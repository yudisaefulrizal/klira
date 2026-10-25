import { Router } from 'express';
import type { Request, RequestHandler, Response } from 'express';
import { filterBerkas, filterPerbaikan, GALAT, idParam, keputusanPerbaikanMasukan, pengkodeanMasukan, perbaikanMasukan } from '@klira/shared';
import type { PenggunaSaya, ResponsGalat } from '@klira/shared';
import { wajibMasuk } from '../../middleware/auth';
import { alamatDari } from '../../middleware/audit';
import { buatWajibIzin } from '../../middleware/izin';
import type { LayananAkses } from '../akses/layanan';
import type { LayananIzin } from '../akses/layanan-izin';
import { galatValidasi, kirimHasil } from '../hasil';
import type { LayananRm } from './layanan-rm';

/**
 * Rute Rekam medis (3.1, 4.2): perbaikan catatan (pemohon: izin `klinis` perbaikan; peninjau: `rekam-medis` perbaikan), pengkodean ICD (izin `rekam-medis`),
 * daftar berkas (lihat `rekam-medis` atau `klinis`). Dibatasi pada fasyankes akun; tidak ada rute hapus.
 */
export function buatRuteRm(layananAkses: LayananAkses, layananIzin: LayananIzin, layanan: LayananRm): Router {
  const rute = Router();
  const masuk = wajibMasuk(layananAkses);
  const { wajibIzin, wajibIzinSalahSatu } = buatWajibIzin(layananIzin);
  const pengguna = (res: Response) => res.locals.pengguna as PenggunaSaya;
  const bungkus =
    (f: (req: Request, res: Response) => Promise<void>): RequestHandler =>
    (req, res, next) => void f(req, res).catch(next);
  const tidakAda = (res: Response) => void res.status(404).json({ galat: { kode: 'tidak_ditemukan', pesan: GALAT.tidakDitemukan } } satisfies ResponsGalat);
  const lihatBerkas = wajibIzinSalahSatu(['rekam-medis', 'lihat'], ['klinis', 'lihat']);

  rute.get('/rekam-medis/berkas', masuk, lihatBerkas, bungkus(async (req, res) => {
    const f = filterBerkas.safeParse(req.query);
    if (!f.success) return galatValidasi(res, f.error);
    res.json({ data: await layanan.berkas(pengguna(res), f.data) });
  }));

  rute.post('/kunjungan/:id/perbaikan', masuk, wajibIzin('klinis', 'perbaikan'), bungkus(async (req, res) => {
    const id = idParam.safeParse(req.params);
    if (!id.success) return tidakAda(res);
    const m = perbaikanMasukan.safeParse(req.body ?? {});
    if (!m.success) return galatValidasi(res, m.error);
    kirimHasil(res, await layanan.ajukanPerbaikan(pengguna(res), id.data.id, m.data, alamatDari(req)), 201);
  }));
  rute.get('/rekam-medis/perbaikan', masuk, wajibIzin('rekam-medis', 'lihat'), bungkus(async (req, res) => {
    const f = filterPerbaikan.safeParse(req.query);
    if (!f.success) return galatValidasi(res, f.error);
    res.json({ data: await layanan.daftarPerbaikan(pengguna(res), f.data) });
  }));
  rute.post('/rekam-medis/perbaikan/:id/keputusan', masuk, wajibIzin('rekam-medis', 'perbaikan'), bungkus(async (req, res) => {
    const id = idParam.safeParse(req.params);
    if (!id.success) return tidakAda(res);
    const m = keputusanPerbaikanMasukan.safeParse(req.body ?? {});
    if (!m.success) return galatValidasi(res, m.error);
    kirimHasil(res, await layanan.putuskan(pengguna(res), id.data.id, m.data, alamatDari(req)));
  }));

  rute.get('/kunjungan/:id/pengkodean', masuk, wajibIzin('rekam-medis', 'lihat'), bungkus(async (req, res) => {
    const id = idParam.safeParse(req.params);
    if (!id.success) return tidakAda(res);
    kirimHasil(res, await layanan.kode(pengguna(res), id.data.id, alamatDari(req)));
  }));
  rute.put('/kunjungan/:id/pengkodean', masuk, wajibIzin('rekam-medis', 'input'), bungkus(async (req, res) => {
    const id = idParam.safeParse(req.params);
    if (!id.success) return tidakAda(res);
    const m = pengkodeanMasukan.safeParse(req.body ?? {});
    if (!m.success) return galatValidasi(res, m.error);
    kirimHasil(res, await layanan.simpanKode(pengguna(res), id.data.id, m.data, alamatDari(req)));
  }));

  return rute;
}
