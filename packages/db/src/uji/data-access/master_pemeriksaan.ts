import { baca, tulis, pool, type Koneksi } from '../../koneksi';


export async function hitungMasterPemeriksaanUntukPenunjangPenunjangIntegrasiTest(fasyankes_id: number | undefined, kode: string | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `master_pemeriksaan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`kode` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null, kode === undefined, kode ?? null], koneksi);
  return Number(baris.jumlah);
}

export function hapusMasterPemeriksaanFasyankesUji(ids: readonly number[], koneksi: Koneksi = pool) {
  return tulis('DELETE FROM `master_pemeriksaan` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
