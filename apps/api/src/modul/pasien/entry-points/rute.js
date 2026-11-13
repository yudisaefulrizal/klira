import { ambilWilayah, cariWilayah } from '../../wilayah/data-access/data.js';
import { Router } from 'express';
import { perbaikanPasienMasukan, cekDuplikatMasukan, filterPasien, idParam, registrasiPasienMasukan, GALAT, REGISTRASI } from '@klira/shared';
import { wajibMasuk } from '../../../middleware/auth.js';
import { alamatDari } from '../../../middleware/audit.js';
import { buatWajibIzin } from '../../../middleware/izin.js';
import { galatValidasi, kirimHasil } from '../../../umum/hasil.js';
/**
 * Rute pasien (3.1, 3.3). Melihat daftar dan data: fitur `pasien` atau `rekam-medis` (lihat); registrasi dan cek duplikat:
 * `pasien` input. Semua dibatasi pada fasyankes akun; pembukaan isi pasien dicatat audit `lihat`.
 */
export function buatRutePasien(layananAkses, layananIzin, layanan) {
    const rute = Router();
    const masuk = wajibMasuk(layananAkses);
    const { wajibIzin, wajibIzinSalahSatu } = buatWajibIzin(layananIzin);
    const pengguna = (res) => res.locals.pengguna;
    const bungkus = (f) => (req, res, next) => void f(req, res).catch(next);
    const lihat = wajibIzinSalahSatu(['pasien', 'lihat'], ['rekam-medis', 'lihat']);
    const izinWilayah = wajibIzinSalahSatu(['pasien', 'lihat'], ['pasien', 'input'], ['pasien', 'perbaikan'], ['rekam-medis', 'lihat']);
    rute.get('/wilayah', masuk, izinWilayah, (req, res) => {
        if (typeof req.query.cari !== 'string' || req.query.cari.length > 100) {
            res.status(400).json({ galat: { kode: 'tidak_valid', pesan: 'Pencarian wilayah maksimal 100 karakter.' } });
            return;
        }
        res.json({ data: cariWilayah(req.query.cari) });
    });
    rute.get('/wilayah/:kode', masuk, izinWilayah, (req, res) => {
        const wilayah = ambilWilayah(String(req.params.kode));
        if (!wilayah) {
            res.status(404).json({ galat: { kode: 'tidak_ditemukan', pesan: 'Wilayah tidak ditemukan dalam referensi aplikasi.' } });
            return;
        }
        res.json({ data: wilayah });
    });
    rute.get('/pasien', masuk, lihat, bungkus(async (req, res) => {
        const f = filterPasien.safeParse(req.query);
        if (!f.success)
            return galatValidasi(res, f.error);
        res.json({ data: await layanan.cari(pengguna(res), f.data) });
    }));
    rute.get('/pasien/teks-persetujuan', masuk, wajibIzin('pasien', 'input'), bungkus(async (_req, res) => {
        const teks = await layanan.teksGeneral(pengguna(res));
        if (!teks)
            return void res.status(404).json({ galat: { kode: 'tidak_ditemukan', pesan: REGISTRASI.consentTidakAda } });
        res.json({ data: teks });
    }));
    rute.post('/pasien/cek-duplikat', masuk, wajibIzin('pasien', 'input'), bungkus(async (req, res) => {
        const k = cekDuplikatMasukan.safeParse(req.body ?? {});
        if (!k.success)
            return galatValidasi(res, k.error);
        res.json({ data: await layanan.cekDuplikat(pengguna(res), k.data, alamatDari(req)) });
    }));
    rute.post('/pasien', masuk, wajibIzin('pasien', 'input'), bungkus(async (req, res) => {
        const m = registrasiPasienMasukan.safeParse(req.body ?? {});
        if (!m.success)
            return galatValidasi(res, m.error);
        kirimHasil(res, await layanan.daftarkan(pengguna(res), m.data, alamatDari(req)), 201);
    }));
    rute.patch('/pasien/:id', masuk, wajibIzin('pasien', 'perbaikan'), bungkus(async (req, res) => {
        const id = idParam.safeParse(req.params);
        if (!id.success)
            return void res.status(404).json({ galat: { kode: 'tidak_ditemukan', pesan: GALAT.tidakDitemukan } });
        const m = perbaikanPasienMasukan.safeParse(req.body ?? {});
        if (!m.success)
            return galatValidasi(res, m.error);
        kirimHasil(res, await layanan.perbaiki(pengguna(res), id.data.id, m.data, alamatDari(req)));
    }));
    rute.get('/pasien/:id', masuk, lihat, bungkus(async (req, res) => {
        const id = idParam.safeParse(req.params);
        if (!id.success)
            return void res.status(404).json({ galat: { kode: 'tidak_ditemukan', pesan: GALAT.tidakDitemukan } });
        kirimHasil(res, await layanan.detail(pengguna(res), id.data.id, alamatDari(req)));
    }));
    return rute;
}
