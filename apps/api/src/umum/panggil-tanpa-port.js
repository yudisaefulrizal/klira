// Untuk uji: menjalankan aplikasi Express dengan permintaan buatan di memori, tanpa membuka port atau soket jaringan.
import { Duplex } from 'node:stream';
import { IncomingMessage, ServerResponse } from 'node:http';

/** Hasil: { status, headers, teks, json() }. `headers` permintaan memakai nama huruf kecil atau bebas. */
export function panggilTanpaPort(app, { metode = 'GET', url, headers = {}, badan }) {
    return new Promise((selesai, gagal) => {
        const keluar = [];
        const soket = new Duplex({ read() { }, write(potongan, _enc, lanjut) { keluar.push(Buffer.from(potongan)); lanjut(); } });
        const muatan = badan === undefined ? null : Buffer.from(typeof badan === 'string' ? badan : JSON.stringify(badan));
        const req = new IncomingMessage(soket);
        req.method = metode;
        req.url = url;
        req.headers = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
        if (muatan) {
            req.headers['content-length'] = String(muatan.length);
            req.headers['content-type'] ??= 'application/json';
            req.push(muatan);
        }
        // Tanpa penanda ini Node menganggap permintaan terputus setelah badan dibaca dan menutup soket sebelum respons asinkron terkirim.
        req.complete = true;
        req.push(null);
        const res = new ServerResponse(req);
        res.assignSocket(soket);
        res.on('finish', () => {
            const mentah = Buffer.concat(keluar).toString('utf8');
            const pisah = mentah.indexOf('\r\n\r\n');
            const kepala = mentah.slice(0, pisah).split('\r\n');
            const teks = mentah.slice(pisah + 4);
            const status = Number(/^HTTP\/1\.1 (\d{3})/.exec(kepala[0])?.[1]);
            const header = Object.fromEntries(kepala.slice(1).map((b) => [b.slice(0, b.indexOf(':')).toLowerCase(), b.slice(b.indexOf(':') + 1).trim()]));
            selesai({ status, headers: header, teks, json: async () => JSON.parse(teks) });
        });
        res.on('error', gagal);
        app.handle(req, res, (galat) => { if (galat) gagal(galat); });
    });
}
