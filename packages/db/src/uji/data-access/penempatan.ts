import { baca, tulis, pool, type Koneksi } from '../../koneksi';


export async function hitungPenempatanUntukRawatInapRawatInapIntegrasiTest(lokasi_id: number | undefined, selesai: Date | null | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `penempatan` t WHERE ((? OR t.`lokasi_id` <=> ?)) AND ((? OR t.`selesai` <=> ?))", [lokasi_id === undefined, lokasi_id ?? null, selesai === undefined, selesai ?? null], koneksi);
  return Number(baris.jumlah);
}

export async function ubahPenempatanUntukRawatInapRawatInapIntegrasiTest(mulai: Date | undefined, kunjungan_id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `penempatan` t SET `mulai` = IF(?, t.`mulai`, ?) WHERE ((? OR t.`kunjungan_id` <=> ?))", [mulai === undefined, mulai ?? null, kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function hitungPenempatanUntukRawatInapRawatInapIntegrasiTest2(kunjungan_id: number | undefined, selesai: Date | null | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `penempatan` t WHERE ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`selesai` <=> ?))", [kunjungan_id === undefined, kunjungan_id ?? null, selesai === undefined, selesai ?? null], koneksi);
  return Number(baris.jumlah);
}

export function hapusPenempatanFasyankesUji(ids: readonly number[], koneksi: Koneksi = pool) {
  return tulis('DELETE FROM `penempatan` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
