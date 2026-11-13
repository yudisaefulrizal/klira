import { baca, tulis, pool, type Koneksi } from '../koneksi';
import type * as T from '../tipe';

export async function daftarFavoritDokterUntukDaftarFavorit(fasyankes_id: number | undefined, pengguna_id: number | undefined, jenis: T.JenisFavorit | undefined, batas: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; pengguna_id: number; jenis: T.JenisFavorit; kode: string; nama: string; urutan: number; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`pengguna_id`, t.`jenis`, t.`kode`, t.`nama`, t.`urutan`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `favorit_dokter` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`pengguna_id` <=> ?)) AND ((? OR t.`jenis` <=> ?)) ORDER BY t.`urutan` ASC, t.`id` ASC LIMIT ? OFFSET ?", [fasyankes_id === undefined, fasyankes_id ?? null, pengguna_id === undefined, pengguna_id ?? null, jenis === undefined, jenis ?? null, batas ?? 2147483647, 0], koneksi);
  return baris;
}

export async function ringkasanFavoritDokterUntukTambahFavorit(pengguna_id: number | undefined, jenis: T.JenisFavorit | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ _max_urutan: number | null }>("SELECT MAX(t.`urutan`) AS `_max_urutan` FROM `favorit_dokter` t WHERE ((? OR t.`pengguna_id` <=> ?)) AND ((? OR t.`jenis` <=> ?))", [pengguna_id === undefined, pengguna_id ?? null, jenis === undefined, jenis ?? null], koneksi);
  const hasil = baris.map(b => ({ _max: { urutan: b._max_urutan } }));
  return hasil[0];
}

export async function tambahFavoritDokterUntukTambahFavorit(fasyankes_id: number | undefined, pengguna_id: number | undefined, jenis: T.JenisFavorit | undefined, kode: string | undefined, nama: string | undefined, urutan: number | undefined, dibuat_oleh: number | null | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `favorit_dokter` (`fasyankes_id`, `pengguna_id`, `jenis`, `kode`, `nama`, `urutan`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (pengguna_id === undefined ? null : pengguna_id) ?? null, ((jenis === undefined ? null : jenis) ?? null), (kode === undefined ? null : kode) ?? null, (nama === undefined ? null : nama) ?? null, (urutan === undefined ? 0 : urutan) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function tambahFavoritDokterUntukTambahFavoritHasil(id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; pengguna_id: number; jenis: T.JenisFavorit; kode: string; nama: string; urutan: number; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`pengguna_id`, t.`jenis`, t.`kode`, t.`nama`, t.`urutan`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `favorit_dokter` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
  if (!baris[0]) throw new Error('Baris favorit_dokter tidak ditemukan.');
  return baris[0];
}

export async function ubahFavoritDokterUntukUbahUrutanFavorit(urutan: number | undefined, id: number | undefined, fasyankes_id: number | undefined, pengguna_id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `favorit_dokter` t SET `urutan` = IF(?, t.`urutan`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`pengguna_id` <=> ?))", [urutan === undefined, urutan ?? null, id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null, pengguna_id === undefined, pengguna_id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function hapusFavoritDokterUntukHapusFavorit(id: number | undefined, fasyankes_id: number | undefined, pengguna_id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("DELETE t FROM `favorit_dokter` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`pengguna_id` <=> ?))", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null, pengguna_id === undefined, pengguna_id ?? null], koneksi);
  return { count: hasil.affectedRows };
}
