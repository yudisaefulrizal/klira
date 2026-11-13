import { baca, tulis, pool, type Koneksi } from '../../koneksi';


export async function hapusWaliKeluargaUntukPasienPasienIntegrasiTest(fasyankes_id: readonly (number)[] | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("DELETE t FROM `wali_keluarga` t WHERE ((? OR t.`fasyankes_id` IN (?)))", [fasyankes_id === undefined, (fasyankes_id)?.length ? (fasyankes_id) : [null]], koneksi);
  return { count: hasil.affectedRows };
}

export async function hitungWaliKeluargaUntukHitung(fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `wali_keluarga` t WHERE ((? OR t.`fasyankes_id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  return Number(baris.jumlah);
}

export async function tambahWaliKeluargaUntukPenunjangPenunjangIntegrasiTest(fasyankes_id: number | undefined, pasien_id: number | undefined, hubungan: string | undefined, nama: string | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `wali_keluarga` (`fasyankes_id`, `pasien_id`, `hubungan`, `nama`) VALUES (?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (pasien_id === undefined ? null : pasien_id) ?? null, (hubungan === undefined ? null : hubungan) ?? null, (nama === undefined ? null : nama) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function tambahWaliKeluargaUntukPenunjangPenunjangIntegrasiTestHasil(id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; pasien_id: number; hubungan: string; nama: string; kontak: string | null; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`pasien_id`, t.`hubungan`, t.`nama`, t.`kontak`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `wali_keluarga` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
  if (!baris[0]) throw new Error('Baris wali_keluarga tidak ditemukan.');
  return baris[0];
}

export function hapusWaliKeluargaFasyankesUji(ids: readonly number[], koneksi: Koneksi = pool) {
  return tulis('DELETE FROM `wali_keluarga` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
