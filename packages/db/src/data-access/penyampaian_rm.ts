import { baca, tulis, pool, type Koneksi } from '../koneksi';
import type * as T from '../tipe';

export async function tambahPenyampaianRmUntukBuatPenyampaian(fasyankes_id: number | undefined, pasien_id: number | undefined, kunjungan_id: number | null | undefined, penerima_nama: string | undefined, hubungan: string | undefined, bentuk: T.BentukPenyampaian | undefined, bukti_persetujuan: string | null | undefined, catatan: string | null | undefined, petugas_id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `penyampaian_rm` (`fasyankes_id`, `pasien_id`, `kunjungan_id`, `penerima_nama`, `hubungan`, `bentuk`, `bukti_persetujuan`, `catatan`, `petugas_id`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (pasien_id === undefined ? null : pasien_id) ?? null, (kunjungan_id === undefined ? null : kunjungan_id) ?? null, (penerima_nama === undefined ? null : penerima_nama) ?? null, (hubungan === undefined ? null : hubungan) ?? null, ((bentuk === undefined ? null : bentuk) ?? null), (bukti_persetujuan === undefined ? null : bukti_persetujuan) ?? null, (catatan === undefined ? null : catatan) ?? null, (petugas_id === undefined ? null : petugas_id) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function tambahPenyampaianRmUntukBuatPenyampaianHasil(id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; pasien_id: number; kunjungan_id: number | null; penerima_nama: string; hubungan: string; bentuk: T.BentukPenyampaian; bukti_persetujuan: string | null; catatan: string | null; petugas_id: number; waktu: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`pasien_id`, t.`kunjungan_id`, t.`penerima_nama`, t.`hubungan`, t.`bentuk`, t.`bukti_persetujuan`, t.`catatan`, t.`petugas_id`, t.`waktu` FROM `penyampaian_rm` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
  if (!baris[0]) throw new Error('Baris penyampaian_rm tidak ditemukan.');
  return baris[0];
}

export async function hitungPenyampaianRmUntukDaftarPenyampaian(fasyankes_id: number | undefined, penerima_nama: string | undefined, pasien_id: readonly (number)[] | undefined, pakai: unknown, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `penyampaian_rm` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR ((((? OR t.`penerima_nama` LIKE ? ESCAPE '!'))) OR (((? OR t.`pasien_id` IN (?)))))))", [fasyankes_id === undefined, fasyankes_id ?? null, !pakai, penerima_nama === undefined, '%' + String(penerima_nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', pasien_id === undefined, (pasien_id)?.length ? (pasien_id) : [null]], koneksi);
  return Number(baris.jumlah);
}

export async function daftarPenyampaianRmUntukDaftarPenyampaian(fasyankes_id: number | undefined, penerima_nama: string | undefined, pasien_id: readonly (number)[] | undefined, pakai: unknown, batas: number | undefined, lewati: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; pasien_id: number; kunjungan_id: number | null; penerima_nama: string; hubungan: string; bentuk: T.BentukPenyampaian; bukti_persetujuan: string | null; catatan: string | null; petugas_id: number; waktu: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`pasien_id`, t.`kunjungan_id`, t.`penerima_nama`, t.`hubungan`, t.`bentuk`, t.`bukti_persetujuan`, t.`catatan`, t.`petugas_id`, t.`waktu` FROM `penyampaian_rm` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR ((((? OR t.`penerima_nama` LIKE ? ESCAPE '!'))) OR (((? OR t.`pasien_id` IN (?))))))) ORDER BY t.`id` DESC LIMIT ? OFFSET ?", [fasyankes_id === undefined, fasyankes_id ?? null, !pakai, penerima_nama === undefined, '%' + String(penerima_nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', pasien_id === undefined, (pasien_id)?.length ? (pasien_id) : [null], batas ?? 2147483647, lewati ?? 0], koneksi);
  return baris;
}
