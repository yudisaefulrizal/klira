import { NAMA_COOKIE_SESI } from '../modul/akses/domain/skema.js';

const METODE_AMAN = new Set(['GET', 'HEAD', 'OPTIONS']);

const adaCookieSesi = (req) => (req.headers?.cookie ?? '').split(';').some((c) => c.trim().startsWith(`${NAMA_COOKIE_SESI}=`));

function namaHostDari(asal) {
    try {
        return new URL(asal).hostname;
    } catch {
        return null;
    }
}

/**
 * Pertahanan berlapis terhadap CSRF di atas SameSite=Lax: permintaan pengubah yang membawa cookie sesi
 * ditolak bila header Origin ada tetapi nama host-nya berbeda dari host layanan ini.
 * Permintaan tanpa cookie sesi (webhook, jalur publik) dan tanpa Origin (klien non-browser) tidak disentuh.
 */
export function tolakAsalLintasSitus() {
    return (req, res, next) => {
        const asal = req.headers?.origin;
        if (METODE_AMAN.has(req.method) || !asal || !adaCookieSesi(req)) return next();
        if (namaHostDari(asal) === req.hostname) return next();
        res.status(403).json({ galat: { kode: 'asal_ditolak', pesan: 'Permintaan dari asal lain tidak diizinkan.' } });
    };
}
