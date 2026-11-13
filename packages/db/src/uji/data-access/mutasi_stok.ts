import { baca, tulis, pool, type Koneksi } from '../../koneksi';
import type * as T from '../../tipe';

export async function daftarMutasiStokUntukKasirKasirIntegrasiTest(fasyankes_id: number | undefined, jenis: T.JenisMutasi | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; stok_id: number; jenis: T.JenisMutasi; jumlah: number; alasan: string | null; pengguna_id: number; waktu: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`stok_id`, t.`jenis`, t.`jumlah`, t.`alasan`, t.`pengguna_id`, t.`waktu` FROM `mutasi_stok` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`jenis` <=> ?)) ORDER BY t.`id` ASC", [fasyankes_id === undefined, fasyankes_id ?? null, jenis === undefined, jenis ?? null], koneksi);
  return baris;
}

export function hapusMutasiStokFasyankesUji(ids: readonly number[], koneksi: Koneksi = pool) {
  return tulis('DELETE FROM `mutasi_stok` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
