import { baca, tulis, pool, type Koneksi } from '../koneksi';


export async function daftarEventPanggilanUntukBuatRuteLayarPanggilan(fasyankes_id: number | undefined, tanggal: Date | undefined, id: number | undefined, batas: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; kode: string; poli_id: number; poli_nama: string; waktu_panggil: Date }>("SELECT t.`id`, t.`kode`, t.`poli_id`, t.`poli_nama`, t.`waktu_panggil` FROM `event_panggilan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`tanggal` <=> ?)) AND ((? OR t.`id` > ?)) ORDER BY t.`id` ASC LIMIT ? OFFSET ?", [fasyankes_id === undefined, fasyankes_id ?? null, tanggal === undefined, tanggal ?? null, id === undefined, id ?? null, batas ?? 2147483647, 0], koneksi);
  return baris;
}

export async function cariEventPanggilanUntukBuatRuteLayarPanggilan(fasyankes_id: number | undefined, tanggal: Date | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number }>("SELECT t.`id` FROM `event_panggilan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`tanggal` <=> ?)) ORDER BY t.`id` DESC LIMIT 1", [fasyankes_id === undefined, fasyankes_id ?? null, tanggal === undefined, tanggal ?? null], koneksi);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}

export async function tambahEventPanggilanUntukUbahAntrean(fasyankes_id: number | undefined, poli_id: number | undefined, poli_nama: string | undefined, kode: string | undefined, tanggal: Date | undefined, waktu_panggil: Date | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `event_panggilan` (`fasyankes_id`, `poli_id`, `poli_nama`, `kode`, `tanggal`, `waktu_panggil`) VALUES (?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (poli_id === undefined ? null : poli_id) ?? null, (poli_nama === undefined ? null : poli_nama) ?? null, (kode === undefined ? null : kode) ?? null, (tanggal === undefined ? null : tanggal) ?? null, (waktu_panggil === undefined ? null : waktu_panggil) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}
