import { tulis, pool, type Koneksi } from '../../koneksi';
import type * as T from '../../tipe';


export async function hapusRiwayatBackupUntukKeamananKeamananIntegrasiTest(fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("DELETE t FROM `riwayat_backup` t WHERE ((? OR t.`fasyankes_id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function tambahBanyakRiwayatBackupUntukKeamananKeamananIntegrasiTest(data: readonly T.RiwayatBackupBaru[], koneksi: Koneksi = pool) {
  if (!data.length) return { count: 0 };
  const nilai = data.map(d => [(d.fasyankes_id === undefined ? null : d.fasyankes_id) ?? null, (d.waktu === undefined ? new Date() : d.waktu) ?? null, (d.status === undefined ? null : d.status) ?? null, (d.ukuran_byte === undefined ? null : d.ukuran_byte) ?? null, (d.lokasi === undefined ? null : d.lokasi) ?? null, (d.dibuat_oleh === undefined ? null : d.dibuat_oleh) ?? null, (d.dibuat_pada === undefined ? new Date() : d.dibuat_pada) ?? null]);
  const hasil = await tulis("INSERT INTO `riwayat_backup` (`fasyankes_id`, `waktu`, `status`, `ukuran_byte`, `lokasi`, `dibuat_oleh`, `dibuat_pada`) VALUES ?", [nilai], koneksi);
  return { count: hasil.affectedRows };
}
