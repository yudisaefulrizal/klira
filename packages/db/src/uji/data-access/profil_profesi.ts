import { baca, tulis, pool, type Koneksi } from '../../koneksi';


export async function tambahProfilProfesiUntukAksesIzinIntegrasiTest(fasyankes_id: number | undefined, pengguna_id: number | undefined, profesi: string | undefined, nomor_sip: string | null | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `profil_profesi` (`fasyankes_id`, `pengguna_id`, `profesi`, `nomor_sip`) VALUES (?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (pengguna_id === undefined ? null : pengguna_id) ?? null, (profesi === undefined ? null : profesi) ?? null, (nomor_sip === undefined ? null : nomor_sip) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function tambahProfilProfesiUntukAksesIzinIntegrasiTest2(fasyankes_id: number | undefined, pengguna_id: number | undefined, profesi: string | undefined, nomor_sip: string | null | undefined, masa_berlaku_sip: Date | null | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `profil_profesi` (`fasyankes_id`, `pengguna_id`, `profesi`, `nomor_sip`, `masa_berlaku_sip`) VALUES (?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (pengguna_id === undefined ? null : pengguna_id) ?? null, (profesi === undefined ? null : profesi) ?? null, (nomor_sip === undefined ? null : nomor_sip) ?? null, (masa_berlaku_sip === undefined ? null : masa_berlaku_sip) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function hapusProfilProfesiUntukAksesIzinIntegrasiTest(fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("DELETE t FROM `profil_profesi` t WHERE ((? OR t.`fasyankes_id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function hapusProfilProfesiUntukMasterMasterIntegrasiTest(fasyankes_id: readonly (number)[] | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("DELETE t FROM `profil_profesi` t WHERE ((? OR t.`fasyankes_id` IN (?)))", [fasyankes_id === undefined, (fasyankes_id)?.length ? (fasyankes_id) : [null]], koneksi);
  return { count: hasil.affectedRows };
}

export async function hitungProfilProfesiUntukMasterMasterIntegrasiTest(fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `profil_profesi` t WHERE ((? OR t.`fasyankes_id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  return Number(baris.jumlah);
}

export async function wajibProfilProfesiUntukMasterMasterIntegrasiTest(fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; pengguna_id: number; profesi: string; nomor_sip: string | null; masa_berlaku_sip: Date | null; ihs_practitioner_id: string | null; aktif: boolean; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`pengguna_id`, t.`profesi`, t.`nomor_sip`, t.`masa_berlaku_sip`, t.`ihs_practitioner_id`, t.`aktif`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `profil_profesi` t WHERE ((? OR t.`fasyankes_id` <=> ?)) LIMIT 1", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  if (!baris[0]) throw new Error('Baris profil_profesi tidak ditemukan.');
  return baris[0];
}

export async function tambahProfilProfesiUntukPasienPasienIntegrasiTest(fasyankes_id: number | undefined, pengguna_id: number | undefined, profesi: string | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `profil_profesi` (`fasyankes_id`, `pengguna_id`, `profesi`) VALUES (?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (pengguna_id === undefined ? null : pengguna_id) ?? null, (profesi === undefined ? null : profesi) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function hitungProfilProfesiUntukPenggunaPembuatanIntegrasiTest(fasyankes_id: number | undefined, username: string | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `profil_profesi` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND (EXISTS (SELECT 1 FROM `pengguna` r1 WHERE t.`pengguna_id` = r1.`id` AND (((? OR r1.`username` <=> ?)))))", [fasyankes_id === undefined, fasyankes_id ?? null, username === undefined, username ?? null], koneksi);
  return Number(baris.jumlah);
}

export function hapusProfilProfesiFasyankesUji(ids: readonly number[], koneksi: Koneksi = pool) {
  return tulis('DELETE FROM `profil_profesi` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
