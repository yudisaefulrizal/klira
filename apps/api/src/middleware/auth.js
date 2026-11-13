import { GALAT, GANTI_KREDENSIAL } from '@klira/shared';
import { NAMA_COOKIE_SESI } from '../modul/akses/domain/skema.js';
export function bacaCookie(header, nama) {
    if (!header)
        return undefined;
    for (const bagian of header.split(';')) {
        const i = bagian.indexOf('=');
        if (i < 0 || bagian.slice(0, i).trim() !== nama)
            continue;
        try {
            return decodeURIComponent(bagian.slice(i + 1).trim());
        }
        catch {
            return undefined;
        }
    }
    return undefined;
}
export function idSesiDariPermintaan(req) {
    return bacaCookie(req.headers.cookie, NAMA_COOKIE_SESI);
}
export function galat401(res) {
    const badan = { galat: { kode: 'tidak_terautentikasi', pesan: GALAT.tidakTerautentikasi } };
    res.status(401).json(badan);
}
/** Mewajibkan sesi sah; menaruh pengguna di res.locals.pengguna. */
export function wajibMasuk(layanan) {
    return (req, res, next) => {
        layanan
            .saya(idSesiDariPermintaan(req))
            .then((pengguna) => {
            if (!pengguna)
                return galat401(res);
            res.locals.pengguna = pengguna;
            next();
        })
            .catch(next);
    };
}
/**
 * Selama akun wajib ganti kredensial, tolak semua rute yang melewati middleware ini.
 * Dipasang setelah rute akses (/saya, /keluar, /ganti-kredensial, /masuk) sehingga hanya
 * rute lain yang terkena. Tanpa sesi, lanjut (rute masing-masing yang menolak).
 */
export function blokirSelamaWajibGanti(layanan) {
    return (req, res, next) => {
        layanan
            .saya(idSesiDariPermintaan(req))
            .then((pengguna) => {
            if (!pengguna?.wajib_ganti_kredensial)
                return next();
            const badan = { galat: { kode: 'wajib_ganti_kredensial', pesan: GANTI_KREDENSIAL.wajib } };
            res.status(403).json(badan);
        })
            .catch(next);
    };
}
