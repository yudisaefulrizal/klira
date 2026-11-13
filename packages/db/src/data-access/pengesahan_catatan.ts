import { baca, tulis, pool, type Koneksi } from '../koneksi';


export async function tambahPengesahanCatatanUntukTulisPengesahanDalam(fasyankes_id: number | undefined, entitas: string | undefined, entitas_id: number | undefined, versi: number | undefined, pengguna_id: number | undefined, jenis_akun_id: number | null | undefined, jenis_akun_nama: string | null | undefined, waktu: Date | undefined, hash: string | undefined, dibuat_oleh: number | null | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `pengesahan_catatan` (`fasyankes_id`, `entitas`, `entitas_id`, `versi`, `pengguna_id`, `jenis_akun_id`, `jenis_akun_nama`, `waktu`, `hash`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (entitas === undefined ? null : entitas) ?? null, (entitas_id === undefined ? null : entitas_id) ?? null, (versi === undefined ? null : versi) ?? null, (pengguna_id === undefined ? null : pengguna_id) ?? null, (jenis_akun_id === undefined ? null : jenis_akun_id) ?? null, (jenis_akun_nama === undefined ? null : jenis_akun_nama) ?? null, (waktu === undefined ? new Date() : waktu) ?? null, (hash === undefined ? null : hash) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function cariPengesahanCatatanUntukTerakhir(fasyankes_id: number | undefined, entitas: string | undefined, entitas_id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; entitas: string; entitas_id: number; versi: number; pengguna_id: number; jenis_akun_id: number | null; jenis_akun_nama: string | null; waktu: Date; hash: string; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`entitas`, t.`entitas_id`, t.`versi`, t.`pengguna_id`, t.`jenis_akun_id`, t.`jenis_akun_nama`, t.`waktu`, t.`hash`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `pengesahan_catatan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`entitas` <=> ?)) AND ((? OR t.`entitas_id` <=> ?)) ORDER BY t.`versi` DESC LIMIT 1", [fasyankes_id === undefined, fasyankes_id ?? null, entitas === undefined, entitas ?? null, entitas_id === undefined, entitas_id ?? null], koneksi);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}

export async function cariPengesahanCatatanUntukVersiTerbaru(fasyankes_id: number | undefined, entitas: string | undefined, entitas_id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ versi: number }>("SELECT t.`versi` FROM `pengesahan_catatan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`entitas` <=> ?)) AND ((? OR t.`entitas_id` <=> ?)) ORDER BY t.`versi` DESC LIMIT 1", [fasyankes_id === undefined, fasyankes_id ?? null, entitas === undefined, entitas ?? null, entitas_id === undefined, entitas_id ?? null], koneksi);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}

export async function daftarPengesahanCatatanUntukBagianDisahkan(fasyankes_id: number | undefined, entitas_id: number | undefined, entitas: readonly (string)[] | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ entitas: string }>("SELECT DISTINCT t.`entitas` FROM `pengesahan_catatan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`entitas_id` <=> ?)) AND ((? OR t.`entitas` IN (?)))", [fasyankes_id === undefined, fasyankes_id ?? null, entitas_id === undefined, entitas_id ?? null, entitas === undefined, (entitas)?.length ? (entitas) : [null]], koneksi);
  return baris;
}
