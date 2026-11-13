import { baca, tulis, pool, type Koneksi } from '../koneksi';
import type * as T from '../tipe';

export async function tambahPembukaanRmUntukBuatPembukaan(fasyankes_id: number | undefined, pasien_id: number | undefined, pemohon_nama: string | undefined, pemohon_instansi: string | null | undefined, dasar: T.DasarPembukaan | undefined, alasan_hukum: string | null | undefined, dasar_rinci: string | undefined, cakupan: string | undefined, identitas_disamarkan: boolean | undefined, diminta_oleh: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `pembukaan_rm` (`fasyankes_id`, `pasien_id`, `pemohon_nama`, `pemohon_instansi`, `dasar`, `alasan_hukum`, `dasar_rinci`, `cakupan`, `identitas_disamarkan`, `diminta_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (pasien_id === undefined ? null : pasien_id) ?? null, (pemohon_nama === undefined ? null : pemohon_nama) ?? null, (pemohon_instansi === undefined ? null : pemohon_instansi) ?? null, ((dasar === undefined ? null : dasar) ?? null), (alasan_hukum === undefined ? null : alasan_hukum) ?? null, (dasar_rinci === undefined ? null : dasar_rinci) ?? null, (cakupan === undefined ? null : cakupan) ?? null, (identitas_disamarkan === undefined ? true : identitas_disamarkan) ?? null, (diminta_oleh === undefined ? null : diminta_oleh) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function tambahPembukaanRmUntukBuatPembukaanHasil(id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; pasien_id: number; pemohon_nama: string; pemohon_instansi: string | null; dasar: T.DasarPembukaan; alasan_hukum: string | null; dasar_rinci: string; cakupan: string; identitas_disamarkan: boolean; status: T.StatusPembukaan; penyetuju_id: number | null; catatan_keputusan: string | null; waktu_keputusan: Date | null; diminta_oleh: number; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`pasien_id`, t.`pemohon_nama`, t.`pemohon_instansi`, t.`dasar`, t.`alasan_hukum`, t.`dasar_rinci`, t.`cakupan`, t.`identitas_disamarkan`, t.`status`, t.`penyetuju_id`, t.`catatan_keputusan`, t.`waktu_keputusan`, t.`diminta_oleh`, t.`dibuat_pada` FROM `pembukaan_rm` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
  if (!baris[0]) throw new Error('Baris pembukaan_rm tidak ditemukan.');
  return baris[0];
}

export async function cariPembukaanRmUntukPembukaan(id: number | undefined, fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; status: T.StatusPembukaan; diminta_oleh: number }>("SELECT t.`id`, t.`status`, t.`diminta_oleh` FROM `pembukaan_rm` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) LIMIT 1", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}

export async function ubahPembukaanRmUntukPutuskanPembukaan(status: T.StatusPembukaan | undefined, penyetuju_id: number | null | undefined, catatan_keputusan: string | null | undefined, waktu_keputusan: Date | null | undefined, id: number | undefined, fasyankes_id: number | undefined, status2: T.StatusPembukaan | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `pembukaan_rm` t SET `status` = IF(?, t.`status`, ?), `penyetuju_id` = IF(?, t.`penyetuju_id`, ?), `catatan_keputusan` = IF(?, t.`catatan_keputusan`, ?), `waktu_keputusan` = IF(?, t.`waktu_keputusan`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`status` <=> ?))", [status === undefined, (status ?? null), penyetuju_id === undefined, penyetuju_id ?? null, catatan_keputusan === undefined, catatan_keputusan ?? null, waktu_keputusan === undefined, waktu_keputusan ?? null, id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null, status2 === undefined, status2 ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function hitungPembukaanRmUntukDaftarPembukaan(fasyankes_id: number | undefined, status: T.StatusPembukaan | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `pembukaan_rm` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`status` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null, status === undefined, status ?? null], koneksi);
  return Number(baris.jumlah);
}

export async function daftarPembukaanRmUntukDaftarPembukaan(fasyankes_id: number | undefined, status: T.StatusPembukaan | undefined, batas: number | undefined, lewati: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; pasien_id: number; pemohon_nama: string; pemohon_instansi: string | null; dasar: T.DasarPembukaan; alasan_hukum: string | null; dasar_rinci: string; cakupan: string; identitas_disamarkan: boolean; status: T.StatusPembukaan; penyetuju_id: number | null; catatan_keputusan: string | null; waktu_keputusan: Date | null; diminta_oleh: number; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`pasien_id`, t.`pemohon_nama`, t.`pemohon_instansi`, t.`dasar`, t.`alasan_hukum`, t.`dasar_rinci`, t.`cakupan`, t.`identitas_disamarkan`, t.`status`, t.`penyetuju_id`, t.`catatan_keputusan`, t.`waktu_keputusan`, t.`diminta_oleh`, t.`dibuat_pada` FROM `pembukaan_rm` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`status` <=> ?)) ORDER BY t.`id` DESC LIMIT ? OFFSET ?", [fasyankes_id === undefined, fasyankes_id ?? null, status === undefined, status ?? null, batas ?? 2147483647, lewati ?? 0], koneksi);
  return baris;
}
