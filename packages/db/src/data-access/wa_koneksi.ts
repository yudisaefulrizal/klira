import { baca, tulis, pool, type Koneksi } from '../koneksi';


export async function ambilWaKoneksi(id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; aktif: boolean; generasi: number; status: string; nomor: string | null; qr: string | null; detak: Date | null; pemilik_engine: string | null; sewa_sampai: Date | null }>("SELECT t.`id`, t.`fasyankes_id`, t.`aktif`, t.`generasi`, t.`status`, t.`nomor`, t.`qr`, t.`detak`, t.`pemilik_engine`, t.`sewa_sampai` FROM `wa_koneksi` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}

export async function ubahWaKoneksiUntukPutuskanDanBersihkan(aktif: boolean | undefined, generasi: number | undefined, status: string | undefined, nomor: string | null | undefined, fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `wa_koneksi` t SET `aktif` = IF(?, t.`aktif`, ?), `generasi` = IF(?, t.`generasi`, t.`generasi` + ?), `status` = IF(?, t.`status`, ?), `nomor` = IF(?, t.`nomor`, ?), `qr` = IF(?, t.`qr`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?))", [aktif === undefined, aktif ?? null, generasi === undefined, generasi ?? null, status === undefined, status ?? null, nomor === undefined, nomor ?? null, nomor === undefined, nomor ?? null, generasi === undefined, generasi ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function simpanWaKoneksiUntukBuatRuteWhatsapp(id: number | undefined, fasyankes_id: number | undefined, aktif: boolean | undefined, status: string | undefined, nomor: string | null | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `wa_koneksi` (`id`, `fasyankes_id`, `aktif`, `status`) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE `aktif` = IF(?, `aktif`, ?), `generasi` = IF(?, `generasi`, `generasi` + ?), `status` = IF(?, `status`, ?), `nomor` = IF(?, `nomor`, ?), `qr` = IF(?, `qr`, ?), `id` = LAST_INSERT_ID(`id`)", [(id === undefined ? 1 : id) ?? null, (fasyankes_id === undefined ? null : fasyankes_id) ?? null, (aktif === undefined ? false : aktif) ?? null, (status === undefined ? "terputus" : status) ?? null, aktif === undefined, aktif ?? null, id === undefined, id ?? null, status === undefined, status ?? null, nomor === undefined, nomor ?? null, nomor === undefined, nomor ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function ubahWaKoneksiUntukHubungkan(status: string | undefined, qr: string | null | undefined, id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `wa_koneksi` t SET `status` = IF(?, t.`status`, ?), `qr` = IF(?, t.`qr`, ?) WHERE ((? OR t.`id` <=> ?))", [status === undefined, status ?? null, qr === undefined, qr ?? null, id === undefined, id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function ubahWaKoneksiUntukHubungkan3(status: string | undefined, nomor: string | null | undefined, qr: string | null | undefined, id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `wa_koneksi` t SET `status` = IF(?, t.`status`, ?), `nomor` = IF(?, t.`nomor`, ?), `qr` = IF(?, t.`qr`, ?) WHERE ((? OR t.`id` <=> ?))", [status === undefined, status ?? null, nomor === undefined, nomor ?? null, qr === undefined, qr ?? null, id === undefined, id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function ubahWaKoneksiUntukHubungkan4(aktif: boolean | undefined, status: string | undefined, nomor: string | null | undefined, qr: string | null | undefined, id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `wa_koneksi` t SET `aktif` = IF(?, t.`aktif`, ?), `status` = IF(?, t.`status`, ?), `nomor` = IF(?, t.`nomor`, ?), `qr` = IF(?, t.`qr`, ?) WHERE ((? OR t.`id` <=> ?))", [aktif === undefined, aktif ?? null, status === undefined, status ?? null, nomor === undefined, nomor ?? null, qr === undefined, qr ?? null, id === undefined, id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function ubahWaKoneksiUntukDetak(detak: Date | null | undefined, pemilik_engine: string | null | undefined, sewa_sampai: Date | null | undefined, id: number | undefined, sewa_sampai2: Date | null | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `wa_koneksi` t SET `detak` = IF(?, t.`detak`, ?), `pemilik_engine` = IF(?, t.`pemilik_engine`, ?), `sewa_sampai` = IF(?, t.`sewa_sampai`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((((? OR t.`pemilik_engine` <=> ?))) OR (((? OR t.`sewa_sampai` <=> ?))) OR (((? OR t.`sewa_sampai` < ?))))", [detak === undefined, detak ?? null, pemilik_engine === undefined, pemilik_engine ?? null, sewa_sampai === undefined, sewa_sampai ?? null, id === undefined, id ?? null, pemilik_engine === undefined, pemilik_engine ?? null, sewa_sampai2 === undefined, sewa_sampai2 ?? null, detak === undefined, detak ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function wajibWaKoneksiUntukDetak(id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; aktif: boolean; generasi: number; status: string; nomor: string | null; qr: string | null; detak: Date | null; pemilik_engine: string | null; sewa_sampai: Date | null }>("SELECT t.`id`, t.`fasyankes_id`, t.`aktif`, t.`generasi`, t.`status`, t.`nomor`, t.`qr`, t.`detak`, t.`pemilik_engine`, t.`sewa_sampai` FROM `wa_koneksi` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
  if (!baris[0]) throw new Error('Baris wa_koneksi tidak ditemukan.');
  return baris[0];
}

export async function ubahWaKoneksiUntukDetak2(status: string | undefined, nomor: string | null | undefined, id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `wa_koneksi` t SET `status` = IF(?, t.`status`, ?), `nomor` = IF(?, t.`nomor`, ?), `qr` = IF(?, t.`qr`, ?) WHERE ((? OR t.`id` <=> ?))", [status === undefined, status ?? null, nomor === undefined, nomor ?? null, nomor === undefined, nomor ?? null, id === undefined, id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function ubahWaKoneksiUntukSrcMain(status: string | undefined, qr: string | null | undefined, detak: Date | null | undefined, pemilik_engine: string | null | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `wa_koneksi` t SET `status` = IF(?, t.`status`, ?), `qr` = IF(?, t.`qr`, ?), `detak` = IF(?, t.`detak`, ?), `pemilik_engine` = IF(?, t.`pemilik_engine`, ?), `sewa_sampai` = IF(?, t.`sewa_sampai`, ?) WHERE ((? OR t.`pemilik_engine` <=> ?))", [status === undefined, status ?? null, qr === undefined, qr ?? null, detak === undefined, detak ?? null, qr === undefined, qr ?? null, detak === undefined, detak ?? null, pemilik_engine === undefined, pemilik_engine ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function kunciWaKoneksi(koneksi: Koneksi = pool) {
  return baca<{ id: number }>("SELECT id FROM wa_koneksi WHERE id = 1 FOR UPDATE", [], koneksi);
}
