import { GALAT } from '@klira/shared';
const KODE_HTTP = { tidak_valid: 400, konflik: 409, tidak_ditemukan: 404 };
export const gagal = (kode, pesan, jalur) => ({
    ok: false, kode, pesan, ...(jalur ? { rincian: [{ jalur, pesan }] } : {}),
});
export function galatValidasi(res, e) {
    const badan = {
        galat: { kode: 'tidak_valid', pesan: GALAT.tidakValid, rincian: e.issues.map((i) => ({ jalur: i.path.join('.'), pesan: i.message })) },
    };
    res.status(400).json(badan);
}
export function kirimHasil(res, h, statusSukses = 200) {
    if (h.ok)
        return void res.status(statusSukses).json({ data: h.data });
    const badan = { galat: { kode: h.kode, pesan: h.pesan, ...(h.rincian ? { rincian: h.rincian } : {}) } };
    res.status(KODE_HTTP[h.kode]).json(badan);
}
