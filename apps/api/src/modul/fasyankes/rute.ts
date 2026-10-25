import { Router } from 'express';
import type { Request, RequestHandler, Response } from 'express';
import { GALAT, filterRiwayatBackup, profilKlinikMasukan } from '@klira/shared';
import type { PenggunaSaya, ResponsGalat } from '@klira/shared';
import type { z } from 'zod';
import { wajibMasuk } from '../../middleware/auth';
import { alamatDari } from '../../middleware/audit';
import { buatWajibIzin } from '../../middleware/izin';
import type { LayananAkses } from '../akses/layanan';
import type { LayananIzin } from '../akses/layanan-izin';
import type { LayananFasyankes } from './layanan';

function galatValidasi(res: Response, e: z.ZodError): void {
  const badan: ResponsGalat = {
    galat: { kode: 'tidak_valid', pesan: GALAT.tidakValid, rincian: e.issues.map((i) => ({ jalur: i.path.join('.'), pesan: i.message })) },
  };
  res.status(400).json(badan);
}

/** Rute tab Profil klinik: lihat butuh `profil-klinik` lihat, simpan butuh `profil-klinik` perbaikan. */
export function buatRuteFasyankes(layananAkses: LayananAkses, layananIzin: LayananIzin, layanan: LayananFasyankes): Router {
  const rute = Router();
  const masuk = wajibMasuk(layananAkses);
  const { wajibIzin } = buatWajibIzin(layananIzin);
  const pengguna = (res: Response) => res.locals.pengguna as PenggunaSaya;
  const bungkus =
    (f: (req: Request, res: Response) => Promise<void>): RequestHandler =>
    (req, res, next) => void f(req, res).catch(next);

  rute.get('/fasyankes/profil', masuk, wajibIzin('profil-klinik', 'lihat'), bungkus(async (_req, res) => {
    const data = await layanan.ambil(pengguna(res));
    if (!data) return void res.status(404).json({ galat: { kode: 'tidak_ditemukan', pesan: GALAT.tidakDitemukan } } satisfies ResponsGalat);
    res.json({ data });
  }));

  rute.patch('/fasyankes/profil', masuk, wajibIzin('profil-klinik', 'perbaikan'), bungkus(async (req, res) => {
    const b = profilKlinikMasukan.safeParse(req.body ?? {});
    if (!b.success) return galatValidasi(res, b.error);
    const h = await layanan.simpan(pengguna(res), b.data, alamatDari(req));
    if (h.ok) return void res.json({ data: h.data });
    res.status(h.kode === 'konflik' ? 409 : 404).json({ galat: { kode: h.kode, pesan: h.pesan } } satisfies ResponsGalat);
  }));

  rute.get('/fasyankes/riwayat-profil', masuk, wajibIzin('profil-klinik', 'lihat'), bungkus(async (req, res) => {
    const h = filterRiwayatBackup.safeParse(req.query);
    if (!h.success) return galatValidasi(res, h.error);
    res.json({ data: await layanan.riwayat(pengguna(res), h.data.halaman, h.data.ukuran) });
  }));

  return rute;
}
