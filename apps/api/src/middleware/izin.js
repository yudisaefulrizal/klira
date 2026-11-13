import { GALAT, punyaIzin } from '@klira/shared';
function galat403(res) {
    const badan = { galat: { kode: 'tidak_berizin', pesan: GALAT.tidakBerizin } };
    res.status(403).json(badan);
}
/**
 * Pabrik middleware izin. Mengharuskan wajibMasuk (res.locals.pengguna) lebih dulu.
 * Tanpa izin: 403 dan tercatat di audit. Dengan izin: peringatan relevan dievaluasi dan dicatat
 * (tidak pernah memblokir).
 */
export function buatWajibIzin(layanan) {
    const periksa = (syarat, opsi = {}) => (req, res, next) => {
        const pengguna = res.locals.pengguna;
        if (!pengguna)
            return void res.status(401).json({ galat: { kode: 'tidak_terautentikasi', pesan: GALAT.tidakTerautentikasi } });
        const cocok = syarat.find(([f, a]) => punyaIzin(pengguna, f, a));
        const alamat = req.ip ?? 'tidak-diketahui';
        if (!cocok) {
            const [f, a] = syarat[0];
            layanan.catatPenolakan(pengguna, f, a, alamat).then(() => galat403(res), next);
            return;
        }
        layanan
            .catatTindakan(pengguna, cocok[0], opsi.konteks?.(req), alamat)
            .catch((e) => console.error('Gagal mencatat peringatan izin', e))
            .then(() => next());
    };
    return {
        /** wajibIzin(fitur, aksi): wajib punya izin fitur x aksi (cakupan apa pun). */
        wajibIzin: (fitur, aksi, opsi) => periksa([[fitur, aksi]], opsi),
        /** Cukup salah satu syarat terpenuhi (mis. pimpinan atau auditor melihat daftar peringatan). */
        wajibIzinSalahSatu: (...syarat) => periksa(syarat),
    };
}
