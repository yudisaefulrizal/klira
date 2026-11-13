import { baca, tulis, pool, type Koneksi } from '../../koneksi';
import type * as T from '../../tipe';

export async function ambilPermintaanPerbaikanUntukRekamMedisRmIntegrasiTest(id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kunjungan_id: number; bagian: string; isi_baru: T.NilaiJson; alasan: string; pemohon_id: number; status: T.StatusPerbaikan; penyetuju_id: number | null; catatan_keputusan: string | null; waktu_keputusan: Date | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`bagian`, t.`isi_baru`, t.`alasan`, t.`pemohon_id`, t.`status`, t.`penyetuju_id`, t.`catatan_keputusan`, t.`waktu_keputusan`, t.`dibuat_pada` FROM `permintaan_perbaikan` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
  for (const b of baris) if (typeof b.isi_baru === 'string') b.isi_baru = JSON.parse(b.isi_baru);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}

export function hapusPermintaanPerbaikanFasyankesUji(ids: readonly number[], koneksi: Koneksi = pool) {
  return tulis('DELETE FROM `permintaan_perbaikan` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
