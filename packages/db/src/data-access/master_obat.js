import { baca, tulis, pool } from '../koneksi.js';
export async function hitungMasterObatUntukHitungKesiapan(fasyankes_id, aktif, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `master_obat` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`aktif` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null, aktif === undefined, aktif ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function hitungMasterObatUntukDaftarMaster(fasyankes_id, aktif, nama_tampil, pakai, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `master_obat` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`aktif` <=> ?)) AND ((? OR ((((? OR t.`nama_tampil` LIKE ? ESCAPE '!'))) OR (((? OR t.`kfa_kode` LIKE ? ESCAPE '!'))) OR (((? OR t.`kfa_nama` LIKE ? ESCAPE '!'))))))", [fasyankes_id === undefined, fasyankes_id ?? null, aktif === undefined, aktif ?? null, !pakai, nama_tampil === undefined, '%' + String(nama_tampil ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', nama_tampil === undefined, '%' + String(nama_tampil ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', nama_tampil === undefined, '%' + String(nama_tampil ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%'], koneksi);
    return Number(baris.jumlah);
}
export async function daftarMasterObatUntukDaftarMaster(fasyankes_id, aktif, nama_tampil, pakai, batas, lewati, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`kfa_kode`, t.`kfa_nama`, t.`bentuk_sediaan`, t.`rute`, t.`nama_tampil`, t.`satuan`, t.`harga`, t.`aktif`, t.`dibuat_oleh`, t.`dibuat_pada`, t.`diubah_pada` FROM `master_obat` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`aktif` <=> ?)) AND ((? OR ((((? OR t.`nama_tampil` LIKE ? ESCAPE '!'))) OR (((? OR t.`kfa_kode` LIKE ? ESCAPE '!'))) OR (((? OR t.`kfa_nama` LIKE ? ESCAPE '!')))))) ORDER BY t.`nama_tampil` ASC LIMIT ? OFFSET ?", [fasyankes_id === undefined, fasyankes_id ?? null, aktif === undefined, aktif ?? null, !pakai, nama_tampil === undefined, '%' + String(nama_tampil ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', nama_tampil === undefined, '%' + String(nama_tampil ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', nama_tampil === undefined, '%' + String(nama_tampil ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', batas ?? 2147483647, lewati ?? 0], koneksi);
    return baris;
}
export async function cariMasterObatUntukMaster(id, fasyankes_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`kfa_kode`, t.`kfa_nama`, t.`bentuk_sediaan`, t.`rute`, t.`nama_tampil`, t.`satuan`, t.`harga`, t.`aktif`, t.`dibuat_oleh`, t.`dibuat_pada`, t.`diubah_pada` FROM `master_obat` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) LIMIT 1", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function tambahMasterObatUntukBuatMaster(fasyankes_id, kfa_kode, kfa_nama, bentuk_sediaan, rute, nama_tampil, satuan, harga, aktif, dibuat_oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `master_obat` (`fasyankes_id`, `kfa_kode`, `kfa_nama`, `bentuk_sediaan`, `rute`, `nama_tampil`, `satuan`, `harga`, `aktif`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (kfa_kode === undefined ? null : kfa_kode) ?? null, (kfa_nama === undefined ? null : kfa_nama) ?? null, (bentuk_sediaan === undefined ? null : bentuk_sediaan) ?? null, (rute === undefined ? null : rute) ?? null, (nama_tampil === undefined ? null : nama_tampil) ?? null, (satuan === undefined ? null : satuan) ?? null, (harga === undefined ? null : harga) ?? null, (aktif === undefined ? true : aktif) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahMasterObatUntukBuatMasterHasil(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`kfa_kode`, t.`kfa_nama`, t.`bentuk_sediaan`, t.`rute`, t.`nama_tampil`, t.`satuan`, t.`harga`, t.`aktif`, t.`dibuat_oleh`, t.`dibuat_pada`, t.`diubah_pada` FROM `master_obat` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris master_obat tidak ditemukan.');
    return baris[0];
}
export async function ubahMasterObatUntukUbahMaster(rute, nama_tampil, satuan, harga, aktif, diubah_pada, id, fasyankes_id, koneksi = pool) {
    const hasil = await tulis("UPDATE `master_obat` t SET `rute` = IF(?, t.`rute`, ?), `nama_tampil` = IF(?, t.`nama_tampil`, ?), `satuan` = IF(?, t.`satuan`, ?), `harga` = IF(?, t.`harga`, ?), `aktif` = IF(?, t.`aktif`, ?), `diubah_pada` = IF(?, t.`diubah_pada`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?))", [rute === undefined, rute ?? null, nama_tampil === undefined, nama_tampil ?? null, satuan === undefined, satuan ?? null, harga === undefined, harga ?? null, aktif === undefined, aktif ?? null, diubah_pada === undefined, diubah_pada ?? null, id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function cariMasterObatUntukMutasi(id, fasyankes_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id` FROM `master_obat` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) LIMIT 1", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function daftarMasterObatUntukObatAktifDari(fasyankes_id, aktif, id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`nama_tampil`, t.`satuan`, t.`harga` FROM `master_obat` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`aktif` <=> ?)) AND ((? OR t.`id` IN (?)))", [fasyankes_id === undefined, fasyankes_id ?? null, aktif === undefined, aktif ?? null, id === undefined, (id)?.length ? (id) : [null]], koneksi);
    return baris;
}
