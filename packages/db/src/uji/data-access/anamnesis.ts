import { baca, tulis, pool, type Koneksi } from '../../koneksi';


export async function hitungAnamnesisUntukKlinisKlinisIntegrasiTest(kunjungan_id: number | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `anamnesis` t WHERE ((? OR t.`kunjungan_id` <=> ?))", [kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
  return Number(baris.jumlah);
}

export function hapusAnamnesisFasyankesUji(ids: readonly number[], koneksi: Koneksi = pool) {
  return tulis('DELETE FROM `anamnesis` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
