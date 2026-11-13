import { tulis, pool, type Koneksi } from '../koneksi';


export async function tambahSpesimenUntukCatatSpesimen(fasyankes_id: number | undefined, order_id: number | undefined, asal: string | undefined, waktu_ambil: Date | undefined, petugas_id: number | undefined, dibuat_oleh: number | null | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `spesimen` (`fasyankes_id`, `order_id`, `asal`, `waktu_ambil`, `petugas_id`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (order_id === undefined ? null : order_id) ?? null, (asal === undefined ? null : asal) ?? null, (waktu_ambil === undefined ? null : waktu_ambil) ?? null, (petugas_id === undefined ? null : petugas_id) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}
