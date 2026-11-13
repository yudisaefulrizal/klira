import { tulis, pool, type Koneksi } from '../koneksi';
import type * as T from '../tipe';


export async function tambahBanyakIzinJenisAkunUntukBuatJenisAkun(data: readonly T.IzinJenisAkunBaru[], koneksi: Koneksi = pool) {
  if (!data.length) return { count: 0 };
  const nilai = data.map(d => [(d.fasyankes_id === undefined ? null : d.fasyankes_id) ?? null, (d.jenis_akun_id === undefined ? null : d.jenis_akun_id) ?? null, (d.izin_id === undefined ? null : d.izin_id) ?? null, (d.dibuat_oleh === undefined ? null : d.dibuat_oleh) ?? null, (d.dibuat_pada === undefined ? new Date() : d.dibuat_pada) ?? null]);
  const hasil = await tulis("INSERT INTO `izin_jenis_akun` (`fasyankes_id`, `jenis_akun_id`, `izin_id`, `dibuat_oleh`, `dibuat_pada`) VALUES ?", [nilai], koneksi);
  return { count: hasil.affectedRows };
}

export async function hapusIzinJenisAkunUntukUbahJenisAkun(jenis_akun_id: number | undefined, izin_id: readonly (number)[] | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("DELETE t FROM `izin_jenis_akun` t WHERE ((? OR t.`jenis_akun_id` <=> ?)) AND ((? OR t.`izin_id` NOT IN (?)))", [jenis_akun_id === undefined, jenis_akun_id ?? null, (izin_id === undefined) || !(izin_id)?.length, (izin_id)?.length ? (izin_id) : [null]], koneksi);
  return { count: hasil.affectedRows };
}

export async function tambahBanyakIzinJenisAkunUntukUbahJenisAkun(data: readonly T.IzinJenisAkunBaru[], koneksi: Koneksi = pool) {
  if (!data.length) return { count: 0 };
  const nilai = data.map(d => [(d.fasyankes_id === undefined ? null : d.fasyankes_id) ?? null, (d.jenis_akun_id === undefined ? null : d.jenis_akun_id) ?? null, (d.izin_id === undefined ? null : d.izin_id) ?? null, (d.dibuat_oleh === undefined ? null : d.dibuat_oleh) ?? null, (d.dibuat_pada === undefined ? new Date() : d.dibuat_pada) ?? null]);
  const hasil = await tulis("INSERT IGNORE INTO `izin_jenis_akun` (`fasyankes_id`, `jenis_akun_id`, `izin_id`, `dibuat_oleh`, `dibuat_pada`) VALUES ?", [nilai], koneksi);
  return { count: hasil.affectedRows };
}

