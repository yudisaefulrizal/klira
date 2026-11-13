import { baca, tulis, pool } from '../koneksi.js';
export async function hitungRopaUntukDaftarRopa(fasyankes_id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `ropa` t WHERE ((? OR t.`fasyankes_id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function daftarRopaUntukDaftarRopa(fasyankes_id, batas, lewati, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`nama_kegiatan`, t.`ppdp_nama`, t.`sumber_tujuan`, t.`dasar`, t.`tujuan`, t.`jenis_data`, t.`kategori_subjek`, t.`pihak_akses`, t.`pemenuhan_hak`, t.`aliran`, t.`masa_retensi`, t.`pengamanan`, t.`transfer`, t.`dibuat_oleh`, t.`dibuat_pada`, t.`diperbarui_pada` FROM `ropa` t WHERE ((? OR t.`fasyankes_id` <=> ?)) ORDER BY t.`id` DESC LIMIT ? OFFSET ?", [fasyankes_id === undefined, fasyankes_id ?? null, batas ?? 2147483647, lewati ?? 0], koneksi);
    return baris;
}
export async function daftarRopaUntukSemuaRopa(fasyankes_id, batas, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`nama_kegiatan`, t.`ppdp_nama`, t.`sumber_tujuan`, t.`dasar`, t.`tujuan`, t.`jenis_data`, t.`kategori_subjek`, t.`pihak_akses`, t.`pemenuhan_hak`, t.`aliran`, t.`masa_retensi`, t.`pengamanan`, t.`transfer`, t.`dibuat_oleh`, t.`dibuat_pada`, t.`diperbarui_pada` FROM `ropa` t WHERE ((? OR t.`fasyankes_id` <=> ?)) ORDER BY t.`id` ASC LIMIT ? OFFSET ?", [fasyankes_id === undefined, fasyankes_id ?? null, batas ?? 2147483647, 0], koneksi);
    return baris;
}
export async function cariRopaUntukRopa(id, fasyankes_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`nama_kegiatan`, t.`ppdp_nama`, t.`sumber_tujuan`, t.`dasar`, t.`tujuan`, t.`jenis_data`, t.`kategori_subjek`, t.`pihak_akses`, t.`pemenuhan_hak`, t.`aliran`, t.`masa_retensi`, t.`pengamanan`, t.`transfer`, t.`dibuat_oleh`, t.`dibuat_pada`, t.`diperbarui_pada` FROM `ropa` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) LIMIT 1", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function tambahRopaUntukBuatRopa(fasyankes_id, nama_kegiatan, ppdp_nama, sumber_tujuan, dasar, tujuan, jenis_data, kategori_subjek, pihak_akses, pemenuhan_hak, aliran, masa_retensi, pengamanan, transfer, dibuat_oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `ropa` (`fasyankes_id`, `nama_kegiatan`, `ppdp_nama`, `sumber_tujuan`, `dasar`, `tujuan`, `jenis_data`, `kategori_subjek`, `pihak_akses`, `pemenuhan_hak`, `aliran`, `masa_retensi`, `pengamanan`, `transfer`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (nama_kegiatan === undefined ? null : nama_kegiatan) ?? null, (ppdp_nama === undefined ? null : ppdp_nama) ?? null, (sumber_tujuan === undefined ? null : sumber_tujuan) ?? null, (dasar === undefined ? null : dasar) ?? null, (tujuan === undefined ? null : tujuan) ?? null, (jenis_data === undefined ? null : jenis_data) ?? null, (kategori_subjek === undefined ? null : kategori_subjek) ?? null, (pihak_akses === undefined ? null : pihak_akses) ?? null, (pemenuhan_hak === undefined ? null : pemenuhan_hak) ?? null, (aliran === undefined ? null : aliran) ?? null, (masa_retensi === undefined ? null : masa_retensi) ?? null, (pengamanan === undefined ? null : pengamanan) ?? null, (transfer === undefined ? null : transfer) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahRopaUntukBuatRopaHasil(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`nama_kegiatan`, t.`ppdp_nama`, t.`sumber_tujuan`, t.`dasar`, t.`tujuan`, t.`jenis_data`, t.`kategori_subjek`, t.`pihak_akses`, t.`pemenuhan_hak`, t.`aliran`, t.`masa_retensi`, t.`pengamanan`, t.`transfer`, t.`dibuat_oleh`, t.`dibuat_pada`, t.`diperbarui_pada` FROM `ropa` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris ropa tidak ditemukan.');
    return baris[0];
}
export async function ubahRopaUntukUbahRopa(nama_kegiatan, ppdp_nama, sumber_tujuan, dasar, tujuan, jenis_data, kategori_subjek, pihak_akses, pemenuhan_hak, aliran, masa_retensi, pengamanan, transfer, diperbarui_pada, id, fasyankes_id, koneksi = pool) {
    const hasil = await tulis("UPDATE `ropa` t SET `nama_kegiatan` = IF(?, t.`nama_kegiatan`, ?), `ppdp_nama` = IF(?, t.`ppdp_nama`, ?), `sumber_tujuan` = IF(?, t.`sumber_tujuan`, ?), `dasar` = IF(?, t.`dasar`, ?), `tujuan` = IF(?, t.`tujuan`, ?), `jenis_data` = IF(?, t.`jenis_data`, ?), `kategori_subjek` = IF(?, t.`kategori_subjek`, ?), `pihak_akses` = IF(?, t.`pihak_akses`, ?), `pemenuhan_hak` = IF(?, t.`pemenuhan_hak`, ?), `aliran` = IF(?, t.`aliran`, ?), `masa_retensi` = IF(?, t.`masa_retensi`, ?), `pengamanan` = IF(?, t.`pengamanan`, ?), `transfer` = IF(?, t.`transfer`, ?), `diperbarui_pada` = IF(?, t.`diperbarui_pada`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?))", [nama_kegiatan === undefined, nama_kegiatan ?? null, ppdp_nama === undefined, ppdp_nama ?? null, sumber_tujuan === undefined, sumber_tujuan ?? null, dasar === undefined, dasar ?? null, tujuan === undefined, tujuan ?? null, jenis_data === undefined, jenis_data ?? null, kategori_subjek === undefined, kategori_subjek ?? null, pihak_akses === undefined, pihak_akses ?? null, pemenuhan_hak === undefined, pemenuhan_hak ?? null, aliran === undefined, aliran ?? null, masa_retensi === undefined, masa_retensi ?? null, pengamanan === undefined, pengamanan ?? null, transfer === undefined, transfer ?? null, diperbarui_pada === undefined, diperbarui_pada ?? null, id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function daftarRopaUntukDaftarDpia(fasyankes_id, id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`nama_kegiatan` FROM `ropa` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`id` IN (?)))", [fasyankes_id === undefined, fasyankes_id ?? null, id === undefined, (id)?.length ? (id) : [null]], koneksi);
    return baris;
}
export async function hitungRopaUntukRopaAda(id, fasyankes_id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `ropa` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?))", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return Number(baris.jumlah);
}
