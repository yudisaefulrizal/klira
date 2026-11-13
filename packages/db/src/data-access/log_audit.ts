import { baca, tulis, pool, type Koneksi } from '../koneksi';


export async function tambahLogAuditUntukTambah(fasyankes_id: number | null | undefined, pengguna_id: number | null | undefined, aksi: string | undefined, entitas: string | undefined, entitas_id: number | null | undefined, keterangan: string | null | undefined, waktu: Date | undefined, alamat: string | null | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `log_audit` (`fasyankes_id`, `pengguna_id`, `aksi`, `entitas`, `entitas_id`, `keterangan`, `waktu`, `alamat`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (pengguna_id === undefined ? null : pengguna_id) ?? null, (aksi === undefined ? null : aksi) ?? null, (entitas === undefined ? null : entitas) ?? null, (entitas_id === undefined ? null : entitas_id) ?? null, (keterangan === undefined ? null : keterangan) ?? null, (waktu === undefined ? new Date() : waktu) ?? null, (alamat === undefined ? null : alamat) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function hitungLogAuditUntukCari(fasyankes_id: number | null | undefined, pengguna_id: number | null | undefined, aksi: string | undefined, entitas: string | undefined, waktu: Date | undefined, waktu2: Date | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `log_audit` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`pengguna_id` <=> ?)) AND ((? OR t.`aksi` <=> ?)) AND ((? OR t.`entitas` <=> ?)) AND ((? OR t.`waktu` >= ?) AND (? OR t.`waktu` <= ?))", [fasyankes_id === undefined, fasyankes_id ?? null, pengguna_id === undefined, pengguna_id ?? null, aksi === undefined, aksi ?? null, entitas === undefined, entitas ?? null, waktu === undefined, waktu ?? null, waktu2 === undefined, waktu2 ?? null], koneksi);
  return Number(baris.jumlah);
}

export async function daftarLogAuditUntukCari(fasyankes_id: number | null | undefined, pengguna_id: number | null | undefined, aksi: string | undefined, entitas: string | undefined, waktu: Date | undefined, waktu2: Date | undefined, batas: number | undefined, lewati: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number | null; pengguna_id: number | null; aksi: string; entitas: string; entitas_id: number | null; keterangan: string | null; waktu: Date; alamat: string | null }>("SELECT t.`id`, t.`fasyankes_id`, t.`pengguna_id`, t.`aksi`, t.`entitas`, t.`entitas_id`, t.`keterangan`, t.`waktu`, t.`alamat` FROM `log_audit` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`pengguna_id` <=> ?)) AND ((? OR t.`aksi` <=> ?)) AND ((? OR t.`entitas` <=> ?)) AND ((? OR t.`waktu` >= ?) AND (? OR t.`waktu` <= ?)) ORDER BY t.`waktu` DESC, t.`id` DESC LIMIT ? OFFSET ?", [fasyankes_id === undefined, fasyankes_id ?? null, pengguna_id === undefined, pengguna_id ?? null, aksi === undefined, aksi ?? null, entitas === undefined, entitas ?? null, waktu === undefined, waktu ?? null, waktu2 === undefined, waktu2 ?? null, batas ?? 2147483647, lewati ?? 0], koneksi);
  return baris;
}

export async function cariLogAuditUntukAmbil(id: number | undefined, fasyankes_id: number | null | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number | null; pengguna_id: number | null; aksi: string; entitas: string; entitas_id: number | null; keterangan: string | null; waktu: Date; alamat: string | null }>("SELECT t.`id`, t.`fasyankes_id`, t.`pengguna_id`, t.`aksi`, t.`entitas`, t.`entitas_id`, t.`keterangan`, t.`waktu`, t.`alamat` FROM `log_audit` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) LIMIT 1", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}

export async function tambahLogAuditUntukSeedPimpinanPertama(fasyankes_id: number | null | undefined, pengguna_id: number | null | undefined, aksi: string | undefined, entitas: string | undefined, keterangan: string | null | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `log_audit` (`fasyankes_id`, `pengguna_id`, `aksi`, `entitas`, `entitas_id`, `keterangan`) VALUES (?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (pengguna_id === undefined ? null : pengguna_id) ?? null, (aksi === undefined ? null : aksi) ?? null, (entitas === undefined ? null : entitas) ?? null, (pengguna_id === undefined ? null : pengguna_id) ?? null, (keterangan === undefined ? null : keterangan) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}
