import { Router } from 'express';
import { aksiAntrean, filterAntrean, idParam, kunjunganMasukan, ubahDpjpMasukan, ubahTahapMasukan } from '@klira/shared';
import { wajibMasuk } from '../../../middleware/auth.js';
import { alamatDari } from '../../../middleware/audit.js';
import { buatWajibIzin } from '../../../middleware/izin.js';
import { galatValidasi, kirimHasil } from '../../../umum/hasil.js';
import { bungkus, pengguna, tidakAda } from '../../../umum/rute.js';
/** Rute kunjungan dan antrean: input = pendaftaran, perbaikan = ubah tahap dan status antrean, lihat = daftar antrean (fitur `kunjungan`). */
export function buatRuteKunjungan(layananAkses, layananIzin, layanan) {
    const rute = Router();
    const masuk = wajibMasuk(layananAkses);
    const { wajibIzin } = buatWajibIzin(layananIzin);
    rute.get('/kunjungan/opsi', masuk, wajibIzin('kunjungan', 'input'), bungkus(async (_req, res) => {
        res.json({ data: await layanan.opsi(pengguna(res)) });
    }));
    rute.post('/kunjungan', masuk, wajibIzin('kunjungan', 'input'), bungkus(async (req, res) => {
        const m = kunjunganMasukan.safeParse(req.body ?? {});
        if (!m.success)
            return galatValidasi(res, m.error);
        kirimHasil(res, await layanan.daftarkan(pengguna(res), m.data, alamatDari(req)), 201);
    }));
    rute.patch('/kunjungan/:id/tahap', masuk, wajibIzin('kunjungan', 'perbaikan'), bungkus(async (req, res) => {
        const id = idParam.safeParse(req.params);
        if (!id.success)
            return tidakAda(res);
        const m = ubahTahapMasukan.safeParse(req.body ?? {});
        if (!m.success)
            return galatValidasi(res, m.error);
        kirimHasil(res, await layanan.ubahTahap(pengguna(res), id.data.id, m.data.tahap, alamatDari(req)));
    }));
    rute.patch('/kunjungan/:id/dpjp', masuk, wajibIzin('kunjungan', 'input'), bungkus(async (req, res) => {
        const id = idParam.safeParse(req.params);
        if (!id.success)
            return tidakAda(res);
        const m = ubahDpjpMasukan.safeParse(req.body ?? {});
        if (!m.success)
            return galatValidasi(res, m.error);
        kirimHasil(res, await layanan.ubahDpjp(pengguna(res), id.data.id, m.data.dpjp_id ?? null, alamatDari(req)));
    }));
    rute.get('/antrean', masuk, wajibIzin('kunjungan', 'lihat'), bungkus(async (req, res) => {
        const f = filterAntrean.safeParse(req.query);
        if (!f.success)
            return galatValidasi(res, f.error);
        res.json({ data: await layanan.daftarAntrean(pengguna(res), f.data) });
    }));
    rute.get('/antrean/sesi', masuk, wajibIzin('kunjungan', 'lihat'), bungkus(async (_req, res) => {
        res.json({ data: await layanan.keadaanSesi(pengguna(res)) });
    }));
    rute.post('/antrean/buka', masuk, wajibIzin('kunjungan', 'input'), bungkus(async (req, res) => {
        kirimHasil(res, await layanan.bukaAntrean(pengguna(res), alamatDari(req)));
    }));
    rute.post('/antrean/tutup', masuk, wajibIzin('kunjungan', 'input'), bungkus(async (req, res) => {
        kirimHasil(res, await layanan.tutupAntrean(pengguna(res), alamatDari(req)));
    }));
    rute.post('/antrean/:id/:aksi', masuk, wajibIzin('kunjungan', 'perbaikan'), bungkus(async (req, res) => {
        const id = idParam.safeParse({ id: req.params.id });
        const aksi = aksiAntrean.safeParse(req.params.aksi);
        if (!id.success || !aksi.success)
            return tidakAda(res);
        // `ruang_id` (opsional): ruang periksa yang memanggil; bila kosong, sistem memilih ruang poli itu yang bebas.
        const pilihan = Number.isInteger(req.body?.ruang_id) && req.body.ruang_id > 0 ? req.body.ruang_id : undefined;
        kirimHasil(res, await layanan.aksiAntrean(pengguna(res), id.data.id, aksi.data, alamatDari(req), pilihan));
    }));
    return rute;
}
