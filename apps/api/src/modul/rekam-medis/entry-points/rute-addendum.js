import { Router } from 'express';
import { GALAT, idParam } from '@klira/shared';
import { wajibMasuk } from '../../../middleware/auth.js';
import { alamatDari } from '../../../middleware/audit.js';
import { buatWajibIzin } from '../../../middleware/izin.js';
import { kirimHasil } from '../../../umum/hasil.js';
/** GET /api/kunjungan/:id/addendum (izin lihat klinis, rekam medis, atau penunjang). Tidak ada rute ubah atau hapus. */
export function buatRuteAddendum(layananAkses, layananIzin, layanan) {
    const rute = Router();
    const masuk = wajibMasuk(layananAkses);
    const { wajibIzinSalahSatu } = buatWajibIzin(layananIzin);
    const bungkus = (f) => (req, res, next) => void f(req, res).catch(next);
    rute.get('/kunjungan/:id/addendum', masuk, wajibIzinSalahSatu(['klinis', 'lihat'], ['rekam-medis', 'lihat'], ['penunjang', 'lihat']), bungkus(async (req, res) => {
        const id = idParam.safeParse(req.params);
        if (!id.success)
            return void res.status(404).json({ galat: { kode: 'tidak_ditemukan', pesan: GALAT.tidakDitemukan } });
        kirimHasil(res, await layanan.daftar(res.locals.pengguna, id.data.id, alamatDari(req)));
    }));
    return rute;
}
