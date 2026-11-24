import { Router } from 'express';
import { GALAT, idParam, konfigurasiSatusehatMasukan, lingkunganParam } from '@klira/shared';
import { wajibMasuk } from '../../../middleware/auth.js';
import { alamatDari } from '../../../middleware/audit.js';
import { buatWajibIzin } from '../../../middleware/izin.js';
import { bungkus, pengguna } from '../../../umum/rute.js';
import { galatValidasi } from '../../../umum/hasil.js';
const status = { tidak_valid: 400, belum_lengkap: 409 };
/** Rute koneksi SATUSEHAT: lihat butuh `satusehat` lihat; simpan, aktifkan, dan uji butuh `satusehat` perbaikan. Rahasia tidak pernah dikembalikan. */
export function buatRuteSatusehat(layananAkses, layananIzin, layanan, sinkronIhs) {
    const rute = Router();
    const masuk = wajibMasuk(layananAkses);
    const { wajibIzin, wajibIzinSalahSatu } = buatWajibIzin(layananIzin);
    const jawab = (res, h) => {
        if (h.ok)
            return void res.json({ data: h.data });
        const badan = { galat: { kode: h.kode, pesan: h.pesan, ...(h.bidang ? { rincian: [{ jalur: h.bidang, pesan: h.pesan }] } : {}) } };
        res.status(status[h.kode] ?? 400).json(badan);
    };
    rute.get('/satusehat/konfigurasi', masuk, wajibIzin('satusehat', 'lihat'), bungkus(async (_req, res) => {
        res.json({ data: await layanan.ambil(pengguna(res)) });
    }));
    rute.put('/satusehat/konfigurasi', masuk, wajibIzin('satusehat', 'perbaikan'), bungkus(async (req, res) => {
        const b = konfigurasiSatusehatMasukan.safeParse(req.body ?? {});
        if (!b.success)
            return galatValidasi(res, b.error);
        jawab(res, await layanan.simpan(pengguna(res), b.data, alamatDari(req)));
    }));
    rute.post('/satusehat/konfigurasi/:environment/aktifkan', masuk, wajibIzin('satusehat', 'perbaikan'), bungkus(async (req, res) => {
        const p = lingkunganParam.safeParse(req.params);
        if (!p.success)
            return galatValidasi(res, p.error);
        jawab(res, await layanan.aktifkan(pengguna(res), p.data.environment, alamatDari(req)));
    }));
    rute.post('/satusehat/konfigurasi/:environment/uji', masuk, wajibIzin('satusehat', 'perbaikan'), bungkus(async (req, res) => {
        const p = lingkunganParam.safeParse(req.params);
        if (!p.success)
            return galatValidasi(res, p.error);
        jawab(res, await layanan.uji(pengguna(res), p.data.environment));
    }));
    /** Cari ulang IHS Number satu pasien (petugas pendaftaran atau admin SATUSEHAT), mis. setelah NIK diperbaiki atau koneksi dipulihkan. */
    rute.post('/satusehat/pasien/:id/ihs', masuk, wajibIzinSalahSatu(['satusehat', 'perbaikan'], ['pasien', 'perbaikan']), bungkus(async (req, res) => {
        const id = idParam.safeParse(req.params);
        if (!id.success)
            return void res.status(404).json({ galat: { kode: 'tidak_ditemukan', pesan: GALAT.tidakDitemukan } });
        const hasil = await sinkronIhs(pengguna(res), id.data.id, { paksa: true, alamat: alamatDari(req) });
        if (hasil.alasan === 'pasien_tidak_ada')
            return void res.status(404).json({ galat: { kode: 'tidak_ditemukan', pesan: GALAT.tidakDitemukan } });
        res.json({ data: hasil });
    }));
    return rute;
}
