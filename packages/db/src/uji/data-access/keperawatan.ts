import { baca, tulis, pool, type Koneksi } from '../../koneksi';


export async function hitungKeperawatanUntukKlinisKlinisIntegrasiTest(kunjungan_id: number | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `keperawatan` t WHERE ((? OR t.`kunjungan_id` <=> ?))", [kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
  return Number(baris.jumlah);
}

export async function ubahKeperawatanUntukKlinisKlinisIntegrasiTest(nyeri_skala: number | null | undefined, kunjungan_id: number | undefined, versi: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `keperawatan` t SET `nyeri_skala` = IF(?, t.`nyeri_skala`, ?) WHERE ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`versi` <=> ?))", [nyeri_skala === undefined, nyeri_skala ?? null, kunjungan_id === undefined, kunjungan_id ?? null, versi === undefined, versi ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export function hapusKeperawatanFasyankesUji(ids: readonly number[], koneksi: Koneksi = pool) {
  return tulis('DELETE FROM `keperawatan` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
