import { baca, tulis, pool, type Koneksi } from '../../koneksi';
import type * as T from '../../tipe';

export async function hitungRiwayatKlaimUntukKlaimKlaimIntegrasiTest(klaim_id: number | undefined, dari: T.StatusKlaim | null | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `riwayat_klaim` t WHERE ((? OR t.`klaim_id` <=> ?)) AND ((? OR t.`dari` <=> ?))", [klaim_id === undefined, klaim_id ?? null, dari === undefined, dari ?? null], koneksi);
  return Number(baris.jumlah);
}

export function hapusRiwayatKlaimFasyankesUji(ids: readonly number[], koneksi: Koneksi = pool) {
  return tulis('DELETE FROM `riwayat_klaim` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
