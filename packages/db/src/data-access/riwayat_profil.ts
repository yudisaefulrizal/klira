import { baca, tulis, pool, type Koneksi } from '../koneksi';
import type * as T from '../tipe';

export async function tambahRiwayatProfilUntukBuatRuteWebsitePengaturan(fasyankes_id: number | undefined, jenis: string | undefined, ringkasan: string | undefined, dibuat_oleh: number | null | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `riwayat_profil` (`fasyankes_id`, `jenis`, `ringkasan`, `dibuat_oleh`) VALUES (?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (jenis === undefined ? null : jenis) ?? null, (ringkasan === undefined ? null : ringkasan) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function tambahRiwayatProfilUntukTambahRiwayatProfil(fasyankes_id: number | undefined, jenis: string | undefined, pengguna_id: number | null | undefined, ringkasan: string | undefined, dibuat_oleh: number | null | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `riwayat_profil` (`fasyankes_id`, `jenis`, `pengguna_id`, `ringkasan`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (jenis === undefined ? null : jenis) ?? null, (pengguna_id === undefined ? null : pengguna_id) ?? null, (ringkasan === undefined ? null : ringkasan) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function tambahBanyakRiwayatProfilUntukSimpan(data: readonly T.RiwayatProfilBaru[], koneksi: Koneksi = pool) {
  if (!data.length) return { count: 0 };
  const nilai = data.map(d => [(d.fasyankes_id === undefined ? null : d.fasyankes_id) ?? null, (d.jenis === undefined ? null : d.jenis) ?? null, (d.pengguna_id === undefined ? null : d.pengguna_id) ?? null, (d.ringkasan === undefined ? null : d.ringkasan) ?? null, (d.dibuat_oleh === undefined ? null : d.dibuat_oleh) ?? null, (d.dibuat_pada === undefined ? new Date() : d.dibuat_pada) ?? null]);
  const hasil = await tulis("INSERT INTO `riwayat_profil` (`fasyankes_id`, `jenis`, `pengguna_id`, `ringkasan`, `dibuat_oleh`, `dibuat_pada`) VALUES ?", [nilai], koneksi);
  return { count: hasil.affectedRows };
}

export async function hitungRiwayatProfilUntukRiwayat(fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `riwayat_profil` t WHERE ((? OR t.`fasyankes_id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  return Number(baris.jumlah);
}

export async function daftarRiwayatProfilUntukRiwayat(fasyankes_id: number | undefined, batas: number | undefined, lewati: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; jenis: string; pengguna_id: number | null; ringkasan: string; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`jenis`, t.`pengguna_id`, t.`ringkasan`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `riwayat_profil` t WHERE ((? OR t.`fasyankes_id` <=> ?)) ORDER BY t.`dibuat_pada` DESC, t.`id` DESC LIMIT ? OFFSET ?", [fasyankes_id === undefined, fasyankes_id ?? null, batas ?? 2147483647, lewati ?? 0], koneksi);
  return baris;
}
