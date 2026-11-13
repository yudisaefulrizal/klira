import { baca, tulis, pool, type Koneksi } from '../koneksi';


export async function hapusIgMediaPublikUntukBersihkanDalam(media_id: readonly (string)[] | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("DELETE t FROM `ig_media_publik` t WHERE ((? OR t.`media_id` IN (?)))", [media_id === undefined, (media_id)?.length ? (media_id) : [null]], koneksi);
  return { count: hasil.affectedRows };
}

export async function tambahIgMediaPublikUntukBuatRuteInstagram(token_hash: string | undefined, media_id: string | undefined, generasi: number | undefined, berakhir: Date | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `ig_media_publik` (`token_hash`, `media_id`, `generasi`, `berakhir`) VALUES (?, ?, ?, ?)", [(token_hash === undefined ? null : token_hash) ?? null, (media_id === undefined ? null : media_id) ?? null, (generasi === undefined ? null : generasi) ?? null, (berakhir === undefined ? null : berakhir) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function ambilIgMediaPublikUntukBuatRuteInstagramPublik(token_hash: string | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ token_hash: string; media_id: string; generasi: number; berakhir: Date }>("SELECT t.`token_hash`, t.`media_id`, t.`generasi`, t.`berakhir` FROM `ig_media_publik` t WHERE ((? OR t.`token_hash` <=> ?)) LIMIT 1", [token_hash === undefined, token_hash ?? null], koneksi);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}

export async function hapusIgMediaPublikUntukBuatRuteInstagramPublik(koneksi: Koneksi = pool) {
  const hasil = await tulis("DELETE t FROM `ig_media_publik` t WHERE TRUE", [], koneksi);
  return { count: hasil.affectedRows };
}

export async function hapusIgMediaPublikUntukPerbaruiTokenInstagram(berakhir: Date | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("DELETE t FROM `ig_media_publik` t WHERE ((? OR t.`berakhir` < ?))", [berakhir === undefined, berakhir ?? null], koneksi);
  return { count: hasil.affectedRows };
}
