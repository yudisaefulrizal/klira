import { Router } from 'express';
import type { Request, RequestHandler, Response } from 'express';
import { GALAT, filterPengguna, idParam, ubahPengguna } from '@klira/shared';
import type { PenggunaSaya, ResponsGalat } from '@klira/shared';
import type { z } from 'zod';
import { wajibMasuk } from '../../middleware/auth';
import { alamatDari } from '../../middleware/audit';
import { buatWajibIzin } from '../../middleware/izin';
import type { LayananAkses } from '../akses/layanan';
import type { LayananIzin } from '../akses/layanan-izin';
import type { LayananPengguna } from './layanan';

function galatValidasi(res: Response, e: z.ZodError): void {
  const badan: ResponsGalat = {
    galat: { kode: 'tidak_valid', pesan: GALAT.tidakValid, rincian: e.issues.map((i) => ({ jalur: i.path.join('.'), pesan: i.message })) },
  };
  res.status(400).json(badan);
}

/** Rute tab Pengguna dan akses: daftar (akses lihat) dan nonaktifkan/aktifkan (akses perbaikan). */
export function buatRutePengguna(layananAkses: LayananAkses, layananIzin: LayananIzin, layanan: LayananPengguna): Router {
  const rute = Router();
  const masuk = wajibMasuk(layananAkses);
  const { wajibIzin } = buatWajibIzin(layananIzin);
  const pengguna = (res: Response) => res.locals.pengguna as PenggunaSaya;
  const bungkus =
    (f: (req: Request, res: Response) => Promise<void>): RequestHandler =>
    (req, res, next) => void f(req, res).catch(next);

  rute.get('/pengguna', masuk, wajibIzin('akses', 'lihat'), bungkus(async (req, res) => {
    const h = filterPengguna.safeParse(req.query);
    if (!h.success) return galatValidasi(res, h.error);
    res.json({ data: await layanan.daftar(pengguna(res), h.data) });
  }));

  rute.patch('/pengguna/:id', masuk, wajibIzin('akses', 'perbaikan'), bungkus(async (req, res) => {
    const p = idParam.safeParse(req.params);
    if (!p.success) return galatValidasi(res, p.error);
    const b = ubahPengguna.safeParse(req.body ?? {});
    if (!b.success) return galatValidasi(res, b.error);
    const hasil = await layanan.ubah(pengguna(res), p.data.id, b.data, alamatDari(req));
    if (hasil.ok) return void res.json({ data: hasil.data });
    const badan: ResponsGalat = { galat: { kode: hasil.kode, pesan: hasil.pesan } };
    res.status(hasil.kode === 'konflik' ? 409 : 404).json(badan);
  }));

  return rute;
}
