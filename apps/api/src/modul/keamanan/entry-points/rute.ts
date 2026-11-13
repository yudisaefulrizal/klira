import { Router } from 'express';
import type { Request, RequestHandler, Response } from 'express';
import { GALAT, filterRiwayatBackup, pengaturanKeamananMasukan } from '@klira/shared';
import type { PenggunaSaya, ResponsGalat } from '@klira/shared';
import type { z } from 'zod';
import { wajibMasuk } from '../../../middleware/auth';
import { alamatDari } from '../../../middleware/audit';
import { buatWajibIzin } from '../../../middleware/izin';
import type { LayananAkses } from '../../akses/domain/layanan';
import type { LayananIzin } from '../../akses/domain/layanan-izin';
import { GalatCadangan, mulaiUnduhBackup, pulihkanBackup, resetSistem } from '../domain/layanan';
import type { LayananKeamanan } from '../domain/layanan';

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

  // Cadangan sistem: hanya yang boleh memperbaiki akses. Unggah dikirim mentah (bukan JSON) agar tidak dimuat ke memori.
  const kirimGalat = (res: Response, e: unknown) => {
    const pesan = e instanceof GalatCadangan ? e.message : GALAT.umum;
    if (!res.headersSent) res.status(e instanceof GalatCadangan ? 400 : 500).json({ galat: { kode: 'tidak_valid', pesan } } satisfies ResponsGalat);
  };

  rute.get('/cadangan/unduh', masuk, wajibIzin('akses', 'perbaikan'), (req, res) => {
    const { aliran, selesai, batal } = mulaiUnduhBackup();
    const stempel = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
    res.setHeader('content-type', 'application/sql');
    res.setHeader('content-disposition', `attachment; filename="klira-backup-${stempel}.sql"`);
    res.on('close', () => { if (!res.writableFinished) batal(); });
    aliran.pipe(res);
    selesai.catch(() => res.destroy());
  });

  rute.post('/cadangan/pulihkan', masuk, wajibIzin('akses', 'perbaikan'), bungkus(async (req, res) => {
    try {
      await pulihkanBackup(req);
      res.json({ data: { ok: true } });
    } catch (e) {
      kirimGalat(res, e);
    }
  }));

  rute.post('/cadangan/reset', masuk, wajibIzin('akses', 'perbaikan'), bungkus(async (req, res) => {
    if ((req.body as { konfirmasi?: unknown } | undefined)?.konfirmasi !== 'RESET') return void res.status(400).json({ galat: { kode: 'tidak_valid', pesan: GALAT.tidakValid } } satisfies ResponsGalat);
    try {
      await resetSistem();
      res.json({ data: { ok: true } });
    } catch (e) {
      kirimGalat(res, e);
    }
  }));

  return rute;
}
