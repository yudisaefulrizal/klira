import { baca, tulis, pool, type Koneksi } from '../koneksi';
import type * as T from '../tipe';

export async function ambilPemulanganUntukDetail(kunjungan_id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kunjungan_id: number; disposisi: T.DisposisiPulang; kondisi_pulang: string; diagnosis_akhir: string; ringkasan: string; tindak_lanjut: string | null; waktu: Date; dibuat_oleh: number }>("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`disposisi`, t.`kondisi_pulang`, t.`diagnosis_akhir`, t.`ringkasan`, t.`tindak_lanjut`, t.`waktu`, t.`dibuat_oleh` FROM `pemulangan` t WHERE ((? OR t.`kunjungan_id` <=> ?)) LIMIT 1", [kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}

export async function hitungPemulanganUntukPulangkan(kunjungan_id: number | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `pemulangan` t WHERE ((? OR t.`kunjungan_id` <=> ?))", [kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
  return Number(baris.jumlah);
}

export async function tambahPemulanganUntukPulangkan(fasyankes_id: number | undefined, kunjungan_id: number | undefined, disposisi: T.DisposisiPulang | undefined, kondisi_pulang: string | undefined, diagnosis_akhir: string | undefined, ringkasan: string | undefined, tindak_lanjut: string | null | undefined, waktu: Date | undefined, dibuat_oleh: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `pemulangan` (`fasyankes_id`, `kunjungan_id`, `disposisi`, `kondisi_pulang`, `diagnosis_akhir`, `ringkasan`, `tindak_lanjut`, `waktu`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (kunjungan_id === undefined ? null : kunjungan_id) ?? null, ((disposisi === undefined ? null : disposisi) ?? null), (kondisi_pulang === undefined ? null : kondisi_pulang) ?? null, (diagnosis_akhir === undefined ? null : diagnosis_akhir) ?? null, (ringkasan === undefined ? null : ringkasan) ?? null, (tindak_lanjut === undefined ? null : tindak_lanjut) ?? null, (waktu === undefined ? new Date() : waktu) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}
