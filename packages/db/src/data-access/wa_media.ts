import { baca, tulis, pool, type Koneksi } from '../koneksi';


export async function hapusWaMediaUntukBersihkanDalam(fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("DELETE t FROM `wa_media` t WHERE ((? OR t.`fasyankes_id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function tambahWaMediaUntukBuatRuteWhatsapp(id: string | undefined, fasyankes_id: number | undefined, isi: string | undefined, mime: string | undefined, nama: string | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `wa_media` (`id`, `fasyankes_id`, `isi`, `mime`, `nama`) VALUES (?, ?, ?, ?, ?)", [(id === undefined ? null : id) ?? null, (fasyankes_id === undefined ? null : fasyankes_id) ?? null, (isi === undefined ? null : isi) ?? null, (mime === undefined ? null : mime) ?? null, (nama === undefined ? null : nama) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function cariWaMediaUntukBuatRuteWhatsapp(id: string | undefined, fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: string; fasyankes_id: number; isi: string; mime: string; nama: string }>("SELECT t.`id`, t.`fasyankes_id`, t.`isi`, t.`mime`, t.`nama` FROM `wa_media` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) LIMIT 1", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}

export async function tambahWaMediaUntukTerima(koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `wa_media` () VALUES ()", [], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function wajibWaMediaUntukKirim(id: string | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: string; fasyankes_id: number; isi: string; mime: string; nama: string }>("SELECT t.`id`, t.`fasyankes_id`, t.`isi`, t.`mime`, t.`nama` FROM `wa_media` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
  if (!baris[0]) throw new Error('Baris wa_media tidak ditemukan.');
  return baris[0];
}

export async function hapusWaMediaUntukPangkasPesanWhatsapp(id: readonly (string)[] | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("DELETE t FROM `wa_media` t WHERE ((? OR t.`id` IN (?)))", [id === undefined, (id)?.length ? (id) : [null]], koneksi);
  return { count: hasil.affectedRows };
}
