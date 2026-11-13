import { baca, tulis, pool, type Koneksi } from '../koneksi';
import type * as T from '../tipe';

export async function hitungTarifLayananUntukDaftar(fasyankes_id: number | undefined, aktif: boolean | undefined, kode: string | undefined, kode_icd9cm: string | null | undefined, pakai: unknown, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `tarif_layanan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`aktif` <=> ?)) AND ((? OR ((((? OR t.`kode` LIKE ? ESCAPE '!'))) OR (((? OR t.`nama` LIKE ? ESCAPE '!'))) OR (((? OR t.`kode_icd9cm` LIKE ? ESCAPE '!'))))))", [fasyankes_id === undefined, fasyankes_id ?? null, aktif === undefined, aktif ?? null, !pakai, kode === undefined, '%' + String(kode ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', kode === undefined, '%' + String(kode ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', kode_icd9cm === undefined, String(kode_icd9cm ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%'], koneksi);
  return Number(baris.jumlah);
}

export async function daftarTarifLayananUntukDaftar(fasyankes_id: number | undefined, aktif: boolean | undefined, kode: string | undefined, kode_icd9cm: string | null | undefined, pakai: unknown, batas: number | undefined, lewati: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kode: string; nama: string; jenis: T.JenisTarif; harga_umum: number | null; harga_jkn: number | null; kode_icd9cm: string | null; aktif: boolean; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`kode`, t.`nama`, t.`jenis`, t.`harga_umum`, t.`harga_jkn`, t.`kode_icd9cm`, t.`aktif`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `tarif_layanan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`aktif` <=> ?)) AND ((? OR ((((? OR t.`kode` LIKE ? ESCAPE '!'))) OR (((? OR t.`nama` LIKE ? ESCAPE '!'))) OR (((? OR t.`kode_icd9cm` LIKE ? ESCAPE '!')))))) ORDER BY t.`jenis` ASC, t.`kode` ASC LIMIT ? OFFSET ?", [fasyankes_id === undefined, fasyankes_id ?? null, aktif === undefined, aktif ?? null, !pakai, kode === undefined, '%' + String(kode ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', kode === undefined, '%' + String(kode ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', kode_icd9cm === undefined, String(kode_icd9cm ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', batas ?? 2147483647, lewati ?? 0], koneksi);
  return baris;
}

export async function cariTarifLayananUntukAmbil(id: number | undefined, fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kode: string; nama: string; jenis: T.JenisTarif; harga_umum: number | null; harga_jkn: number | null; kode_icd9cm: string | null; aktif: boolean; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`kode`, t.`nama`, t.`jenis`, t.`harga_umum`, t.`harga_jkn`, t.`kode_icd9cm`, t.`aktif`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `tarif_layanan` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) LIMIT 1", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}

export async function tambahTarifLayananUntukBuat(fasyankes_id: number | undefined, kode: string | undefined, nama: string | undefined, jenis: T.JenisTarif | undefined, harga_umum: number | null | undefined, harga_jkn: number | null | undefined, kode_icd9cm: string | null | undefined, dibuat_oleh: number | null | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `tarif_layanan` (`fasyankes_id`, `kode`, `nama`, `jenis`, `harga_umum`, `harga_jkn`, `kode_icd9cm`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (kode === undefined ? null : kode) ?? null, (nama === undefined ? null : nama) ?? null, ((jenis === undefined ? null : jenis) ?? null), (harga_umum === undefined ? null : harga_umum) ?? null, (harga_jkn === undefined ? null : harga_jkn) ?? null, (kode_icd9cm === undefined ? null : kode_icd9cm) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function tambahTarifLayananUntukBuatHasil(id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kode: string; nama: string; jenis: T.JenisTarif; harga_umum: number | null; harga_jkn: number | null; kode_icd9cm: string | null; aktif: boolean; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`kode`, t.`nama`, t.`jenis`, t.`harga_umum`, t.`harga_jkn`, t.`kode_icd9cm`, t.`aktif`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `tarif_layanan` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
  if (!baris[0]) throw new Error('Baris tarif_layanan tidak ditemukan.');
  return baris[0];
}

export async function ubahTarifLayananUntukUbah(kode: string | undefined, nama: string | undefined, jenis: T.JenisTarif | undefined, harga_umum: number | null | undefined, harga_jkn: number | null | undefined, kode_icd9cm: string | null | undefined, id: number | undefined, fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `tarif_layanan` t SET `kode` = IF(?, t.`kode`, ?), `nama` = IF(?, t.`nama`, ?), `jenis` = IF(?, t.`jenis`, ?), `harga_umum` = IF(?, t.`harga_umum`, ?), `harga_jkn` = IF(?, t.`harga_jkn`, ?), `kode_icd9cm` = IF(?, t.`kode_icd9cm`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?))", [kode === undefined, kode ?? null, nama === undefined, nama ?? null, jenis === undefined, (jenis ?? null), harga_umum === undefined, harga_umum ?? null, harga_jkn === undefined, harga_jkn ?? null, kode_icd9cm === undefined, kode_icd9cm ?? null, id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function ubahTarifLayananUntukSetAktif(aktif: boolean | undefined, id: number | undefined, fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `tarif_layanan` t SET `aktif` = IF(?, t.`aktif`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?))", [aktif === undefined, aktif ?? null, id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function hitungTarifLayananUntukTarifKodeAda(fasyankes_id: number | undefined, kode: string | undefined, id: number | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `tarif_layanan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`kode` <=> ?)) AND ((? OR NOT (t.`id` <=> ?)))", [fasyankes_id === undefined, fasyankes_id ?? null, kode === undefined, kode ?? null, id === undefined, id ?? null], koneksi);
  return Number(baris.jumlah);
}

export async function daftarTarifLayananUntukKodeTarifTindakan(fasyankes_id: number | undefined, kode: string | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ kode: string }>("SELECT t.`kode` FROM `tarif_layanan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`kode` LIKE ? ESCAPE '!'))", [fasyankes_id === undefined, fasyankes_id ?? null, kode === undefined, String(kode ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%'], koneksi);
  return baris;
}

export async function hitungTarifLayananUntukHitungKesiapan(fasyankes_id: number | undefined, jenis: T.JenisTarif | undefined, aktif: boolean | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `tarif_layanan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`jenis` <=> ?)) AND ((? OR t.`aktif` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null, jenis === undefined, jenis ?? null, aktif === undefined, aktif ?? null], koneksi);
  return Number(baris.jumlah);
}

export async function daftarTarifLayananUntukSinkronItemTindakanDalam(id: readonly (number)[] | undefined, fasyankes_id: number | undefined, jenis: T.JenisTarif | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kode: string; nama: string; jenis: T.JenisTarif; harga_umum: number | null; harga_jkn: number | null; kode_icd9cm: string | null; aktif: boolean; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`kode`, t.`nama`, t.`jenis`, t.`harga_umum`, t.`harga_jkn`, t.`kode_icd9cm`, t.`aktif`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `tarif_layanan` t WHERE ((? OR t.`id` IN (?))) AND ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`jenis` <=> ?))", [id === undefined, (id)?.length ? (id) : [null], fasyankes_id === undefined, fasyankes_id ?? null, jenis === undefined, jenis ?? null], koneksi);
  return baris;
}

export async function daftarTarifLayananUntukTarifTindakanSah(id: readonly (number)[] | undefined, fasyankes_id: number | undefined, jenis: T.JenisTarif | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; kode_icd9cm: string | null }>("SELECT t.`id`, t.`kode_icd9cm` FROM `tarif_layanan` t WHERE ((? OR t.`id` IN (?))) AND ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`jenis` <=> ?))", [id === undefined, (id)?.length ? (id) : [null], fasyankes_id === undefined, fasyankes_id ?? null, jenis === undefined, jenis ?? null], koneksi);
  return baris;
}

export async function daftarTarifLayananUntukTindakanKlinik(fasyankes_id: number | undefined, jenis: T.JenisTarif | undefined, aktif: boolean | undefined, nama: string | undefined, kode_icd9cm: string | null | undefined, pakai: unknown, batas: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kode: string; nama: string; jenis: T.JenisTarif; harga_umum: number | null; harga_jkn: number | null; kode_icd9cm: string | null; aktif: boolean; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`kode`, t.`nama`, t.`jenis`, t.`harga_umum`, t.`harga_jkn`, t.`kode_icd9cm`, t.`aktif`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `tarif_layanan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`jenis` <=> ?)) AND ((? OR t.`aktif` <=> ?)) AND ((? OR ((((? OR t.`nama` LIKE ? ESCAPE '!'))) OR (((? OR t.`kode` LIKE ? ESCAPE '!'))) OR (((? OR t.`kode_icd9cm` LIKE ? ESCAPE '!')))))) ORDER BY t.`nama` ASC, t.`id` ASC LIMIT ? OFFSET ?", [fasyankes_id === undefined, fasyankes_id ?? null, jenis === undefined, jenis ?? null, aktif === undefined, aktif ?? null, !pakai, nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', kode_icd9cm === undefined, String(kode_icd9cm ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', batas ?? 2147483647, 0], koneksi);
  return baris;
}

export async function hitungTarifLayananUntukTarifKamarSah(id: number | undefined, fasyankes_id: number | undefined, jenis: T.JenisTarif | undefined, aktif: boolean | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `tarif_layanan` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`jenis` <=> ?)) AND ((? OR t.`aktif` <=> ?))", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null, jenis === undefined, jenis ?? null, aktif === undefined, aktif ?? null], koneksi);
  return Number(baris.jumlah);
}

export async function daftarTarifLayananUntukOpsi(fasyankes_id: number | undefined, jenis: T.JenisTarif | undefined, aktif: boolean | undefined, batas: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kode: string; nama: string; jenis: T.JenisTarif; harga_umum: number | null; harga_jkn: number | null; kode_icd9cm: string | null; aktif: boolean; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`kode`, t.`nama`, t.`jenis`, t.`harga_umum`, t.`harga_jkn`, t.`kode_icd9cm`, t.`aktif`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `tarif_layanan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`jenis` <=> ?)) AND ((? OR t.`aktif` <=> ?)) ORDER BY t.`nama` ASC LIMIT ? OFFSET ?", [fasyankes_id === undefined, fasyankes_id ?? null, jenis === undefined, jenis ?? null, aktif === undefined, aktif ?? null, batas ?? 2147483647, 0], koneksi);
  return baris;
}

export async function daftarTarifLayananUntukDetail(id: readonly (number)[] | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; nama: string }>("SELECT t.`id`, t.`nama` FROM `tarif_layanan` t WHERE ((? OR t.`id` IN (?)))", [id === undefined, (id)?.length ? (id) : [null]], koneksi);
  return baris;
}

export async function daftarTarifLayananUntukPulangkan(id: readonly (number)[] | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kode: string; nama: string; jenis: T.JenisTarif; harga_umum: number | null; harga_jkn: number | null; kode_icd9cm: string | null; aktif: boolean; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`kode`, t.`nama`, t.`jenis`, t.`harga_umum`, t.`harga_jkn`, t.`kode_icd9cm`, t.`aktif`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `tarif_layanan` t WHERE ((? OR t.`id` IN (?)))", [id === undefined, (id)?.length ? (id) : [null]], koneksi);
  return baris;
}

export async function daftarTarifLayananUntukTarifAktif(fasyankes_id: number | undefined, aktif: boolean | undefined, jenis: T.JenisTarif | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kode: string; nama: string; jenis: T.JenisTarif; harga_umum: number | null; harga_jkn: number | null; kode_icd9cm: string | null; aktif: boolean; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`kode`, t.`nama`, t.`jenis`, t.`harga_umum`, t.`harga_jkn`, t.`kode_icd9cm`, t.`aktif`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `tarif_layanan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`aktif` <=> ?)) AND ((? OR NOT (t.`jenis` <=> ?))) ORDER BY t.`jenis` ASC, t.`nama` ASC", [fasyankes_id === undefined, fasyankes_id ?? null, aktif === undefined, aktif ?? null, jenis === undefined, jenis ?? null], koneksi);
  return baris;
}

export async function cariTarifLayananUntukTambahItem(id: number | undefined, fasyankes_id: number | undefined, aktif: boolean | undefined, jenis: T.JenisTarif | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kode: string; nama: string; jenis: T.JenisTarif; harga_umum: number | null; harga_jkn: number | null; kode_icd9cm: string | null; aktif: boolean; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`kode`, t.`nama`, t.`jenis`, t.`harga_umum`, t.`harga_jkn`, t.`kode_icd9cm`, t.`aktif`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `tarif_layanan` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`aktif` <=> ?)) AND ((? OR NOT (t.`jenis` <=> ?))) LIMIT 1", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null, aktif === undefined, aktif ?? null, jenis === undefined, jenis ?? null], koneksi);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}

export async function daftarTarifLayananUntukPetakanMaster(id: readonly (number)[] | undefined, fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kode: string; nama: string; jenis: T.JenisTarif; harga_umum: number | null; harga_jkn: number | null; kode_icd9cm: string | null; aktif: boolean; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`kode`, t.`nama`, t.`jenis`, t.`harga_umum`, t.`harga_jkn`, t.`kode_icd9cm`, t.`aktif`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `tarif_layanan` t WHERE ((? OR t.`id` IN (?))) AND ((? OR t.`fasyankes_id` <=> ?))", [id === undefined, (id)?.length ? (id) : [null], fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  return baris;
}

export async function daftarTarifLayananUntukBuatOrder(fasyankes_id: number | undefined, aktif: boolean | undefined, jenis: T.JenisTarif | undefined, id: readonly (number)[] | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kode: string; nama: string; jenis: T.JenisTarif; harga_umum: number | null; harga_jkn: number | null; kode_icd9cm: string | null; aktif: boolean; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`kode`, t.`nama`, t.`jenis`, t.`harga_umum`, t.`harga_jkn`, t.`kode_icd9cm`, t.`aktif`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `tarif_layanan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`aktif` <=> ?)) AND ((? OR t.`jenis` <=> ?)) AND ((? OR t.`id` IN (?)))", [fasyankes_id === undefined, fasyankes_id ?? null, aktif === undefined, aktif ?? null, jenis === undefined, jenis ?? null, id === undefined, (id)?.length ? (id) : [null]], koneksi);
  return baris;
}

export async function ubahTarifLayananUntukPastikanTarif(harga_umum: number | null | undefined, harga_jkn: number | null | undefined, aktif: boolean | undefined, id: number | undefined, fasyankes_id: number | undefined, jenis: T.JenisTarif | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `tarif_layanan` t SET `harga_umum` = IF(?, t.`harga_umum`, ?), `harga_jkn` = IF(?, t.`harga_jkn`, ?), `aktif` = IF(?, t.`aktif`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`jenis` <=> ?))", [harga_umum === undefined, harga_umum ?? null, harga_jkn === undefined, harga_jkn ?? null, aktif === undefined, aktif ?? null, id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null, jenis === undefined, jenis ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function ambilTarifLayananUntukPastikanTarif(fasyankes_id: number | undefined, kode: string | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kode: string; nama: string; jenis: T.JenisTarif; harga_umum: number | null; harga_jkn: number | null; kode_icd9cm: string | null; aktif: boolean; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`kode`, t.`nama`, t.`jenis`, t.`harga_umum`, t.`harga_jkn`, t.`kode_icd9cm`, t.`aktif`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `tarif_layanan` t WHERE (((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`kode` <=> ?))) LIMIT 1", [fasyankes_id === undefined, fasyankes_id ?? null, kode === undefined, kode ?? null], koneksi);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}

export async function ubahTarifLayananUntukPastikanTarif2(harga_umum: number | null | undefined, harga_jkn: number | null | undefined, aktif: boolean | undefined, id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `tarif_layanan` t SET `harga_umum` = IF(?, t.`harga_umum`, ?), `harga_jkn` = IF(?, t.`harga_jkn`, ?), `aktif` = IF(?, t.`aktif`, ?) WHERE ((? OR t.`id` <=> ?))", [harga_umum === undefined, harga_umum ?? null, harga_jkn === undefined, harga_jkn ?? null, aktif === undefined, aktif ?? null, id === undefined, id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function tambahTarifLayananUntukPastikanTarif(fasyankes_id: number | undefined, kode: string | undefined, nama: string | undefined, jenis: T.JenisTarif | undefined, harga_umum: number | null | undefined, harga_jkn: number | null | undefined, dibuat_oleh: number | null | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `tarif_layanan` (`fasyankes_id`, `kode`, `nama`, `jenis`, `harga_umum`, `harga_jkn`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (kode === undefined ? null : kode) ?? null, (nama === undefined ? null : nama) ?? null, ((jenis === undefined ? null : jenis) ?? null), (harga_umum === undefined ? null : harga_umum) ?? null, (harga_jkn === undefined ? null : harga_jkn) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

