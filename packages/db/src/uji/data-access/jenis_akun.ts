import { baca, tulis, pool, type Koneksi } from '../../koneksi';


export async function tambahJenisAkunUntukJenisPaket(fasyankes_id: number | undefined, nama: string | undefined, syarat_profesi: string | null | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `jenis_akun` (`fasyankes_id`, `nama`, `syarat_profesi`) VALUES (?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (nama === undefined ? null : nama) ?? null, (syarat_profesi === undefined ? null : syarat_profesi) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function tambahJenisAkunUntukJenisPaketHasil(id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; nama: string; syarat_profesi: string | null; aktif: boolean; diubah_oleh: number | null; alasan_perubahan: string | null; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`nama`, t.`syarat_profesi`, t.`aktif`, t.`diubah_oleh`, t.`alasan_perubahan`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `jenis_akun` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
  if (!baris[0]) throw new Error('Baris jenis_akun tidak ditemukan.');
  return baris[0];
}

export async function hapusJenisAkunUntukAksesIzinIntegrasiTest(fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("DELETE t FROM `jenis_akun` t WHERE ((? OR t.`fasyankes_id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function hitungJenisAkunUntukAksesIzinIntegrasiTest(id: number | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `jenis_akun` t WHERE ((? OR t.`id` <=> ?))", [id === undefined, id ?? null], koneksi);
  return Number(baris.jumlah);
}

export async function tambahJenisAkunUntukBuatPengguna(fasyankes_id: number | undefined, nama: string | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `jenis_akun` (`fasyankes_id`, `nama`) VALUES (?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (nama === undefined ? null : nama) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function hapusJenisAkunUntukFarmasiFarmasiIntegrasiTest(fasyankes_id: readonly (number)[] | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("DELETE t FROM `jenis_akun` t WHERE ((? OR t.`fasyankes_id` IN (?)))", [fasyankes_id === undefined, (fasyankes_id)?.length ? (fasyankes_id) : [null]], koneksi);
  return { count: hasil.affectedRows };
}

export async function hitungJenisAkunUntukSrcSkemaTest(fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `jenis_akun` t WHERE ((? OR t.`fasyankes_id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  return Number(baris.jumlah);
}

export async function wajibJenisAkunUntukSrcSkemaTest(koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; nama: string; syarat_profesi: string | null; aktif: boolean; diubah_oleh: number | null; alasan_perubahan: string | null; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`nama`, t.`syarat_profesi`, t.`aktif`, t.`diubah_oleh`, t.`alasan_perubahan`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `jenis_akun` t WHERE TRUE LIMIT 1", [], koneksi);
  if (!baris[0]) throw new Error('Baris jenis_akun tidak ditemukan.');
  return baris[0];
}
