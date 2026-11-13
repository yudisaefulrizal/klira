import { baca, tulis, pool, type Koneksi } from '../../koneksi';


export async function tambahMasterObatUntukKasirKasirIntegrasiTest(fasyankes_id: number | undefined, kfa_kode: string | undefined, kfa_nama: string | undefined, nama_tampil: string | undefined, satuan: string | undefined, harga: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `master_obat` (`fasyankes_id`, `kfa_kode`, `kfa_nama`, `nama_tampil`, `satuan`, `harga`) VALUES (?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (kfa_kode === undefined ? null : kfa_kode) ?? null, (kfa_nama === undefined ? null : kfa_nama) ?? null, (nama_tampil === undefined ? null : nama_tampil) ?? null, (satuan === undefined ? null : satuan) ?? null, (harga === undefined ? null : harga) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function tambahMasterObatUntukKasirKasirIntegrasiTestHasil(id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kfa_kode: string; kfa_nama: string; bentuk_sediaan: string | null; rute: string | null; nama_tampil: string; satuan: string; harga: number; aktif: boolean; dibuat_oleh: number | null; dibuat_pada: Date; diubah_pada: Date | null }>("SELECT t.`id`, t.`fasyankes_id`, t.`kfa_kode`, t.`kfa_nama`, t.`bentuk_sediaan`, t.`rute`, t.`nama_tampil`, t.`satuan`, t.`harga`, t.`aktif`, t.`dibuat_oleh`, t.`dibuat_pada`, t.`diubah_pada` FROM `master_obat` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
  if (!baris[0]) throw new Error('Baris master_obat tidak ditemukan.');
  return baris[0];
}

export function hapusMasterObatFasyankesUji(ids: readonly number[], koneksi: Koneksi = pool) {
  return tulis('DELETE FROM `master_obat` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
