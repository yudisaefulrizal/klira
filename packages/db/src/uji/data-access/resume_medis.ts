import { baca, tulis, pool, type Koneksi } from '../../koneksi';
import type * as T from '../../tipe';

export async function tambahResumeMedisUntukKlaimKlaimIntegrasiTest(fasyankes_id: number | undefined, kunjungan_id: number | undefined, isi: T.NilaiJson | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `resume_medis` (`fasyankes_id`, `kunjungan_id`, `isi`) VALUES (?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (kunjungan_id === undefined ? null : kunjungan_id) ?? null, JSON.stringify((isi === undefined ? null : isi) ?? null)], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function hitungResumeMedisUntukRawatInapRawatInapIntegrasiTest(kunjungan_id: number | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `resume_medis` t WHERE ((? OR t.`kunjungan_id` <=> ?))", [kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
  return Number(baris.jumlah);
}

export function hapusResumeMedisFasyankesUji(ids: readonly number[], koneksi: Koneksi = pool) {
  return tulis('DELETE FROM `resume_medis` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
