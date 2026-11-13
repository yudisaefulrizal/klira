import { baca, tulis, pool } from '../koneksi.js';
export async function daftarTindakanUntukBacaVersiLepas(fasyankes_id, kunjungan_id, versi, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`versi`, t.`kode_icd9cm`, t.`nama`, t.`tarif_layanan_id`, t.`jumlah`, t.`performer_id`, t.`mulai`, t.`selesai`, t.`urutan`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `tindakan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`versi` <=> ?)) ORDER BY t.`urutan` ASC", [fasyankes_id === undefined, fasyankes_id ?? null, kunjungan_id === undefined, kunjungan_id ?? null, versi === undefined, versi ?? null], koneksi);
    return baris;
}
export async function tambahBanyakTindakanUntukTulisIsi(data, koneksi = pool) {
    if (!data.length)
        return { count: 0 };
    const nilai = data.map(d => [(d.fasyankes_id === undefined ? null : d.fasyankes_id) ?? null, (d.kunjungan_id === undefined ? null : d.kunjungan_id) ?? null, (d.versi === undefined ? null : d.versi) ?? null, (d.kode_icd9cm === undefined ? null : d.kode_icd9cm) ?? null, (d.nama === undefined ? null : d.nama) ?? null, (d.tarif_layanan_id === undefined ? null : d.tarif_layanan_id) ?? null, (d.jumlah === undefined ? 1 : d.jumlah) ?? null, (d.performer_id === undefined ? null : d.performer_id) ?? null, (d.mulai === undefined ? null : d.mulai) ?? null, (d.selesai === undefined ? null : d.selesai) ?? null, (d.urutan === undefined ? null : d.urutan) ?? null, (d.dibuat_oleh === undefined ? null : d.dibuat_oleh) ?? null, (d.dibuat_pada === undefined ? new Date() : d.dibuat_pada) ?? null]);
    const hasil = await tulis("INSERT INTO `tindakan` (`fasyankes_id`, `kunjungan_id`, `versi`, `kode_icd9cm`, `nama`, `tarif_layanan_id`, `jumlah`, `performer_id`, `mulai`, `selesai`, `urutan`, `dibuat_oleh`, `dibuat_pada`) VALUES ?", [nilai], koneksi);
    return { count: hasil.affectedRows };
}
