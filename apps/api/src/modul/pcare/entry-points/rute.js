import { Router } from 'express';
import { GALAT, konfigurasiPcareMasukan, lingkunganParam } from '@klira/shared';
import { wajibMasuk } from '../../../middleware/auth.js';
import { alamatDari } from '../../../middleware/audit.js';
import { buatWajibIzin } from '../../../middleware/izin.js';
function galatValidasi(res, e) {
    res.status(400).json({ galat: { kode: 'tidak_valid', pesan: GALAT.tidakValid, rincian: e.issues.map((i) => ({ jalur: i.path.join('.'), pesan: i.message })) } });
}
const status = { tidak_valid: 400, belum_lengkap: 409 };
/** Rute koneksi PCare memakai izin fitur `satusehat` (admin integrasi): lihat untuk membaca; perbaikan untuk simpan, aktifkan, uji. Rahasia tidak pernah dikembalikan. */
export function buatRutePcare(layananAkses, layananIzin, layanan) {
    const rute = Router();
    const masuk = wajibMasuk(layananAkses);
    const { wajibIzin } = buatWajibIzin(layananIzin);
    const pengguna = (res) => res.locals.pengguna;
    const bungkus = (f) => (req, res, next) => void f(req, res).catch(next);
    const jawab = (res, h) => {
        if (h.ok)
            return void res.json({ data: h.data });
        res.status(status[h.kode] ?? 400).json({ galat: { kode: h.kode, pesan: h.pesan, ...(h.bidang ? { rincian: [{ jalur: h.bidang, pesan: h.pesan }] } : {}) } });
    };
    rute.get('/pcare/konfigurasi', masuk, wajibIzin('satusehat', 'lihat'), bungkus(async (_req, res) => {
        res.json({ data: await layanan.ambil(pengguna(res)) });
    }));
    rute.put('/pcare/konfigurasi', masuk, wajibIzin('satusehat', 'perbaikan'), bungkus(async (req, res) => {
        const b = konfigurasiPcareMasukan.safeParse(req.body ?? {});
        if (!b.success)
            return galatValidasi(res, b.error);
        jawab(res, await layanan.simpan(pengguna(res), b.data, alamatDari(req)));
    }));
    rute.post('/pcare/konfigurasi/:environment/aktifkan', masuk, wajibIzin('satusehat', 'perbaikan'), bungkus(async (req, res) => {
        const p = lingkunganParam.safeParse(req.params);
        if (!p.success)
            return galatValidasi(res, p.error);
        jawab(res, await layanan.aktifkan(pengguna(res), p.data.environment, alamatDari(req)));
    }));
    rute.post('/pcare/konfigurasi/:environment/uji', masuk, wajibIzin('satusehat', 'perbaikan'), bungkus(async (req, res) => {
        const p = lingkunganParam.safeParse(req.params);
        if (!p.success)
            return galatValidasi(res, p.error);
        jawab(res, await layanan.uji(pengguna(res), p.data.environment));
    }));
    return rute;
}
