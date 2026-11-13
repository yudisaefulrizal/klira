import { baca, tulis, pool, type Koneksi } from '../koneksi';
import type * as T from '../tipe';

export async function ambilFasyankesUntukPengaturanWebsite(id: number | undefined, koneksi: Koneksi = pool) {
  type Baris = { t0__id: number; t0__nama: string; t1__id: number; t1__aktif: boolean; t1__slug: string; t1__domain: string | null; t1__judul: string; t1__ringkasan: string; t1__tentang: string; t1__alamat: string; t1__whatsapp: string; t1__telepon: string; t1__email: string; t1__jam_operasional: string; t1__warna_utama: string; t1__logo_url: string; t1__hero_url: string; t1__tampilkan_jadwal: boolean; t1__tampilkan_nama_praktisi: boolean };
function petakt1(semua: Baris[]): { aktif: boolean; slug: string; domain: string | null; judul: string; ringkasan: string; tentang: string; alamat: string; whatsapp: string; telepon: string; email: string; jam_operasional: string; warna_utama: string; logo_url: string; hero_url: string; tampilkan_jadwal: boolean; tampilkan_nama_praktisi: boolean }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t1__id === null) continue;
    const kunci = String(baris.t1__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ aktif: baris[0].t1__aktif, slug: baris[0].t1__slug, domain: baris[0].t1__domain, judul: baris[0].t1__judul, ringkasan: baris[0].t1__ringkasan, tentang: baris[0].t1__tentang, alamat: baris[0].t1__alamat, whatsapp: baris[0].t1__whatsapp, telepon: baris[0].t1__telepon, email: baris[0].t1__email, jam_operasional: baris[0].t1__jam_operasional, warna_utama: baris[0].t1__warna_utama, logo_url: baris[0].t1__logo_url, hero_url: baris[0].t1__hero_url, tampilkan_jadwal: baris[0].t1__tampilkan_jadwal, tampilkan_nama_praktisi: baris[0].t1__tampilkan_nama_praktisi }));
}
function petakt0(semua: Baris[]): { nama: string; website_klinik: { aktif: boolean; slug: string; domain: string | null; judul: string; ringkasan: string; tentang: string; alamat: string; whatsapp: string; telepon: string; email: string; jam_operasional: string; warna_utama: string; logo_url: string; hero_url: string; tampilkan_jadwal: boolean; tampilkan_nama_praktisi: boolean } | null }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t0__id === null) continue;
    const kunci = String(baris.t0__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ nama: baris[0].t0__nama, website_klinik: petakt1(baris)[0] ?? null }));
}
  const baris = await baca<Baris>("SELECT t0.`id` AS `t0__id`, t0.`nama` AS `t0__nama`, t1.`id` AS `t1__id`, t1.`aktif` AS `t1__aktif`, t1.`slug` AS `t1__slug`, t1.`domain` AS `t1__domain`, t1.`judul` AS `t1__judul`, t1.`ringkasan` AS `t1__ringkasan`, t1.`tentang` AS `t1__tentang`, t1.`alamat` AS `t1__alamat`, t1.`whatsapp` AS `t1__whatsapp`, t1.`telepon` AS `t1__telepon`, t1.`email` AS `t1__email`, t1.`jam_operasional` AS `t1__jam_operasional`, t1.`warna_utama` AS `t1__warna_utama`, t1.`logo_url` AS `t1__logo_url`, t1.`hero_url` AS `t1__hero_url`, t1.`tampilkan_jadwal` AS `t1__tampilkan_jadwal`, t1.`tampilkan_nama_praktisi` AS `t1__tampilkan_nama_praktisi`\nFROM (SELECT t0.* FROM `fasyankes` t0 WHERE ((? OR t0.`id` <=> ?)) LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `website_klinik` b1 WHERE TRUE) t1 ON t0.`id` = t1.`fasyankes_id`\nORDER BY t1.`id` ASC", [id === undefined, id ?? null], koneksi);
  const hasil = petakt0(baris);
  return (hasil[0] ?? null) as (typeof hasil)[number] | null;
}

export async function ambilFasyankesUntukBuatRuteLayarPanggilan(id: number | undefined, koneksi: Koneksi = pool) {
  type Baris = { t0__id: number; t0__nama: string; t1__id: number; t1__logo_url: string };
function petakt1(semua: Baris[]): { logo_url: string }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t1__id === null) continue;
    const kunci = String(baris.t1__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ logo_url: baris[0].t1__logo_url }));
}
function petakt0(semua: Baris[]): { nama: string; website_klinik: { logo_url: string } | null }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t0__id === null) continue;
    const kunci = String(baris.t0__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ nama: baris[0].t0__nama, website_klinik: petakt1(baris)[0] ?? null }));
}
  const baris = await baca<Baris>("SELECT t0.`id` AS `t0__id`, t0.`nama` AS `t0__nama`, t1.`id` AS `t1__id`, t1.`logo_url` AS `t1__logo_url`\nFROM (SELECT t0.* FROM `fasyankes` t0 WHERE ((? OR t0.`id` <=> ?)) LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `website_klinik` b1 WHERE TRUE) t1 ON t0.`id` = t1.`fasyankes_id`\nORDER BY t1.`id` ASC", [id === undefined, id ?? null], koneksi);
  const hasil = petakt0(baris);
  return (hasil[0] ?? null) as (typeof hasil)[number] | null;
}

export async function ambilFasyankesUntukAmbil(id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; nama: string; jenis: T.JenisFasyankes; bentuk_usaha: string | null; kode_registrasi: string | null; organization_id: string | null; status_akreditasi: string | null; tanggal_akreditasi: Date | null; puskesmas_wilayah: string | null }>("SELECT t.`id`, t.`nama`, t.`jenis`, t.`bentuk_usaha`, t.`kode_registrasi`, t.`organization_id`, t.`status_akreditasi`, t.`tanggal_akreditasi`, t.`puskesmas_wilayah` FROM `fasyankes` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}

export async function hitungFasyankesUntukKodeDipakaiLain(kode_registrasi: string | null | undefined, id: number | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `fasyankes` t WHERE ((? OR t.`kode_registrasi` <=> ?)) AND ((? OR NOT (t.`id` <=> ?)))", [kode_registrasi === undefined, kode_registrasi ?? null, id === undefined, id ?? null], koneksi);
  return Number(baris.jumlah);
}

export async function ubahFasyankesUntukSimpan(nama: string | undefined, jenis: T.JenisFasyankes | undefined, bentuk_usaha: string | null | undefined, kode_registrasi: string | null | undefined, organization_id: string | null | undefined, status_akreditasi: string | null | undefined, tanggal_akreditasi: Date | null | undefined, puskesmas_wilayah: string | null | undefined, id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `fasyankes` t SET `nama` = IF(?, t.`nama`, ?), `jenis` = IF(?, t.`jenis`, ?), `bentuk_usaha` = IF(?, t.`bentuk_usaha`, ?), `kode_registrasi` = IF(?, t.`kode_registrasi`, ?), `organization_id` = IF(?, t.`organization_id`, ?), `status_akreditasi` = IF(?, t.`status_akreditasi`, ?), `tanggal_akreditasi` = IF(?, t.`tanggal_akreditasi`, ?), `puskesmas_wilayah` = IF(?, t.`puskesmas_wilayah`, ?) WHERE ((? OR t.`id` <=> ?))", [nama === undefined, nama ?? null, jenis === undefined, (jenis ?? null), bentuk_usaha === undefined, bentuk_usaha ?? null, kode_registrasi === undefined, kode_registrasi ?? null, organization_id === undefined, organization_id ?? null, status_akreditasi === undefined, status_akreditasi ?? null, tanggal_akreditasi === undefined, tanggal_akreditasi ?? null, puskesmas_wilayah === undefined, puskesmas_wilayah ?? null, id === undefined, id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function ubahFasyankesUntukSimpanHasil(id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; nama: string; jenis: T.JenisFasyankes; bentuk_usaha: string | null; kode_registrasi: string | null; organization_id: string | null; status_akreditasi: string | null; tanggal_akreditasi: Date | null; puskesmas_wilayah: string | null }>("SELECT t.`id`, t.`nama`, t.`jenis`, t.`bentuk_usaha`, t.`kode_registrasi`, t.`organization_id`, t.`status_akreditasi`, t.`tanggal_akreditasi`, t.`puskesmas_wilayah` FROM `fasyankes` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
  if (!baris[0]) throw new Error('Baris fasyankes tidak ditemukan.');
  return baris[0];
}

export async function ambilFasyankesUntukUpgrade(id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number }>("SELECT t.`id` FROM `fasyankes` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}

export async function ambilFasyankesUntukJalankanSeed(kode_registrasi: string | null | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; nama: string; jenis: T.JenisFasyankes; bentuk_usaha: string | null; kode_registrasi: string | null; organization_id: string | null; status_akreditasi: string | null; tanggal_akreditasi: Date | null; puskesmas_wilayah: string | null; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`nama`, t.`jenis`, t.`bentuk_usaha`, t.`kode_registrasi`, t.`organization_id`, t.`status_akreditasi`, t.`tanggal_akreditasi`, t.`puskesmas_wilayah`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `fasyankes` t WHERE ((? OR t.`kode_registrasi` <=> ?)) LIMIT 1", [kode_registrasi === undefined, kode_registrasi ?? null], koneksi);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}

export async function tambahFasyankesUntukJalankanSeed(fasyankes_id: number | undefined, nama: string | undefined, jenis: T.JenisFasyankes | undefined, kode_registrasi: string | null | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `fasyankes` (`fasyankes_id`, `nama`, `jenis`, `kode_registrasi`) VALUES (?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (nama === undefined ? null : nama) ?? null, ((jenis === undefined ? null : jenis) ?? null), (kode_registrasi === undefined ? null : kode_registrasi) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function tambahFasyankesUntukJalankanSeedHasil(id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; nama: string; jenis: T.JenisFasyankes; bentuk_usaha: string | null; kode_registrasi: string | null; organization_id: string | null; status_akreditasi: string | null; tanggal_akreditasi: Date | null; puskesmas_wilayah: string | null; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`nama`, t.`jenis`, t.`bentuk_usaha`, t.`kode_registrasi`, t.`organization_id`, t.`status_akreditasi`, t.`tanggal_akreditasi`, t.`puskesmas_wilayah`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `fasyankes` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
  if (!baris[0]) throw new Error('Baris fasyankes tidak ditemukan.');
  return baris[0];
}

export async function ubahFasyankesUntukJalankanSeed(fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `fasyankes` t SET `fasyankes_id` = IF(?, t.`fasyankes_id`, ?) WHERE ((? OR t.`id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function kunciFasyankes(fasyankesId: number, koneksi: Koneksi = pool) {
  return baca<{ id: number }>("SELECT id FROM fasyankes WHERE id = ? FOR UPDATE", [fasyankesId], koneksi);
}
