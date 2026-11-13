import { baca, tulis, pool, type Koneksi } from '../koneksi';


export async function ambilIgEventUntukWebhookInstagram(id: string | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: string }>("SELECT t.`id` FROM `ig_event` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}

export async function tambahIgEventUntukWebhookInstagram(id: string | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `ig_event` (`id`) VALUES (?)", [(id === undefined ? null : id) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function hapusIgEventUntukBuatRuteInstagramPublik(koneksi: Koneksi = pool) {
  const hasil = await tulis("DELETE t FROM `ig_event` t WHERE TRUE", [], koneksi);
  return { count: hasil.affectedRows };
}
