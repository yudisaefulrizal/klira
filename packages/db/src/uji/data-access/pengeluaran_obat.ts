import { baca, tulis, pool, type Koneksi } from '../../koneksi';


export async function daftarPengeluaranObatUntukKasirKasirIntegrasiTest(resep_id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; resep_id: number; item_resep_id: number; master_obat_id: number; jumlah: number; harga: number; stok_kurang: boolean; alasan: string | null; petugas_id: number; waktu: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`resep_id`, t.`item_resep_id`, t.`master_obat_id`, t.`jumlah`, t.`harga`, t.`stok_kurang`, t.`alasan`, t.`petugas_id`, t.`waktu` FROM `pengeluaran_obat` t WHERE ((? OR t.`resep_id` <=> ?))", [resep_id === undefined, resep_id ?? null], koneksi);
  return baris;
}

export async function cariPengeluaranObatUntukKasirKasirIntegrasiTest(resep_id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; resep_id: number; item_resep_id: number; master_obat_id: number; jumlah: number; harga: number; stok_kurang: boolean; alasan: string | null; petugas_id: number; waktu: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`resep_id`, t.`item_resep_id`, t.`master_obat_id`, t.`jumlah`, t.`harga`, t.`stok_kurang`, t.`alasan`, t.`petugas_id`, t.`waktu` FROM `pengeluaran_obat` t WHERE ((? OR t.`resep_id` <=> ?)) LIMIT 1", [resep_id === undefined, resep_id ?? null], koneksi);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}

export async function hitungPengeluaranObatUntukKasirKasirIntegrasiTest(resep_id: number | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `pengeluaran_obat` t WHERE ((? OR t.`resep_id` <=> ?))", [resep_id === undefined, resep_id ?? null], koneksi);
  return Number(baris.jumlah);
}

export function hapusPengeluaranObatFasyankesUji(ids: readonly number[], koneksi: Koneksi = pool) {
  return tulis('DELETE FROM `pengeluaran_obat` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
