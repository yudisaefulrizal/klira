import { WebSocket, WebSocketServer } from 'ws';
/** Blok bangunan bersama untuk server WebSocket kanal pembaruan (notifikasi, layar panggilan, WhatsApp, Instagram). */
export const buatServerWs = () => new WebSocketServer({ noServer: true, maxPayload: 1024, perMessageDeflate: false });
/** Kirim JSON bila soket terbuka; klien yang tertinggal (buffer penuh) diminta menyambung ulang. */
export function kirimAman(ws, pesan) {
    if (ws.readyState !== WebSocket.OPEN)
        return;
    if (ws.bufferedAmount > 65536) {
        ws.close(1013, 'Sambungkan ulang');
        return;
    }
    ws.send(JSON.stringify(pesan));
}
/** Asal (Origin) permintaan upgrade harus sama dengan BASE_URL atau host permintaan itu sendiri. */
export function asalSah(req, baseUrl) {
    const asal = req.headers.origin;
    return Boolean(asal) && [new URL(baseUrl).origin, `${req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http'}://${req.headers.host}`].includes(asal);
}
/** Tutup permintaan upgrade dengan status HTTP, mis. tolak(socket, '401 Unauthorized'). */
export const tolak = (socket, status) => void socket.end(`HTTP/1.1 ${status}\r\nConnection: close\r\n\r\n`);
/**
 * Terima sambungan klien: simpan di `klien`, tandai hidup saat pong, hapus saat tutup, dan tolak pesan masuk
 * (kanal hanya mengirim pembaruan). `saatTutup` dipanggil setelah klien dihapus; `siap` setelah semua pengait terpasang.
 */
export function terimaKlien(wss, klien, req, socket, head, info, { alasanTolakPesan, saatTutup, siap }) {
    wss.handleUpgrade(req, socket, head, (ws) => {
        klien.set(ws, info);
        ws.on('error', () => { });
        ws.on('pong', () => { info.hidup = true; });
        ws.on('close', () => {
            klien.delete(ws);
            saatTutup?.();
        });
        ws.on('message', () => ws.close(1008, alasanTolakPesan));
        siap?.(ws);
    });
}
/**
 * Pasang pengait upgrade, detak berkala, dan penutupan. `denyut(ws, info)` dipanggil tiap detak untuk klien yang masih hidup;
 * `tambahan()` untuk soket di luar `klien`. Mengembalikan fungsi tutup (idempoten, juga dipanggil saat server ditutup).
 */
export function pasangSiklus({ server, wss, klien, upgrade, heartbeatMs, denyut, tambahan, lepas }) {
    server.on('upgrade', upgrade);
    const timer = setInterval(() => {
        for (const [ws, info] of klien) {
            if (!info.hidup) {
                ws.terminate();
                continue;
            }
            info.hidup = false;
            denyut(ws, info);
        }
        tambahan?.();
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
        for (const ws of wss.clients)
            ws.terminate();
        wss.close();
    };
    server.once('close', tutup);
    return tutup;
}
