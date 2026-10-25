import type { Request, RequestHandler, Response } from 'express';
import { GALAT } from '@klira/shared';
import type { AksiAudit, PenggunaSaya, ResponsGalat } from '@klira/shared';
import { RepositoriAuditPrisma } from '../modul/audit/repositori';
import type { RepositoriAudit } from '../modul/audit/repositori';

export type EntriAudit = {
  fasyankes_id?: number | null;
  pengguna_id?: number | null;
  aksi: AksiAudit;
  entitas: string;
  entitas_id?: number | null;
  /** Ringkasan aman (tanpa isi data sensitif); dipotong 255 karakter. */
  keterangan?: string;
  alamat?: string;
};

/** Antarmuka penampung audit. Satu-satunya jalur penulisan log_audit adalah implementasi antarmuka ini. */
export interface PenampungAudit {
  catat(entri: EntriAudit): Promise<void>;
}

/** Penulisan audit gagal; tindakan sensitif harus gagal-aman (lihat dokumen/laporan/pertanyaan.md). */
export class GalatAudit extends Error {
  constructor(public readonly sebab: unknown) {
    super('Gagal menulis log audit');
  }
}

/** Alamat IP klien; menghormati trust proxy (Express mengisi req.ip). */
export const alamatDari = (req: Request): string => req.ip ?? 'tidak-diketahui';

/** Penampung bawaan: menulis hanya-tambah lewat repositori audit. Kegagalan dicatat ke log aplikasi lalu dilempar. */
export class PenampungAuditPrisma implements PenampungAudit {
  constructor(private readonly repo: RepositoriAudit = new RepositoriAuditPrisma()) {}

  async catat(entri: EntriAudit): Promise<void> {
    try {
      await this.repo.tambah({
        fasyankes_id: entri.fasyankes_id ?? null,
        pengguna_id: entri.pengguna_id ?? null,
        aksi: entri.aksi,
        entitas: entri.entitas.slice(0, 100),
        entitas_id: entri.entitas_id ?? null,
        keterangan: entri.keterangan?.replace(/\s+/g, ' ').slice(0, 255) ?? null,
        alamat: entri.alamat?.slice(0, 64) ?? null,
        waktu: new Date(),
      });
    } catch (sebab) {
      console.error('Gagal mencatat audit', { aksi: entri.aksi, entitas: entri.entitas, entitas_id: entri.entitas_id }, sebab);
      throw new GalatAudit(sebab);
    }
  }
}

const penampungBawaan = new PenampungAuditPrisma();
/** Layanan pencatatan audit (jalur tunggal). */
export const catatAudit = (entri: EntriAudit, penampung: PenampungAudit = penampungBawaan): Promise<void> => penampung.catat(entri);

export type OpsiAudit = {
  /** Nama entitas yang diakses, mis. 'pasien'. */
  entitas: string;
  /** Pengambil id entitas dari permintaan; bawaan null. Gunakan idDariParam('id'). */
  id?: (req: Request) => number | null;
  /** Ringkasan aman tetap (jangan memuat data pasien). Bawaan: metode dan pola rute. */
  ringkasan?: string;
};

/** Pengambil id dari parameter rute; null bila bukan bilangan bulat positif. */
export const idDariParam =
  (nama = 'id') =>
  (req: Request): number | null => {
    const n = Number(req.params[nama]);
    return Number.isInteger(n) && n > 0 ? n : null;
  };

const galat500 = (res: Response): void => {
  const badan: ResponsGalat = { galat: { kode: 'galat_server', pesan: GALAT.umum } };
  res.status(500).json(badan);
};

function entriDari(req: Request, res: Response, aksi: AksiAudit, opsi: OpsiAudit, idLain?: number | null): EntriAudit {
  const p = res.locals.pengguna as PenggunaSaya | undefined;
  const pola = `${req.baseUrl}${req.route?.path ?? ''}`;
  return {
    fasyankes_id: p?.fasyankes_id ?? null,
    pengguna_id: p?.id ?? null,
    aksi,
    entitas: opsi.entitas,
    entitas_id: idLain ?? opsi.id?.(req) ?? null,
    keterangan: opsi.ringkasan ?? `${req.method} ${pola}`,
    alamat: alamatDari(req),
  };
}

/**
 * Fasilitas audit per rute. Pasang setelah wajibMasuk dan wajibIzin:
 *   rute.get('/pasien/:id', masuk, wajibIzin('rekam-medis','lihat'), audit.lihat({ entitas: 'pasien', id: idDariParam() }), ...)
 *   rute.post('/pasien', masuk, wajibIzin(...), audit.input({ entitas: 'pasien' }), ...)
 * Catatan hanya memuat identitas entitas dan ringkasan tetap; isi badan, query, dan hasil tidak disimpan.
 */
export function buatFasilitasAudit(penampung: PenampungAudit = penampungBawaan) {
  /** lihat: dicatat SEBELUM data dilepas; bila gagal tulis, permintaan ditolak 500 (gagal-aman). */
  const lihat =
    (opsi: OpsiAudit): RequestHandler =>
    (req, res, next) => {
      penampung.catat(entriDari(req, res, 'lihat', opsi)).then(
        () => next(),
        () => galat500(res),
      );
    };

  /** input/perbaikan: dicatat saat respons sukses (2xx) hendak dikirim; gagal tulis mengubah respons menjadi 500. */
  const tulis =
    (aksi: 'input' | 'perbaikan') =>
    (opsi: OpsiAudit): RequestHandler =>
    (req, res, next) => {
      const asli = res.json.bind(res);
      res.json = (badan: unknown) => {
        if (res.statusCode < 200 || res.statusCode >= 300) return asli(badan);
        const idRespons = (badan as { data?: { id?: unknown } } | null)?.data?.id;
        const id = typeof idRespons === 'number' && Number.isInteger(idRespons) ? idRespons : null;
        penampung.catat(entriDari(req, res, aksi, opsi, id)).then(
          () => asli(badan),
          () => {
            res.status(500);
            asli({ galat: { kode: 'galat_server', pesan: GALAT.umum } } satisfies ResponsGalat);
          },
        );
        return res;
      };
      next();
    };

  return { lihat, input: tulis('input'), perbaikan: tulis('perbaikan') };
}
