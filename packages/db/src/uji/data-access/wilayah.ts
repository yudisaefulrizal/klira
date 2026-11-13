import { baca, tulis, pool, type Koneksi } from '../../koneksi';
import type * as T from '../../tipe';


export async function hapusWilayahUntukSeedWilayahTest(kode: readonly (string)[] | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("DELETE t FROM `wilayah` t WHERE ((? OR t.`kode` IN (?)))", [kode === undefined, (kode)?.length ? (kode) : [null]], koneksi);
  return { count: hasil.affectedRows };
}

export async function hitungWilayahUntukSeedWilayahTest(kode: string | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `wilayah` t WHERE ((? OR t.`kode` LIKE ? ESCAPE '!'))", [kode === undefined, String(kode ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%'], koneksi);
  return Number(baris.jumlah);
}

export async function wajibWilayahUntukSeedWilayahTest(kode: string | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; kode: string; nama: string; tingkat: T.TingkatWilayah; induk_kode: string | null; contoh: boolean; dibuat_pada: Date }>("SELECT t.`id`, t.`kode`, t.`nama`, t.`tingkat`, t.`induk_kode`, t.`contoh`, t.`dibuat_pada` FROM `wilayah` t WHERE ((? OR t.`kode` <=> ?)) LIMIT 1", [kode === undefined, kode ?? null], koneksi);
  if (!baris[0]) throw new Error('Baris wilayah tidak ditemukan.');
  return baris[0];
}

