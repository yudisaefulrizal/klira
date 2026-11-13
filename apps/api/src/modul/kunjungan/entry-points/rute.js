import { Router } from 'express';
import { aksiAntrean, filterAntrean, idParam, kunjunganMasukan, ubahTahapMasukan, GALAT } from '@klira/shared';
import { wajibMasuk } from '../../../middleware/auth.js';
import { alamatDari } from '../../../middleware/audit.js';
import { buatWajibIzin } from '../../../middleware/izin.js';
import { galatValidasi, kirimHasil } from '../../../umum/hasil.js';
/** Rute kunjungan dan antrean: input = pendaftaran, perbaikan = ubah tahap dan status antrean, lihat = daftar antrean (fitur `kunjungan`). */
export function buatRuteKunjungan(layananAkses, layananIzin, layanan) {
    const rute = Router();
    const masuk = wajibMasuk(layananAkses);
    const { wajibIzin } = buatWajibIzin(layananIzin);
    const pengguna = (res) => res.locals.pengguna;
    const bungkus = (f) => (req, res, next) => void f(req, res).catch(next);
    const tidakAda = (res) => void res.status(404).json({ galat: { kode: 'tidak_ditemukan', pesan: GALAT.tidakDitemukan } });
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
    rute.get('/antrean', masuk, wajibIzin('kunjungan', 'lihat'), bungkus(async (req, res) => {
        const f = filterAntrean.safeParse(req.query);
        if (!f.success)
            return galatValidasi(res, f.error);
        res.json({ data: await layanan.daftarAntrean(pengguna(res), f.data) });
    }));
    rute.post('/antrean/:id/:aksi', masuk, wajibIzin('kunjungan', 'perbaikan'), bungkus(async (req, res) => {
        const id = idParam.safeParse({ id: req.params.id });
        const aksi = aksiAntrean.safeParse(req.params.aksi);
        if (!id.success || !aksi.success)
            return tidakAda(res);
        // `lokasi_id` (opsional): poli yang memanggil; bila kosong, sistem memilih poli sejenis yang bebas.
        const pilihan = Number.isInteger(req.body?.lokasi_id) && req.body.lokasi_id > 0 ? req.body.lokasi_id : undefined;
        kirimHasil(res, await layanan.aksiAntrean(pengguna(res), id.data.id, aksi.data, alamatDari(req), pilihan));
    }));
    return rute;
}
