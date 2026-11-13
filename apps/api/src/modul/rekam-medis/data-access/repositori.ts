import * as db from '@klira/db';
import type { AksiIzin, VersiCatatanDto } from '@klira/shared';
import type { JenisAkunPengesah } from '../domain/pengesahan';

export type PengesahanTersimpan = {
  versi: number;
  pengguna_id: number;
  pengguna_nama: string;
  jenis_akun_id: number | null;
  jenis_akun_nama: string | null;
  waktu: Date;
  hash: string;
};

export type VersiLama = { versi: number; isi_lama: unknown; alasan: string; disetujui_oleh: number | null };

/** Data tulis satu pengesahan (dan versi catatan bila ini perbaikan); ditulis dalam transaksi pemanggil. */
export type TulisPengesahan = {
  fasyankesId: number;
  entitas: string;
  entitasId: number;
  versi: number;
  penggunaId: number;
  jenisAkun: JenisAkunPengesah | null;
  hash: string;
  waktu: Date;
  versiLama: VersiLama | null;
};

export interface RepositoriPengesahan {
  terakhir(fasyankesId: number, entitas: string, entitasId: number): Promise<PengesahanTersimpan | null>;
  /** Jenis akun aktif milik pengguna (penugasan berjalan) yang paketnya memuat fitur x aksi. */
  jenisAkunPemberiHak(fasyankesId: number, penggunaId: number, fitur: string, aksi: AksiIzin, sekarang: Date): Promise<JenisAkunPengesah[]>;
  riwayatVersi(fasyankesId: number, entitas: string, entitasId: number): Promise<VersiCatatanDto[]>;
}

/**
 * Tulis pengesahan di dalam transaksi pemanggil (repositori modul klinis, CPPT, resume, hasil lab nanti memakainya agar isi dan
 * pengesahannya tersimpan atomik). Hanya INSERT: versi catatan dan pengesahan tidak pernah diubah atau dihapus.
 */
export async function tulisPengesahanDalam(tx: db.Koneksi, d: TulisPengesahan): Promise<void> {
  if (d.versiLama) {
    await db.tambahVersiCatatanUntukTulisPengesahanDalam(d.fasyankesId, d.entitas, d.entitasId, d.versiLama.versi, d.versiLama.isi_lama as db.NilaiJson, d.versiLama.alasan, d.versiLama.disetujui_oleh, d.penggunaId, tx);
  }
  await db.tambahPengesahanCatatanUntukTulisPengesahanDalam(d.fasyankesId, d.entitas, d.entitasId, d.versi, d.penggunaId, d.jenisAkun?.id ?? null, d.jenisAkun?.nama ?? null, d.waktu, d.hash, d.penggunaId, tx);
}

export class RepositoriPengesahanMysql implements RepositoriPengesahan {
  async terakhir(fasyankesId: number, entitas: string, entitasId: number): Promise<PengesahanTersimpan | null> {
    const p = await db.cariPengesahanCatatanUntukTerakhir(fasyankesId, entitas, entitasId);
    if (!p) return null;
    const pengguna = await db.ambilPenggunaUntukTerakhir(p.pengguna_id);
    return {
      versi: p.versi, pengguna_id: p.pengguna_id, pengguna_nama: pengguna?.nama ?? '-', jenis_akun_id: p.jenis_akun_id, jenis_akun_nama: p.jenis_akun_nama, waktu: p.waktu, hash: p.hash,
    };
  }

  async jenisAkunPemberiHak(fasyankesId: number, penggunaId: number, fitur: string, aksi: AksiIzin, sekarang: Date): Promise<JenisAkunPengesah[]> {
    const baris = await db.daftarPenugasanJenisUntukJenisAkunPemberiHak(fasyankesId, penggunaId, sekarang, null, sekarang, true, fitur, aksi);
    return baris.map((b) => b.jenis_akun);
  }

  async riwayatVersi(fasyankesId: number, entitas: string, entitasId: number): Promise<VersiCatatanDto[]> {
    const baris = await db.daftarVersiCatatanUntukRiwayatVersi(fasyankesId, entitas, entitasId, 100);
    return baris.map((v) => ({ versi: v.versi, alasan: v.alasan, disetujui_oleh: v.disetujui_oleh, dibuat_oleh: v.dibuat_oleh, dibuat_pada: v.dibuat_pada.toISOString() }));
  }
}
