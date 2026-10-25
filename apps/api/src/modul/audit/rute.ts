import { Router } from 'express';
import type { Request, RequestHandler, Response } from 'express';
import { GALAT, eksporAudit, filterAudit, idParam } from '@klira/shared';
import type { PenggunaSaya, ResponsGalat } from '@klira/shared';
import type { z } from 'zod';
import { wajibMasuk } from '../../middleware/auth';
import { alamatDari } from '../../middleware/audit';
import { buatWajibIzin } from '../../middleware/izin';
import type { LayananAkses } from '../akses/layanan';
import type { LayananIzin } from '../akses/layanan-izin';
import type { LayananAudit } from './layanan';

function galatValidasi(res: Response, e: z.ZodError): void {
  const badan: ResponsGalat = {
    galat: { kode: 'tidak_valid', pesan: GALAT.tidakValid, rincian: e.issues.map((i) => ({ jalur: i.path.join('.'), pesan: i.message })) },
  };
  res.status(400).json(badan);
}

/** Rute tab Log audit: semuanya butuh izin fitur `audit` (lihat). */
export function buatRuteAudit(layananAkses: LayananAkses, layananIzin: LayananIzin, layanan: LayananAudit): Router {
  const rute = Router();
  const masuk = wajibMasuk(layananAkses);
  const { wajibIzin } = buatWajibIzin(layananIzin);
  const izin = wajibIzin('audit', 'lihat');
  const pengguna = (res: Response) => res.locals.pengguna as PenggunaSaya;
  const bungkus =
    (f: (req: Request, res: Response) => Promise<void>): RequestHandler =>
    (req, res, next) => void f(req, res).catch(next);

  rute.get('/audit', masuk, izin, bungkus(async (req, res) => {
    const h = filterAudit.safeParse(req.query);
    if (!h.success) return galatValidasi(res, h.error);
    res.json({ data: await layanan.daftar(pengguna(res), h.data) });
  }));

  rute.post('/audit/ekspor', masuk, izin, bungkus(async (req, res) => {
    const h = eksporAudit.safeParse(req.body ?? {});
    if (!h.success) return galatValidasi(res, h.error);
    const { csv } = await layanan.ekspor(pengguna(res), h.data, alamatDari(req));
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="log-audit.csv"');
    res.send(csv);
  }));

  rute.get('/audit/:id', masuk, izin, bungkus(async (req, res) => {
    const h = idParam.safeParse(req.params);
    if (!h.success) return galatValidasi(res, h.error);
    const d = await layanan.detail(pengguna(res), h.data.id);
    if (!d) {
      const badan: ResponsGalat = { galat: { kode: 'tidak_ditemukan', pesan: GALAT.tidakDitemukan } };
      return void res.status(404).json(badan);
    }
    res.json({ data: d });
  }));

  return rute;
}
