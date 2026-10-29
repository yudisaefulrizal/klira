import { Router } from 'express';
import type { Request, RequestHandler, Response } from 'express';
import { GALAT, filterPeringatan, idAnakParam, idPenggunaParam, izinAkunBaru, jenisAkunBaru, jenisAkunUbah, akhiriPeriode, penugasanBaru, terimaPeringatan } from '@klira/shared';
import type { PenggunaSaya, ResponsGalat } from '@klira/shared';
import type { z } from 'zod';
import { buatWajibIzin } from '../../middleware/izin';
import { wajibMasuk } from '../../middleware/auth';
import type { LayananAkses } from './layanan';
import type { Hasil, LayananIzin } from './layanan-izin';

const pengguna = (res: Response) => res.locals.pengguna as PenggunaSaya;
const alamatDari = (req: Request) => req.ip ?? 'tidak-diketahui';

function galatValidasi(res: Response, e: z.ZodError): void {
  const badan: ResponsGalat = {
    galat: { kode: 'tidak_valid', pesan: GALAT.tidakValid, rincian: e.issues.map((i) => ({ jalur: i.path.join('.'), pesan: i.message })) },
  };
  res.status(400).json(badan);
}

const STATUS = { tidak_ditemukan: 404, konflik: 409, tidak_valid: 400, perlu_konfirmasi_peringatan: 409 } as const;

function kirim<T>(res: Response, hasil: Hasil<T>, sukses = 200): void {
  if (hasil.ok) return void res.status(sukses).json({ data: hasil.data });
  const badan: ResponsGalat = {
    galat: { kode: hasil.kode, pesan: hasil.pesan, ...(hasil.kode === 'perlu_konfirmasi_peringatan' ? { peringatan: hasil.peringatan } : {}) },
  };
  res.status(STATUS[hasil.kode]).json(badan);
}

/** Rute manajemen jenis akun, penugasan, izin per akun, dan peringatan (semuanya mensyaratkan izin fitur `akses`). */
export function buatRuteIzin(layananAkses: LayananAkses, layanan: LayananIzin): Router {
  const rute = Router();
  const { wajibIzin, wajibIzinSalahSatu } = buatWajibIzin(layanan);
  const masuk = wajibMasuk(layananAkses);
  const bungkus =
    (f: (req: Request, res: Response) => Promise<void>): RequestHandler =>
    (req, res, next) => void f(req, res).catch(next);
  const param = <S extends z.ZodType>(skema: S, req: Request, res: Response): z.infer<S> | null => {
    const h = skema.safeParse(req.params);
    if (h.success) return h.data;
    galatValidasi(res, h.error);
    return null;
  };
  const badan = <S extends z.ZodType>(skema: S, req: Request, res: Response): z.infer<S> | null => {
    const h = skema.safeParse(req.body ?? {});
    if (h.success) return h.data;
    galatValidasi(res, h.error);
    return null;
  };

  rute.get('/izin', masuk, wajibIzin('akses', 'lihat'), bungkus(async (_req, res) => {
    res.json({ data: await layanan.daftarIzin() });
  }));

  // Jenis akun (tidak ada hapus; nonaktifkan lewat PATCH aktif=false)
  rute.get('/jenis-akun', masuk, wajibIzin('akses', 'lihat'), bungkus(async (_req, res) => {
    res.json({ data: await layanan.daftarJenisAkun(pengguna(res)) });
  }));
  rute.get('/jenis-akun/:id', masuk, wajibIzin('akses', 'lihat'), bungkus(async (req, res) => {
    const p = param(idPenggunaParam, req, res);
    if (p) kirim(res, await layanan.ambilJenisAkun(pengguna(res), p.id));
  }));
  rute.get('/jenis-akun/:id/riwayat', masuk, wajibIzin('akses', 'lihat'), bungkus(async (req, res) => {
    const p = param(idPenggunaParam, req, res);
    if (p) kirim(res, await layanan.riwayatJenisAkun(pengguna(res), p.id));
  }));
  rute.post('/jenis-akun', masuk, wajibIzin('akses', 'input'), bungkus(async (req, res) => {
    const m = badan(jenisAkunBaru, req, res);
    if (m) kirim(res, await layanan.buatJenisAkun(pengguna(res), m, alamatDari(req)), 201);
  }));
  rute.patch('/jenis-akun/:id', masuk, wajibIzin('akses', 'perbaikan'), bungkus(async (req, res) => {
    const p = param(idPenggunaParam, req, res);
    const m = p && badan(jenisAkunUbah, req, res);
    if (p && m) kirim(res, await layanan.ubahJenisAkun(pengguna(res), p.id, m, alamatDari(req)));
  }));

  // Penugasan jenis akun per pengguna
  rute.get('/pengguna/:id/penugasan', masuk, wajibIzin('akses', 'lihat'), bungkus(async (req, res) => {
    const p = param(idPenggunaParam, req, res);
    if (p) kirim(res, await layanan.daftarPenugasan(pengguna(res), p.id));
  }));
  rute.post('/pengguna/:id/penugasan', masuk, wajibIzin('akses', 'input'), bungkus(async (req, res) => {
    const p = param(idPenggunaParam, req, res);
    const m = p && badan(penugasanBaru, req, res);
    if (p && m) kirim(res, await layanan.tugaskanJenis(pengguna(res), p.id, m, alamatDari(req)), 201);
  }));
  rute.patch('/pengguna/:id/penugasan/:anakId', masuk, wajibIzin('akses', 'perbaikan'), bungkus(async (req, res) => {
    const p = param(idAnakParam, req, res);
    const m = p && badan(akhiriPeriode, req, res);
    if (p && m) kirim(res, await layanan.akhiriPenugasan(pengguna(res), p.id, p.anakId, m.selesai, alamatDari(req)));
  }));

  // Izin per akun (tambah/kurang)
  rute.get('/pengguna/:id/izin-akun', masuk, wajibIzin('akses', 'lihat'), bungkus(async (req, res) => {
    const p = param(idPenggunaParam, req, res);
    if (p) kirim(res, await layanan.daftarIzinAkun(pengguna(res), p.id));
  }));
  rute.post('/pengguna/:id/izin-akun', masuk, wajibIzin('akses', 'input'), bungkus(async (req, res) => {
    const p = param(idPenggunaParam, req, res);
    const m = p && badan(izinAkunBaru, req, res);
    if (p && m) kirim(res, await layanan.beriIzinAkun(pengguna(res), p.id, m, alamatDari(req)), 201);
  }));
  rute.patch('/pengguna/:id/izin-akun/:anakId', masuk, wajibIzin('akses', 'perbaikan'), bungkus(async (req, res) => {
    const p = param(idAnakParam, req, res);
    const m = p && badan(akhiriPeriode, req, res);
    if (p && m) kirim(res, await layanan.akhiriIzinAkun(pengguna(res), p.id, p.anakId, m.selesai, alamatDari(req)));
  }));

  rute.get('/pengguna/:id/akses-efektif', masuk, wajibIzin('akses', 'lihat'), bungkus(async (req, res) => {
    const p = param(idPenggunaParam, req, res);
    if (p) kirim(res, await layanan.aksesEfektif(pengguna(res), p.id));
  }));

  // Peringatan izin: pimpinan dan auditor melihat daftar yang sama
  rute.get('/peringatan-izin', masuk, wajibIzinSalahSatu(['akses', 'lihat'], ['audit', 'lihat']), bungkus(async (req, res) => {
    const f = filterPeringatan.safeParse(req.query);
    if (!f.success) return galatValidasi(res, f.error);
    res.json({ data: await layanan.daftarPeringatan(pengguna(res), f.data) });
  }));
  rute.post('/peringatan-izin/terima', masuk, wajibIzin('akses', 'input'), bungkus(async (req, res) => {
    const m = badan(terimaPeringatan, req, res);
    if (m) kirim(res, await layanan.terimaPeringatan(pengguna(res), m, alamatDari(req)), 201);
  }));

  return rute;
}
