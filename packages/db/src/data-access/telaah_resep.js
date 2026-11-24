import { baca, tulis, pool } from '../koneksi.js';
export async function simpanTelaahResepUntukCatatTelaah(resep_id, apoteker_id, administratif, farmasetik, klinis, catatan, waktu, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `telaah_resep` (`resep_id`, `apoteker_id`, `administratif`, `farmasetik`, `klinis`, `catatan`, `waktu`) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE `apoteker_id` = IF(?, `apoteker_id`, ?), `administratif` = IF(?, `administratif`, ?), `farmasetik` = IF(?, `farmasetik`, ?), `klinis` = IF(?, `klinis`, ?), `catatan` = IF(?, `catatan`, ?), `waktu` = IF(?, `waktu`, ?), `id` = LAST_INSERT_ID(`id`)", [(resep_id === undefined ? null : resep_id) ?? null, (apoteker_id === undefined ? null : apoteker_id) ?? null, (administratif === undefined ? null : administratif) ?? null, (farmasetik === undefined ? null : farmasetik) ?? null, (klinis === undefined ? null : klinis) ?? null, (catatan === undefined ? null : catatan) ?? null, (waktu === undefined ? new Date() : waktu) ?? null, apoteker_id === undefined, apoteker_id ?? null, administratif === undefined, administratif ?? null, farmasetik === undefined, farmasetik ?? null, klinis === undefined, klinis ?? null, catatan === undefined, catatan ?? null, waktu === undefined, waktu ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}

/** Jumlah catatan telaah apoteker pada satu resep (resep yang sudah mulai ditelaah tidak boleh diubah dokter lagi). */
export async function hitungTelaahUntukSimpanResep(resep_id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `telaah_resep` WHERE `resep_id` = ?", [resep_id], koneksi);
    return Number(baris.jumlah);
}
