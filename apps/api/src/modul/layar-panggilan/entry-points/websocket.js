import * as db from '@klira/db';
import { WebSocket } from 'ws';
import { asalSah, buatServerWs, kirimAman, pasangSiklus, terimaKlien, tolak } from '../../../umum/websocket.js';
import { dengarkanLayarPanggilan } from '../domain/kanal.js';
import { bacaCookie } from '../../../middleware/auth.js';
import { NAMA_COOKIE_SESI } from '../../akses/domain/skema.js';
export const cocokSocketLayar = (path) => /^\/api\/publik\/layar-panggilan\/[^/]+\/ws$/.test(path);
export function pasangWebsocketLayarPanggilan(server, baseUrl, heartbeatMs = 20000, akses) {
    const wss = buatServerWs();
    const klien = new Map();
    const kabarkanJumlah = (fasilitas) => {
        const jumlah = [...klien.values()].filter(k => k.fasilitas === fasilitas && !k.pemantau).length;
        for (const [ws, info] of klien)
            if (info.fasilitas === fasilitas && info.pemantau)
                kirimAman(ws, { tipe: 'layar', jumlah });
    };
    const lepas = dengarkanLayarPanggilan(() => {
        for (const [ws, info] of klien)
            // Layar publik memuat ulang panggilannya; petugas (pemantau) hanya diberi tahu bahwa antrean berubah dan membaca ulang lewat API berizin.
            kirimAman(ws, { tipe: info.pemantau ? 'antrean' : 'perubahan' });
    });
    const upgrade = (req, socket, head) => {
        const path = req.url?.split('?')[0] ?? '';
        if (!cocokSocketLayar(path))
            return;
        socket.on('error', () => { });
        if (!asalSah(req, baseUrl)) {
            tolak(socket, '403 Forbidden');
            return;
        }
        const nilai = path.split('/')[4];
        const id = Number(nilai);
        if (!/^\d+$/.test(nilai) || !Number.isSafeInteger(id) || id < 1) {
            tolak(socket, '400 Bad Request');
            return;
        }
        void (async () => {
            const pemantau = new URL(req.url, baseUrl).searchParams.get('pemantau') === '1';
            const sesi = pemantau ? bacaCookie(req.headers.cookie, NAMA_COOKIE_SESI) : undefined;
            if (pemantau) {
                const pengguna = sesi && akses ? await akses.saya(sesi) : null;
                if (!pengguna || pengguna.wajib_ganti_kredensial) {
                    tolak(socket, '401 Unauthorized');
                    return;
                }
            }
            const fasilitas = await db.ambilFasyankesUntukUpgrade(id);
            if (socket.destroyed)
                return;
            if (!fasilitas) {
                tolak(socket, '404 Not Found');
                return;
            }
            terimaKlien(wss, klien, req, socket, head, { fasilitas: id, hidup: true, pemantau, sesi }, {
                alasanTolakPesan: 'Kanal hanya menerima pembaruan',
                saatTutup: () => { if (!pemantau)
                    kabarkanJumlah(id); },
                siap: (ws) => {
                    kirimAman(ws, { tipe: 'siap' });
                    kabarkanJumlah(id);
                },
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
            if (info.pemantau && akses)
                void akses.saya(info.sesi).then(p => {
                    if (!p || p.wajib_ganti_kredensial)
                        ws.close(1008, 'Akses berakhir');
                }).catch(() => ws.close(1011));
        },
    });
}
