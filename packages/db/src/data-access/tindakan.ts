import { baca, tulis, pool, type Koneksi } from '../koneksi';
import type * as T from '../tipe';

export async function daftarTindakanUntukBacaVersiLepas(fasyankes_id: number | undefined, kunjungan_id: number | undefined, versi: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kunjungan_id: number; versi: number; kode_icd9cm: string; nama: string; tarif_layanan_id: number | null; jumlah: number; performer_id: number | null; mulai: Date; selesai: Date | null; urutan: number; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`versi`, t.`kode_icd9cm`, t.`nama`, t.`tarif_layanan_id`, t.`jumlah`, t.`performer_id`, t.`mulai`, t.`selesai`, t.`urutan`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `tindakan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`versi` <=> ?)) ORDER BY t.`urutan` ASC", [fasyankes_id === undefined, fasyankes_id ?? null, kunjungan_id === undefined, kunjungan_id ?? null, versi === undefined, versi ?? null], koneksi);
  return baris;
}

export async function tambahBanyakTindakanUntukTulisIsi(data: readonly T.TindakanBaru[], koneksi: Koneksi = pool) {
  if (!data.length) return { count: 0 };
  const nilai = data.map(d => [(d.fasyankes_id === undefined ? null : d.fasyankes_id) ?? null, (d.kunjungan_id === undefined ? null : d.kunjungan_id) ?? null, (d.versi === undefined ? null : d.versi) ?? null, (d.kode_icd9cm === undefined ? null : d.kode_icd9cm) ?? null, (d.nama === undefined ? null : d.nama) ?? null, (d.tarif_layanan_id === undefined ? null : d.tarif_layanan_id) ?? null, (d.jumlah === undefined ? 1 : d.jumlah) ?? null, (d.performer_id === undefined ? null : d.performer_id) ?? null, (d.mulai === undefined ? null : d.mulai) ?? null, (d.selesai === undefined ? null : d.selesai) ?? null, (d.urutan === undefined ? null : d.urutan) ?? null, (d.dibuat_oleh === undefined ? null : d.dibuat_oleh) ?? null, (d.dibuat_pada === undefined ? new Date() : d.dibuat_pada) ?? null]);
  const hasil = await tulis("INSERT INTO `tindakan` (`fasyankes_id`, `kunjungan_id`, `versi`, `kode_icd9cm`, `nama`, `tarif_layanan_id`, `jumlah`, `performer_id`, `mulai`, `selesai`, `urutan`, `dibuat_oleh`, `dibuat_pada`) VALUES ?", [nilai], koneksi);
  return { count: hasil.affectedRows };
}
