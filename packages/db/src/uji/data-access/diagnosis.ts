import { baca, tulis, pool, type Koneksi } from '../../koneksi';
import type * as T from '../../tipe';

export async function tambahBanyakDiagnosisUntukKunjunganBaru(data: readonly T.DiagnosisBaru[], koneksi: Koneksi = pool) {
  if (!data.length) return { count: 0 };
  const nilai = data.map(d => [(d.fasyankes_id === undefined ? null : d.fasyankes_id) ?? null, (d.kunjungan_id === undefined ? null : d.kunjungan_id) ?? null, (d.versi === undefined ? null : d.versi) ?? null, (d.kode_icd10 === undefined ? null : d.kode_icd10) ?? null, (d.nama === undefined ? null : d.nama) ?? null, (d.kode_snomed === undefined ? null : d.kode_snomed) ?? null, ((d.peran === undefined ? null : d.peran) ?? null), (d.urutan === undefined ? null : d.urutan) ?? null, (d.dibuat_oleh === undefined ? null : d.dibuat_oleh) ?? null, (d.dibuat_pada === undefined ? new Date() : d.dibuat_pada) ?? null]);
  const hasil = await tulis("INSERT INTO `diagnosis` (`fasyankes_id`, `kunjungan_id`, `versi`, `kode_icd10`, `nama`, `kode_snomed`, `peran`, `urutan`, `dibuat_oleh`, `dibuat_pada`) VALUES ?", [nilai], koneksi);
  return { count: hasil.affectedRows };
}

export async function tambahDiagnosisUntukKlaimKlaimIntegrasiTest(fasyankes_id: number | undefined, kunjungan_id: number | undefined, versi: number | undefined, kode_icd10: string | undefined, nama: string | undefined, peran: T.PeranDiagnosis | undefined, urutan: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `diagnosis` (`fasyankes_id`, `kunjungan_id`, `versi`, `kode_icd10`, `nama`, `peran`, `urutan`) VALUES (?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (kunjungan_id === undefined ? null : kunjungan_id) ?? null, (versi === undefined ? null : versi) ?? null, (kode_icd10 === undefined ? null : kode_icd10) ?? null, (nama === undefined ? null : nama) ?? null, ((peran === undefined ? null : peran) ?? null), (urutan === undefined ? null : urutan) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function hitungDiagnosisUntukKlinisKlinisIntegrasiTest(kunjungan_id: number | undefined, kode_icd10: string | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `diagnosis` t WHERE ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`kode_icd10` <=> ?))", [kunjungan_id === undefined, kunjungan_id ?? null, kode_icd10 === undefined, kode_icd10 ?? null], koneksi);
  return Number(baris.jumlah);
}

export async function daftarDiagnosisUntukKodeSekarang(kunjungan_id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kunjungan_id: number; versi: number; kode_icd10: string; nama: string; kode_snomed: string | null; peran: T.PeranDiagnosis; urutan: number; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`versi`, t.`kode_icd10`, t.`nama`, t.`kode_snomed`, t.`peran`, t.`urutan`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `diagnosis` t WHERE ((? OR t.`kunjungan_id` <=> ?)) ORDER BY t.`versi` DESC, t.`urutan` ASC", [kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
  return baris;
}

export function hapusDiagnosisFasyankesUji(ids: readonly number[], koneksi: Koneksi = pool) {
  return tulis('DELETE FROM `diagnosis` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
