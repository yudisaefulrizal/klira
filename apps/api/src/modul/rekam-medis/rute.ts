import { Router } from 'express';
import type { Request, RequestHandler, Response } from 'express';
import { z } from 'zod';
import { KLINIS, idPositif } from '@klira/shared';
import type { PenggunaSaya } from '@klira/shared';
import { wajibMasuk } from '../../middleware/auth';
import { alamatDari } from '../../middleware/audit';
import { buatWajibIzin } from '../../middleware/izin';
import type { LayananAkses } from '../akses/layanan';
import type { LayananIzin } from '../akses/layanan-izin';
import { galatValidasi, kirimHasil } from '../hasil';
import type { LayananPengesahan } from './layanan';

const param = z.object({ entitas: z.string().min(1).max(50), id: z.coerce.number().pipe(idPositif) });

/** API verifikasi pengesahan generik: GET /api/pengesahan/:entitas/:id (izin lihat klinis atau rekam medis). */
export function buatRutePengesahan(layananAkses: LayananAkses, layananIzin: LayananIzin, layanan: LayananPengesahan): Router {
  const rute = Router();
  const masuk = wajibMasuk(layananAkses);
  const { wajibIzinSalahSatu } = buatWajibIzin(layananIzin);
  const bungkus =
    (f: (req: Request, res: Response) => Promise<void>): RequestHandler =>
    (req, res, next) => void f(req, res).catch(next);

  rute.get('/pengesahan/:entitas/:id', masuk, wajibIzinSalahSatu(['klinis', 'lihat'], ['rekam-medis', 'lihat']), bungkus(async (req, res) => {
    const p = param.safeParse(req.params);
    if (!p.success) return galatValidasi(res, p.error);
    kirimHasil(res, await layanan.verifikasi(res.locals.pengguna as PenggunaSaya, p.data.entitas, p.data.id, alamatDari(req)));
  }));

  rute.get('/pengesahan/:entitas/:id/versi', masuk, wajibIzinSalahSatu(['klinis', 'lihat'], ['rekam-medis', 'lihat']), bungkus(async (req, res) => {
    const p = param.safeParse(req.params);
    if (!p.success) return galatValidasi(res, p.error);
    const pengguna = res.locals.pengguna as PenggunaSaya;
    if (!layanan.entitasDikenal(p.data.entitas)) return void res.status(404).json({ galat: { kode: 'tidak_ditemukan', pesan: KLINIS.galat.entitasTidakDikenal } });
    res.json({ data: await layanan.riwayatVersi(pengguna.fasyankes_id, p.data.entitas, p.data.id) });
  }));

  return rute;
}
