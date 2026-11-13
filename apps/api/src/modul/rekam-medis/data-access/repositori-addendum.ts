import * as db from '@klira/db';
import type { JenisAkunPengesah } from '../domain/pengesahan';
import { hashIsi } from '../domain/pengesahan';
import { tulisPengesahanDalam } from './repositori';

export type TulisAddendum = {
  fasyankesId: number;
  kunjunganId: number;
  entitas: string;
  entitasId: number;
  isi: Record<string, unknown>;
  alasan: string;
  oleh: number;
  jenisAkun: JenisAkunPengesah | null;
  waktu: Date;
};

/**
 * Tulis satu addendum di dalam transaksi pemanggil (hasil lab susulan; CPPT dan resume nanti memakai jalur yang sama). Hanya INSERT:
 * baris addendum (versi per entitas), versi catatan kunjungan (penanda kronologis, `isi_lama` hanya menunjuk addendum karena tidak ada isi yang
 * digantikan), dan pengesahan baru atas isi addendum (entitas `addendum`). Balapan versi muncul sebagai ER_DUP_ENTRY dari pemanggil.
 */
export async function tulisAddendumDalam(tx: db.Koneksi, d: TulisAddendum): Promise<{ id: number; versi: number }> {
  const terakhir = await db.ringkasanAddendumUntukTulisAddendumDalam(d.entitas, d.entitasId, tx);
  const versi = (terakhir._max.versi ?? 0) + 1;
  const a = await (async () => { const _hasil = await db.tambahAddendumUntukTulisAddendumDalam(d.fasyankesId, d.kunjunganId, d.entitas, d.entitasId, versi, d.isi as db.NilaiJson, d.alasan, d.waktu, d.oleh, tx); return db.tambahAddendumUntukTulisAddendumDalamHasil(_hasil.id, tx); })();
  const versiKunjungan = await db.ringkasanVersiCatatanUntukTulisAddendumDalam('kunjungan', d.kunjunganId, tx);
  await db.tambahVersiCatatanUntukTulisPengesahanDalam(d.fasyankesId, 'kunjungan', d.kunjunganId, (versiKunjungan._max.versi ?? 0) + 1, { jenis: 'addendum', addendum_id: a.id, entitas: d.entitas, entitas_id: d.entitasId }, d.alasan, null, d.oleh, tx);
  await tulisPengesahanDalam(tx, {
    fasyankesId: d.fasyankesId, entitas: 'addendum', entitasId: a.id, versi: 1, penggunaId: d.oleh, jenisAkun: d.jenisAkun, hash: hashIsi(d.isi), waktu: d.waktu, versiLama: null,
  });
  return { id: a.id, versi };
}

export type BarisAddendum = {
  id: number; kunjungan_id: number; entitas: string; entitas_id: number; versi: number; isi: Record<string, unknown>; alasan: string; waktu: Date;
  dibuat_oleh_nama: string | null; perlu_kirim_ulang: boolean; dikirim_pada: Date | null;
};

export interface RepositoriAddendum {
  kunjunganAda(fasyankesId: number, kunjunganId: number): Promise<boolean>;
  daftar(fasyankesId: number, kunjunganId: number): Promise<BarisAddendum[]>;
  untukEntitas(fasyankesId: number, entitas: string, entitasIds: readonly number[]): Promise<BarisAddendum[]>;
  isi(fasyankesId: number, id: number): Promise<unknown>;
}

export class RepositoriAddendumMysql implements RepositoriAddendum {
  private async petakan(fasyankesId: number, baris: { id: number; kunjungan_id: number; entitas: string; entitas_id: number; versi: number; isi: db.NilaiJson; alasan: string; waktu: Date; dibuat_oleh: number | null; perlu_kirim_ulang: boolean; dikirim_pada: Date | null }[]): Promise<BarisAddendum[]> {
    const ids = [...new Set(baris.flatMap((b) => (b.dibuat_oleh ? [b.dibuat_oleh] : [])))];
    const pengguna = ids.length ? await db.daftarPenggunaUntukRiwayat(ids, fasyankesId) : [];
    const nama = new Map(pengguna.map((p) => [p.id, p.nama]));
    return baris.map((b) => ({
      id: b.id, kunjungan_id: b.kunjungan_id, entitas: b.entitas, entitas_id: b.entitas_id, versi: b.versi, isi: (b.isi ?? {}) as Record<string, unknown>, alasan: b.alasan, waktu: b.waktu,
      dibuat_oleh_nama: b.dibuat_oleh ? nama.get(b.dibuat_oleh) ?? null : null, perlu_kirim_ulang: b.perlu_kirim_ulang, dikirim_pada: b.dikirim_pada,
    }));
  }

  async kunjunganAda(fasyankesId: number, kunjunganId: number): Promise<boolean> {
    return (await db.hitungKunjunganUntukKunjunganAda(kunjunganId, fasyankesId)) > 0;
  }

  async daftar(fasyankesId: number, kunjunganId: number): Promise<BarisAddendum[]> {
    return this.petakan(fasyankesId, await db.daftarAddendumUntukDaftar(fasyankesId, kunjunganId, 200));
  }

  async untukEntitas(fasyankesId: number, entitas: string, entitasIds: readonly number[]): Promise<BarisAddendum[]> {
    if (!entitasIds.length) return [];
    return this.petakan(fasyankesId, await db.daftarAddendumUntukUntukEntitas(fasyankesId, entitas, [...entitasIds]));
  }

  async isi(fasyankesId: number, id: number): Promise<unknown> {
    return (await db.cariAddendumUntukIsi(id, fasyankesId))?.isi ?? null;
  }
}
