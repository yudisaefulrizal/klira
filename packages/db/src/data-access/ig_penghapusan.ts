import { baca, tulis, pool, type Koneksi } from '../koneksi';


export async function tambahIgPenghapusanUntukBuatRuteInstagramPublik(kode: string | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `ig_penghapusan` (`kode`) VALUES (?)", [(kode === undefined ? null : kode) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function ambilIgPenghapusanUntukBuatRuteInstagramPublik(kode: string | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ kode: string; dibuat_pada: Date }>("SELECT t.`kode`, t.`dibuat_pada` FROM `ig_penghapusan` t WHERE ((? OR t.`kode` <=> ?)) LIMIT 1", [kode === undefined, kode ?? null], koneksi);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}
