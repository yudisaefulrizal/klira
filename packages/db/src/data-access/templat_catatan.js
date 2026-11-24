import { baca, tulis, pool } from '../koneksi.js';
import { wajibId } from '../wajib.js';
export async function daftarTemplatCatatanUntukDaftarTemplat(pengguna_id, bagian, batas, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`pengguna_id`, t.`bagian`, t.`nama`, t.`isi`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `templat_catatan` t WHERE ((? OR t.`pengguna_id` <=> ?)) AND ((? OR t.`bagian` <=> ?)) ORDER BY t.`nama` ASC LIMIT ? OFFSET ?", [pengguna_id === undefined, pengguna_id ?? null, bagian === undefined, bagian ?? null, batas ?? 2147483647, 0], koneksi);
    for (const b of baris)
        if (typeof b.isi === 'string')
            b.isi = JSON.parse(b.isi);
    return baris;
}
export async function tambahTemplatCatatanUntukTambahTemplat(pengguna_id, bagian, nama, isi, dibuat_oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `templat_catatan` (`pengguna_id`, `bagian`, `nama`, `isi`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?)", [(pengguna_id === undefined ? null : pengguna_id) ?? null, ((bagian === undefined ? null : bagian) ?? null), (nama === undefined ? null : nama) ?? null, JSON.stringify((isi === undefined ? null : isi) ?? null), (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahTemplatCatatanUntukTambahTemplatHasil(id, koneksi = pool) {
    wajibId('tambahTemplatCatatanUntukTambahTemplatHasil', id);
    const baris = await baca("SELECT t.`id`, t.`pengguna_id`, t.`bagian`, t.`nama`, t.`isi`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `templat_catatan` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    for (const b of baris)
        if (typeof b.isi === 'string')
            b.isi = JSON.parse(b.isi);
    if (!baris[0])
        throw new Error('Baris templat_catatan tidak ditemukan.');
    return baris[0];
}
export async function hapusTemplatCatatanUntukHapusTemplat(id, pengguna_id, koneksi = pool) {
    wajibId('hapusTemplatCatatanUntukHapusTemplat', id);
    const hasil = await tulis("DELETE t FROM `templat_catatan` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`pengguna_id` <=> ?))", [id === undefined, id ?? null, pengguna_id === undefined, pengguna_id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
