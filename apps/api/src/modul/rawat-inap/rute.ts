import { Router } from 'express';
import type { Request, RequestHandler, Response } from 'express';
import { admisiMasukan, catatanHarianMasukan, GALAT, idParam, pemulanganMasukan, penempatanMasukan } from '@klira/shared';
import type { PenggunaSaya, ResponsGalat } from '@klira/shared';
import { z } from 'zod';
import { wajibMasuk } from '../../middleware/auth';
import { alamatDari } from '../../middleware/audit';
import { buatWajibIzin } from '../../middleware/izin';
import type { LayananAkses } from '../akses/layanan';
import type { LayananIzin } from '../akses/layanan-izin';
import { galatValidasi, kirimHasil } from '../hasil';
import type { LayananRawatInap } from './layanan';

/** Rute Rawat inap (3.1, 3.3): papan bed dan data (izin klinis lihat), admisi, penempatan, catatan harian, dan pemulangan (izin klinis input). Tidak ada rute hapus. */
export function buatRuteRawatInap(layananAkses: LayananAkses, layananIzin: LayananIzin, layanan: LayananRawatInap): Router {
  const rute = Router();
  const masuk = wajibMasuk(layananAkses);
  const { wajibIzin } = buatWajibIzin(layananIzin);
  const pengguna = (res: Response) => res.locals.pengguna as PenggunaSaya;
  const bungkus =
    (f: (req: Request, res: Response) => Promise<void>): RequestHandler =>
    (req, res, next) => void f(req, res).catch(next);
  const tidakAda = (res: Response) => void res.status(404).json({ galat: { kode: 'tidak_ditemukan', pesan: GALAT.tidakDitemukan } } satisfies ResponsGalat);
  const lihat = wajibIzin('klinis', 'lihat');
  const input = wajibIzin('klinis', 'input');

  rute.get('/rawat-inap/papan', masuk, lihat, bungkus(async (_req, res) => void res.json({ data: await layanan.papan(pengguna(res)) })));
  rute.get('/rawat-inap/opsi', masuk, lihat, bungkus(async (_req, res) => void res.json({ data: await layanan.opsi(pengguna(res)) })));
  rute.get('/rawat-inap/asal', masuk, lihat, bungkus(async (req, res) => {
    const q = z.object({ pasien_id: z.coerce.number().int().positive() }).safeParse(req.query);
    if (!q.success) return galatValidasi(res, q.error);
    kirimHasil(res, await layanan.asal(pengguna(res), q.data.pasien_id));
  }));
  rute.post('/rawat-inap/admisi', masuk, input, bungkus(async (req, res) => {
    const m = admisiMasukan.safeParse(req.body ?? {});
    if (!m.success) return galatValidasi(res, m.error);
    kirimHasil(res, await layanan.admisi(pengguna(res), m.data, alamatDari(req)), 201);
  }));

  rute.get('/kunjungan/:id/rawat-inap', masuk, lihat, bungkus(async (req, res) => {
    const id = idParam.safeParse(req.params);
    if (!id.success) return tidakAda(res);
    kirimHasil(res, await layanan.detail(pengguna(res), id.data.id, alamatDari(req)));
  }));
  rute.put('/kunjungan/:id/penempatan', masuk, input, bungkus(async (req, res) => {
    const id = idParam.safeParse(req.params);
    if (!id.success) return tidakAda(res);
    const m = penempatanMasukan.safeParse(req.body ?? {});
    if (!m.success) return galatValidasi(res, m.error);
    kirimHasil(res, await layanan.ubahPenempatan(pengguna(res), id.data.id, m.data, alamatDari(req)));
  }));
  rute.get('/kunjungan/:id/cppt', masuk, lihat, bungkus(async (req, res) => {
    const id = idParam.safeParse(req.params);
    if (!id.success) return tidakAda(res);
    kirimHasil(res, await layanan.daftarCatatan(pengguna(res), id.data.id));
  }));
  rute.post('/kunjungan/:id/cppt', masuk, input, bungkus(async (req, res) => {
    const id = idParam.safeParse(req.params);
    if (!id.success) return tidakAda(res);
    const m = catatanHarianMasukan.safeParse(req.body ?? {});
    if (!m.success) return galatValidasi(res, m.error);
    kirimHasil(res, await layanan.tambahCatatan(pengguna(res), id.data.id, m.data, alamatDari(req)), 201);
  }));
  rute.post('/kunjungan/:id/pemulangan', masuk, input, bungkus(async (req, res) => {
    const id = idParam.safeParse(req.params);
    if (!id.success) return tidakAda(res);
    const m = pemulanganMasukan.safeParse(req.body ?? {});
    if (!m.success) return galatValidasi(res, m.error);
    kirimHasil(res, await layanan.pulangkan(pengguna(res), id.data.id, m.data, alamatDari(req)), 201);
  }));

  return rute;
}
