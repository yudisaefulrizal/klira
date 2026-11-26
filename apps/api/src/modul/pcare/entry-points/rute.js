import { Router } from 'express';
import { konfigurasiPcareMasukan, lingkunganParam } from '@klira/shared';
import { wajibMasuk } from '../../../middleware/auth.js';
import { alamatDari } from '../../../middleware/audit.js';
import { buatWajibIzin } from '../../../middleware/izin.js';
import { bungkus, pengguna } from '../../../umum/rute.js';
import { galatValidasi } from '../../../umum/hasil.js';
const status = { tidak_valid: 400, tidak_ditemukan: 404, belum_lengkap: 409, konflik: 409 };
/** Rute koneksi & pelayanan PCare. Konfigurasi memakai izin `satusehat`; cek peserta/kirim pelayanan memakai `kunjungan` / `klaim`. */
export function buatRutePcare(layananAkses, layananIzin, layanan, pelayanan = null) {
    const rute = Router();
    const masuk = wajibMasuk(layananAkses);
    const { wajibIzin, wajibIzinSalahSatu } = buatWajibIzin(layananIzin);
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
    if (pelayanan) {
        rute.get('/pcare/peserta', masuk, wajibIzin('kunjungan', 'lihat'), bungkus(async (req, res) => {
            const nomor = String(req.query?.nomor ?? '').trim();
            const jenis = req.query?.jenis === 'nik' ? 'nik' : 'noka';
            if (!nomor)
                return void res.status(400).json({ galat: { kode: 'tidak_valid', pesan: 'Nomor kartu atau NIK wajib diisi.' } });
            jawab(res, await pelayanan.cekPeserta(nomor, jenis));
        }));
        rute.get('/pcare/referensi/:jenis', masuk, wajibIzin('satusehat', 'lihat'), bungkus(async (req, res) => {
            jawab(res, await pelayanan.referensi(req.params.jenis, req.query ?? {}));
        }));
        rute.get('/pcare/pemetaan', masuk, wajibIzin('satusehat', 'lihat'), bungkus(async (req, res) => {
            res.json({ data: await pelayanan.daftarPemetaan(req.query?.jenis || undefined) });
        }));
        rute.put('/pcare/pemetaan', masuk, wajibIzin('satusehat', 'perbaikan'), bungkus(async (req, res) => {
            jawab(res, await pelayanan.simpanPemetaan(pengguna(res), req.body ?? {}, alamatDari(req)));
        }));
        rute.delete('/pcare/pemetaan', masuk, wajibIzin('satusehat', 'perbaikan'), bungkus(async (req, res) => {
            jawab(res, await pelayanan.hapusPemetaan(pengguna(res), req.body ?? {}, alamatDari(req)));
        }));
        rute.put('/pcare/kunjungan/:id/atribut', masuk, wajibIzin('kunjungan', 'perbaikan'), bungkus(async (req, res) => {
            const id = Number(req.params.id);
            if (!Number.isInteger(id) || id <= 0)
                return void res.status(400).json({ galat: { kode: 'tidak_valid', pesan: 'ID kunjungan tidak valid.' } });
            jawab(res, await pelayanan.simpanAtributKunjungan(pengguna(res), id, req.body ?? {}, alamatDari(req)));
        }));
        rute.post('/pcare/kunjungan/:id/kirim', masuk, wajibIzinSalahSatu(['kunjungan', 'perbaikan'], ['klaim', 'perbaikan'], ['satusehat', 'perbaikan']), bungkus(async (req, res) => {
            const id = Number(req.params.id);
            if (!Number.isInteger(id) || id <= 0)
                return void res.status(400).json({ galat: { kode: 'tidak_valid', pesan: 'ID kunjungan tidak valid.' } });
            jawab(res, await pelayanan.kirimKunjungan(pengguna(res), id, req.body ?? {}, alamatDari(req)));
        }));
    }
    return rute;
}
