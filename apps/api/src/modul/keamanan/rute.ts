import { Router } from 'express';
import type { Request, RequestHandler, Response } from 'express';
import { GALAT, filterRiwayatBackup, pengaturanKeamananMasukan } from '@klira/shared';
import type { PenggunaSaya, ResponsGalat } from '@klira/shared';
import type { z } from 'zod';
import { wajibMasuk } from '../../middleware/auth';
import { alamatDari } from '../../middleware/audit';
import { buatWajibIzin } from '../../middleware/izin';
import type { LayananAkses } from '../akses/layanan';
import type { LayananIzin } from '../akses/layanan-izin';
import type { LayananKeamanan } from './layanan';

function galatValidasi(res: Response, e: z.ZodError): void {
  const badan: ResponsGalat = {
    galat: { kode: 'tidak_valid', pesan: GALAT.tidakValid, rincian: e.issues.map((i) => ({ jalur: i.path.join('.'), pesan: i.message })) },
  };
  res.status(400).json(badan);
}

/** Rute tab Keamanan: lihat butuh `akses` lihat, simpan butuh `akses` perbaikan; riwayat backup hanya baca. */
export function buatRuteKeamanan(layananAkses: LayananAkses, layananIzin: LayananIzin, layanan: LayananKeamanan): Router {
  const rute = Router();
  const masuk = wajibMasuk(layananAkses);
  const { wajibIzin } = buatWajibIzin(layananIzin);
  const pengguna = (res: Response) => res.locals.pengguna as PenggunaSaya;
  const bungkus =
    (f: (req: Request, res: Response) => Promise<void>): RequestHandler =>
    (req, res, next) => void f(req, res).catch(next);

  rute.get('/pengaturan-keamanan', masuk, wajibIzin('akses', 'lihat'), bungkus(async (_req, res) => {
    res.json({ data: await layanan.ambil(pengguna(res)) });
  }));

  rute.patch('/pengaturan-keamanan', masuk, wajibIzin('akses', 'perbaikan'), bungkus(async (req, res) => {
    const h = pengaturanKeamananMasukan.safeParse(req.body ?? {});
    if (!h.success) return galatValidasi(res, h.error);
    res.json({ data: await layanan.simpan(pengguna(res), h.data, alamatDari(req)) });
  }));

  rute.get('/riwayat-backup', masuk, wajibIzin('akses', 'lihat'), bungkus(async (req, res) => {
    const h = filterRiwayatBackup.safeParse(req.query);
    if (!h.success) return galatValidasi(res, h.error);
    res.json({ data: await layanan.daftarBackup(pengguna(res), h.data.halaman, h.data.ukuran) });
  }));

  return rute;
}
