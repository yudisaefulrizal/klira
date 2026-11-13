import { baca, tulis, pool, type Koneksi } from '../koneksi';
import type * as T from '../tipe';

export async function simpanTagihanUntukTambahItemTagihanDalam(fasyankes_id: number | undefined, kunjungan_id: number | undefined, dibuat_oleh: number | null | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `tagihan` (`fasyankes_id`, `kunjungan_id`, `dibuat_oleh`) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE `id` = `id`, `id` = LAST_INSERT_ID(`id`)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (kunjungan_id === undefined ? null : kunjungan_id) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function simpanTagihanUntukTambahItemTagihanDalamHasil(kunjungan_id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kunjungan_id: number; status_tagihan: T.StatusTagihan; status_pembayaran: T.StatusPembayaran; dibuat_oleh: number | null; dibuat_pada: Date; alasan_tutup_belum_lunas: string | null }>("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`status_tagihan`, t.`status_pembayaran`, t.`dibuat_oleh`, t.`dibuat_pada`, t.`alasan_tutup_belum_lunas` FROM `tagihan` t WHERE ((? OR t.`kunjungan_id` <=> ?)) LIMIT 1", [kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
  if (!baris[0]) throw new Error('Baris tagihan tidak ditemukan.');
  return baris[0];
}

export async function ubahTagihanUntukTambahItemTagihanDalam(status_tagihan: T.StatusTagihan | undefined, id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `tagihan` t SET `status_tagihan` = IF(?, t.`status_tagihan`, ?) WHERE ((? OR t.`id` <=> ?))", [status_tagihan === undefined, (status_tagihan ?? null), id === undefined, id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function tambahTagihanUntukSinkronItemTindakanDalam(fasyankes_id: number | undefined, kunjungan_id: number | undefined, dibuat_oleh: number | null | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `tagihan` (`fasyankes_id`, `kunjungan_id`, `dibuat_oleh`) VALUES (?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (kunjungan_id === undefined ? null : kunjungan_id) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function tambahTagihanUntukSinkronItemTindakanDalamHasil(id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kunjungan_id: number; status_tagihan: T.StatusTagihan; status_pembayaran: T.StatusPembayaran; dibuat_oleh: number | null; dibuat_pada: Date; alasan_tutup_belum_lunas: string | null }>("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`status_tagihan`, t.`status_pembayaran`, t.`dibuat_oleh`, t.`dibuat_pada`, t.`alasan_tutup_belum_lunas` FROM `tagihan` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
  if (!baris[0]) throw new Error('Baris tagihan tidak ditemukan.');
  return baris[0];
}

export async function cariTagihanUntukGantiItemObatResepDalam(kunjungan_id: number | undefined, fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number }>("SELECT t.`id` FROM `tagihan` t WHERE ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) LIMIT 1", [kunjungan_id === undefined, kunjungan_id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}

export async function cariTagihanUntukAmbil(kunjungan_id: number | undefined, fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  type Baris = { t0__id: number; t0__fasyankes_id: number; t0__kunjungan_id: number; t0__status_tagihan: T.StatusTagihan; t0__status_pembayaran: T.StatusPembayaran; t0__dibuat_oleh: number | null; t0__dibuat_pada: Date; t0__alasan_tutup_belum_lunas: string | null; t1__id: number; t1__fasyankes_id: number; t1__tagihan_id: number; t1__jenis: T.JenisTarif; t1__tarif_layanan_id: number | null; t1__kode: string; t1__nama: string; t1__jumlah: number; t1__harga: number | null; t1__order_penunjang_id: number | null; t1__item_resep_id: number | null; t1__manual: boolean; t1__tindakan_sumber: boolean; t1__harga_acuan: number | null; t1__alasan_ubah_harga: string | null; t1__dibuat_oleh: number | null; t1__dibuat_pada: Date };
function petakt1(semua: Baris[]): { id: number; fasyankes_id: number; tagihan_id: number; jenis: T.JenisTarif; tarif_layanan_id: number | null; kode: string; nama: string; jumlah: number; harga: number | null; order_penunjang_id: number | null; item_resep_id: number | null; manual: boolean; tindakan_sumber: boolean; harga_acuan: number | null; alasan_ubah_harga: string | null; dibuat_oleh: number | null; dibuat_pada: Date }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t1__id === null) continue;
    const kunci = String(baris.t1__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ id: baris[0].t1__id, fasyankes_id: baris[0].t1__fasyankes_id, tagihan_id: baris[0].t1__tagihan_id, jenis: baris[0].t1__jenis, tarif_layanan_id: baris[0].t1__tarif_layanan_id, kode: baris[0].t1__kode, nama: baris[0].t1__nama, jumlah: baris[0].t1__jumlah, harga: baris[0].t1__harga, order_penunjang_id: baris[0].t1__order_penunjang_id, item_resep_id: baris[0].t1__item_resep_id, manual: baris[0].t1__manual, tindakan_sumber: baris[0].t1__tindakan_sumber, harga_acuan: baris[0].t1__harga_acuan, alasan_ubah_harga: baris[0].t1__alasan_ubah_harga, dibuat_oleh: baris[0].t1__dibuat_oleh, dibuat_pada: baris[0].t1__dibuat_pada }));
}
function petakt0(semua: Baris[]): { id: number; fasyankes_id: number; kunjungan_id: number; status_tagihan: T.StatusTagihan; status_pembayaran: T.StatusPembayaran; dibuat_oleh: number | null; dibuat_pada: Date; alasan_tutup_belum_lunas: string | null; item: { id: number; fasyankes_id: number; tagihan_id: number; jenis: T.JenisTarif; tarif_layanan_id: number | null; kode: string; nama: string; jumlah: number; harga: number | null; order_penunjang_id: number | null; item_resep_id: number | null; manual: boolean; tindakan_sumber: boolean; harga_acuan: number | null; alasan_ubah_harga: string | null; dibuat_oleh: number | null; dibuat_pada: Date }[] }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t0__id === null) continue;
    const kunci = String(baris.t0__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, kunjungan_id: baris[0].t0__kunjungan_id, status_tagihan: baris[0].t0__status_tagihan, status_pembayaran: baris[0].t0__status_pembayaran, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, alasan_tutup_belum_lunas: baris[0].t0__alasan_tutup_belum_lunas, item: petakt1(baris) }));
}
  const baris = await baca<Baris>("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`kunjungan_id` AS `t0__kunjungan_id`, t0.`status_tagihan` AS `t0__status_tagihan`, t0.`status_pembayaran` AS `t0__status_pembayaran`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t0.`alasan_tutup_belum_lunas` AS `t0__alasan_tutup_belum_lunas`, t1.`id` AS `t1__id`, t1.`fasyankes_id` AS `t1__fasyankes_id`, t1.`tagihan_id` AS `t1__tagihan_id`, t1.`jenis` AS `t1__jenis`, t1.`tarif_layanan_id` AS `t1__tarif_layanan_id`, t1.`kode` AS `t1__kode`, t1.`nama` AS `t1__nama`, t1.`jumlah` AS `t1__jumlah`, t1.`harga` AS `t1__harga`, t1.`order_penunjang_id` AS `t1__order_penunjang_id`, t1.`item_resep_id` AS `t1__item_resep_id`, t1.`manual` AS `t1__manual`, t1.`tindakan_sumber` AS `t1__tindakan_sumber`, t1.`harga_acuan` AS `t1__harga_acuan`, t1.`alasan_ubah_harga` AS `t1__alasan_ubah_harga`, t1.`dibuat_oleh` AS `t1__dibuat_oleh`, t1.`dibuat_pada` AS `t1__dibuat_pada`\nFROM (SELECT t0.* FROM `tagihan` t0 WHERE ((? OR t0.`kunjungan_id` <=> ?)) AND ((? OR t0.`fasyankes_id` <=> ?)) LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `item_tagihan` b1 WHERE TRUE) t1 ON t0.`id` = t1.`tagihan_id`\nORDER BY t1.`id` ASC", [kunjungan_id === undefined, kunjungan_id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  const hasil = petakt0(baris);
  return (hasil[0] ?? null) as (typeof hasil)[number] | null;
}

export async function ambilTagihanUntukTeruskanDariRawatJalan(kunjungan_id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kunjungan_id: number; status_tagihan: T.StatusTagihan; status_pembayaran: T.StatusPembayaran; dibuat_oleh: number | null; dibuat_pada: Date; alasan_tutup_belum_lunas: string | null }>("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`status_tagihan`, t.`status_pembayaran`, t.`dibuat_oleh`, t.`dibuat_pada`, t.`alasan_tutup_belum_lunas` FROM `tagihan` t WHERE ((? OR t.`kunjungan_id` <=> ?)) LIMIT 1", [kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}

export async function cariTagihanUntukBuatResep(kunjungan_id: number | undefined, fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  type Baris = { t0__id: number; t0__fasyankes_id: number; t0__kunjungan_id: number; t0__status_tagihan: T.StatusTagihan; t0__status_pembayaran: T.StatusPembayaran; t0__dibuat_oleh: number | null; t0__dibuat_pada: Date; t0__alasan_tutup_belum_lunas: string | null; t1__id: number; t1__jumlah: number; t1__harga: number | null };
function petakt1(semua: Baris[]): { jumlah: number; harga: number | null }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t1__id === null) continue;
    const kunci = String(baris.t1__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ jumlah: baris[0].t1__jumlah, harga: baris[0].t1__harga }));
}
function petakt0(semua: Baris[]): { id: number; fasyankes_id: number; kunjungan_id: number; status_tagihan: T.StatusTagihan; status_pembayaran: T.StatusPembayaran; dibuat_oleh: number | null; dibuat_pada: Date; alasan_tutup_belum_lunas: string | null; item: { jumlah: number; harga: number | null }[] }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t0__id === null) continue;
    const kunci = String(baris.t0__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, kunjungan_id: baris[0].t0__kunjungan_id, status_tagihan: baris[0].t0__status_tagihan, status_pembayaran: baris[0].t0__status_pembayaran, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, alasan_tutup_belum_lunas: baris[0].t0__alasan_tutup_belum_lunas, item: petakt1(baris) }));
}
  const baris = await baca<Baris>("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`kunjungan_id` AS `t0__kunjungan_id`, t0.`status_tagihan` AS `t0__status_tagihan`, t0.`status_pembayaran` AS `t0__status_pembayaran`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t0.`alasan_tutup_belum_lunas` AS `t0__alasan_tutup_belum_lunas`, t1.`id` AS `t1__id`, t1.`jumlah` AS `t1__jumlah`, t1.`harga` AS `t1__harga`\nFROM (SELECT t0.* FROM `tagihan` t0 WHERE ((? OR t0.`kunjungan_id` <=> ?)) AND ((? OR t0.`fasyankes_id` <=> ?)) LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `item_tagihan` b1 WHERE TRUE) t1 ON t0.`id` = t1.`tagihan_id`\nORDER BY t1.`id` ASC", [kunjungan_id === undefined, kunjungan_id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  const hasil = petakt0(baris);
  return (hasil[0] ?? null) as (typeof hasil)[number] | null;
}

export async function cariTagihanUntukTagihan(kunjungan_id: number | undefined, fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  type Baris = { t0__id: number; t0__fasyankes_id: number; t0__kunjungan_id: number; t0__status_tagihan: T.StatusTagihan; t0__status_pembayaran: T.StatusPembayaran; t0__dibuat_oleh: number | null; t0__dibuat_pada: Date; t0__alasan_tutup_belum_lunas: string | null; t1__id: number; t1__fasyankes_id: number; t1__tagihan_id: number; t1__jenis: T.JenisTarif; t1__tarif_layanan_id: number | null; t1__kode: string; t1__nama: string; t1__jumlah: number; t1__harga: number | null; t1__order_penunjang_id: number | null; t1__item_resep_id: number | null; t1__manual: boolean; t1__tindakan_sumber: boolean; t1__harga_acuan: number | null; t1__alasan_ubah_harga: string | null; t1__dibuat_oleh: number | null; t1__dibuat_pada: Date; t2__id: number; t2__fasyankes_id: number; t2__tagihan_id: number; t2__shift_id: number; t2__metode: T.MetodeBayar; t2__jumlah: number; t2__waktu: Date; t2__kasir_id: number };
function petakt1(semua: Baris[]): { id: number; fasyankes_id: number; tagihan_id: number; jenis: T.JenisTarif; tarif_layanan_id: number | null; kode: string; nama: string; jumlah: number; harga: number | null; order_penunjang_id: number | null; item_resep_id: number | null; manual: boolean; tindakan_sumber: boolean; harga_acuan: number | null; alasan_ubah_harga: string | null; dibuat_oleh: number | null; dibuat_pada: Date }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t1__id === null) continue;
    const kunci = String(baris.t1__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ id: baris[0].t1__id, fasyankes_id: baris[0].t1__fasyankes_id, tagihan_id: baris[0].t1__tagihan_id, jenis: baris[0].t1__jenis, tarif_layanan_id: baris[0].t1__tarif_layanan_id, kode: baris[0].t1__kode, nama: baris[0].t1__nama, jumlah: baris[0].t1__jumlah, harga: baris[0].t1__harga, order_penunjang_id: baris[0].t1__order_penunjang_id, item_resep_id: baris[0].t1__item_resep_id, manual: baris[0].t1__manual, tindakan_sumber: baris[0].t1__tindakan_sumber, harga_acuan: baris[0].t1__harga_acuan, alasan_ubah_harga: baris[0].t1__alasan_ubah_harga, dibuat_oleh: baris[0].t1__dibuat_oleh, dibuat_pada: baris[0].t1__dibuat_pada }));
}
function petakt2(semua: Baris[]): { id: number; fasyankes_id: number; tagihan_id: number; shift_id: number; metode: T.MetodeBayar; jumlah: number; waktu: Date; kasir_id: number }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t2__id === null) continue;
    const kunci = String(baris.t2__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ id: baris[0].t2__id, fasyankes_id: baris[0].t2__fasyankes_id, tagihan_id: baris[0].t2__tagihan_id, shift_id: baris[0].t2__shift_id, metode: baris[0].t2__metode, jumlah: baris[0].t2__jumlah, waktu: baris[0].t2__waktu, kasir_id: baris[0].t2__kasir_id }));
}
function petakt0(semua: Baris[]): { id: number; fasyankes_id: number; kunjungan_id: number; status_tagihan: T.StatusTagihan; status_pembayaran: T.StatusPembayaran; dibuat_oleh: number | null; dibuat_pada: Date; alasan_tutup_belum_lunas: string | null; item: { id: number; fasyankes_id: number; tagihan_id: number; jenis: T.JenisTarif; tarif_layanan_id: number | null; kode: string; nama: string; jumlah: number; harga: number | null; order_penunjang_id: number | null; item_resep_id: number | null; manual: boolean; tindakan_sumber: boolean; harga_acuan: number | null; alasan_ubah_harga: string | null; dibuat_oleh: number | null; dibuat_pada: Date }[]; pembayaran: { id: number; fasyankes_id: number; tagihan_id: number; shift_id: number; metode: T.MetodeBayar; jumlah: number; waktu: Date; kasir_id: number }[] }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t0__id === null) continue;
    const kunci = String(baris.t0__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, kunjungan_id: baris[0].t0__kunjungan_id, status_tagihan: baris[0].t0__status_tagihan, status_pembayaran: baris[0].t0__status_pembayaran, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, alasan_tutup_belum_lunas: baris[0].t0__alasan_tutup_belum_lunas, item: petakt1(baris), pembayaran: petakt2(baris) }));
}
  const baris = await baca<Baris>("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`kunjungan_id` AS `t0__kunjungan_id`, t0.`status_tagihan` AS `t0__status_tagihan`, t0.`status_pembayaran` AS `t0__status_pembayaran`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t0.`alasan_tutup_belum_lunas` AS `t0__alasan_tutup_belum_lunas`, t1.`id` AS `t1__id`, t1.`fasyankes_id` AS `t1__fasyankes_id`, t1.`tagihan_id` AS `t1__tagihan_id`, t1.`jenis` AS `t1__jenis`, t1.`tarif_layanan_id` AS `t1__tarif_layanan_id`, t1.`kode` AS `t1__kode`, t1.`nama` AS `t1__nama`, t1.`jumlah` AS `t1__jumlah`, t1.`harga` AS `t1__harga`, t1.`order_penunjang_id` AS `t1__order_penunjang_id`, t1.`item_resep_id` AS `t1__item_resep_id`, t1.`manual` AS `t1__manual`, t1.`tindakan_sumber` AS `t1__tindakan_sumber`, t1.`harga_acuan` AS `t1__harga_acuan`, t1.`alasan_ubah_harga` AS `t1__alasan_ubah_harga`, t1.`dibuat_oleh` AS `t1__dibuat_oleh`, t1.`dibuat_pada` AS `t1__dibuat_pada`, t2.`id` AS `t2__id`, t2.`fasyankes_id` AS `t2__fasyankes_id`, t2.`tagihan_id` AS `t2__tagihan_id`, t2.`shift_id` AS `t2__shift_id`, t2.`metode` AS `t2__metode`, t2.`jumlah` AS `t2__jumlah`, t2.`waktu` AS `t2__waktu`, t2.`kasir_id` AS `t2__kasir_id`\nFROM (SELECT t0.* FROM `tagihan` t0 WHERE ((? OR t0.`kunjungan_id` <=> ?)) AND ((? OR t0.`fasyankes_id` <=> ?)) LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `item_tagihan` b1 WHERE TRUE) t1 ON t0.`id` = t1.`tagihan_id`\nLEFT JOIN (SELECT b2.* FROM `pembayaran` b2 WHERE TRUE) t2 ON t0.`id` = t2.`tagihan_id`\nORDER BY t1.`id` ASC, t2.`id` ASC", [kunjungan_id === undefined, kunjungan_id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  const hasil = petakt0(baris);
  return (hasil[0] ?? null) as (typeof hasil)[number] | null;
}

export async function wajibTagihanUntukBayar(id: number | undefined, koneksi: Koneksi = pool) {
  type Baris = { t0__id: number; t0__fasyankes_id: number; t0__kunjungan_id: number; t0__status_tagihan: T.StatusTagihan; t0__status_pembayaran: T.StatusPembayaran; t0__dibuat_oleh: number | null; t0__dibuat_pada: Date; t0__alasan_tutup_belum_lunas: string | null; t1__id: number; t1__jumlah: number; t1__harga: number | null; t2__id: number; t2__jumlah: number };
function petakt1(semua: Baris[]): { jumlah: number; harga: number | null }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t1__id === null) continue;
    const kunci = String(baris.t1__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ jumlah: baris[0].t1__jumlah, harga: baris[0].t1__harga }));
}
function petakt2(semua: Baris[]): { jumlah: number }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t2__id === null) continue;
    const kunci = String(baris.t2__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ jumlah: baris[0].t2__jumlah }));
}
function petakt0(semua: Baris[]): { id: number; fasyankes_id: number; kunjungan_id: number; status_tagihan: T.StatusTagihan; status_pembayaran: T.StatusPembayaran; dibuat_oleh: number | null; dibuat_pada: Date; alasan_tutup_belum_lunas: string | null; item: { jumlah: number; harga: number | null }[]; pembayaran: { jumlah: number }[] }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t0__id === null) continue;
    const kunci = String(baris.t0__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, kunjungan_id: baris[0].t0__kunjungan_id, status_tagihan: baris[0].t0__status_tagihan, status_pembayaran: baris[0].t0__status_pembayaran, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, alasan_tutup_belum_lunas: baris[0].t0__alasan_tutup_belum_lunas, item: petakt1(baris), pembayaran: petakt2(baris) }));
}
  const baris = await baca<Baris>("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`kunjungan_id` AS `t0__kunjungan_id`, t0.`status_tagihan` AS `t0__status_tagihan`, t0.`status_pembayaran` AS `t0__status_pembayaran`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t0.`alasan_tutup_belum_lunas` AS `t0__alasan_tutup_belum_lunas`, t1.`id` AS `t1__id`, t1.`jumlah` AS `t1__jumlah`, t1.`harga` AS `t1__harga`, t2.`id` AS `t2__id`, t2.`jumlah` AS `t2__jumlah`\nFROM (SELECT t0.* FROM `tagihan` t0 WHERE ((? OR t0.`id` <=> ?)) LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `item_tagihan` b1 WHERE TRUE) t1 ON t0.`id` = t1.`tagihan_id`\nLEFT JOIN (SELECT b2.* FROM `pembayaran` b2 WHERE TRUE) t2 ON t0.`id` = t2.`tagihan_id`\nORDER BY t1.`id` ASC, t2.`id` ASC", [id === undefined, id ?? null], koneksi);
  const hasil = petakt0(baris);
  if (!hasil[0]) throw new Error('Baris tagihan tidak ditemukan.');
  return hasil[0];
}

export async function ubahTagihanUntukBayar(status_pembayaran: T.StatusPembayaran | undefined, id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `tagihan` t SET `status_pembayaran` = IF(?, t.`status_pembayaran`, ?) WHERE ((? OR t.`id` <=> ?))", [status_pembayaran === undefined, (status_pembayaran ?? null), id === undefined, id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function ubahTagihanUntukHitungUlang(status_tagihan: T.StatusTagihan | undefined, status_pembayaran: T.StatusPembayaran | undefined, id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `tagihan` t SET `status_tagihan` = IF(?, t.`status_tagihan`, ?), `status_pembayaran` = IF(?, t.`status_pembayaran`, ?) WHERE ((? OR t.`id` <=> ?))", [status_tagihan === undefined, (status_tagihan ?? null), status_pembayaran === undefined, (status_pembayaran ?? null), id === undefined, id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function ambilTagihanUntukTutup(kunjungan_id: number | undefined, koneksi: Koneksi = pool) {
  type Baris = { t0__id: number; t0__fasyankes_id: number; t0__kunjungan_id: number; t0__status_tagihan: T.StatusTagihan; t0__status_pembayaran: T.StatusPembayaran; t0__dibuat_oleh: number | null; t0__dibuat_pada: Date; t0__alasan_tutup_belum_lunas: string | null; t1__id: number; t1__jumlah: number; t1__harga: number | null; t2__id: number; t2__jumlah: number };
function petakt1(semua: Baris[]): { jumlah: number; harga: number | null }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t1__id === null) continue;
    const kunci = String(baris.t1__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ jumlah: baris[0].t1__jumlah, harga: baris[0].t1__harga }));
}
function petakt2(semua: Baris[]): { jumlah: number }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t2__id === null) continue;
    const kunci = String(baris.t2__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ jumlah: baris[0].t2__jumlah }));
}
function petakt0(semua: Baris[]): { id: number; fasyankes_id: number; kunjungan_id: number; status_tagihan: T.StatusTagihan; status_pembayaran: T.StatusPembayaran; dibuat_oleh: number | null; dibuat_pada: Date; alasan_tutup_belum_lunas: string | null; item: { jumlah: number; harga: number | null }[]; pembayaran: { jumlah: number }[] }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t0__id === null) continue;
    const kunci = String(baris.t0__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, kunjungan_id: baris[0].t0__kunjungan_id, status_tagihan: baris[0].t0__status_tagihan, status_pembayaran: baris[0].t0__status_pembayaran, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, alasan_tutup_belum_lunas: baris[0].t0__alasan_tutup_belum_lunas, item: petakt1(baris), pembayaran: petakt2(baris) }));
}
  const baris = await baca<Baris>("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`kunjungan_id` AS `t0__kunjungan_id`, t0.`status_tagihan` AS `t0__status_tagihan`, t0.`status_pembayaran` AS `t0__status_pembayaran`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t0.`alasan_tutup_belum_lunas` AS `t0__alasan_tutup_belum_lunas`, t1.`id` AS `t1__id`, t1.`jumlah` AS `t1__jumlah`, t1.`harga` AS `t1__harga`, t2.`id` AS `t2__id`, t2.`jumlah` AS `t2__jumlah`\nFROM (SELECT t0.* FROM `tagihan` t0 WHERE ((? OR t0.`kunjungan_id` <=> ?)) LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `item_tagihan` b1 WHERE TRUE) t1 ON t0.`id` = t1.`tagihan_id`\nLEFT JOIN (SELECT b2.* FROM `pembayaran` b2 WHERE TRUE) t2 ON t0.`id` = t2.`tagihan_id`\nORDER BY t1.`id` ASC, t2.`id` ASC", [kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
  const hasil = petakt0(baris);
  return (hasil[0] ?? null) as (typeof hasil)[number] | null;
}

export async function ubahTagihanUntukTutup(alasan_tutup_belum_lunas: string | null | undefined, id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `tagihan` t SET `alasan_tutup_belum_lunas` = IF(?, t.`alasan_tutup_belum_lunas`, ?) WHERE ((? OR t.`id` <=> ?))", [alasan_tutup_belum_lunas === undefined, alasan_tutup_belum_lunas ?? null, id === undefined, id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function wajibTagihanUntukBuatOrder(id: number | undefined, koneksi: Koneksi = pool) {
  type Baris = { t0__id: number; t0__fasyankes_id: number; t0__kunjungan_id: number; t0__status_tagihan: T.StatusTagihan; t0__status_pembayaran: T.StatusPembayaran; t0__dibuat_oleh: number | null; t0__dibuat_pada: Date; t0__alasan_tutup_belum_lunas: string | null; t1__id: number; t1__harga: number | null; t1__jumlah: number };
function petakt1(semua: Baris[]): { harga: number | null; jumlah: number }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t1__id === null) continue;
    const kunci = String(baris.t1__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ harga: baris[0].t1__harga, jumlah: baris[0].t1__jumlah }));
}
function petakt0(semua: Baris[]): { id: number; fasyankes_id: number; kunjungan_id: number; status_tagihan: T.StatusTagihan; status_pembayaran: T.StatusPembayaran; dibuat_oleh: number | null; dibuat_pada: Date; alasan_tutup_belum_lunas: string | null; item: { harga: number | null; jumlah: number }[] }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t0__id === null) continue;
    const kunci = String(baris.t0__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, kunjungan_id: baris[0].t0__kunjungan_id, status_tagihan: baris[0].t0__status_tagihan, status_pembayaran: baris[0].t0__status_pembayaran, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, alasan_tutup_belum_lunas: baris[0].t0__alasan_tutup_belum_lunas, item: petakt1(baris) }));
}
  const baris = await baca<Baris>("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`kunjungan_id` AS `t0__kunjungan_id`, t0.`status_tagihan` AS `t0__status_tagihan`, t0.`status_pembayaran` AS `t0__status_pembayaran`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t0.`alasan_tutup_belum_lunas` AS `t0__alasan_tutup_belum_lunas`, t1.`id` AS `t1__id`, t1.`harga` AS `t1__harga`, t1.`jumlah` AS `t1__jumlah`\nFROM (SELECT t0.* FROM `tagihan` t0 WHERE ((? OR t0.`id` <=> ?)) LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `item_tagihan` b1 WHERE TRUE) t1 ON t0.`id` = t1.`tagihan_id`\nORDER BY t1.`id` ASC", [id === undefined, id ?? null], koneksi);
  const hasil = petakt0(baris);
  if (!hasil[0]) throw new Error('Baris tagihan tidak ditemukan.');
  return hasil[0];
}

export async function kunciTagihanKunjungan(kunjunganId: number, fasyankesId: number, koneksi: Koneksi = pool) {
  return baca<{ id: number }>("SELECT id FROM tagihan WHERE kunjungan_id = ? AND fasyankes_id = ? FOR UPDATE", [kunjunganId, fasyankesId], koneksi);
}
