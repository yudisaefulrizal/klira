import { Router } from 'express';
import type { Request, RequestHandler, Response } from 'express';
import { filterKfa, filterMasterObat, filterRiwayatObat, GALAT, idParam, masterObatMasukan, mutasiStokMasukan, resepMasukan, serahTerimaMasukan, telaahMasukan, ubahMasterObatMasukan } from '@klira/shared';
import type { PenggunaSaya, ResponsGalat } from '@klira/shared';
import { wajibMasuk } from '../../middleware/auth';
import { alamatDari } from '../../middleware/audit';
import { buatWajibIzin } from '../../middleware/izin';
import type { LayananAkses } from '../akses/layanan';
import type { LayananIzin } from '../akses/layanan-izin';
import { galatValidasi, kirimHasil } from '../hasil';
import type { LayananFarmasi } from './layanan';

/**
 * Rute Farmasi (3.1, 3.3, 4.3): master obat tertaut KFA, stok sederhana, resep dari dokter (izin `resep`), telaah dan siapkan oleh apoteker (izin `farmasi`).
 * Semua dibatasi pada fasyankes akun; tidak ada rute hapus (obat dinonaktifkan, mutasi hanya ditambah).
 */
export function buatRuteFarmasi(layananAkses: LayananAkses, layananIzin: LayananIzin, layanan: LayananFarmasi): Router {
  const rute = Router();
  const masuk = wajibMasuk(layananAkses);
  const { wajibIzin, wajibIzinSalahSatu } = buatWajibIzin(layananIzin);
  const pengguna = (res: Response) => res.locals.pengguna as PenggunaSaya;
  const bungkus =
    (f: (req: Request, res: Response) => Promise<void>): RequestHandler =>
    (req, res, next) => void f(req, res).catch(next);
  const tidakAda = (res: Response) => void res.status(404).json({ galat: { kode: 'tidak_ditemukan', pesan: GALAT.tidakDitemukan } } satisfies ResponsGalat);
  // Master dibaca juga oleh dokter yang menulis resep.
  const bacaMaster = wajibIzinSalahSatu(['farmasi', 'lihat'], ['resep', 'input']);
  const lihatResep = wajibIzinSalahSatu(['farmasi', 'lihat'], ['farmasi', 'input'], ['resep', 'lihat'], ['klinis', 'lihat'], ['rekam-medis', 'lihat']);

  rute.get('/farmasi/kfa', masuk, wajibIzin('farmasi', 'input'), bungkus(async (req, res) => {
    const f = filterKfa.safeParse(req.query);
    if (!f.success) return galatValidasi(res, f.error);
    res.json({ data: await layanan.cariKfa(f.data) });
  }));
  rute.get('/farmasi/master', masuk, bacaMaster, bungkus(async (req, res) => {
    const f = filterMasterObat.safeParse(req.query);
    if (!f.success) return galatValidasi(res, f.error);
    res.json({ data: await layanan.daftarMaster(pengguna(res), f.data) });
  }));
  rute.post('/farmasi/master', masuk, wajibIzin('farmasi', 'input'), bungkus(async (req, res) => {
    const m = masterObatMasukan.safeParse(req.body ?? {});
    if (!m.success) return galatValidasi(res, m.error);
    kirimHasil(res, await layanan.buatMaster(pengguna(res), m.data, alamatDari(req)), 201);
  }));
  rute.patch('/farmasi/master/:id', masuk, wajibIzin('farmasi', 'perbaikan'), bungkus(async (req, res) => {
    const id = idParam.safeParse(req.params);
    if (!id.success) return tidakAda(res);
    const m = ubahMasterObatMasukan.safeParse(req.body ?? {});
    if (!m.success) return galatValidasi(res, m.error);
    kirimHasil(res, await layanan.ubahMaster(pengguna(res), id.data.id, m.data, alamatDari(req)));
  }));
  rute.get('/farmasi/master/:id/stok', masuk, wajibIzin('farmasi', 'lihat'), bungkus(async (req, res) => {
    const id = idParam.safeParse(req.params);
    if (!id.success) return tidakAda(res);
    kirimHasil(res, await layanan.stok(pengguna(res), id.data.id));
  }));
  rute.post('/farmasi/mutasi', masuk, wajibIzin('farmasi', 'input'), bungkus(async (req, res) => {
    const m = mutasiStokMasukan.safeParse(req.body ?? {});
    if (!m.success) return galatValidasi(res, m.error);
    kirimHasil(res, await layanan.mutasi(pengguna(res), m.data, alamatDari(req)), 201);
  }));
  rute.get('/farmasi/riwayat', masuk, wajibIzin('farmasi', 'lihat'), bungkus(async (req, res) => {
    const f = filterRiwayatObat.safeParse(req.query);
    if (!f.success) return galatValidasi(res, f.error);
    res.json({ data: await layanan.riwayat(pengguna(res), f.data) });
  }));

  rute.get('/kunjungan/:id/resep', masuk, lihatResep, bungkus(async (req, res) => {
    const id = idParam.safeParse(req.params);
    if (!id.success) return tidakAda(res);
    kirimHasil(res, await layanan.resepKunjungan(pengguna(res), id.data.id, alamatDari(req)));
  }));
  rute.post('/kunjungan/:id/resep', masuk, wajibIzin('resep', 'input'), bungkus(async (req, res) => {
    const id = idParam.safeParse(req.params);
    if (!id.success) return tidakAda(res);
    const m = resepMasukan.safeParse(req.body ?? {});
    if (!m.success) return galatValidasi(res, m.error);
    kirimHasil(res, await layanan.buatResep(pengguna(res), id.data.id, m.data, alamatDari(req)), 201);
  }));
  rute.post('/resep/:id/telaah', masuk, wajibIzin('farmasi', 'input'), bungkus(async (req, res) => {
    const id = idParam.safeParse(req.params);
    if (!id.success) return tidakAda(res);
    const m = telaahMasukan.safeParse(req.body ?? {});
    if (!m.success) return galatValidasi(res, m.error);
    kirimHasil(res, await layanan.telaah(pengguna(res), id.data.id, m.data, alamatDari(req)));
  }));
  rute.post('/resep/:id/siap', masuk, wajibIzin('farmasi', 'input'), bungkus(async (req, res) => {
    const id = idParam.safeParse(req.params);
    if (!id.success) return tidakAda(res);
    kirimHasil(res, await layanan.siap(pengguna(res), id.data.id, alamatDari(req)));
  }));

  rute.post('/kunjungan/:id/serah-terima-obat', masuk, wajibIzin('farmasi', 'input'), bungkus(async (req, res) => {
    const id = idParam.safeParse(req.params);
    if (!id.success) return tidakAda(res);
    const m = serahTerimaMasukan.safeParse(req.body ?? {});
    if (!m.success) return galatValidasi(res, m.error);
    kirimHasil(res, await layanan.serahTerima(pengguna(res), id.data.id, m.data, alamatDari(req)));
  }));
  return rute;
}
