import { baca, tulis, pool } from '../koneksi.js';
export async function ambilIgEventUntukWebhookInstagram(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id` FROM `ig_event` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function tambahIgEventUntukWebhookInstagram(id, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `ig_event` (`id`) VALUES (?)", [(id === undefined ? null : id) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function hapusIgEventUntukBuatRuteInstagramPublik(koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `ig_event` t WHERE TRUE", [], koneksi);
    return { count: hasil.affectedRows };
}
