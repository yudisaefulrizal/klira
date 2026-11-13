import { baca, pool, type Koneksi } from '../koneksi';


export async function hitungRiwayatBackupUntukDaftarBackup(fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `riwayat_backup` t WHERE ((? OR t.`fasyankes_id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  return Number(baris.jumlah);
}

export async function daftarRiwayatBackupUntukDaftarBackup(fasyankes_id: number | undefined, batas: number | undefined, lewati: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; waktu: Date; status: string; ukuran_byte: bigint | null; lokasi: string | null }>("SELECT t.`id`, t.`waktu`, t.`status`, t.`ukuran_byte`, t.`lokasi` FROM `riwayat_backup` t WHERE ((? OR t.`fasyankes_id` <=> ?)) ORDER BY t.`waktu` DESC, t.`id` DESC LIMIT ? OFFSET ?", [fasyankes_id === undefined, fasyankes_id ?? null, batas ?? 2147483647, lewati ?? 0], koneksi);
  for (const b of baris) if (b.ukuran_byte !== null) b.ukuran_byte = BigInt(b.ukuran_byte);
  return baris;
}
