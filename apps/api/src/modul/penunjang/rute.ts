import { Router } from 'express';
import type { Request, RequestHandler, Response } from 'express';
import {
  filterMasterPemeriksaan, filterRekapLab, GALAT, hasilMasukan, idParam, masterPemeriksaanMasukan, orderLabMasukan, spesimenMasukan, ubahMasterPemeriksaanMasukan,
} from '@klira/shared';
import type { PenggunaSaya, ResponsGalat } from '@klira/shared';
import { wajibMasuk } from '../../middleware/auth';
import { alamatDari } from '../../middleware/audit';
import { buatWajibIzin } from '../../middleware/izin';
import type { LayananAkses } from '../akses/layanan';
import type { LayananIzin } from '../akses/layanan-izin';
import { galatValidasi, kirimHasil } from '../hasil';
import type { LayananPenunjang } from './layanan';

/**
 * Rute penunjang (3.1, 3.3, 4.3). Order dipesan dokter (izin `klinis` input); ambil spesimen, hasil, validasi, dan master oleh analis lab (izin `penunjang`
 * input atau perbaikan); lihat boleh lewat `penunjang`, `klinis`, atau `rekam-medis`. Semua dibatasi pada fasyankes akun; tidak ada rute hapus.
 */
export function buatRutePenunjang(layananAkses: LayananAkses, layananIzin: LayananIzin, layanan: LayananPenunjang): Router {
  const rute = Router();
  const masuk = wajibMasuk(layananAkses);
  const { wajibIzin, wajibIzinSalahSatu } = buatWajibIzin(layananIzin);
  const pengguna = (res: Response) => res.locals.pengguna as PenggunaSaya;
  const bungkus =
    (f: (req: Request, res: Response) => Promise<void>): RequestHandler =>
    (req, res, next) => void f(req, res).catch(next);
  const tidakAda = (res: Response) => void res.status(404).json({ galat: { kode: 'tidak_ditemukan', pesan: GALAT.tidakDitemukan } } satisfies ResponsGalat);
  const lihatOrder = wajibIzinSalahSatu(['penunjang', 'lihat'], ['klinis', 'lihat'], ['rekam-medis', 'lihat']);
  const pesanOrder = wajibIzin('klinis', 'input');
  // Master dibaca juga oleh pemesan order (pilih pemeriksaan).
  const bacaMaster = wajibIzinSalahSatu(['penunjang', 'lihat'], ['klinis', 'input']);

  rute.get('/penunjang/rekap', masuk, wajibIzin('penunjang', 'lihat'), bungkus(async (req, res) => {
    const f = filterRekapLab.safeParse(req.query);
    if (!f.success) return galatValidasi(res, f.error);
    res.json({ data: await layanan.rekap(pengguna(res), f.data) });
  }));

  rute.get('/penunjang/master', masuk, bacaMaster, bungkus(async (req, res) => {
    const f = filterMasterPemeriksaan.safeParse(req.query);
    if (!f.success) return galatValidasi(res, f.error);
    res.json({ data: await layanan.daftarMaster(pengguna(res), f.data) });
  }));
  rute.get('/penunjang/tarif', masuk, wajibIzin('penunjang', 'lihat'), bungkus(async (_req, res) => {
    res.json({ data: await layanan.tarifLab(pengguna(res)) });
  }));
  rute.post('/penunjang/master', masuk, wajibIzin('penunjang', 'input'), bungkus(async (req, res) => {
    const m = masterPemeriksaanMasukan.safeParse(req.body ?? {});
    if (!m.success) return galatValidasi(res, m.error);
    kirimHasil(res, await layanan.buatMaster(pengguna(res), m.data, alamatDari(req)), 201);
  }));
  rute.patch('/penunjang/master/:id', masuk, wajibIzin('penunjang', 'perbaikan'), bungkus(async (req, res) => {
    const id = idParam.safeParse(req.params);
    if (!id.success) return tidakAda(res);
    const m = ubahMasterPemeriksaanMasukan.safeParse(req.body ?? {});
    if (!m.success) return galatValidasi(res, m.error);
    kirimHasil(res, await layanan.ubahMaster(pengguna(res), id.data.id, m.data, alamatDari(req)));
  }));

  rute.get('/kunjungan/:id/penunjang/order', masuk, lihatOrder, bungkus(async (req, res) => {
    const id = idParam.safeParse(req.params);
    if (!id.success) return tidakAda(res);
    kirimHasil(res, await layanan.ordersKunjungan(pengguna(res), id.data.id, alamatDari(req)));
  }));
  rute.post('/kunjungan/:id/penunjang/order', masuk, pesanOrder, bungkus(async (req, res) => {
    const id = idParam.safeParse(req.params);
    if (!id.success) return tidakAda(res);
    const m = orderLabMasukan.safeParse(req.body ?? {});
    if (!m.success) return galatValidasi(res, m.error);
    kirimHasil(res, await layanan.buatOrder(pengguna(res), id.data.id, m.data, alamatDari(req)), 201);
  }));

  rute.get('/penunjang/order/:id', masuk, lihatOrder, bungkus(async (req, res) => {
    const id = idParam.safeParse(req.params);
    if (!id.success) return tidakAda(res);
    kirimHasil(res, await layanan.order(pengguna(res), id.data.id, alamatDari(req)));
  }));
  rute.post('/penunjang/order/:id/spesimen', masuk, wajibIzin('penunjang', 'input'), bungkus(async (req, res) => {
    const id = idParam.safeParse(req.params);
    if (!id.success) return tidakAda(res);
    const m = spesimenMasukan.safeParse(req.body ?? {});
    if (!m.success) return galatValidasi(res, m.error);
    kirimHasil(res, await layanan.ambilSpesimen(pengguna(res), id.data.id, m.data, alamatDari(req)));
  }));
  rute.put('/penunjang/order/:id/hasil', masuk, wajibIzin('penunjang', 'input'), bungkus(async (req, res) => {
    const id = idParam.safeParse(req.params);
    if (!id.success) return tidakAda(res);
    const m = hasilMasukan.safeParse(req.body ?? {});
    if (!m.success) return galatValidasi(res, m.error);
    kirimHasil(res, await layanan.isiHasil(pengguna(res), id.data.id, m.data, alamatDari(req)));
  }));
  rute.post('/penunjang/order/:id/validasi', masuk, wajibIzin('penunjang', 'input'), bungkus(async (req, res) => {
    const id = idParam.safeParse(req.params);
    if (!id.success) return tidakAda(res);
    kirimHasil(res, await layanan.validasi(pengguna(res), id.data.id, alamatDari(req)));
  }));

  return rute;
}
