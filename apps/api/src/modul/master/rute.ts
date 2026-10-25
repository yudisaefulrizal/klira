import { Router } from 'express';
import type { Request, RequestHandler, Response } from 'express';
import { GALAT, MASTER, SKEMA_MASTER, SKEMA_MASTER_UBAH, filterMaster, jenisMaster, jenisMasterUbah, sumberOpsiMaster, ubahAktifMaster } from '@klira/shared';
import type { PenggunaSaya, ResponsGalat } from '@klira/shared';
import type { z } from 'zod';
import { wajibMasuk } from '../../middleware/auth';
import { alamatDari } from '../../middleware/audit';
import { buatWajibIzin } from '../../middleware/izin';
import type { LayananAkses } from '../akses/layanan';
import type { LayananIzin } from '../akses/layanan-izin';
import type { HasilMaster, LayananMaster } from './layanan';
import type { MasukanMaster } from './repositori';

function galatValidasi(res: Response, e: z.ZodError): void {
  const badan: ResponsGalat = {
    galat: { kode: 'tidak_valid', pesan: GALAT.tidakValid, rincian: e.issues.map((i) => ({ jalur: i.path.join('.'), pesan: i.message })) },
  };
  res.status(400).json(badan);
}

const KODE_HTTP = { tidak_valid: 400, konflik: 409, tidak_ditemukan: 404 } as const;

function kirimHasil<T>(res: Response, h: HasilMaster<T>, statusSukses = 200): void {
  if (h.ok) return void res.status(statusSukses).json({ data: h.data });
  const badan: ResponsGalat = { galat: { kode: h.kode, pesan: h.pesan, ...(h.rincian ? { rincian: h.rincian } : {}) } };
  res.status(KODE_HTTP[h.kode]).json(badan);
}

/** Rute tab Master data: lihat/input/perbaikan memakai izin fitur `master`. Wilayah hanya baca. */
export function buatRuteMaster(layananAkses: LayananAkses, layananIzin: LayananIzin, layanan: LayananMaster): Router {
  const rute = Router();
  const masuk = wajibMasuk(layananAkses);
  const { wajibIzin } = buatWajibIzin(layananIzin);
  const pengguna = (res: Response) => res.locals.pengguna as PenggunaSaya;
  const bungkus =
    (f: (req: Request, res: Response) => Promise<void>): RequestHandler =>
    (req, res, next) => void f(req, res).catch(next);
  const idRute = (req: Request) => {
    const n = Number(req.params.id);
    return Number.isInteger(n) && n > 0 ? n : null;
  };
  const jenisUbah = (req: Request, res: Response) => {
    const j = jenisMasterUbah.safeParse(req.params.jenis);
    if (!j.success) {
      const wilayah = req.params.jenis === 'wilayah';
      res.status(wilayah ? 405 : 400).json({ galat: { kode: 'tidak_valid', pesan: wilayah ? MASTER.galat.wilayahBacaSaja : MASTER.galat.jenisTakDikenal } } satisfies ResponsGalat);
      return null;
    }
    return j.data;
  };

  rute.get('/master/opsi/:sumber', masuk, wajibIzin('master', 'lihat'), bungkus(async (req, res) => {
    const s = sumberOpsiMaster.safeParse(req.params.sumber);
    if (!s.success) return galatValidasi(res, s.error);
    const cari = typeof req.query.cari === 'string' ? req.query.cari.trim().slice(0, 100) : undefined;
    res.json({ data: await layanan.opsi(pengguna(res), s.data, cari || undefined) });
  }));

  rute.get('/master/:jenis', masuk, wajibIzin('master', 'lihat'), bungkus(async (req, res) => {
    const j = jenisMaster.safeParse(req.params.jenis);
    if (!j.success) return galatValidasi(res, j.error);
    const f = filterMaster.safeParse(req.query);
    if (!f.success) return galatValidasi(res, f.error);
    res.json({ data: await layanan.daftar(pengguna(res), j.data, f.data) });
  }));

  rute.post('/master/:jenis', masuk, wajibIzin('master', 'input'), bungkus(async (req, res) => {
    const j = jenisUbah(req, res);
    if (!j) return;
    const b = SKEMA_MASTER[j].safeParse(req.body ?? {});
    if (!b.success) return galatValidasi(res, b.error);
    kirimHasil(res, await layanan.buat(pengguna(res), j, b.data as MasukanMaster[typeof j], alamatDari(req)), 201);
  }));

  rute.patch('/master/:jenis/:id', masuk, wajibIzin('master', 'perbaikan'), bungkus(async (req, res) => {
    const j = jenisUbah(req, res);
    const id = idRute(req);
    if (!j) return;
    if (!id) return void res.status(404).json({ galat: { kode: 'tidak_ditemukan', pesan: GALAT.tidakDitemukan } } satisfies ResponsGalat);
    const b = SKEMA_MASTER_UBAH[j].safeParse(req.body ?? {});
    if (!b.success) return galatValidasi(res, b.error);
    kirimHasil(res, await layanan.ubah(pengguna(res), j, id, b.data as Partial<MasukanMaster[typeof j]>, alamatDari(req)));
  }));

  rute.patch('/master/:jenis/:id/aktif', masuk, wajibIzin('master', 'perbaikan'), bungkus(async (req, res) => {
    const j = jenisUbah(req, res);
    const id = idRute(req);
    if (!j) return;
    if (!id) return void res.status(404).json({ galat: { kode: 'tidak_ditemukan', pesan: GALAT.tidakDitemukan } } satisfies ResponsGalat);
    const b = ubahAktifMaster.safeParse(req.body ?? {});
    if (!b.success) return galatValidasi(res, b.error);
    kirimHasil(res, await layanan.ubahAktif(pengguna(res), j, id, b.data.aktif, alamatDari(req)));
  }));

  return rute;
}
