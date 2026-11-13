import { baca, tulis, pool, type Koneksi } from '../../koneksi';


export async function hapusShiftKasirUntukRawatInapRawatInapIntegrasiTest(fasyankes_id: readonly (number)[] | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("DELETE t FROM `shift_kasir` t WHERE ((? OR t.`fasyankes_id` IN (?)))", [fasyankes_id === undefined, (fasyankes_id)?.length ? (fasyankes_id) : [null]], koneksi);
  return { count: hasil.affectedRows };
}

export async function tambahShiftKasirUntukRawatInapRawatInapIntegrasiTest(fasyankes_id: number | undefined, kasir_id: number | undefined, kas_awal: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `shift_kasir` (`fasyankes_id`, `kasir_id`, `kas_awal`) VALUES (?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (kasir_id === undefined ? null : kasir_id) ?? null, (kas_awal === undefined ? null : kas_awal) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function tambahShiftKasirUntukRawatInapRawatInapIntegrasiTestHasil(id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kasir_id: number; buka: Date; tutup: Date | null; kas_awal: number; kas_akhir: number | null; selisih: number | null; alasan_selisih: string | null }>("SELECT t.`id`, t.`fasyankes_id`, t.`kasir_id`, t.`buka`, t.`tutup`, t.`kas_awal`, t.`kas_akhir`, t.`selisih`, t.`alasan_selisih` FROM `shift_kasir` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
  if (!baris[0]) throw new Error('Baris shift_kasir tidak ditemukan.');
  return baris[0];
}

export async function hapusShiftKasirUntukRawatInapRawatInapIntegrasiTest2(id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("DELETE t FROM `shift_kasir` t WHERE ((? OR t.`id` <=> ?))", [id === undefined, id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export function hapusShiftKasirFasyankesUji(ids: readonly number[], koneksi: Koneksi = pool) {
  return tulis('DELETE FROM `shift_kasir` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
