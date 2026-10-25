import { Router } from 'express';
import type { Request, RequestHandler, Response } from 'express';
import { aksiAntrean, filterAntrean, idParam, kunjunganMasukan, ubahTahapMasukan, GALAT } from '@klira/shared';
import type { PenggunaSaya, ResponsGalat } from '@klira/shared';
import { wajibMasuk } from '../../middleware/auth';
import { alamatDari } from '../../middleware/audit';
import { buatWajibIzin } from '../../middleware/izin';
import type { LayananAkses } from '../akses/layanan';
import type { LayananIzin } from '../akses/layanan-izin';
import { galatValidasi, kirimHasil } from '../hasil';
import type { LayananKunjungan } from './layanan';

/** Rute kunjungan dan antrean: input = pendaftaran, perbaikan = ubah tahap dan status antrean, lihat = daftar antrean (fitur `kunjungan`). */
export function buatRuteKunjungan(layananAkses: LayananAkses, layananIzin: LayananIzin, layanan: LayananKunjungan): Router {
  const rute = Router();
  const masuk = wajibMasuk(layananAkses);
  const { wajibIzin } = buatWajibIzin(layananIzin);
  const pengguna = (res: Response) => res.locals.pengguna as PenggunaSaya;
  const bungkus =
    (f: (req: Request, res: Response) => Promise<void>): RequestHandler =>
    (req, res, next) => void f(req, res).catch(next);
  const tidakAda = (res: Response) => void res.status(404).json({ galat: { kode: 'tidak_ditemukan', pesan: GALAT.tidakDitemukan } } satisfies ResponsGalat);

  rute.get('/kunjungan/opsi', masuk, wajibIzin('kunjungan', 'input'), bungkus(async (_req, res) => {
    res.json({ data: await layanan.opsi(pengguna(res)) });
  }));

  rute.post('/kunjungan', masuk, wajibIzin('kunjungan', 'input'), bungkus(async (req, res) => {
    const m = kunjunganMasukan.safeParse(req.body ?? {});
    if (!m.success) return galatValidasi(res, m.error);
    kirimHasil(res, await layanan.daftarkan(pengguna(res), m.data, alamatDari(req)), 201);
  }));

  rute.patch('/kunjungan/:id/tahap', masuk, wajibIzin('kunjungan', 'perbaikan'), bungkus(async (req, res) => {
    const id = idParam.safeParse(req.params);
    if (!id.success) return tidakAda(res);
    const m = ubahTahapMasukan.safeParse(req.body ?? {});
    if (!m.success) return galatValidasi(res, m.error);
    kirimHasil(res, await layanan.ubahTahap(pengguna(res), id.data.id, m.data.tahap, alamatDari(req)));
  }));

  rute.get('/antrean', masuk, wajibIzin('kunjungan', 'lihat'), bungkus(async (req, res) => {
    const f = filterAntrean.safeParse(req.query);
    if (!f.success) return galatValidasi(res, f.error);
    res.json({ data: await layanan.daftarAntrean(pengguna(res), f.data) });
  }));

  rute.post('/antrean/:id/:aksi', masuk, wajibIzin('kunjungan', 'perbaikan'), bungkus(async (req, res) => {
    const id = idParam.safeParse({ id: req.params.id });
    const aksi = aksiAntrean.safeParse(req.params.aksi);
    if (!id.success || !aksi.success) return tidakAda(res);
    kirimHasil(res, await layanan.aksiAntrean(pengguna(res), id.data.id, aksi.data, alamatDari(req)));
  }));

  return rute;
}
