import { asalSah, buatServerWs, kirimAman, pasangSiklus, terimaKlien, tolak } from '../../../umum/websocket.js';
import { punyaIzin } from '@klira/shared';
import { bacaCookie } from '../../../middleware/auth.js';
import { NAMA_COOKIE_SESI } from '../../akses/domain/skema.js';
import { dengarkanInstagram } from '../domain/kanal.js';
const URL_HALAMAN = '/api/instagram/ws';
export function pasangWebsocketInstagram(server, akses, baseUrl, heartbeatMs = 30000) {
    const wss = buatServerWs();
    const klien = new Map();
    const kirim = (ws, event) => kirimAman(ws, { tipe: event.tipe, baru: event.baru ?? false });
    const lepas = dengarkanInstagram((event) => {
        for (const [ws] of klien)
            kirim(ws, event);
    });
    const sah = async (id) => {
        const p = await akses.saya(id);
        return p && !p.wajib_ganti_kredensial && punyaIzin(p, 'instagram', 'lihat') ? p : null;
    };
    const upgrade = (req, socket, head) => {
        const path = req.url?.split('?')[0];
        if (path !== URL_HALAMAN)
            return;
        socket.on('error', () => { });
        void (async () => {
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
    });
}
