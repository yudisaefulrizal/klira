import { Router } from 'express';
import { GALAT, pengaturanAntreanJknMasukan } from '@klira/shared';
import { wajibMasuk } from '../../../middleware/auth.js';
import { alamatDari } from '../../../middleware/audit.js';
import { buatWajibIzin } from '../../../middleware/izin.js';

const STATUS = { tidak_valid: 400, konflik: 409 };
/**
 * Antrean online BPJS di layar klira. Pengaturan memakai izin fitur `satusehat` (admin integrasi) seperti koneksi PCare;
 * menarik pendaftaran Mobile JKN memakai izin pendaftaran kunjungan (`kunjungan` input).
 */
export function buatRuteAntreanJkn(layananAkses, layananIzin, layanan) {
    const rute = Router();
    const masuk = wajibMasuk(layananAkses);
    const { wajibIzin } = buatWajibIzin(layananIzin);
    const pengguna = (res) => res.locals.pengguna;
    const bungkus = (f) => (req, res, next) => void f(req, res).catch(next);
    rute.get('/antrean-jkn/pengaturan', masuk, wajibIzin('satusehat', 'lihat'), bungkus(async (_req, res) => {
        res.json({ data: await layanan.ambil(pengguna(res)) });
    }));
    rute.put('/antrean-jkn/pengaturan', masuk, wajibIzin('satusehat', 'perbaikan'), bungkus(async (req, res) => {
        const b = pengaturanAntreanJknMasukan.safeParse(req.body ?? {});
        if (!b.success)
            return void res.status(400).json({ galat: { kode: 'tidak_valid', pesan: GALAT.tidakValid, rincian: b.error.issues.map((i) => ({ jalur: i.path.join('.'), pesan: i.message })) } });
        const h = await layanan.simpan(pengguna(res), b.data, alamatDari(req));
        if (h.ok)
            return void res.json({ data: h.data });
        res.status(STATUS[h.kode] ?? 400).json({ galat: { kode: h.kode, pesan: h.pesan, ...(h.bidang ? { rincian: [{ jalur: h.bidang, pesan: h.pesan }] } : {}) } });
    }));
    // `paksa: true` (tombol di layar) menarik sekarang juga; tanpa itu server membatasi jaraknya.
    rute.post('/antrean-jkn/tarik', masuk, wajibIzin('kunjungan', 'input'), bungkus(async (req, res) => {
        res.json({ data: await layanan.tarik(pengguna(res).fasyankes_id, { paksa: req.body?.paksa === true, alamat: alamatDari(req) }) });
    }));
    return rute;
}
