import { baca, tulis, pool, type Koneksi } from '../koneksi';


export async function hitungKebijakanRetensiUntukKebijakan(fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `kebijakan_retensi` t WHERE ((? OR t.`fasyankes_id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  return Number(baris.jumlah);
}

export async function tambahKebijakanRetensiUntukKebijakan(fasyankes_id: number | undefined, jenis_data: string | undefined, periode_tahun: number | undefined, dasar_hukum: string | undefined, metode_musnah: string | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `kebijakan_retensi` (`fasyankes_id`, `jenis_data`, `periode_tahun`, `dasar_hukum`, `metode_musnah`) VALUES (?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (jenis_data === undefined ? null : jenis_data) ?? null, (periode_tahun === undefined ? null : periode_tahun) ?? null, (dasar_hukum === undefined ? null : dasar_hukum) ?? null, (metode_musnah === undefined ? null : metode_musnah) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function daftarKebijakanRetensiUntukKebijakan(fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; jenis_data: string; periode_tahun: number; dasar_hukum: string; metode_musnah: string; penanggung_jawab: string | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`jenis_data`, t.`periode_tahun`, t.`dasar_hukum`, t.`metode_musnah`, t.`penanggung_jawab`, t.`dibuat_pada` FROM `kebijakan_retensi` t WHERE ((? OR t.`fasyankes_id` <=> ?)) ORDER BY t.`id` ASC", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  return baris;
}
