import { baca, tulis, pool, type Koneksi } from '../koneksi';
import type * as T from '../tipe';

export async function hitungPermintaanPerbaikanUntukAdaMenunggu(fasyankes_id: number | undefined, kunjungan_id: number | undefined, bagian: string | undefined, status: T.StatusPerbaikan | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `permintaan_perbaikan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`bagian` <=> ?)) AND ((? OR t.`status` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null, kunjungan_id === undefined, kunjungan_id ?? null, bagian === undefined, bagian ?? null, status === undefined, status ?? null], koneksi);
  return Number(baris.jumlah);
}

export async function tambahPermintaanPerbaikanUntukBuatPermintaan(fasyankes_id: number | undefined, kunjungan_id: number | undefined, bagian: string | undefined, isi_baru: T.NilaiJson | undefined, alasan: string | undefined, pemohon_id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `permintaan_perbaikan` (`fasyankes_id`, `kunjungan_id`, `bagian`, `isi_baru`, `alasan`, `pemohon_id`) VALUES (?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (kunjungan_id === undefined ? null : kunjungan_id) ?? null, (bagian === undefined ? null : bagian) ?? null, JSON.stringify((isi_baru === undefined ? null : isi_baru) ?? null), (alasan === undefined ? null : alasan) ?? null, (pemohon_id === undefined ? null : pemohon_id) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function tambahPermintaanPerbaikanUntukBuatPermintaanHasil(id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kunjungan_id: number; bagian: string; isi_baru: T.NilaiJson; alasan: string; pemohon_id: number; status: T.StatusPerbaikan; penyetuju_id: number | null; catatan_keputusan: string | null; waktu_keputusan: Date | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`bagian`, t.`isi_baru`, t.`alasan`, t.`pemohon_id`, t.`status`, t.`penyetuju_id`, t.`catatan_keputusan`, t.`waktu_keputusan`, t.`dibuat_pada` FROM `permintaan_perbaikan` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
  for (const b of baris) if (typeof b.isi_baru === 'string') b.isi_baru = JSON.parse(b.isi_baru);
  if (!baris[0]) throw new Error('Baris permintaan_perbaikan tidak ditemukan.');
  return baris[0];
}

export async function cariPermintaanPerbaikanUntukPermintaan(id: number | undefined, fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kunjungan_id: number; bagian: string; isi_baru: T.NilaiJson; alasan: string; pemohon_id: number; status: T.StatusPerbaikan; penyetuju_id: number | null; catatan_keputusan: string | null; waktu_keputusan: Date | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`bagian`, t.`isi_baru`, t.`alasan`, t.`pemohon_id`, t.`status`, t.`penyetuju_id`, t.`catatan_keputusan`, t.`waktu_keputusan`, t.`dibuat_pada` FROM `permintaan_perbaikan` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) LIMIT 1", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  for (const b of baris) if (typeof b.isi_baru === 'string') b.isi_baru = JSON.parse(b.isi_baru);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}

export async function ubahPermintaanPerbaikanUntukPutuskan(status: T.StatusPerbaikan | undefined, penyetuju_id: number | null | undefined, catatan_keputusan: string | null | undefined, waktu_keputusan: Date | null | undefined, id: number | undefined, fasyankes_id: number | undefined, status2: T.StatusPerbaikan | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `permintaan_perbaikan` t SET `status` = IF(?, t.`status`, ?), `penyetuju_id` = IF(?, t.`penyetuju_id`, ?), `catatan_keputusan` = IF(?, t.`catatan_keputusan`, ?), `waktu_keputusan` = IF(?, t.`waktu_keputusan`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`status` <=> ?))", [status === undefined, (status ?? null), penyetuju_id === undefined, penyetuju_id ?? null, catatan_keputusan === undefined, catatan_keputusan ?? null, waktu_keputusan === undefined, waktu_keputusan ?? null, id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null, status2 === undefined, status2 ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function ubahPermintaanPerbaikanUntukKembalikan(status: T.StatusPerbaikan | undefined, penyetuju_id: number | null | undefined, catatan_keputusan: string | null | undefined, waktu_keputusan: Date | null | undefined, id: number | undefined, fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `permintaan_perbaikan` t SET `status` = IF(?, t.`status`, ?), `penyetuju_id` = IF(?, t.`penyetuju_id`, ?), `catatan_keputusan` = IF(?, t.`catatan_keputusan`, ?), `waktu_keputusan` = IF(?, t.`waktu_keputusan`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR NOT (t.`status` <=> ?)))", [status === undefined, (status ?? null), penyetuju_id === undefined, penyetuju_id ?? null, catatan_keputusan === undefined, catatan_keputusan ?? null, waktu_keputusan === undefined, waktu_keputusan ?? null, id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null, status === undefined, status ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function hitungPermintaanPerbaikanUntukDaftarPermintaan(fasyankes_id: number | undefined, status: T.StatusPerbaikan | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `permintaan_perbaikan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`status` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null, status === undefined, status ?? null], koneksi);
  return Number(baris.jumlah);
}

export async function daftarPermintaanPerbaikanUntukDaftarPermintaan(fasyankes_id: number | undefined, status: T.StatusPerbaikan | undefined, batas: number | undefined, lewati: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kunjungan_id: number; bagian: string; isi_baru: T.NilaiJson; alasan: string; pemohon_id: number; status: T.StatusPerbaikan; penyetuju_id: number | null; catatan_keputusan: string | null; waktu_keputusan: Date | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`bagian`, t.`isi_baru`, t.`alasan`, t.`pemohon_id`, t.`status`, t.`penyetuju_id`, t.`catatan_keputusan`, t.`waktu_keputusan`, t.`dibuat_pada` FROM `permintaan_perbaikan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`status` <=> ?)) ORDER BY t.`id` DESC LIMIT ? OFFSET ?", [fasyankes_id === undefined, fasyankes_id ?? null, status === undefined, status ?? null, batas ?? 2147483647, lewati ?? 0], koneksi);
  for (const b of baris) if (typeof b.isi_baru === 'string') b.isi_baru = JSON.parse(b.isi_baru);
  return baris;
}

export async function kelompokPermintaanPerbaikanUntukBerkas(fasyankes_id: number | undefined, status: T.StatusPerbaikan | undefined, kunjungan_id: readonly (number)[] | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ kunjungan_id: number; _count__all: number | string }>("SELECT t.`kunjungan_id`, COUNT(*) AS `_count__all` FROM `permintaan_perbaikan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`status` <=> ?)) AND ((? OR t.`kunjungan_id` IN (?))) GROUP BY t.`kunjungan_id`", [fasyankes_id === undefined, fasyankes_id ?? null, status === undefined, status ?? null, kunjungan_id === undefined, (kunjungan_id)?.length ? (kunjungan_id) : [null]], koneksi);
  const hasil = baris.map(b => ({ kunjungan_id: b.kunjungan_id, _count: { _all: Number(b._count__all) } }));
  return hasil;
}
