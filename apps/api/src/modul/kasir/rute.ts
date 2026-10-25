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
import type { LayananTagihan } from './layanan';

/** GET /api/kunjungan/:id/tagihan (izin lihat kasir, klinis, atau rekam medis). */
export function buatRuteKasir(layananAkses: LayananAkses, layananIzin: LayananIzin, layanan: LayananTagihan): Router {
  const rute = Router();
  const masuk = wajibMasuk(layananAkses);
  const { wajibIzinSalahSatu } = buatWajibIzin(layananIzin);
  const bungkus =
    (f: (req: Request, res: Response) => Promise<void>): RequestHandler =>
    (req, res, next) => void f(req, res).catch(next);

  rute.get('/kunjungan/:id/tagihan', masuk, wajibIzinSalahSatu(['kasir', 'lihat'], ['klinis', 'lihat'], ['rekam-medis', 'lihat']), bungkus(async (req, res) => {
    const id = idParam.safeParse(req.params);
    if (!id.success) return void res.status(404).json({ galat: { kode: 'tidak_ditemukan', pesan: GALAT.tidakDitemukan } } satisfies ResponsGalat);
    kirimHasil(res, await layanan.ambil(res.locals.pengguna as PenggunaSaya, id.data.id, alamatDari(req)));
  }));

  return rute;
}
