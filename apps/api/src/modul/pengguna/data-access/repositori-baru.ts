import * as db from '@klira/db';

export type DataAkunBaru = {
  fasyankes_id: number;
  oleh: number;
  nama: string;
  nik: string;
  username: string;
  kata_sandi_hash: string;
  profil: { profesi: string; nomor_sip: string | null; masa_berlaku_sip: Date | null; ihs_practitioner_id: string | null } | null;
  penugasan: { jenis_akun_id: number; mulai: Date; selesai: Date | null }[];
  izin_akun: { izin_id: number; tipe: 'tambah' | 'kurang'; alasan: string; mulai: Date; selesai: Date | null }[];
  peringatan: {
    jenis_peringatan: string; izin_id: number | null; jenis_akun_id: number | null; alasan_pimpinan: string;
    diterima_untuk_akun: boolean; keterangan: string;
  }[];
};

export type HasilAkunBaru = {
  id: number;
  profil_id: number | null;
  penugasan_ids: number[];
  izin_akun_ids: number[];
  peringatan: { id: number; jenis_peringatan: string; alasan_pimpinan: string }[];
};

/** Username atau NIK bentrok saat menyimpan (balapan setelah pemeriksaan awal). */
export class KonflikAkun extends Error {
  constructor(public readonly bidang: 'username' | 'nik' = 'username') {
    super(`konflik ${bidang}`);
  }
}

/** Nama indeks pada galat ER_DUP_ENTRY membedakan konflik NIK dan username. */
export function bidangKonflik(galat: unknown): 'username' | 'nik' {
  const indeks = /for key ['`]([^'`]+)['`]/i.exec(db.pesanGalat(galat))?.[1] ?? '';
  return indeks.toLowerCase().split(/[^a-z0-9]+/).includes('nik') ? 'nik' : 'username';
}

export interface RepositoriAkunBaru {
  /** Username dipakai di mana pun (tanpa beda huruf besar/kecil); NIK dipakai di fasyankes ini. */
  cekDuplikat(username: string, nik: string, fasyankesId: number): Promise<{ username: boolean; nik: boolean }>;
  /** Satu transaksi: akun, profil, penugasan, izin per akun, dan peringatan; semua atau tidak sama sekali. */
  buatAkun(data: DataAkunBaru): Promise<HasilAkunBaru>;
}

export class RepositoriAkunBaruMysql implements RepositoriAkunBaru {
  async cekDuplikat(username: string, nik: string, fasyankesId: number) {
    const [u, n] = await Promise.all([
      db.hitungPenggunaUntukCekDuplikat(username),
      db.hitungPenggunaUntukCekDuplikat2(fasyankesId, nik),
    ]);
    return { username: u > 0, nik: n > 0 };
  }

  async buatAkun(d: DataAkunBaru): Promise<HasilAkunBaru> {
    try {
      return await db.transaksi(async (tx) => {
        const p = await (async () => { const _hasil = await db.tambahPenggunaUntukBuatAkun(d.fasyankes_id, d.nama, d.nik, d.username, d.kata_sandi_hash, true, d.oleh, tx); return db.tambahPenggunaUntukBuatAkunHasil(_hasil.id, tx); })();
        const profil = d.profil
          ? await (async () => { const _hasil = await db.tambahProfilProfesiUntukBuat(d.fasyankes_id, p.id, (d.profil)?.profesi, (d.profil)?.nomor_sip, (d.profil)?.masa_berlaku_sip, (d.profil)?.ihs_practitioner_id, d.oleh, tx); return db.tambahProfilProfesiUntukBuatAkunHasil(_hasil.id, tx); })()
          : null;
        const penugasanIds = new Map<number, number>();
        const ids: number[] = [];
        for (const x of d.penugasan) {
          const r = await (async () => { const _hasil = await db.tambahPenugasanJenisUntukBuatAkun(d.fasyankes_id, p.id, x.jenis_akun_id, x.mulai, x.selesai, d.oleh, tx); return db.tambahPenugasanJenisUntukBuatAkunHasil(_hasil.id, tx); })();
          ids.push(r.id);
          if (!penugasanIds.has(x.jenis_akun_id)) penugasanIds.set(x.jenis_akun_id, r.id);
        }
        const izinIds: number[] = [];
        for (const x of d.izin_akun) {
          const r = await (async () => { const _hasil = await db.tambahIzinPerAkunUntukBuatAkun(d.fasyankes_id, p.id, (x)?.izin_id, (x)?.tipe, (x)?.alasan, (x)?.mulai, (x)?.selesai, d.oleh, tx); return db.tambahIzinPerAkunUntukBuatAkunHasil(_hasil.id, tx); })();
          izinIds.push(r.id);
        }
        const peringatan: HasilAkunBaru['peringatan'] = [];
        for (const w of d.peringatan) {
          const r = await (async () => { const _hasil = await db.tambahPeringatanIzinUntukBuatAkun(d.fasyankes_id, p.id, w.izin_id, w.jenis_akun_id ? (penugasanIds.get(w.jenis_akun_id) ?? null) : null, w.jenis_peringatan, w.alasan_pimpinan, 'pemberian', w.diterima_untuk_akun, w.keterangan, d.oleh, tx); return db.tambahPeringatanIzinUntukBuatAkunHasil(_hasil.id, tx); })();
          peringatan.push({ id: r.id, jenis_peringatan: r.jenis_peringatan, alasan_pimpinan: r.alasan_pimpinan });
        }
        return { id: p.id, profil_id: profil?.id ?? null, penugasan_ids: ids, izin_akun_ids: izinIds, peringatan };
      });
    } catch (galat) {
      if (db.bentrokUnik(galat)) throw new KonflikAkun(bidangKonflik(galat));
      throw galat;
    }
  }
}
