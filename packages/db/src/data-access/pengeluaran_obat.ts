import { tulis, pool, type Koneksi } from '../koneksi';


export async function tambahPengeluaranObatUntukSerahTerima(fasyankes_id: number | undefined, resep_id: number | undefined, item_resep_id: number | undefined, master_obat_id: number | undefined, jumlah: number | undefined, harga: number | undefined, stok_kurang: boolean | undefined, alasan: string | null | undefined, petugas_id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `pengeluaran_obat` (`fasyankes_id`, `resep_id`, `item_resep_id`, `master_obat_id`, `jumlah`, `harga`, `stok_kurang`, `alasan`, `petugas_id`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (resep_id === undefined ? null : resep_id) ?? null, (item_resep_id === undefined ? null : item_resep_id) ?? null, (master_obat_id === undefined ? null : master_obat_id) ?? null, (jumlah === undefined ? null : jumlah) ?? null, (harga === undefined ? null : harga) ?? null, (stok_kurang === undefined ? false : stok_kurang) ?? null, (alasan === undefined ? null : alasan) ?? null, (petugas_id === undefined ? null : petugas_id) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}
