import { baca, tulis, pool, type Koneksi } from '../../koneksi';
import type * as T from '../../tipe';

export async function hapusPersetujuanUntukPasienPasienIntegrasiTest(fasyankes_id: readonly (number)[] | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("DELETE t FROM `persetujuan` t WHERE ((? OR t.`fasyankes_id` IN (?)))", [fasyankes_id === undefined, (fasyankes_id)?.length ? (fasyankes_id) : [null]], koneksi);
  return { count: hasil.affectedRows };
}

export async function hitungPersetujuanUntukHitung(fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `persetujuan` t WHERE ((? OR t.`fasyankes_id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  return Number(baris.jumlah);
}

export async function tambahPersetujuanUntukBuat(fasyankes_id: number | undefined, pasien_id: number | undefined, jenis: T.JenisPersetujuan | undefined, versi_teks: number | undefined, tujuan: string | undefined, bentuk: string | undefined, penandatangan: string | undefined, penandatangan_nama: string | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `persetujuan` (`fasyankes_id`, `pasien_id`, `jenis`, `versi_teks`, `tujuan`, `bentuk`, `penandatangan`, `penandatangan_nama`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (pasien_id === undefined ? null : pasien_id) ?? null, ((jenis === undefined ? null : jenis) ?? null), (versi_teks === undefined ? null : versi_teks) ?? null, (tujuan === undefined ? null : tujuan) ?? null, (bentuk === undefined ? null : bentuk) ?? null, (penandatangan === undefined ? null : penandatangan) ?? null, (penandatangan_nama === undefined ? null : penandatangan_nama) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function tambahPersetujuanUntukBuatHasil(id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; pasien_id: number; jenis: T.JenisPersetujuan; teks_persetujuan_id: number | null; versi_teks: number; tujuan: string; penjelasan: string | null; bentuk: string; status: string; waktu: Date; penandatangan: string; wali_id: number | null; penandatangan_nama: string; saksi_pengguna_id: number | null; kunjungan_id: number | null; tindakan_kode: string | null; tindakan_nama: string | null; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`pasien_id`, t.`jenis`, t.`teks_persetujuan_id`, t.`versi_teks`, t.`tujuan`, t.`penjelasan`, t.`bentuk`, t.`status`, t.`waktu`, t.`penandatangan`, t.`wali_id`, t.`penandatangan_nama`, t.`saksi_pengguna_id`, t.`kunjungan_id`, t.`tindakan_kode`, t.`tindakan_nama`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `persetujuan` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
  if (!baris[0]) throw new Error('Baris persetujuan tidak ditemukan.');
  return baris[0];
}

export function hapusPersetujuanFasyankesUji(ids: readonly number[], koneksi: Koneksi = pool) {
  return tulis('DELETE FROM `persetujuan` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
