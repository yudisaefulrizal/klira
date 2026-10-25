import { Router } from 'express';
import type { Request, RequestHandler, Response } from 'express';
import { GALAT, idParam } from '@klira/shared';
import type { PenggunaSaya, ResponsGalat } from '@klira/shared';
import { wajibMasuk } from '../../middleware/auth';
import { alamatDari } from '../../middleware/audit';
import { buatWajibIzin } from '../../middleware/izin';
import type { LayananAkses } from '../akses/layanan';
import type { LayananIzin } from '../akses/layanan-izin';
import { kirimHasil } from '../hasil';
import type { LayananAddendum } from './layanan-addendum';

/** GET /api/kunjungan/:id/addendum (izin lihat klinis, rekam medis, atau penunjang). Tidak ada rute ubah atau hapus. */
export function buatRuteAddendum(layananAkses: LayananAkses, layananIzin: LayananIzin, layanan: LayananAddendum): Router {
  const rute = Router();
  const masuk = wajibMasuk(layananAkses);
  const { wajibIzinSalahSatu } = buatWajibIzin(layananIzin);
  const bungkus =
    (f: (req: Request, res: Response) => Promise<void>): RequestHandler =>
    (req, res, next) => void f(req, res).catch(next);

  rute.get('/kunjungan/:id/addendum', masuk, wajibIzinSalahSatu(['klinis', 'lihat'], ['rekam-medis', 'lihat'], ['penunjang', 'lihat']), bungkus(async (req, res) => {
    const id = idParam.safeParse(req.params);
    if (!id.success) return void res.status(404).json({ galat: { kode: 'tidak_ditemukan', pesan: GALAT.tidakDitemukan } } satisfies ResponsGalat);
    kirimHasil(res, await layanan.daftar(res.locals.pengguna as PenggunaSaya, id.data.id, alamatDari(req)));
  }));

  return rute;
}
