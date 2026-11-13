import { baca, tulis, pool, type Koneksi } from '../koneksi';
import type * as T from '../tipe';

export async function tambahVersiCatatanUntukTulisPengesahanDalam(fasyankes_id: number | undefined, entitas: string | undefined, entitas_id: number | undefined, versi: number | undefined, isi_lama: T.NilaiJson | undefined, alasan: string | undefined, disetujui_oleh: number | null | undefined, dibuat_oleh: number | null | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `versi_catatan` (`fasyankes_id`, `entitas`, `entitas_id`, `versi`, `isi_lama`, `alasan`, `disetujui_oleh`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (entitas === undefined ? null : entitas) ?? null, (entitas_id === undefined ? null : entitas_id) ?? null, (versi === undefined ? null : versi) ?? null, JSON.stringify((isi_lama === undefined ? null : isi_lama) ?? null), (alasan === undefined ? null : alasan) ?? null, (disetujui_oleh === undefined ? null : disetujui_oleh) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function daftarVersiCatatanUntukRiwayatVersi(fasyankes_id: number | undefined, entitas: string | undefined, entitas_id: number | undefined, batas: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; entitas: string; entitas_id: number; versi: number; isi_lama: T.NilaiJson; alasan: string; disetujui_oleh: number | null; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`entitas`, t.`entitas_id`, t.`versi`, t.`isi_lama`, t.`alasan`, t.`disetujui_oleh`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `versi_catatan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`entitas` <=> ?)) AND ((? OR t.`entitas_id` <=> ?)) ORDER BY t.`versi` DESC LIMIT ? OFFSET ?", [fasyankes_id === undefined, fasyankes_id ?? null, entitas === undefined, entitas ?? null, entitas_id === undefined, entitas_id ?? null, batas ?? 2147483647, 0], koneksi);
  for (const b of baris) if (typeof b.isi_lama === 'string') b.isi_lama = JSON.parse(b.isi_lama);
  return baris;
}

export async function ringkasanVersiCatatanUntukTulisAddendumDalam(entitas: string | undefined, entitas_id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ _max_versi: number | null }>("SELECT MAX(t.`versi`) AS `_max_versi` FROM `versi_catatan` t WHERE ((? OR t.`entitas` <=> ?)) AND ((? OR t.`entitas_id` <=> ?))", [entitas === undefined, entitas ?? null, entitas_id === undefined, entitas_id ?? null], koneksi);
  const hasil = baris.map(b => ({ _max: { versi: b._max_versi } }));
  return hasil[0];
}

