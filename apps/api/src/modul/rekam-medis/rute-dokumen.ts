import { Router } from 'express';
import type { Request, RequestHandler, Response } from 'express';
import {
  filterLaporan, filterPembukaan, filterPenyampaian, GALAT, idParam, keputusanPerbaikanMasukan, laporanKeCsv, pembukaanMasukan, penyampaianMasukan, resumeMasukan, suratMasukan,
} from '@klira/shared';
import type { PenggunaSaya, ResponsGalat } from '@klira/shared';
import { wajibMasuk } from '../../middleware/auth';
import { alamatDari } from '../../middleware/audit';
import { buatWajibIzin } from '../../middleware/izin';
import type { LayananAkses } from '../akses/layanan';
import type { LayananIzin } from '../akses/layanan-izin';
import { galatValidasi, kirimHasil } from '../hasil';
import type { LayananDokumen } from './layanan-dokumen';

/**
 * Rute dokumen Rekam medis (4.2, 4.4): resume dan surat (izin `klinis`), pembukaan dan penyampaian (izin `rekam-medis`; keputusan butuh aksi perbaikan),
 * laporan (lihat `rekam-medis`, ekspor CSV lewat `?format=csv`). Dibatasi pada fasyankes akun; tidak ada rute hapus.
 */
export function buatRuteDokumen(layananAkses: LayananAkses, layananIzin: LayananIzin, layanan: LayananDokumen): Router {
  const rute = Router();
  const masuk = wajibMasuk(layananAkses);
  const { wajibIzin, wajibIzinSalahSatu } = buatWajibIzin(layananIzin);
  const pengguna = (res: Response) => res.locals.pengguna as PenggunaSaya;
  const bungkus =
    (f: (req: Request, res: Response) => Promise<void>): RequestHandler =>
    (req, res, next) => void f(req, res).catch(next);
  const tidakAda = (res: Response) => void res.status(404).json({ galat: { kode: 'tidak_ditemukan', pesan: GALAT.tidakDitemukan } } satisfies ResponsGalat);
  const lihatDokumen = wajibIzinSalahSatu(['rekam-medis', 'lihat'], ['klinis', 'lihat']);

  rute.get('/kunjungan/:id/dokumen', masuk, lihatDokumen, bungkus(async (req, res) => {
    const id = idParam.safeParse(req.params);
    if (!id.success) return tidakAda(res);
    kirimHasil(res, await layanan.dokumen(pengguna(res), id.data.id, alamatDari(req)));
  }));
  rute.put('/kunjungan/:id/resume', masuk, wajibIzin('klinis', 'input'), bungkus(async (req, res) => {
    const id = idParam.safeParse(req.params);
    if (!id.success) return tidakAda(res);
    const m = resumeMasukan.safeParse(req.body ?? {});
    if (!m.success) return galatValidasi(res, m.error);
    kirimHasil(res, await layanan.simpanResume(pengguna(res), id.data.id, m.data, alamatDari(req)));
  }));
  rute.post('/kunjungan/:id/surat', masuk, wajibIzin('klinis', 'input'), bungkus(async (req, res) => {
    const id = idParam.safeParse(req.params);
    if (!id.success) return tidakAda(res);
    const m = suratMasukan.safeParse(req.body ?? {});
    if (!m.success) return galatValidasi(res, m.error);
    kirimHasil(res, await layanan.buatSurat(pengguna(res), id.data.id, m.data, alamatDari(req)), 201);
  }));

  rute.get('/rekam-medis/pembukaan', masuk, wajibIzin('rekam-medis', 'lihat'), bungkus(async (req, res) => {
    const f = filterPembukaan.safeParse(req.query);
    if (!f.success) return galatValidasi(res, f.error);
    res.json({ data: await layanan.daftarPembukaan(pengguna(res), f.data) });
  }));
  rute.post('/rekam-medis/pembukaan', masuk, wajibIzin('rekam-medis', 'input'), bungkus(async (req, res) => {
    const m = pembukaanMasukan.safeParse(req.body ?? {});
    if (!m.success) return galatValidasi(res, m.error);
    kirimHasil(res, await layanan.ajukanPembukaan(pengguna(res), m.data, alamatDari(req)), 201);
  }));
  rute.post('/rekam-medis/pembukaan/:id/keputusan', masuk, wajibIzin('rekam-medis', 'perbaikan'), bungkus(async (req, res) => {
    const id = idParam.safeParse(req.params);
    if (!id.success) return tidakAda(res);
    const m = keputusanPerbaikanMasukan.safeParse(req.body ?? {});
    if (!m.success) return galatValidasi(res, m.error);
    kirimHasil(res, await layanan.putuskanPembukaan(pengguna(res), id.data.id, m.data, alamatDari(req)));
  }));

  rute.get('/rekam-medis/penyampaian', masuk, wajibIzin('rekam-medis', 'lihat'), bungkus(async (req, res) => {
    const f = filterPenyampaian.safeParse(req.query);
    if (!f.success) return galatValidasi(res, f.error);
    res.json({ data: await layanan.daftarPenyampaian(pengguna(res), f.data) });
  }));
  rute.post('/rekam-medis/penyampaian', masuk, wajibIzin('rekam-medis', 'input'), bungkus(async (req, res) => {
    const m = penyampaianMasukan.safeParse(req.body ?? {});
    if (!m.success) return galatValidasi(res, m.error);
    kirimHasil(res, await layanan.catatPenyampaian(pengguna(res), m.data, alamatDari(req)), 201);
  }));

  rute.get('/rekam-medis/laporan', masuk, wajibIzin('rekam-medis', 'lihat'), bungkus(async (req, res) => {
    const f = filterLaporan.safeParse(req.query);
    if (!f.success) return galatValidasi(res, f.error);
    const l = await layanan.laporan(pengguna(res), f.data, alamatDari(req));
    if (req.query.format === 'csv') {
      res.type('text/csv; charset=utf-8').set('Content-Disposition', `attachment; filename="laporan-${l.jenis}-${l.dari}-${l.sampai}.csv"`).send(laporanKeCsv(l));
      return;
    }
    res.json({ data: l });
  }));

  return rute;
}
