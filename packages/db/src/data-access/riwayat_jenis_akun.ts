import { baca, tulis, pool, type Koneksi } from '../koneksi';


export async function tambahRiwayatJenisAkunUntukBuatJenisAkun(fasyankes_id: number | undefined, jenis_akun_id: number | undefined, ringkasan: string | undefined, alasan: string | null | undefined, dibuat_oleh: number | null | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `riwayat_jenis_akun` (`fasyankes_id`, `jenis_akun_id`, `ringkasan`, `alasan`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (jenis_akun_id === undefined ? null : jenis_akun_id) ?? null, (ringkasan === undefined ? null : ringkasan) ?? null, (alasan === undefined ? null : alasan) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function daftarRiwayatJenisAkunUntukRiwayatJenisAkun(fasyankes_id: number | undefined, jenis_akun_id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; jenis_akun_id: number; ringkasan: string; alasan: string | null; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`jenis_akun_id`, t.`ringkasan`, t.`alasan`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `riwayat_jenis_akun` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`jenis_akun_id` <=> ?)) ORDER BY t.`id` DESC", [fasyankes_id === undefined, fasyankes_id ?? null, jenis_akun_id === undefined, jenis_akun_id ?? null], koneksi);
  return baris;
}
