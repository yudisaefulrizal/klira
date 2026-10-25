import { Router } from 'express';
import type { Request, RequestHandler, Response } from 'express';
import {
  dpiaMasukan, filterHak, filterPersetujuanPdp, filterUmumPdp, GALAT, hakMasukan, idParam, insidenMasukan, pemberitahuanMasukan, pemusnahanMasukan, prosesHakMasukan, prosesorMasukan, prosesPemusnahanMasukan, ropaMasukan, tarikMasukan,
} from '@klira/shared';
import type { PenggunaSaya, ResponsGalat } from '@klira/shared';
import { wajibMasuk } from '../../middleware/auth';
import { alamatDari } from '../../middleware/audit';
import { buatWajibIzin } from '../../middleware/izin';
import type { LayananAkses } from '../akses/layanan';
import type { LayananIzin } from '../akses/layanan-izin';
import { galatValidasi, kirimHasil } from '../hasil';
import type { LayananPdp } from './layanan';

/** Rute Pelindungan data (3.1, 4.7): lihat (izin pdp lihat), catat dan buat (input), proses dan ubah (perbaikan). Dibatasi pada fasyankes akun; tidak ada rute hapus. */
export function buatRutePdp(layananAkses: LayananAkses, layananIzin: LayananIzin, layanan: LayananPdp): Router {
  const rute = Router();
  const masuk = wajibMasuk(layananAkses);
  const { wajibIzin } = buatWajibIzin(layananIzin);
  const lihat = wajibIzin('pdp', 'lihat');
  const input = wajibIzin('pdp', 'input');
  const perbaikan = wajibIzin('pdp', 'perbaikan');
  const pengguna = (res: Response) => res.locals.pengguna as PenggunaSaya;
  const bungkus =
    (f: (req: Request, res: Response) => Promise<void>): RequestHandler =>
    (req, res, next) => void f(req, res).catch(next);
  const tidakAda = (res: Response) => void res.status(404).json({ galat: { kode: 'tidak_ditemukan', pesan: GALAT.tidakDitemukan } } satisfies ResponsGalat);
  /** Daftar berhalaman sederhana: query halaman dan ukuran. */
  const daftar = (ambil: (p: PenggunaSaya, h: number, u: number) => Promise<unknown>): RequestHandler =>
    bungkus(async (req, res) => {
      const f = filterUmumPdp.safeParse(req.query);
      if (!f.success) return galatValidasi(res, f.error);
      res.json({ data: await ambil(pengguna(res), f.data.halaman, f.data.ukuran) });
    });

  // Permintaan hak pasien
  rute.get('/pdp/hak', masuk, lihat, bungkus(async (req, res) => {
    const f = filterHak.safeParse(req.query);
    if (!f.success) return galatValidasi(res, f.error);
    res.json({ data: await layanan.daftarHak(pengguna(res), f.data) });
  }));
  rute.post('/pdp/hak', masuk, input, bungkus(async (req, res) => {
    const m = hakMasukan.safeParse(req.body ?? {});
    if (!m.success) return galatValidasi(res, m.error);
    kirimHasil(res, await layanan.catatHak(pengguna(res), m.data, alamatDari(req)), 201);
  }));
  rute.post('/pdp/hak/:id/proses', masuk, perbaikan, bungkus(async (req, res) => {
    const id = idParam.safeParse(req.params);
    if (!id.success) return tidakAda(res);
    const m = prosesHakMasukan.safeParse(req.body ?? {});
    if (!m.success) return galatValidasi(res, m.error);
    kirimHasil(res, await layanan.prosesHak(pengguna(res), id.data.id, m.data, alamatDari(req)));
  }));

  // Teks pemberitahuan dan persetujuan
  rute.get('/pdp/pemberitahuan', masuk, lihat, bungkus(async (_req, res) => void res.json({ data: await layanan.daftarPemberitahuan(pengguna(res)) })));
  rute.post('/pdp/pemberitahuan', masuk, input, bungkus(async (req, res) => {
    const m = pemberitahuanMasukan.safeParse(req.body ?? {});
    if (!m.success) return galatValidasi(res, m.error);
    kirimHasil(res, await layanan.buatPemberitahuan(pengguna(res), m.data, alamatDari(req)), 201);
  }));
  rute.get('/pdp/persetujuan', masuk, lihat, bungkus(async (req, res) => {
    const f = filterPersetujuanPdp.safeParse(req.query);
    if (!f.success) return galatValidasi(res, f.error);
    res.json({ data: await layanan.daftarPersetujuan(pengguna(res), f.data) });
  }));
  rute.post('/pdp/persetujuan/tarik', masuk, perbaikan, bungkus(async (req, res) => {
    const m = tarikMasukan.safeParse(req.body ?? {});
    if (!m.success) return galatValidasi(res, m.error);
    kirimHasil(res, await layanan.tarikPersetujuan(pengguna(res), m.data.persetujuan_id, m.data.alasan, alamatDari(req)));
  }));

  // ROPA
  rute.get('/pdp/ropa', masuk, lihat, bungkus(async (req, res) => {
    if (req.query.format === 'csv') {
      res.type('text/csv; charset=utf-8').set('Content-Disposition', 'attachment; filename="ropa.csv"').send(await layanan.ropaCsv(pengguna(res), alamatDari(req)));
      return;
    }
    const f = filterUmumPdp.safeParse(req.query);
    if (!f.success) return galatValidasi(res, f.error);
    res.json({ data: await layanan.daftarRopa(pengguna(res), f.data.halaman, f.data.ukuran) });
  }));
  rute.post('/pdp/ropa', masuk, input, bungkus(async (req, res) => {
    const m = ropaMasukan.safeParse(req.body ?? {});
    if (!m.success) return galatValidasi(res, m.error);
    kirimHasil(res, await layanan.buatRopa(pengguna(res), m.data, alamatDari(req)), 201);
  }));
  rute.put('/pdp/ropa/:id', masuk, perbaikan, bungkus(async (req, res) => {
    const id = idParam.safeParse(req.params);
    if (!id.success) return tidakAda(res);
    const m = ropaMasukan.safeParse(req.body ?? {});
    if (!m.success) return galatValidasi(res, m.error);
    kirimHasil(res, await layanan.ubahRopa(pengguna(res), id.data.id, m.data, alamatDari(req)));
  }));

  // DPIA
  rute.get('/pdp/dpia', masuk, lihat, daftar((p, h, u) => layanan.daftarDpia(p, h, u)));
  rute.post('/pdp/dpia', masuk, input, bungkus(async (req, res) => {
    const m = dpiaMasukan.safeParse(req.body ?? {});
    if (!m.success) return galatValidasi(res, m.error);
    kirimHasil(res, await layanan.simpanDpia(pengguna(res), null, m.data, alamatDari(req)), 201);
  }));
  rute.put('/pdp/dpia/:id', masuk, perbaikan, bungkus(async (req, res) => {
    const id = idParam.safeParse(req.params);
    if (!id.success) return tidakAda(res);
    const m = dpiaMasukan.safeParse(req.body ?? {});
    if (!m.success) return galatValidasi(res, m.error);
    kirimHasil(res, await layanan.simpanDpia(pengguna(res), id.data.id, m.data, alamatDari(req)));
  }));

  // Insiden
  rute.get('/pdp/insiden', masuk, lihat, daftar((p, h, u) => layanan.daftarInsiden(p, h, u)));
  rute.post('/pdp/insiden', masuk, input, bungkus(async (req, res) => {
    const m = insidenMasukan.safeParse(req.body ?? {});
    if (!m.success) return galatValidasi(res, m.error);
    kirimHasil(res, await layanan.simpanInsiden(pengguna(res), null, m.data, alamatDari(req)), 201);
  }));
  rute.put('/pdp/insiden/:id', masuk, perbaikan, bungkus(async (req, res) => {
    const id = idParam.safeParse(req.params);
    if (!id.success) return tidakAda(res);
    const m = insidenMasukan.safeParse(req.body ?? {});
    if (!m.success) return galatValidasi(res, m.error);
    kirimHasil(res, await layanan.simpanInsiden(pengguna(res), id.data.id, m.data, alamatDari(req)));
  }));

  // Retensi dan pemusnahan
  rute.get('/pdp/retensi', masuk, lihat, bungkus(async (_req, res) => void res.json({ data: await layanan.kebijakan(pengguna(res)) })));
  rute.get('/pdp/pemusnahan', masuk, lihat, daftar((p, h, u) => layanan.daftarMusnah(p, h, u)));
  rute.post('/pdp/pemusnahan', masuk, input, bungkus(async (req, res) => {
    const m = pemusnahanMasukan.safeParse(req.body ?? {});
    if (!m.success) return galatValidasi(res, m.error);
    kirimHasil(res, await layanan.rencanaMusnah(pengguna(res), m.data, alamatDari(req)), 201);
  }));
  rute.post('/pdp/pemusnahan/:id/proses', masuk, perbaikan, bungkus(async (req, res) => {
    const id = idParam.safeParse(req.params);
    if (!id.success) return tidakAda(res);
    const m = prosesPemusnahanMasukan.safeParse(req.body ?? {});
    if (!m.success) return galatValidasi(res, m.error);
    kirimHasil(res, await layanan.prosesMusnah(pengguna(res), id.data.id, m.data, alamatDari(req)));
  }));

  // Prosesor
  rute.get('/pdp/prosesor', masuk, lihat, daftar((p, h, u) => layanan.daftarProsesor(p, h, u)));
  rute.get('/pdp/prosesor/opsi', masuk, lihat, bungkus(async (_req, res) => void res.json({ data: await layanan.opsiProsesor(pengguna(res)) })));
  rute.post('/pdp/prosesor', masuk, input, bungkus(async (req, res) => {
    const m = prosesorMasukan.safeParse(req.body ?? {});
    if (!m.success) return galatValidasi(res, m.error);
    kirimHasil(res, await layanan.simpanProsesor(pengguna(res), null, m.data, alamatDari(req)), 201);
  }));
  rute.put('/pdp/prosesor/:id', masuk, perbaikan, bungkus(async (req, res) => {
    const id = idParam.safeParse(req.params);
    if (!id.success) return tidakAda(res);
    const m = prosesorMasukan.safeParse(req.body ?? {});
    if (!m.success) return galatValidasi(res, m.error);
    kirimHasil(res, await layanan.simpanProsesor(pengguna(res), id.data.id, m.data, alamatDari(req)));
  }));

  return rute;
}
