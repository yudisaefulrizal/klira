import { baca, tulis, pool, type Koneksi } from '../../koneksi';


export async function cariStokObatUntukStokBatch(master_obat_id: number | undefined, batch: string | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; master_obat_id: number; batch: string; kedaluwarsa: Date; jumlah: number; dibuat_oleh: number | null; dibuat_pada: Date; diubah_pada: Date | null }>("SELECT t.`id`, t.`fasyankes_id`, t.`master_obat_id`, t.`batch`, t.`kedaluwarsa`, t.`jumlah`, t.`dibuat_oleh`, t.`dibuat_pada`, t.`diubah_pada` FROM `stok_obat` t WHERE ((? OR t.`master_obat_id` <=> ?)) AND ((? OR t.`batch` <=> ?)) LIMIT 1", [master_obat_id === undefined, master_obat_id ?? null, batch === undefined, batch ?? null], koneksi);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}

export async function tambahStokObatUntukKasirKasirIntegrasiTest(fasyankes_id: number | undefined, master_obat_id: number | undefined, batch: string | undefined, kedaluwarsa: Date | undefined, jumlah: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `stok_obat` (`fasyankes_id`, `master_obat_id`, `batch`, `kedaluwarsa`, `jumlah`) VALUES (?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (master_obat_id === undefined ? null : master_obat_id) ?? null, (batch === undefined ? null : batch) ?? null, (kedaluwarsa === undefined ? null : kedaluwarsa) ?? null, (jumlah === undefined ? 0 : jumlah) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function ubahStokObatUntukKasirKasirIntegrasiTest(jumlah: number | undefined, master_obat_id: number | undefined, batch: string | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `stok_obat` t SET `jumlah` = IF(?, t.`jumlah`, ?) WHERE ((? OR t.`master_obat_id` <=> ?)) AND ((? OR t.`batch` <=> ?))", [jumlah === undefined, jumlah ?? null, master_obat_id === undefined, master_obat_id ?? null, batch === undefined, batch ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export function hapusStokObatFasyankesUji(ids: readonly number[], koneksi: Koneksi = pool) {
  return tulis('DELETE FROM `stok_obat` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
