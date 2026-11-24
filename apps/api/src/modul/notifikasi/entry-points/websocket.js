import { punyaIzin } from '@klira/shared';
import { WebSocket, WebSocketServer } from 'ws';
import { bacaCookie } from '../../../middleware/auth.js';
import { NAMA_COOKIE_SESI } from '../../akses/domain/skema.js';
import { dengarkanNotifikasi } from '../domain/kanal.js';

export const cocokSocketNotifikasi = (path) => path === '/api/notifikasi/ws';

/**
 * Menentukan apakah sebuah koneksi pengguna berhak menerima event notifikasi tertentu.
 * @param {object} info - Metadata klien yang terhubung (`pengguna`, `fasyankesId`).
 * @param {object} event - Event domain yang dipancarkan dari layanan.
 */
function cocokPenerima(info, event) {
    if (event.pelakuId && info.pengguna.id === event.pelakuId)
        return false;
    if (event.tipe === 'skrining_selesai' || event.tipe === 'hasil_lab_selesai') {
        if (event.dpjpId)
            return info.pengguna.id === event.dpjpId;
        return punyaIzin(info.pengguna, 'klinis', 'sahkan');
    }
    if (event.tipe === 'order_lab_baru') {
        return punyaIzin(info.pengguna, 'penunjang', 'input');
    }
    if (event.tipe === 'hasil_lab_kasir') {
        return punyaIzin(info.pengguna, 'kasir', 'input');
    }
    return false;
}

function bentukPayload(event) {
    if (event.tipe === 'skrining_selesai') {
        return {
            tipe: 'skrining_selesai',
            kunjungan_id: event.kunjunganId,
            nomor_antrean: event.nomorAntrean ?? null,
        };
    }
    if (event.tipe === 'order_lab_baru') {
        return {
            tipe: 'order_lab_baru',
            kunjungan_id: event.kunjunganId,
            jumlah: event.jumlah ?? 1,
            prioritas: event.prioritas ?? 'rutin',
        };
    }
    if (event.tipe === 'hasil_lab_selesai' || event.tipe === 'hasil_lab_kasir') {
        return {
            tipe: event.tipe,
            kunjungan_id: event.kunjunganId,
        };
    }
    return null;
}

export function pasangWebsocketNotifikasi(server, akses, baseUrl, heartbeatMs = 20000) {
    const wss = new WebSocketServer({ noServer: true, maxPayload: 1024, perMessageDeflate: false });
    const klien = new Map();

    const kirim = (ws, pesan) => {
        if (ws.readyState !== WebSocket.OPEN)
            return;
        if (ws.bufferedAmount > 65536) {
            ws.close(1013, 'Sambungkan ulang');
            return;
        }
        ws.send(JSON.stringify(pesan));
    };

    const lepas = dengarkanNotifikasi((event) => {
        const payload = bentukPayload(event);
        if (!payload)
            return;
        for (const [ws, info] of klien) {
            if (cocokPenerima(info, event))
                kirim(ws, payload);
        }
    });

    const upgrade = (req, socket, head) => {
        const path = req.url?.split('?')[0] ?? '';
        if (!cocokSocketNotifikasi(path))
            return;
        socket.on('error', () => { });
        const asal = req.headers.origin;
        if (!asal || ![new URL(baseUrl).origin, `${req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http'}://${req.headers.host}`].includes(asal)) {
            socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
            return;
        }
        const sesi = bacaCookie(req.headers.cookie, NAMA_COOKIE_SESI);
        void (async () => {
            const pengguna = sesi && akses ? await akses.saya(sesi) : null;
            if (socket.destroyed)
                return;
            if (!pengguna || pengguna.wajib_ganti_kredensial) {
                socket.end('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n');
                return;
            }
            wss.handleUpgrade(req, socket, head, (ws) => {
                klien.set(ws, { pengguna, hidup: true, sesi });
                ws.on('error', () => { });
                ws.on('pong', () => {
                    const info = klien.get(ws);
                    if (info)
                        info.hidup = true;
                });
                ws.on('close', () => {
                    klien.delete(ws);
                });
                ws.on('message', () => ws.close(1008, 'Kanal hanya mengirim notifikasi'));
                kirim(ws, { tipe: 'siap' });
            });
        })().catch(() => socket.destroy());
    };

    server.on('upgrade', upgrade);

    const timer = setInterval(() => {
        for (const [ws, info] of klien) {
            if (!info.hidup) {
                ws.terminate();
                continue;
            }
            info.hidup = false;
            if (ws.readyState === WebSocket.OPEN) {
                ws.ping();
                kirim(ws, { tipe: 'hidup' });
            }
            if (akses) {
                void akses.saya(info.sesi).then((p) => {
                    if (!p || p.wajib_ganti_kredensial) {
                        ws.close(1008, 'Sesi berakhir');
                    } else {
                        info.pengguna = p;
                    }
                }).catch(() => { });
            }
        }
    }, heartbeatMs);
    timer.unref();

    let ditutup = false;
    const tutup = () => {
        if (ditutup)
            return;
        ditutup = true;
        clearInterval(timer);
        lepas();
        server.off('upgrade', upgrade);
        for (const ws of klien.keys())
            ws.terminate();
        wss.close();
    };
    server.once('close', tutup);
    return tutup;
}
