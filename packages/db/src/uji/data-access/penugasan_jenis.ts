import { baca, tulis, pool, type Koneksi } from '../../koneksi';


export async function tambahPenugasanJenisUntukAksesIzinIntegrasiTest(fasyankes_id: number | undefined, pengguna_id: number | undefined, jenis_akun_id: number | undefined, mulai: Date | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `penugasan_jenis` (`fasyankes_id`, `pengguna_id`, `jenis_akun_id`, `mulai`) VALUES (?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (pengguna_id === undefined ? null : pengguna_id) ?? null, (jenis_akun_id === undefined ? null : jenis_akun_id) ?? null, (mulai === undefined ? null : mulai) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function hapusPenugasanJenisUntukAksesIzinIntegrasiTest(fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("DELETE t FROM `penugasan_jenis` t WHERE ((? OR t.`fasyankes_id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function hitungPenugasanJenisUntukAksesIzinIntegrasiTest(pengguna_id: number | undefined, jenis_akun_id: number | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `penugasan_jenis` t WHERE ((? OR t.`pengguna_id` <=> ?)) AND ((? OR t.`jenis_akun_id` <=> ?))", [pengguna_id === undefined, pengguna_id ?? null, jenis_akun_id === undefined, jenis_akun_id ?? null], koneksi);
  return Number(baris.jumlah);
}

export async function hapusPenugasanJenisUntukFarmasiFarmasiIntegrasiTest(fasyankes_id: readonly (number)[] | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("DELETE t FROM `penugasan_jenis` t WHERE ((? OR t.`fasyankes_id` IN (?)))", [fasyankes_id === undefined, (fasyankes_id)?.length ? (fasyankes_id) : [null]], koneksi);
  return { count: hasil.affectedRows };
}

export async function ubahPenugasanJenisUntukKeamananKeamananIntegrasiTest(selesai: Date | null | undefined, pengguna_id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `penugasan_jenis` t SET `selesai` = IF(?, t.`selesai`, ?) WHERE ((? OR t.`pengguna_id` <=> ?))", [selesai === undefined, selesai ?? null, pengguna_id === undefined, pengguna_id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function wajibPenugasanJenisUntukRekamMedisRmIntegrasiTest(pengguna_id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; pengguna_id: number; jenis_akun_id: number; mulai: Date; selesai: Date | null; ditetapkan_oleh: number | null; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`pengguna_id`, t.`jenis_akun_id`, t.`mulai`, t.`selesai`, t.`ditetapkan_oleh`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `penugasan_jenis` t WHERE ((? OR t.`pengguna_id` <=> ?)) LIMIT 1", [pengguna_id === undefined, pengguna_id ?? null], koneksi);
  if (!baris[0]) throw new Error('Baris penugasan_jenis tidak ditemukan.');
  return baris[0];
}

export async function hitungPenugasanJenisUntukSrcSkemaTest(pengguna_id: number | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `penugasan_jenis` t WHERE ((? OR t.`pengguna_id` <=> ?))", [pengguna_id === undefined, pengguna_id ?? null], koneksi);
  return Number(baris.jumlah);
}

export async function tambahPenugasanJenisUntukSrcSkemaTestHasil(id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; pengguna_id: number; jenis_akun_id: number; mulai: Date; selesai: Date | null; ditetapkan_oleh: number | null; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`pengguna_id`, t.`jenis_akun_id`, t.`mulai`, t.`selesai`, t.`ditetapkan_oleh`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `penugasan_jenis` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
  if (!baris[0]) throw new Error('Baris penugasan_jenis tidak ditemukan.');
  return baris[0];
}
