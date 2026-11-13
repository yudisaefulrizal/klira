import { baca, tulis, pool, type Koneksi } from '../../koneksi';


export async function hapusUrutanNomorRmUntukPasienPasienIntegrasiTest(fasyankes_id: readonly (number)[] | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("DELETE t FROM `urutan_nomor_rm` t WHERE ((? OR t.`fasyankes_id` IN (?)))", [fasyankes_id === undefined, (fasyankes_id)?.length ? (fasyankes_id) : [null]], koneksi);
  return { count: hasil.affectedRows };
}

export async function ambilUrutanNomorRmUntukHitung(fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; terakhir: number; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`terakhir`, t.`dibuat_pada` FROM `urutan_nomor_rm` t WHERE ((? OR t.`fasyankes_id` <=> ?)) LIMIT 1", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}

