import { punyaIzin } from '@klira/shared';
import { WebSocket } from 'ws';
import { asalSah, buatServerWs, kirimAman, pasangSiklus, terimaKlien, tolak } from '../../../umum/websocket.js';
import { bacaCookie } from '../../../middleware/auth.js';
import { NAMA_COOKIE_SESI } from '../../akses/domain/skema.js';
import { dengarkanNotifikasi } from '../domain/kanal.js';

export const cocokSocketNotifikasi = (path) => path === '/api/notifikasi/ws';

/**
 * Menentukan apakah sebuah koneksi pengguna berhak menerima event notifikasi tertentu.
 * @param {object} info - Metadata klien yang terhubung (`pengguna`).
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
    const wss = buatServerWs();
    const klien = new Map();

    const lepas = dengarkanNotifikasi((event) => {
        const payload = bentukPayload(event);
        if (!payload)
            return;
        for (const [ws, info] of klien) {
            if (cocokPenerima(info, event))
                kirimAman(ws, payload);
        }
    });

    const upgrade = (req, socket, head) => {
        const path = req.url?.split('?')[0] ?? '';
        if (!cocokSocketNotifikasi(path))
            return;
        socket.on('error', () => { });
        if (!asalSah(req, baseUrl)) {
            tolak(socket, '403 Forbidden');
            return;
        }
        const sesi = bacaCookie(req.headers.cookie, NAMA_COOKIE_SESI);
        void (async () => {
            const pengguna = sesi && akses ? await akses.saya(sesi) : null;
            if (socket.destroyed)
                return;
            if (!pengguna || pengguna.wajib_ganti_kredensial) {
                tolak(socket, '401 Unauthorized');
                return;
            }
            terimaKlien(wss, klien, req, socket, head, { pengguna, hidup: true, sesi }, {
                alasanTolakPesan: 'Kanal hanya mengirim notifikasi',
                siap: (ws) => kirimAman(ws, { tipe: 'siap' }),
            });
        })().catch(() => socket.destroy());
    };

    return pasangSiklus({
        server, wss, klien, upgrade, heartbeatMs, lepas,
        denyut: (ws, info) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.ping();
                kirimAman(ws, { tipe: 'hidup' });
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
        },
    });
}
