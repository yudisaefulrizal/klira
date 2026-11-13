import { baca, tulis, pool, type Koneksi } from '../koneksi';
import type * as T from '../tipe';

export async function daftarAntreanUntukBuatRuteLayarPanggilan(fasyankes_id: number | undefined, tanggal: Date | undefined, lokasi_id: readonly (number)[] | undefined, status: readonly (T.StatusAntrean)[] | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; lokasi_id: number; nomor: number; status: T.StatusAntrean; waktu_panggil: Date | null }>("SELECT t.`id`, t.`lokasi_id`, t.`nomor`, t.`status`, t.`waktu_panggil` FROM `antrean` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`tanggal` <=> ?)) AND ((? OR t.`lokasi_id` IN (?))) AND ((? OR t.`status` IN (?))) ORDER BY t.`waktu_panggil` DESC, t.`id` DESC", [fasyankes_id === undefined, fasyankes_id ?? null, tanggal === undefined, tanggal ?? null, lokasi_id === undefined, (lokasi_id)?.length ? (lokasi_id) : [null], status === undefined, (status)?.length ? (status) : [null]], koneksi);
  return baris;
}

export async function ubahAntreanUntukMulaiAntreanDalam(waktu_mulai: Date | null | undefined, fasyankes_id: number | undefined, kunjungan_id: number | undefined, status: readonly (T.StatusAntrean)[] | undefined, waktu_mulai2: Date | null | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `antrean` t SET `waktu_mulai` = IF(?, t.`waktu_mulai`, ?) WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`status` IN (?))) AND ((? OR t.`waktu_mulai` <=> ?))", [waktu_mulai === undefined, waktu_mulai ?? null, fasyankes_id === undefined, fasyankes_id ?? null, kunjungan_id === undefined, kunjungan_id ?? null, status === undefined, (status)?.length ? (status) : [null], waktu_mulai2 === undefined, waktu_mulai2 ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function ubahAntreanUntukMulaiAntreanDalam2(status: T.StatusAntrean | undefined, fasyankes_id: number | undefined, kunjungan_id: number | undefined, status2: readonly (T.StatusAntrean)[] | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `antrean` t SET `status` = IF(?, t.`status`, ?) WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`status` IN (?)))", [status === undefined, (status ?? null), fasyankes_id === undefined, fasyankes_id ?? null, kunjungan_id === undefined, kunjungan_id ?? null, status2 === undefined, (status2)?.length ? (status2) : [null]], koneksi);
  return { count: hasil.affectedRows };
}

export async function ubahAntreanUntukSelesaiAntreanDalam(waktu_selesai: Date | null | undefined, fasyankes_id: number | undefined, kunjungan_id: number | undefined, status: readonly (T.StatusAntrean)[] | undefined, waktu_selesai2: Date | null | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `antrean` t SET `waktu_selesai` = IF(?, t.`waktu_selesai`, ?) WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`status` IN (?))) AND ((? OR t.`waktu_selesai` <=> ?))", [waktu_selesai === undefined, waktu_selesai ?? null, fasyankes_id === undefined, fasyankes_id ?? null, kunjungan_id === undefined, kunjungan_id ?? null, status === undefined, (status)?.length ? (status) : [null], waktu_selesai2 === undefined, waktu_selesai2 ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function ringkasanAntreanUntukDaftarkan(fasyankes_id: number | undefined, lokasi_id: number | undefined, tanggal: Date | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ _max_nomor: number | null }>("SELECT MAX(t.`nomor`) AS `_max_nomor` FROM `antrean` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`lokasi_id` <=> ?)) AND ((? OR t.`tanggal` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null, lokasi_id === undefined, lokasi_id ?? null, tanggal === undefined, tanggal ?? null], koneksi);
  const hasil = baris.map(b => ({ _max: { nomor: b._max_nomor } }));
  return hasil[0];
}

export async function tambahAntreanUntukDaftarkan(fasyankes_id: number | undefined, kunjungan_id: number | undefined, lokasi_id: number | undefined, tanggal: Date | undefined, nomor: number | undefined, status: T.StatusAntrean | undefined, waktu_daftar: Date | undefined, dibuat_oleh: number | null | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `antrean` (`fasyankes_id`, `kunjungan_id`, `lokasi_id`, `tanggal`, `nomor`, `status`, `waktu_daftar`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (kunjungan_id === undefined ? null : kunjungan_id) ?? null, (lokasi_id === undefined ? null : lokasi_id) ?? null, (tanggal === undefined ? null : tanggal) ?? null, (nomor === undefined ? null : nomor) ?? null, ((status === undefined ? "menunggu" : status) ?? null), (waktu_daftar === undefined ? new Date() : waktu_daftar) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function cariAntreanUntukStatusAntrean(id: number | undefined, fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ status: T.StatusAntrean }>("SELECT t.`status` FROM `antrean` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) LIMIT 1", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}

export async function ubahAntreanUntukUbahAntrean(status: T.StatusAntrean | undefined, waktu_panggil: Date | null | undefined, waktu_mulai: Date | null | undefined, waktu_selesai: Date | null | undefined, id: number | undefined, fasyankes_id: number | undefined, status2: readonly (T.StatusAntrean)[] | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `antrean` t SET `status` = IF(?, t.`status`, ?), `waktu_panggil` = IF(?, t.`waktu_panggil`, ?), `waktu_mulai` = IF(?, t.`waktu_mulai`, ?), `waktu_selesai` = IF(?, t.`waktu_selesai`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`status` IN (?)))", [status === undefined, (status ?? null), waktu_panggil === undefined, waktu_panggil ?? null, waktu_mulai === undefined, waktu_mulai ?? null, waktu_selesai === undefined, waktu_selesai ?? null, id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null, status2 === undefined, (status2)?.length ? (status2) : [null]], koneksi);
  return { count: hasil.affectedRows };
}

export async function wajibAntreanUntukUbahAntrean(id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ lokasi_id: number; nomor: number; tanggal: Date }>("SELECT t.`lokasi_id`, t.`nomor`, t.`tanggal` FROM `antrean` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
  if (!baris[0]) throw new Error('Baris antrean tidak ditemukan.');
  return baris[0];
}

export async function wajibAntreanUntukUbahAntrean2(id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ kunjungan_id: number }>("SELECT t.`kunjungan_id` FROM `antrean` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
  if (!baris[0]) throw new Error('Baris antrean tidak ditemukan.');
  return baris[0];
}

export async function hitungAntreanUntukDaftarAntrean(fasyankes_id: number | undefined, tanggal: Date | undefined, lokasi_id: number | undefined, status: T.StatusAntrean | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `antrean` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`tanggal` <=> ?)) AND ((? OR t.`lokasi_id` <=> ?)) AND ((? OR t.`status` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null, tanggal === undefined, tanggal ?? null, lokasi_id === undefined, lokasi_id ?? null, status === undefined, status ?? null], koneksi);
  return Number(baris.jumlah);
}

export async function daftarAntreanUntukPetakanAntrean(id: number | undefined, fasyankes_id: number | undefined, tanggal: Date | undefined, lokasi_id: number | undefined, status: T.StatusAntrean | undefined, fasyankes_id2: number | undefined, batas: number | undefined, lewati: number | undefined, koneksi: Koneksi = pool) {
  type Baris = { t0__id: number; t0__fasyankes_id: number; t0__kunjungan_id: number; t0__lokasi_id: number; t0__tanggal: Date; t0__nomor: number; t0__status: T.StatusAntrean; t0__waktu_daftar: Date; t0__waktu_panggil: Date | null; t0__waktu_mulai: Date | null; t0__waktu_selesai: Date | null; t0__dibuat_oleh: number | null; t0__dibuat_pada: Date; t1__id: number; t1__pasien_id: number };
function petakt1(semua: Baris[]): { pasien_id: number }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t1__id === null) continue;
    const kunci = String(baris.t1__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ pasien_id: baris[0].t1__pasien_id }));
}
function petakt0(semua: Baris[]): { id: number; fasyankes_id: number; kunjungan_id: number; lokasi_id: number; tanggal: Date; nomor: number; status: T.StatusAntrean; waktu_daftar: Date; waktu_panggil: Date | null; waktu_mulai: Date | null; waktu_selesai: Date | null; dibuat_oleh: number | null; dibuat_pada: Date; kunjungan: { pasien_id: number } }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t0__id === null) continue;
    const kunci = String(baris.t0__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, kunjungan_id: baris[0].t0__kunjungan_id, lokasi_id: baris[0].t0__lokasi_id, tanggal: baris[0].t0__tanggal, nomor: baris[0].t0__nomor, status: baris[0].t0__status, waktu_daftar: baris[0].t0__waktu_daftar, waktu_panggil: baris[0].t0__waktu_panggil, waktu_mulai: baris[0].t0__waktu_mulai, waktu_selesai: baris[0].t0__waktu_selesai, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, kunjungan: petakt1(baris)[0]! }));
}
  const baris = await baca<Baris>("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`kunjungan_id` AS `t0__kunjungan_id`, t0.`lokasi_id` AS `t0__lokasi_id`, t0.`tanggal` AS `t0__tanggal`, t0.`nomor` AS `t0__nomor`, t0.`status` AS `t0__status`, t0.`waktu_daftar` AS `t0__waktu_daftar`, t0.`waktu_panggil` AS `t0__waktu_panggil`, t0.`waktu_mulai` AS `t0__waktu_mulai`, t0.`waktu_selesai` AS `t0__waktu_selesai`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t1.`id` AS `t1__id`, t1.`pasien_id` AS `t1__pasien_id`\nFROM (SELECT t0.* FROM `antrean` t0 WHERE ((? OR t0.`id` <=> ?)) AND ((? OR t0.`fasyankes_id` <=> ?)) AND ((? OR t0.`tanggal` <=> ?)) AND ((? OR t0.`lokasi_id` <=> ?)) AND ((? OR t0.`status` <=> ?)) AND ((? OR t0.`fasyankes_id` <=> ?)) ORDER BY t0.`lokasi_id` ASC, t0.`nomor` ASC LIMIT ? OFFSET ?) t0\nLEFT JOIN (SELECT b1.* FROM `kunjungan` b1 WHERE TRUE) t1 ON t0.`kunjungan_id` = t1.`id`\nORDER BY t0.`lokasi_id` ASC, t0.`nomor` ASC, t1.`id` ASC", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null, tanggal === undefined, tanggal ?? null, lokasi_id === undefined, lokasi_id ?? null, status === undefined, status ?? null, fasyankes_id2 === undefined, fasyankes_id2 ?? null, batas ?? 2147483647, lewati ?? 0], koneksi);
  const hasil = petakt0(baris);
  return hasil;
}
