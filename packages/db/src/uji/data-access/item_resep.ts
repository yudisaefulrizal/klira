import { tulis, pool, type Koneksi } from '../../koneksi';


export async function tambahItemResepUntukSiapkan(fasyankes_id: number | undefined, resep_id: number | undefined, master_obat_id: number | undefined, aturan_pakai: string | undefined, jumlah: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `item_resep` (`fasyankes_id`, `resep_id`, `master_obat_id`, `aturan_pakai`, `jumlah`) VALUES (?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (resep_id === undefined ? null : resep_id) ?? null, (master_obat_id === undefined ? null : master_obat_id) ?? null, (aturan_pakai === undefined ? null : aturan_pakai) ?? null, (jumlah === undefined ? null : jumlah) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export function hapusItemResepFasyankesUji(ids: readonly number[], koneksi: Koneksi = pool) {
  return tulis('DELETE FROM `item_resep` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
