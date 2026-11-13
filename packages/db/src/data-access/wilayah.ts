import { tulis, pool, type Koneksi } from '../koneksi';
import type * as T from '../tipe';


export async function simpanWilayahUntukSimpanWilayah(kode: string | undefined, nama: string | undefined, tingkat: T.TingkatWilayah | undefined, induk_kode: string | null | undefined, contoh: boolean | undefined, nama2: string | undefined, tingkat2: T.TingkatWilayah | undefined, induk_kode2: string | null | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `wilayah` (`kode`, `nama`, `tingkat`, `induk_kode`, `contoh`) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE `nama` = IF(?, `nama`, ?), `tingkat` = IF(?, `tingkat`, ?), `induk_kode` = IF(?, `induk_kode`, ?), `contoh` = IF(?, `contoh`, ?), `id` = LAST_INSERT_ID(`id`)", [(kode === undefined ? null : kode) ?? null, (nama === undefined ? null : nama) ?? null, ((tingkat === undefined ? null : tingkat) ?? null), (induk_kode === undefined ? null : induk_kode) ?? null, (contoh === undefined ? false : contoh) ?? null, nama2 === undefined, nama2 ?? null, tingkat2 === undefined, (tingkat2 ?? null), induk_kode2 === undefined, induk_kode2 ?? null, contoh === undefined, contoh ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}
