import { tulis, pool } from '../koneksi.js';
export async function simpanWilayahUntukSimpanWilayah(kode, nama, tingkat, induk_kode, contoh, nama2, tingkat2, induk_kode2, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `wilayah` (`kode`, `nama`, `tingkat`, `induk_kode`, `contoh`) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE `nama` = IF(?, `nama`, ?), `tingkat` = IF(?, `tingkat`, ?), `induk_kode` = IF(?, `induk_kode`, ?), `contoh` = IF(?, `contoh`, ?), `id` = LAST_INSERT_ID(`id`)", [(kode === undefined ? null : kode) ?? null, (nama === undefined ? null : nama) ?? null, ((tingkat === undefined ? null : tingkat) ?? null), (induk_kode === undefined ? null : induk_kode) ?? null, (contoh === undefined ? false : contoh) ?? null, nama2 === undefined, nama2 ?? null, tingkat2 === undefined, (tingkat2 ?? null), induk_kode2 === undefined, induk_kode2 ?? null, contoh === undefined, contoh ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
