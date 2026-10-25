import { Router } from 'express';
import type { Request, RequestHandler, Response } from 'express';
import { filterKlaim, GALAT, idParam, siapkanKlaimMasukan, ubahBerkasKlaimMasukan, ubahStatusKlaimMasukan } from '@klira/shared';
import type { PenggunaSaya, ResponsGalat } from '@klira/shared';
import { wajibMasuk } from '../../middleware/auth';
import { alamatDari } from '../../middleware/audit';
import { buatWajibIzin } from '../../middleware/izin';
import type { LayananAkses } from '../akses/layanan';
import type { LayananIzin } from '../akses/layanan-izin';
import { galatValidasi, kirimHasil } from '../hasil';
import type { LayananKlaim } from './layanan';

/** Rute Klaim JKN/BPJS (3.1, 4.5): lihat (izin klaim lihat), siapkan (input), ubah berkas dan status (perbaikan). Dibatasi pada fasyankes akun; tidak ada rute hapus. */
export function buatRuteKlaim(layananAkses: LayananAkses, layananIzin: LayananIzin, layanan: LayananKlaim): Router {
  const rute = Router();
  const masuk = wajibMasuk(layananAkses);
  const { wajibIzin } = buatWajibIzin(layananIzin);
  const pengguna = (res: Response) => res.locals.pengguna as PenggunaSaya;
  const bungkus =
    (f: (req: Request, res: Response) => Promise<void>): RequestHandler =>
    (req, res, next) => void f(req, res).catch(next);
  const tidakAda = (res: Response) => void res.status(404).json({ galat: { kode: 'tidak_ditemukan', pesan: GALAT.tidakDitemukan } } satisfies ResponsGalat);

  rute.get('/klaim', masuk, wajibIzin('klaim', 'lihat'), bungkus(async (req, res) => {
    const f = filterKlaim.safeParse(req.query);
    if (!f.success) return galatValidasi(res, f.error);
    res.json({ data: await layanan.daftar(pengguna(res), f.data) });
  }));
  rute.get('/klaim/kandidat', masuk, wajibIzin('klaim', 'lihat'), bungkus(async (_req, res) => void res.json({ data: await layanan.kandidat(pengguna(res)) })));
  rute.get('/klaim/kode/:id', masuk, wajibIzin('klaim', 'lihat'), bungkus(async (req, res) => {
    const id = idParam.safeParse(req.params);
    if (!id.success) return tidakAda(res);
    kirimHasil(res, await layanan.kodeKunjungan(pengguna(res), id.data.id));
  }));
  rute.get('/klaim/:id', masuk, wajibIzin('klaim', 'lihat'), bungkus(async (req, res) => {
    const id = idParam.safeParse(req.params);
    if (!id.success) return tidakAda(res);
    kirimHasil(res, await layanan.detail(pengguna(res), id.data.id, alamatDari(req)));
  }));
  rute.post('/klaim', masuk, wajibIzin('klaim', 'input'), bungkus(async (req, res) => {
    const m = siapkanKlaimMasukan.safeParse(req.body ?? {});
    if (!m.success) return galatValidasi(res, m.error);
    kirimHasil(res, await layanan.siapkan(pengguna(res), m.data, alamatDari(req)), 201);
  }));
  rute.put('/klaim/:id/berkas', masuk, wajibIzin('klaim', 'perbaikan'), bungkus(async (req, res) => {
    const id = idParam.safeParse(req.params);
    if (!id.success) return tidakAda(res);
    const m = ubahBerkasKlaimMasukan.safeParse(req.body ?? {});
    if (!m.success) return galatValidasi(res, m.error);
    kirimHasil(res, await layanan.ubahBerkas(pengguna(res), id.data.id, m.data, alamatDari(req)));
  }));
  rute.post('/klaim/:id/status', masuk, wajibIzin('klaim', 'perbaikan'), bungkus(async (req, res) => {
    const id = idParam.safeParse(req.params);
    if (!id.success) return tidakAda(res);
    const m = ubahStatusKlaimMasukan.safeParse(req.body ?? {});
    if (!m.success) return galatValidasi(res, m.error);
    kirimHasil(res, await layanan.ubahStatus(pengguna(res), id.data.id, m.data, alamatDari(req)));
  }));

  return rute;
}
