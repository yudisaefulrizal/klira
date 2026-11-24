import { cocokSocketLayar } from '../../layar-panggilan/entry-points/websocket.js';
import { cocokSocketNotifikasi } from '../../notifikasi/entry-points/websocket.js';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { WebSocket } from 'ws';
import { asalSah, buatServerWs, kirimAman, pasangSiklus, tolak, terimaKlien } from '../../../umum/websocket.js';
import { punyaIzin } from '@klira/shared';
import { bacaCookie } from '../../../middleware/auth.js';
import { NAMA_COOKIE_SESI } from '../../akses/domain/skema.js';
import { dengarkanWhatsapp, kabarkanWhatsapp } from '../domain/kanal.js';
const URL_HALAMAN = '/api/whatsapp/ws';
const URL_ENGINE = '/api/whatsapp/engine-ws';
export function pasangWebsocketWhatsapp(server, akses, baseUrl, heartbeatMs = 30000) {
    const wss = buatServerWs();
    const klien = new Map();
    const mesin = new Map();
    const tokenEngine = () => process.env.KUNCI_ENKRIPSI
        ? createHmac('sha256', process.env.KUNCI_ENKRIPSI).update('klira-whatsapp-events-v1').digest('hex')
        : '';
    const kirim = (ws, event) => kirimAman(ws, { tipe: event.tipe, baru: event.baru ?? false });
    const lepas = dengarkanWhatsapp((event) => {
        for (const [ws] of klien)
            kirim(ws, event);
    });
    const sah = async (id) => {
        const p = await akses.saya(id);
        return p && !p.wajib_ganti_kredensial && punyaIzin(p, 'whatsapp', 'lihat') ? p : null;
    };
    const upgrade = (req, socket, head) => {
        const path = req.url?.split('?')[0];
        if (path !== URL_HALAMAN && path !== URL_ENGINE) {
            if (cocokSocketLayar(path ?? '') || cocokSocketNotifikasi(path ?? '') || path === '/api/instagram/ws' || (process.env.KLIRA_DEV === '1' && path === '/__klira_hmr'))
                return;
            socket.destroy();
            return;
        }
        socket.on('error', () => { });
        void (async () => {
            if (path === URL_ENGINE) {
                const token = req.headers.authorization?.replace(/^Bearer /, '') ?? '';
                const diharapkan = tokenEngine();
                if (!diharapkan ||
                    token.length !== diharapkan.length ||
                    !timingSafeEqual(Buffer.from(token), Buffer.from(diharapkan))) {
                    tolak(socket, '401 Unauthorized');
                    return;
                }
                wss.handleUpgrade(req, socket, head, (ws) => {
                    mesin.set(ws, true);
                    ws.on('pong', () => mesin.set(ws, true));
                    ws.on('error', () => { });
                    ws.on('close', () => mesin.delete(ws));
                    ws.on('message', (data) => {
                        try {
                            const e = JSON.parse(data.toString());
                            if (!['pesan', 'koneksi', 'siap'].includes(e.tipe))
                                return;
                            kabarkanWhatsapp({ tipe: e.tipe, baru: e.baru === true });
                        }
                        catch {
                            ws.close(1008);
                        }
                    });
                });
                return;
            }
            if (!asalSah(req, baseUrl)) {
                tolak(socket, '403 Forbidden');
                return;
            }
            const idSesi = bacaCookie(req.headers.cookie, NAMA_COOKIE_SESI);
            const user = idSesi ? await sah(idSesi) : null;
            if (!idSesi || !user) {
                tolak(socket, '401 Unauthorized');
                return;
            }
            // Browser hanya menerima notifikasi. Semua pembacaan/penulisan tetap melalui API berizin.
            terimaKlien(wss, klien, req, socket, head, { idSesi, hidup: true }, {
                alasanTolakPesan: 'Kanal hanya menerima pembaruan',
                siap: (ws) => kirim(ws, { tipe: 'siap' }),
            });
        })().catch(() => {
            socket.destroy();
        });
    };
    return pasangSiklus({
        server, wss, klien, upgrade, heartbeatMs, lepas,
        denyut: (ws, info) => {
            ws.ping();
            void sah(info.idSesi)
                .then((p) => {
                if (!p)
                    ws.close(1008, 'Akses berakhir');
            })
                .catch(() => ws.close(1011));
        },
        tambahan: () => {
            for (const [ws, hidup] of mesin) {
                if (!hidup)
                    ws.terminate();
                else if (ws.readyState === WebSocket.OPEN) {
                    mesin.set(ws, false);
                    ws.ping();
                }
            }
        },
    });
}
