import { Router } from 'express';
import type { Request, RequestHandler, Response } from 'express';
import { z } from 'zod';
import {
  bagianParam, cariTerminologiMasukan, favoritMasukan, filterFavorit, filterTemplat, GALAT, idParam, keluargaMasukan, selesaiPemeriksaanMasukan, simpanBagianMasukan, templatMasukan,
  ubahFavoritMasukan, ubahKeluargaMasukan,
} from '@klira/shared';
import type { PenggunaSaya, ResponsGalat } from '@klira/shared';
import { wajibMasuk } from '../../middleware/auth';
import { alamatDari } from '../../middleware/audit';
import { buatWajibIzin } from '../../middleware/izin';
import type { LayananAkses } from '../akses/layanan';
import type { LayananIzin } from '../akses/layanan-izin';
import { galatValidasi, kirimHasil } from '../hasil';
import type { LayananKlinis } from './layanan';

const idSumber = z.object({ id: z.coerce.number().int().positive(), sumber_id: z.coerce.number().int().positive() });
const idAnak = z.object({ id: z.coerce.number().int().positive(), anak_id: z.coerce.number().int().positive() });
const queryRiwayat = z.object({ kecuali: z.coerce.number().int().positive().optional() });

/**
 * Rute klinis (3.3, 4.2): catatan per bagian (izin `klinis`; lihat boleh juga lewat `rekam-medis`), riwayat, salinan, terminologi, favorit,
 * templat, dan family folder. Semua dibatasi pada fasyankes akun; tidak ada rute hapus catatan (perubahan berversi).
 */
export function buatRuteKlinis(layananAkses: LayananAkses, layananIzin: LayananIzin, layanan: LayananKlinis): Router {
  const rute = Router();
  const masuk = wajibMasuk(layananAkses);
  const { wajibIzinSalahSatu } = buatWajibIzin(layananIzin);
  const pengguna = (res: Response) => res.locals.pengguna as PenggunaSaya;
  const bungkus =
    (f: (req: Request, res: Response) => Promise<void>): RequestHandler =>
    (req, res, next) => void f(req, res).catch(next);
  const tidakAda = (res: Response) => void res.status(404).json({ galat: { kode: 'tidak_ditemukan', pesan: GALAT.tidakDitemukan } } satisfies ResponsGalat);
  const lihatKlinis = wajibIzinSalahSatu(['klinis', 'lihat'], ['rekam-medis', 'lihat']);
  const tulisKlinis = wajibIzinSalahSatu(['klinis', 'input'], ['klinis', 'perbaikan']);

  rute.get('/kunjungan/:id/klinis', masuk, lihatKlinis, bungkus(async (req, res) => {
    const id = idParam.safeParse(req.params);
    if (!id.success) return tidakAda(res);
    kirimHasil(res, await layanan.ambil(pengguna(res), id.data.id, alamatDari(req)));
  }));

  rute.put('/kunjungan/:id/klinis/:bagian', masuk, tulisKlinis, bungkus(async (req, res) => {
    const p = bagianParam.safeParse(req.params);
    if (!p.success) return tidakAda(res);
    const m = simpanBagianMasukan.safeParse(req.body ?? {});
    if (!m.success) return galatValidasi(res, m.error);
    kirimHasil(res, await layanan.simpanBagian(pengguna(res), p.data.id, p.data.bagian, m.data.isi, m.data.alasan, alamatDari(req)));
  }));

  rute.post('/kunjungan/:id/klinis/selesai', masuk, tulisKlinis, bungkus(async (req, res) => {
    const id = idParam.safeParse(req.params);
    if (!id.success) return tidakAda(res);
    const m = selesaiPemeriksaanMasukan.safeParse(req.body ?? {});
    if (!m.success) return galatValidasi(res, m.error);
    kirimHasil(res, await layanan.selesai(pengguna(res), id.data.id, m.data.tahap, alamatDari(req)));
  }));

  rute.get('/kunjungan/:id/konteks-klinis', masuk, lihatKlinis, bungkus(async (req, res) => {
    const id = idParam.safeParse(req.params);
    if (!id.success) return tidakAda(res);
    kirimHasil(res, await layanan.konteks(pengguna(res), id.data.id, alamatDari(req)));
  }));

  rute.get('/kunjungan/:id/salinan/:sumber_id', masuk, lihatKlinis, bungkus(async (req, res) => {
    const p = idSumber.safeParse(req.params);
    if (!p.success) return tidakAda(res);
    kirimHasil(res, await layanan.salinan(pengguna(res), p.data.id, p.data.sumber_id, alamatDari(req)));
  }));

  rute.get('/pasien/:id/riwayat-kunjungan', masuk, lihatKlinis, bungkus(async (req, res) => {
    const id = idParam.safeParse(req.params);
    const q = queryRiwayat.safeParse(req.query);
    if (!id.success) return tidakAda(res);
    if (!q.success) return galatValidasi(res, q.error);
    kirimHasil(res, await layanan.riwayat(pengguna(res), id.data.id, q.data.kecuali ?? null, alamatDari(req)));
  }));

  rute.get('/terminologi', masuk, lihatKlinis, bungkus(async (req, res) => {
    const q = cariTerminologiMasukan.safeParse(req.query);
    if (!q.success) return galatValidasi(res, q.error);
    res.json({ data: await layanan.cariTerminologi(q.data) });
  }));

  // Favorit dan templat milik pengguna sendiri.
  rute.get('/favorit', masuk, lihatKlinis, bungkus(async (req, res) => {
    const f = filterFavorit.safeParse(req.query);
    if (!f.success) return galatValidasi(res, f.error);
    res.json({ data: await layanan.daftarFavorit(pengguna(res), f.data.jenis) });
  }));
  rute.post('/favorit', masuk, tulisKlinis, bungkus(async (req, res) => {
    const m = favoritMasukan.safeParse(req.body ?? {});
    if (!m.success) return galatValidasi(res, m.error);
    kirimHasil(res, await layanan.tambahFavorit(pengguna(res), m.data), 201);
  }));
  rute.patch('/favorit/:id', masuk, tulisKlinis, bungkus(async (req, res) => {
    const id = idParam.safeParse(req.params);
    if (!id.success) return tidakAda(res);
    const m = ubahFavoritMasukan.safeParse(req.body ?? {});
    if (!m.success) return galatValidasi(res, m.error);
    kirimHasil(res, await layanan.ubahUrutanFavorit(pengguna(res), id.data.id, m.data.urutan));
  }));
  rute.delete('/favorit/:id', masuk, tulisKlinis, bungkus(async (req, res) => {
    const id = idParam.safeParse(req.params);
    if (!id.success) return tidakAda(res);
    kirimHasil(res, await layanan.hapusFavorit(pengguna(res), id.data.id));
  }));

  rute.get('/templat-catatan', masuk, lihatKlinis, bungkus(async (req, res) => {
    const f = filterTemplat.safeParse(req.query);
    if (!f.success) return galatValidasi(res, f.error);
    res.json({ data: await layanan.daftarTemplat(pengguna(res), f.data.bagian) });
  }));
  rute.post('/templat-catatan', masuk, tulisKlinis, bungkus(async (req, res) => {
    const m = templatMasukan.safeParse(req.body ?? {});
    if (!m.success) return galatValidasi(res, m.error);
    kirimHasil(res, await layanan.tambahTemplat(pengguna(res), m.data), 201);
  }));
  rute.delete('/templat-catatan/:id', masuk, tulisKlinis, bungkus(async (req, res) => {
    const id = idParam.safeParse(req.params);
    if (!id.success) return tidakAda(res);
    kirimHasil(res, await layanan.hapusTemplat(pengguna(res), id.data.id));
  }));

  // Family folder: melihat dengan izin lihat pasien/klinis/rekam medis; menautkan dengan izin input pasien atau klinis.
  const lihatKeluarga = wajibIzinSalahSatu(['pasien', 'lihat'], ['klinis', 'lihat'], ['rekam-medis', 'lihat']);
  const ubahKeluarga = wajibIzinSalahSatu(['pasien', 'input'], ['klinis', 'input']);
  rute.get('/pasien/:id/keluarga', masuk, lihatKeluarga, bungkus(async (req, res) => {
    const id = idParam.safeParse(req.params);
    if (!id.success) return tidakAda(res);
    kirimHasil(res, await layanan.folderKeluarga(pengguna(res), id.data.id, alamatDari(req)));
  }));
  rute.post('/pasien/:id/keluarga', masuk, ubahKeluarga, bungkus(async (req, res) => {
    const id = idParam.safeParse(req.params);
    if (!id.success) return tidakAda(res);
    const m = keluargaMasukan.safeParse(req.body ?? {});
    if (!m.success) return galatValidasi(res, m.error);
    kirimHasil(res, await layanan.tautkanKeluarga(pengguna(res), id.data.id, m.data, alamatDari(req)), 201);
  }));
  rute.patch('/pasien/:id/keluarga/:anak_id', masuk, ubahKeluarga, bungkus(async (req, res) => {
    const p = idAnak.safeParse(req.params);
    if (!p.success) return tidakAda(res);
    const m = ubahKeluargaMasukan.safeParse(req.body ?? {});
    if (!m.success) return galatValidasi(res, m.error);
    kirimHasil(res, await layanan.ubahKeluarga(pengguna(res), p.data.id, p.data.anak_id, m.data, alamatDari(req)));
  }));

  return rute;
}
