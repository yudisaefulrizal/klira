import { baca, tulis, pool, type Koneksi } from '../koneksi';
import type * as T from '../tipe';

export async function daftarRiwayatKlaimUntukRiwayat(fasyankes_id: number | undefined, klaim_id: readonly (number)[] | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; klaim_id: number; dari: T.StatusKlaim | null; ke: T.StatusKlaim; alasan: string | null; oleh: number; waktu: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`klaim_id`, t.`dari`, t.`ke`, t.`alasan`, t.`oleh`, t.`waktu` FROM `riwayat_klaim` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`klaim_id` IN (?))) ORDER BY t.`id` ASC", [fasyankes_id === undefined, fasyankes_id ?? null, klaim_id === undefined, (klaim_id)?.length ? (klaim_id) : [null]], koneksi);
  return baris;
}

export async function tambahRiwayatKlaimUntukBuat(fasyankes_id: number | undefined, klaim_id: number | undefined, dari: T.StatusKlaim | null | undefined, ke: T.StatusKlaim | undefined, oleh: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `riwayat_klaim` (`fasyankes_id`, `klaim_id`, `dari`, `ke`, `oleh`) VALUES (?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (klaim_id === undefined ? null : klaim_id) ?? null, ((dari === undefined ? null : dari) ?? null), ((ke === undefined ? null : ke) ?? null), (oleh === undefined ? null : oleh) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function tambahRiwayatKlaimUntukUbahStatus(fasyankes_id: number | undefined, klaim_id: number | undefined, dari: T.StatusKlaim | null | undefined, ke: T.StatusKlaim | undefined, alasan: string | null | undefined, oleh: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `riwayat_klaim` (`fasyankes_id`, `klaim_id`, `dari`, `ke`, `alasan`, `oleh`) VALUES (?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (klaim_id === undefined ? null : klaim_id) ?? null, ((dari === undefined ? null : dari) ?? null), ((ke === undefined ? null : ke) ?? null), (alasan === undefined ? null : alasan) ?? null, (oleh === undefined ? null : oleh) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}
