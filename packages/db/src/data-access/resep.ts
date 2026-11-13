import { baca, tulis, pool, type Koneksi } from '../koneksi';
import type * as T from '../tipe';

export async function daftarResepUntukPetakan(fasyankes_id: number | undefined, kunjungan_id: readonly (number)[] | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ kunjungan_id: number }>("SELECT DISTINCT t.`kunjungan_id` FROM `resep` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`kunjungan_id` IN (?)))", [fasyankes_id === undefined, fasyankes_id ?? null, kunjungan_id === undefined, (kunjungan_id)?.length ? (kunjungan_id) : [null]], koneksi);
  return baris;
}

export async function daftarResepUntukDataCetak(fasyankes_id: number | undefined, kunjungan_id: number | undefined, koneksi: Koneksi = pool) {
  type Baris = { t0__id: number; t0__fasyankes_id: number; t0__kunjungan_id: number; t0__dpjp_id: number; t0__nomor_resep: string; t0__teks: string; t0__jenis_pembiayaan: T.CaraPembayaran; t0__status: T.StatusResep; t0__waktu_siap: Date | null; t0__dibuat_oleh: number | null; t0__dibuat_pada: Date; t1__id: number; t1__fasyankes_id: number; t1__resep_id: number; t1__master_obat_id: number; t1__aturan_pakai: string; t1__bentuk: string | null; t1__rute: string | null; t1__jumlah: number; t1__dibuat_oleh: number | null; t1__dibuat_pada: Date; t2__id: number; t2__nama_tampil: string; t2__satuan: string };
function petakt2(semua: Baris[]): { nama_tampil: string; satuan: string }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t2__id === null) continue;
    const kunci = String(baris.t2__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ nama_tampil: baris[0].t2__nama_tampil, satuan: baris[0].t2__satuan }));
}
function petakt1(semua: Baris[]): { id: number; fasyankes_id: number; resep_id: number; master_obat_id: number; aturan_pakai: string; bentuk: string | null; rute: string | null; jumlah: number; dibuat_oleh: number | null; dibuat_pada: Date; master: { nama_tampil: string; satuan: string } }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t1__id === null) continue;
    const kunci = String(baris.t1__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ id: baris[0].t1__id, fasyankes_id: baris[0].t1__fasyankes_id, resep_id: baris[0].t1__resep_id, master_obat_id: baris[0].t1__master_obat_id, aturan_pakai: baris[0].t1__aturan_pakai, bentuk: baris[0].t1__bentuk, rute: baris[0].t1__rute, jumlah: baris[0].t1__jumlah, dibuat_oleh: baris[0].t1__dibuat_oleh, dibuat_pada: baris[0].t1__dibuat_pada, master: petakt2(baris)[0]! }));
}
function petakt0(semua: Baris[]): { id: number; fasyankes_id: number; kunjungan_id: number; dpjp_id: number; nomor_resep: string; teks: string; jenis_pembiayaan: T.CaraPembayaran; status: T.StatusResep; waktu_siap: Date | null; dibuat_oleh: number | null; dibuat_pada: Date; item: { id: number; fasyankes_id: number; resep_id: number; master_obat_id: number; aturan_pakai: string; bentuk: string | null; rute: string | null; jumlah: number; dibuat_oleh: number | null; dibuat_pada: Date; master: { nama_tampil: string; satuan: string } }[] }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t0__id === null) continue;
    const kunci = String(baris.t0__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, kunjungan_id: baris[0].t0__kunjungan_id, dpjp_id: baris[0].t0__dpjp_id, nomor_resep: baris[0].t0__nomor_resep, teks: baris[0].t0__teks, jenis_pembiayaan: baris[0].t0__jenis_pembiayaan, status: baris[0].t0__status, waktu_siap: baris[0].t0__waktu_siap, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, item: petakt1(baris) }));
}
  const baris = await baca<Baris>("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`kunjungan_id` AS `t0__kunjungan_id`, t0.`dpjp_id` AS `t0__dpjp_id`, t0.`nomor_resep` AS `t0__nomor_resep`, t0.`teks` AS `t0__teks`, t0.`jenis_pembiayaan` AS `t0__jenis_pembiayaan`, t0.`status` AS `t0__status`, t0.`waktu_siap` AS `t0__waktu_siap`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t1.`id` AS `t1__id`, t1.`fasyankes_id` AS `t1__fasyankes_id`, t1.`resep_id` AS `t1__resep_id`, t1.`master_obat_id` AS `t1__master_obat_id`, t1.`aturan_pakai` AS `t1__aturan_pakai`, t1.`bentuk` AS `t1__bentuk`, t1.`rute` AS `t1__rute`, t1.`jumlah` AS `t1__jumlah`, t1.`dibuat_oleh` AS `t1__dibuat_oleh`, t1.`dibuat_pada` AS `t1__dibuat_pada`, t2.`id` AS `t2__id`, t2.`nama_tampil` AS `t2__nama_tampil`, t2.`satuan` AS `t2__satuan`\nFROM (SELECT t0.* FROM `resep` t0 WHERE ((? OR t0.`fasyankes_id` <=> ?)) AND ((? OR t0.`kunjungan_id` <=> ?)) ORDER BY t0.`id` ASC) t0\nLEFT JOIN (SELECT b1.* FROM `item_resep` b1 WHERE TRUE) t1 ON t0.`id` = t1.`resep_id`\nLEFT JOIN (SELECT b2.* FROM `master_obat` b2 WHERE TRUE) t2 ON t1.`master_obat_id` = t2.`id`\nORDER BY t0.`id` ASC, t1.`id` ASC, t2.`id` ASC", [fasyankes_id === undefined, fasyankes_id ?? null, kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
  const hasil = petakt0(baris);
  return hasil;
}

export async function ubahResepUntukTeruskanDariRawatJalan(kunjungan_id: number | undefined, kunjungan_id2: number | undefined, fasyankes_id: number | undefined, status: T.StatusResep | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `resep` t SET `kunjungan_id` = IF(?, t.`kunjungan_id`, ?) WHERE ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR NOT (t.`status` <=> ?)))", [kunjungan_id === undefined, kunjungan_id ?? null, kunjungan_id2 === undefined, kunjungan_id2 ?? null, fasyankes_id === undefined, fasyankes_id ?? null, status === undefined, status ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function daftarResepUntukSerahTerima(kunjungan_id: number | undefined, fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  type Baris = { t0__id: number; t0__fasyankes_id: number; t0__kunjungan_id: number; t0__dpjp_id: number; t0__nomor_resep: string; t0__teks: string; t0__jenis_pembiayaan: T.CaraPembayaran; t0__status: T.StatusResep; t0__waktu_siap: Date | null; t0__dibuat_oleh: number | null; t0__dibuat_pada: Date; t1__id: number; t1__fasyankes_id: number; t1__resep_id: number; t1__master_obat_id: number; t1__aturan_pakai: string; t1__bentuk: string | null; t1__rute: string | null; t1__jumlah: number; t1__dibuat_oleh: number | null; t1__dibuat_pada: Date; t2__id: number; t2__fasyankes_id: number; t2__kfa_kode: string; t2__kfa_nama: string; t2__bentuk_sediaan: string | null; t2__rute: string | null; t2__nama_tampil: string; t2__satuan: string; t2__harga: number; t2__aktif: boolean; t2__dibuat_oleh: number | null; t2__dibuat_pada: Date; t2__diubah_pada: Date | null };
function petakt2(semua: Baris[]): { id: number; fasyankes_id: number; kfa_kode: string; kfa_nama: string; bentuk_sediaan: string | null; rute: string | null; nama_tampil: string; satuan: string; harga: number; aktif: boolean; dibuat_oleh: number | null; dibuat_pada: Date; diubah_pada: Date | null }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t2__id === null) continue;
    const kunci = String(baris.t2__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ id: baris[0].t2__id, fasyankes_id: baris[0].t2__fasyankes_id, kfa_kode: baris[0].t2__kfa_kode, kfa_nama: baris[0].t2__kfa_nama, bentuk_sediaan: baris[0].t2__bentuk_sediaan, rute: baris[0].t2__rute, nama_tampil: baris[0].t2__nama_tampil, satuan: baris[0].t2__satuan, harga: baris[0].t2__harga, aktif: baris[0].t2__aktif, dibuat_oleh: baris[0].t2__dibuat_oleh, dibuat_pada: baris[0].t2__dibuat_pada, diubah_pada: baris[0].t2__diubah_pada }));
}
function petakt1(semua: Baris[]): { id: number; fasyankes_id: number; resep_id: number; master_obat_id: number; aturan_pakai: string; bentuk: string | null; rute: string | null; jumlah: number; dibuat_oleh: number | null; dibuat_pada: Date; master: { id: number; fasyankes_id: number; kfa_kode: string; kfa_nama: string; bentuk_sediaan: string | null; rute: string | null; nama_tampil: string; satuan: string; harga: number; aktif: boolean; dibuat_oleh: number | null; dibuat_pada: Date; diubah_pada: Date | null } }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t1__id === null) continue;
    const kunci = String(baris.t1__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ id: baris[0].t1__id, fasyankes_id: baris[0].t1__fasyankes_id, resep_id: baris[0].t1__resep_id, master_obat_id: baris[0].t1__master_obat_id, aturan_pakai: baris[0].t1__aturan_pakai, bentuk: baris[0].t1__bentuk, rute: baris[0].t1__rute, jumlah: baris[0].t1__jumlah, dibuat_oleh: baris[0].t1__dibuat_oleh, dibuat_pada: baris[0].t1__dibuat_pada, master: petakt2(baris)[0]! }));
}
function petakt0(semua: Baris[]): { id: number; fasyankes_id: number; kunjungan_id: number; dpjp_id: number; nomor_resep: string; teks: string; jenis_pembiayaan: T.CaraPembayaran; status: T.StatusResep; waktu_siap: Date | null; dibuat_oleh: number | null; dibuat_pada: Date; item: { id: number; fasyankes_id: number; resep_id: number; master_obat_id: number; aturan_pakai: string; bentuk: string | null; rute: string | null; jumlah: number; dibuat_oleh: number | null; dibuat_pada: Date; master: { id: number; fasyankes_id: number; kfa_kode: string; kfa_nama: string; bentuk_sediaan: string | null; rute: string | null; nama_tampil: string; satuan: string; harga: number; aktif: boolean; dibuat_oleh: number | null; dibuat_pada: Date; diubah_pada: Date | null } }[] }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t0__id === null) continue;
    const kunci = String(baris.t0__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, kunjungan_id: baris[0].t0__kunjungan_id, dpjp_id: baris[0].t0__dpjp_id, nomor_resep: baris[0].t0__nomor_resep, teks: baris[0].t0__teks, jenis_pembiayaan: baris[0].t0__jenis_pembiayaan, status: baris[0].t0__status, waktu_siap: baris[0].t0__waktu_siap, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, item: petakt1(baris) }));
}
  const baris = await baca<Baris>("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`kunjungan_id` AS `t0__kunjungan_id`, t0.`dpjp_id` AS `t0__dpjp_id`, t0.`nomor_resep` AS `t0__nomor_resep`, t0.`teks` AS `t0__teks`, t0.`jenis_pembiayaan` AS `t0__jenis_pembiayaan`, t0.`status` AS `t0__status`, t0.`waktu_siap` AS `t0__waktu_siap`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t1.`id` AS `t1__id`, t1.`fasyankes_id` AS `t1__fasyankes_id`, t1.`resep_id` AS `t1__resep_id`, t1.`master_obat_id` AS `t1__master_obat_id`, t1.`aturan_pakai` AS `t1__aturan_pakai`, t1.`bentuk` AS `t1__bentuk`, t1.`rute` AS `t1__rute`, t1.`jumlah` AS `t1__jumlah`, t1.`dibuat_oleh` AS `t1__dibuat_oleh`, t1.`dibuat_pada` AS `t1__dibuat_pada`, t2.`id` AS `t2__id`, t2.`fasyankes_id` AS `t2__fasyankes_id`, t2.`kfa_kode` AS `t2__kfa_kode`, t2.`kfa_nama` AS `t2__kfa_nama`, t2.`bentuk_sediaan` AS `t2__bentuk_sediaan`, t2.`rute` AS `t2__rute`, t2.`nama_tampil` AS `t2__nama_tampil`, t2.`satuan` AS `t2__satuan`, t2.`harga` AS `t2__harga`, t2.`aktif` AS `t2__aktif`, t2.`dibuat_oleh` AS `t2__dibuat_oleh`, t2.`dibuat_pada` AS `t2__dibuat_pada`, t2.`diubah_pada` AS `t2__diubah_pada`\nFROM (SELECT t0.* FROM `resep` t0 WHERE ((? OR t0.`kunjungan_id` <=> ?)) AND ((? OR t0.`fasyankes_id` <=> ?)) ORDER BY t0.`id` ASC) t0\nLEFT JOIN (SELECT b1.* FROM `item_resep` b1 WHERE TRUE) t1 ON t0.`id` = t1.`resep_id`\nLEFT JOIN (SELECT b2.* FROM `master_obat` b2 WHERE TRUE) t2 ON t1.`master_obat_id` = t2.`id`\nORDER BY t0.`id` ASC, t1.`id` ASC, t2.`id` ASC", [kunjungan_id === undefined, kunjungan_id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  const hasil = petakt0(baris);
  return hasil;
}

export async function ubahResepUntukSerahTerima(status: T.StatusResep | undefined, id: readonly (number)[] | undefined, status2: T.StatusResep | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `resep` t SET `status` = IF(?, t.`status`, ?) WHERE ((? OR t.`id` IN (?))) AND ((? OR t.`status` <=> ?))", [status === undefined, (status ?? null), id === undefined, (id)?.length ? (id) : [null], status2 === undefined, status2 ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function daftarResepUntukKeResepDto(id: readonly (number)[] | undefined, fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  type Baris = { t0__id: number; t0__fasyankes_id: number; t0__kunjungan_id: number; t0__dpjp_id: number; t0__nomor_resep: string; t0__teks: string; t0__jenis_pembiayaan: T.CaraPembayaran; t0__status: T.StatusResep; t0__waktu_siap: Date | null; t0__dibuat_oleh: number | null; t0__dibuat_pada: Date; t1__id: number; t1__fasyankes_id: number; t1__resep_id: number; t1__master_obat_id: number; t1__aturan_pakai: string; t1__bentuk: string | null; t1__rute: string | null; t1__jumlah: number; t1__dibuat_oleh: number | null; t1__dibuat_pada: Date; t2__id: number; t2__fasyankes_id: number; t2__kfa_kode: string; t2__kfa_nama: string; t2__bentuk_sediaan: string | null; t2__rute: string | null; t2__nama_tampil: string; t2__satuan: string; t2__harga: number; t2__aktif: boolean; t2__dibuat_oleh: number | null; t2__dibuat_pada: Date; t2__diubah_pada: Date | null; t3__id: number; t3__fasyankes_id: number; t3__resep_id: number; t3__apoteker_id: number; t3__administratif: boolean; t3__farmasetik: boolean; t3__klinis: boolean; t3__catatan: string | null; t3__waktu: Date };
function petakt2(semua: Baris[]): { id: number; fasyankes_id: number; kfa_kode: string; kfa_nama: string; bentuk_sediaan: string | null; rute: string | null; nama_tampil: string; satuan: string; harga: number; aktif: boolean; dibuat_oleh: number | null; dibuat_pada: Date; diubah_pada: Date | null }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t2__id === null) continue;
    const kunci = String(baris.t2__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ id: baris[0].t2__id, fasyankes_id: baris[0].t2__fasyankes_id, kfa_kode: baris[0].t2__kfa_kode, kfa_nama: baris[0].t2__kfa_nama, bentuk_sediaan: baris[0].t2__bentuk_sediaan, rute: baris[0].t2__rute, nama_tampil: baris[0].t2__nama_tampil, satuan: baris[0].t2__satuan, harga: baris[0].t2__harga, aktif: baris[0].t2__aktif, dibuat_oleh: baris[0].t2__dibuat_oleh, dibuat_pada: baris[0].t2__dibuat_pada, diubah_pada: baris[0].t2__diubah_pada }));
}
function petakt1(semua: Baris[]): { id: number; fasyankes_id: number; resep_id: number; master_obat_id: number; aturan_pakai: string; bentuk: string | null; rute: string | null; jumlah: number; dibuat_oleh: number | null; dibuat_pada: Date; master: { id: number; fasyankes_id: number; kfa_kode: string; kfa_nama: string; bentuk_sediaan: string | null; rute: string | null; nama_tampil: string; satuan: string; harga: number; aktif: boolean; dibuat_oleh: number | null; dibuat_pada: Date; diubah_pada: Date | null } }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t1__id === null) continue;
    const kunci = String(baris.t1__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ id: baris[0].t1__id, fasyankes_id: baris[0].t1__fasyankes_id, resep_id: baris[0].t1__resep_id, master_obat_id: baris[0].t1__master_obat_id, aturan_pakai: baris[0].t1__aturan_pakai, bentuk: baris[0].t1__bentuk, rute: baris[0].t1__rute, jumlah: baris[0].t1__jumlah, dibuat_oleh: baris[0].t1__dibuat_oleh, dibuat_pada: baris[0].t1__dibuat_pada, master: petakt2(baris)[0]! }));
}
function petakt3(semua: Baris[]): { id: number; fasyankes_id: number; resep_id: number; apoteker_id: number; administratif: boolean; farmasetik: boolean; klinis: boolean; catatan: string | null; waktu: Date }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t3__id === null) continue;
    const kunci = String(baris.t3__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ id: baris[0].t3__id, fasyankes_id: baris[0].t3__fasyankes_id, resep_id: baris[0].t3__resep_id, apoteker_id: baris[0].t3__apoteker_id, administratif: baris[0].t3__administratif, farmasetik: baris[0].t3__farmasetik, klinis: baris[0].t3__klinis, catatan: baris[0].t3__catatan, waktu: baris[0].t3__waktu }));
}
function petakt0(semua: Baris[]): { id: number; fasyankes_id: number; kunjungan_id: number; dpjp_id: number; nomor_resep: string; teks: string; jenis_pembiayaan: T.CaraPembayaran; status: T.StatusResep; waktu_siap: Date | null; dibuat_oleh: number | null; dibuat_pada: Date; item: { id: number; fasyankes_id: number; resep_id: number; master_obat_id: number; aturan_pakai: string; bentuk: string | null; rute: string | null; jumlah: number; dibuat_oleh: number | null; dibuat_pada: Date; master: { id: number; fasyankes_id: number; kfa_kode: string; kfa_nama: string; bentuk_sediaan: string | null; rute: string | null; nama_tampil: string; satuan: string; harga: number; aktif: boolean; dibuat_oleh: number | null; dibuat_pada: Date; diubah_pada: Date | null } }[]; telaah: { id: number; fasyankes_id: number; resep_id: number; apoteker_id: number; administratif: boolean; farmasetik: boolean; klinis: boolean; catatan: string | null; waktu: Date } | null }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t0__id === null) continue;
    const kunci = String(baris.t0__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, kunjungan_id: baris[0].t0__kunjungan_id, dpjp_id: baris[0].t0__dpjp_id, nomor_resep: baris[0].t0__nomor_resep, teks: baris[0].t0__teks, jenis_pembiayaan: baris[0].t0__jenis_pembiayaan, status: baris[0].t0__status, waktu_siap: baris[0].t0__waktu_siap, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, item: petakt1(baris), telaah: petakt3(baris)[0] ?? null }));
}
  const baris = await baca<Baris>("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`kunjungan_id` AS `t0__kunjungan_id`, t0.`dpjp_id` AS `t0__dpjp_id`, t0.`nomor_resep` AS `t0__nomor_resep`, t0.`teks` AS `t0__teks`, t0.`jenis_pembiayaan` AS `t0__jenis_pembiayaan`, t0.`status` AS `t0__status`, t0.`waktu_siap` AS `t0__waktu_siap`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t1.`id` AS `t1__id`, t1.`fasyankes_id` AS `t1__fasyankes_id`, t1.`resep_id` AS `t1__resep_id`, t1.`master_obat_id` AS `t1__master_obat_id`, t1.`aturan_pakai` AS `t1__aturan_pakai`, t1.`bentuk` AS `t1__bentuk`, t1.`rute` AS `t1__rute`, t1.`jumlah` AS `t1__jumlah`, t1.`dibuat_oleh` AS `t1__dibuat_oleh`, t1.`dibuat_pada` AS `t1__dibuat_pada`, t2.`id` AS `t2__id`, t2.`fasyankes_id` AS `t2__fasyankes_id`, t2.`kfa_kode` AS `t2__kfa_kode`, t2.`kfa_nama` AS `t2__kfa_nama`, t2.`bentuk_sediaan` AS `t2__bentuk_sediaan`, t2.`rute` AS `t2__rute`, t2.`nama_tampil` AS `t2__nama_tampil`, t2.`satuan` AS `t2__satuan`, t2.`harga` AS `t2__harga`, t2.`aktif` AS `t2__aktif`, t2.`dibuat_oleh` AS `t2__dibuat_oleh`, t2.`dibuat_pada` AS `t2__dibuat_pada`, t2.`diubah_pada` AS `t2__diubah_pada`, t3.`id` AS `t3__id`, t3.`fasyankes_id` AS `t3__fasyankes_id`, t3.`resep_id` AS `t3__resep_id`, t3.`apoteker_id` AS `t3__apoteker_id`, t3.`administratif` AS `t3__administratif`, t3.`farmasetik` AS `t3__farmasetik`, t3.`klinis` AS `t3__klinis`, t3.`catatan` AS `t3__catatan`, t3.`waktu` AS `t3__waktu`\nFROM (SELECT t0.* FROM `resep` t0 WHERE ((? OR t0.`id` IN (?))) AND ((? OR t0.`fasyankes_id` <=> ?)) ORDER BY t0.`id` ASC) t0\nLEFT JOIN (SELECT b1.* FROM `item_resep` b1 WHERE TRUE) t1 ON t0.`id` = t1.`resep_id`\nLEFT JOIN (SELECT b2.* FROM `master_obat` b2 WHERE TRUE) t2 ON t1.`master_obat_id` = t2.`id`\nLEFT JOIN (SELECT b3.* FROM `telaah_resep` b3 WHERE TRUE) t3 ON t0.`id` = t3.`resep_id`\nORDER BY t0.`id` ASC, t1.`id` ASC, t2.`id` ASC, t3.`id` ASC", [id === undefined, (id)?.length ? (id) : [null], fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  const hasil = petakt0(baris);
  return hasil;
}

export async function daftarResepUntukResepKunjungan(fasyankes_id: number | undefined, kunjungan_id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number }>("SELECT t.`id` FROM `resep` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`kunjungan_id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null, kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
  return baris;
}

export async function hitungResepUntukBuatResep(fasyankes_id: number | undefined, dibuat_pada: Date | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `resep` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`dibuat_pada` >= ?))", [fasyankes_id === undefined, fasyankes_id ?? null, dibuat_pada === undefined, dibuat_pada ?? null], koneksi);
  return Number(baris.jumlah);
}

export async function tambahResepUntukBuatResep(fasyankes_id: number | undefined, kunjungan_id: number | undefined, dpjp_id: number | undefined, nomor_resep: string | undefined, teks: string | undefined, jenis_pembiayaan: T.CaraPembayaran | undefined, dibuat_oleh: number | null | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `resep` (`fasyankes_id`, `kunjungan_id`, `dpjp_id`, `nomor_resep`, `teks`, `jenis_pembiayaan`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (kunjungan_id === undefined ? null : kunjungan_id) ?? null, (dpjp_id === undefined ? null : dpjp_id) ?? null, (nomor_resep === undefined ? null : nomor_resep) ?? null, (teks === undefined ? null : teks) ?? null, ((jenis_pembiayaan === undefined ? "umum" : jenis_pembiayaan) ?? null), (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function tambahResepUntukBuatResepHasil(id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kunjungan_id: number; dpjp_id: number; nomor_resep: string; teks: string; jenis_pembiayaan: T.CaraPembayaran; status: T.StatusResep; waktu_siap: Date | null; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`dpjp_id`, t.`nomor_resep`, t.`teks`, t.`jenis_pembiayaan`, t.`status`, t.`waktu_siap`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `resep` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
  if (!baris[0]) throw new Error('Baris resep tidak ditemukan.');
  return baris[0];
}

export async function ubahResepUntukCatatTelaah(status: T.StatusResep | undefined, id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `resep` t SET `status` = IF(?, t.`status`, ?) WHERE ((? OR t.`id` <=> ?))", [status === undefined, (status ?? null), id === undefined, id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function cariResepUntukTandaiSiap(id: number | undefined, fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ kunjungan_id: number }>("SELECT t.`kunjungan_id` FROM `resep` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) LIMIT 1", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}

export async function ubahResepUntukTandaiSiap(status: T.StatusResep | undefined, waktu_siap: Date | null | undefined, id: number | undefined, fasyankes_id: number | undefined, status2: T.StatusResep | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `resep` t SET `status` = IF(?, t.`status`, ?), `waktu_siap` = IF(?, t.`waktu_siap`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`status` <=> ?)) AND (EXISTS (SELECT 1 FROM `item_resep` r1 WHERE t.`id` = r1.`resep_id` AND (TRUE)))", [status === undefined, (status ?? null), waktu_siap === undefined, waktu_siap ?? null, id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null, status2 === undefined, status2 ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function hitungResepUntukTandaiSiap(fasyankes_id: number | undefined, kunjungan_id: number | undefined, status: readonly (T.StatusResep)[] | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `resep` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`status` IN (?)))", [fasyankes_id === undefined, fasyankes_id ?? null, kunjungan_id === undefined, kunjungan_id ?? null, status === undefined, (status)?.length ? (status) : [null]], koneksi);
  return Number(baris.jumlah);
}

export async function hitungResepUntukRiwayat(fasyankes_id: number | undefined, status: T.StatusResep | undefined, dibuat_pada: Date | undefined, dibuat_pada2: Date | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `resep` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`status` <=> ?)) AND ((? OR t.`dibuat_pada` >= ?) AND (? OR t.`dibuat_pada` < ?))", [fasyankes_id === undefined, fasyankes_id ?? null, status === undefined, status ?? null, dibuat_pada === undefined, dibuat_pada ?? null, dibuat_pada2 === undefined, dibuat_pada2 ?? null], koneksi);
  return Number(baris.jumlah);
}

export async function daftarResepUntukRiwayat(fasyankes_id: number | undefined, status: T.StatusResep | undefined, dibuat_pada: Date | undefined, dibuat_pada2: Date | undefined, batas: number | undefined, lewati: number | undefined, koneksi: Koneksi = pool) {
  type Baris = { t0__id: number; t0__fasyankes_id: number; t0__kunjungan_id: number; t0__dpjp_id: number; t0__nomor_resep: string; t0__teks: string; t0__jenis_pembiayaan: T.CaraPembayaran; t0__status: T.StatusResep; t0__waktu_siap: Date | null; t0__dibuat_oleh: number | null; t0__dibuat_pada: Date; t1__id: number; t1__fasyankes_id: number; t1__resep_id: number; t1__master_obat_id: number; t1__aturan_pakai: string; t1__bentuk: string | null; t1__rute: string | null; t1__jumlah: number; t1__dibuat_oleh: number | null; t1__dibuat_pada: Date; t2__id: number; t2__nama_tampil: string; t2__satuan: string; t3__id: number; t3__fasyankes_id: number; t3__pasien_id: number; t3__jenis: T.JenisKunjungan; t3__status: T.StatusKunjungan; t3__tahap_layanan: T.TahapLayanan; t3__kunjungan_asal_id: number | null; t3__lokasi_id: number | null; t3__cara_pembayaran: T.CaraPembayaran; t3__nomor_sep: string | null; t3__spri: string | null; t3__keluhan_singkat: string | null; t3__service_type: string | null; t3__encounter_id: string | null; t3__mulai: Date; t3__selesai: Date | null; t3__waktu_tutup: Date | null; t3__dibuat_oleh: number | null; t3__dibuat_pada: Date; t3__diarsipkan_pada: Date | null; t3__retensi_sampai: Date | null; t4__id: number; t4__nama: string; t4__nomor_rm: string };
function petakt2(semua: Baris[]): { nama_tampil: string; satuan: string }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t2__id === null) continue;
    const kunci = String(baris.t2__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ nama_tampil: baris[0].t2__nama_tampil, satuan: baris[0].t2__satuan }));
}
function petakt1(semua: Baris[]): { id: number; fasyankes_id: number; resep_id: number; master_obat_id: number; aturan_pakai: string; bentuk: string | null; rute: string | null; jumlah: number; dibuat_oleh: number | null; dibuat_pada: Date; master: { nama_tampil: string; satuan: string } }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t1__id === null) continue;
    const kunci = String(baris.t1__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ id: baris[0].t1__id, fasyankes_id: baris[0].t1__fasyankes_id, resep_id: baris[0].t1__resep_id, master_obat_id: baris[0].t1__master_obat_id, aturan_pakai: baris[0].t1__aturan_pakai, bentuk: baris[0].t1__bentuk, rute: baris[0].t1__rute, jumlah: baris[0].t1__jumlah, dibuat_oleh: baris[0].t1__dibuat_oleh, dibuat_pada: baris[0].t1__dibuat_pada, master: petakt2(baris)[0]! }));
}
function petakt4(semua: Baris[]): { nama: string; nomor_rm: string }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t4__id === null) continue;
    const kunci = String(baris.t4__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ nama: baris[0].t4__nama, nomor_rm: baris[0].t4__nomor_rm }));
}
function petakt3(semua: Baris[]): { id: number; fasyankes_id: number; pasien_id: number; jenis: T.JenisKunjungan; status: T.StatusKunjungan; tahap_layanan: T.TahapLayanan; kunjungan_asal_id: number | null; lokasi_id: number | null; cara_pembayaran: T.CaraPembayaran; nomor_sep: string | null; spri: string | null; keluhan_singkat: string | null; service_type: string | null; encounter_id: string | null; mulai: Date; selesai: Date | null; waktu_tutup: Date | null; dibuat_oleh: number | null; dibuat_pada: Date; diarsipkan_pada: Date | null; retensi_sampai: Date | null; pasien: { nama: string; nomor_rm: string } }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t3__id === null) continue;
    const kunci = String(baris.t3__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ id: baris[0].t3__id, fasyankes_id: baris[0].t3__fasyankes_id, pasien_id: baris[0].t3__pasien_id, jenis: baris[0].t3__jenis, status: baris[0].t3__status, tahap_layanan: baris[0].t3__tahap_layanan, kunjungan_asal_id: baris[0].t3__kunjungan_asal_id, lokasi_id: baris[0].t3__lokasi_id, cara_pembayaran: baris[0].t3__cara_pembayaran, nomor_sep: baris[0].t3__nomor_sep, spri: baris[0].t3__spri, keluhan_singkat: baris[0].t3__keluhan_singkat, service_type: baris[0].t3__service_type, encounter_id: baris[0].t3__encounter_id, mulai: baris[0].t3__mulai, selesai: baris[0].t3__selesai, waktu_tutup: baris[0].t3__waktu_tutup, dibuat_oleh: baris[0].t3__dibuat_oleh, dibuat_pada: baris[0].t3__dibuat_pada, diarsipkan_pada: baris[0].t3__diarsipkan_pada, retensi_sampai: baris[0].t3__retensi_sampai, pasien: petakt4(baris)[0]! }));
}
function petakt0(semua: Baris[]): { id: number; fasyankes_id: number; kunjungan_id: number; dpjp_id: number; nomor_resep: string; teks: string; jenis_pembiayaan: T.CaraPembayaran; status: T.StatusResep; waktu_siap: Date | null; dibuat_oleh: number | null; dibuat_pada: Date; item: { id: number; fasyankes_id: number; resep_id: number; master_obat_id: number; aturan_pakai: string; bentuk: string | null; rute: string | null; jumlah: number; dibuat_oleh: number | null; dibuat_pada: Date; master: { nama_tampil: string; satuan: string } }[]; kunjungan: { id: number; fasyankes_id: number; pasien_id: number; jenis: T.JenisKunjungan; status: T.StatusKunjungan; tahap_layanan: T.TahapLayanan; kunjungan_asal_id: number | null; lokasi_id: number | null; cara_pembayaran: T.CaraPembayaran; nomor_sep: string | null; spri: string | null; keluhan_singkat: string | null; service_type: string | null; encounter_id: string | null; mulai: Date; selesai: Date | null; waktu_tutup: Date | null; dibuat_oleh: number | null; dibuat_pada: Date; diarsipkan_pada: Date | null; retensi_sampai: Date | null; pasien: { nama: string; nomor_rm: string } } }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t0__id === null) continue;
    const kunci = String(baris.t0__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, kunjungan_id: baris[0].t0__kunjungan_id, dpjp_id: baris[0].t0__dpjp_id, nomor_resep: baris[0].t0__nomor_resep, teks: baris[0].t0__teks, jenis_pembiayaan: baris[0].t0__jenis_pembiayaan, status: baris[0].t0__status, waktu_siap: baris[0].t0__waktu_siap, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, item: petakt1(baris), kunjungan: petakt3(baris)[0]! }));
}
  const baris = await baca<Baris>("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`kunjungan_id` AS `t0__kunjungan_id`, t0.`dpjp_id` AS `t0__dpjp_id`, t0.`nomor_resep` AS `t0__nomor_resep`, t0.`teks` AS `t0__teks`, t0.`jenis_pembiayaan` AS `t0__jenis_pembiayaan`, t0.`status` AS `t0__status`, t0.`waktu_siap` AS `t0__waktu_siap`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t1.`id` AS `t1__id`, t1.`fasyankes_id` AS `t1__fasyankes_id`, t1.`resep_id` AS `t1__resep_id`, t1.`master_obat_id` AS `t1__master_obat_id`, t1.`aturan_pakai` AS `t1__aturan_pakai`, t1.`bentuk` AS `t1__bentuk`, t1.`rute` AS `t1__rute`, t1.`jumlah` AS `t1__jumlah`, t1.`dibuat_oleh` AS `t1__dibuat_oleh`, t1.`dibuat_pada` AS `t1__dibuat_pada`, t2.`id` AS `t2__id`, t2.`nama_tampil` AS `t2__nama_tampil`, t2.`satuan` AS `t2__satuan`, t3.`id` AS `t3__id`, t3.`fasyankes_id` AS `t3__fasyankes_id`, t3.`pasien_id` AS `t3__pasien_id`, t3.`jenis` AS `t3__jenis`, t3.`status` AS `t3__status`, t3.`tahap_layanan` AS `t3__tahap_layanan`, t3.`kunjungan_asal_id` AS `t3__kunjungan_asal_id`, t3.`lokasi_id` AS `t3__lokasi_id`, t3.`cara_pembayaran` AS `t3__cara_pembayaran`, t3.`nomor_sep` AS `t3__nomor_sep`, t3.`spri` AS `t3__spri`, t3.`keluhan_singkat` AS `t3__keluhan_singkat`, t3.`service_type` AS `t3__service_type`, t3.`encounter_id` AS `t3__encounter_id`, t3.`mulai` AS `t3__mulai`, t3.`selesai` AS `t3__selesai`, t3.`waktu_tutup` AS `t3__waktu_tutup`, t3.`dibuat_oleh` AS `t3__dibuat_oleh`, t3.`dibuat_pada` AS `t3__dibuat_pada`, t3.`diarsipkan_pada` AS `t3__diarsipkan_pada`, t3.`retensi_sampai` AS `t3__retensi_sampai`, t4.`id` AS `t4__id`, t4.`nama` AS `t4__nama`, t4.`nomor_rm` AS `t4__nomor_rm`\nFROM (SELECT t0.* FROM `resep` t0 WHERE ((? OR t0.`fasyankes_id` <=> ?)) AND ((? OR t0.`status` <=> ?)) AND ((? OR t0.`dibuat_pada` >= ?) AND (? OR t0.`dibuat_pada` < ?)) ORDER BY t0.`id` DESC LIMIT ? OFFSET ?) t0\nLEFT JOIN (SELECT b1.* FROM `item_resep` b1 WHERE TRUE) t1 ON t0.`id` = t1.`resep_id`\nLEFT JOIN (SELECT b2.* FROM `master_obat` b2 WHERE TRUE) t2 ON t1.`master_obat_id` = t2.`id`\nLEFT JOIN (SELECT b3.* FROM `kunjungan` b3 WHERE TRUE) t3 ON t0.`kunjungan_id` = t3.`id`\nLEFT JOIN (SELECT b4.* FROM `pasien` b4 WHERE TRUE) t4 ON t3.`pasien_id` = t4.`id`\nORDER BY t0.`id` DESC, t1.`id` ASC, t2.`id` ASC, t3.`id` ASC, t4.`id` ASC", [fasyankes_id === undefined, fasyankes_id ?? null, status === undefined, status ?? null, dibuat_pada === undefined, dibuat_pada ?? null, dibuat_pada2 === undefined, dibuat_pada2 ?? null, batas ?? 2147483647, lewati ?? 0], koneksi);
  const hasil = petakt0(baris);
  return hasil;
}

export async function hitungResepUntukTutup(kunjungan_id: number | undefined, fasyankes_id: number | undefined, status: T.StatusResep | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `resep` t WHERE ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR NOT (t.`status` <=> ?)))", [kunjungan_id === undefined, kunjungan_id ?? null, fasyankes_id === undefined, fasyankes_id ?? null, status === undefined, status ?? null], koneksi);
  return Number(baris.jumlah);
}

export async function kunciResepKunjungan(kunjunganId: number, fasyankesId: number, koneksi: Koneksi = pool) {
  return baca<{ id: number }>("SELECT id FROM resep WHERE kunjungan_id = ? AND fasyankes_id = ? FOR UPDATE", [kunjunganId, fasyankesId], koneksi);
}

export async function kunciResep(resepId: number, fasyankesId: number, koneksi: Koneksi = pool) {
  return baca<{ id: number; kunjungan_id: number; status: string }>("SELECT id, kunjungan_id, status FROM resep WHERE id = ? AND fasyankes_id = ? FOR UPDATE", [resepId, fasyankesId], koneksi);
}
