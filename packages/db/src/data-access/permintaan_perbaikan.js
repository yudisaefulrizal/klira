import { baca, tulis, pool } from '../koneksi.js';
export async function hitungPermintaanPerbaikanUntukAdaMenunggu(kunjungan_id, bagian, status, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `permintaan_perbaikan` t WHERE ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`bagian` <=> ?)) AND ((? OR t.`status` <=> ?))", [kunjungan_id === undefined, kunjungan_id ?? null, bagian === undefined, bagian ?? null, status === undefined, status ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function tambahPermintaanPerbaikanUntukBuatPermintaan(kunjungan_id, bagian, isi_baru, alasan, pemohon_id, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `permintaan_perbaikan` (`kunjungan_id`, `bagian`, `isi_baru`, `alasan`, `pemohon_id`) VALUES (?, ?, ?, ?, ?)", [(kunjungan_id === undefined ? null : kunjungan_id) ?? null, (bagian === undefined ? null : bagian) ?? null, JSON.stringify((isi_baru === undefined ? null : isi_baru) ?? null), (alasan === undefined ? null : alasan) ?? null, (pemohon_id === undefined ? null : pemohon_id) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahPermintaanPerbaikanUntukBuatPermintaanHasil(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`kunjungan_id`, t.`bagian`, t.`isi_baru`, t.`alasan`, t.`pemohon_id`, t.`status`, t.`penyetuju_id`, t.`catatan_keputusan`, t.`waktu_keputusan`, t.`dibuat_pada` FROM `permintaan_perbaikan` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    for (const b of baris)
        if (typeof b.isi_baru === 'string')
            b.isi_baru = JSON.parse(b.isi_baru);
    if (!baris[0])
        throw new Error('Baris permintaan_perbaikan tidak ditemukan.');
    return baris[0];
}
export async function cariPermintaanPerbaikanUntukPermintaan(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`kunjungan_id`, t.`bagian`, t.`isi_baru`, t.`alasan`, t.`pemohon_id`, t.`status`, t.`penyetuju_id`, t.`catatan_keputusan`, t.`waktu_keputusan`, t.`dibuat_pada` FROM `permintaan_perbaikan` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    for (const b of baris)
        if (typeof b.isi_baru === 'string')
            b.isi_baru = JSON.parse(b.isi_baru);
    return (baris[0] ?? null);
}
export async function ubahPermintaanPerbaikanUntukPutuskan(status, penyetuju_id, catatan_keputusan, waktu_keputusan, id, status2, koneksi = pool) {
    const hasil = await tulis("UPDATE `permintaan_perbaikan` t SET `status` = IF(?, t.`status`, ?), `penyetuju_id` = IF(?, t.`penyetuju_id`, ?), `catatan_keputusan` = IF(?, t.`catatan_keputusan`, ?), `waktu_keputusan` = IF(?, t.`waktu_keputusan`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`status` <=> ?))", [status === undefined, (status ?? null), penyetuju_id === undefined, penyetuju_id ?? null, catatan_keputusan === undefined, catatan_keputusan ?? null, waktu_keputusan === undefined, waktu_keputusan ?? null, id === undefined, id ?? null, status2 === undefined, status2 ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function ubahPermintaanPerbaikanUntukKembalikan(status, penyetuju_id, catatan_keputusan, waktu_keputusan, id, koneksi = pool) {
    const hasil = await tulis("UPDATE `permintaan_perbaikan` t SET `status` = IF(?, t.`status`, ?), `penyetuju_id` = IF(?, t.`penyetuju_id`, ?), `catatan_keputusan` = IF(?, t.`catatan_keputusan`, ?), `waktu_keputusan` = IF(?, t.`waktu_keputusan`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((? OR NOT (t.`status` <=> ?)))", [status === undefined, (status ?? null), penyetuju_id === undefined, penyetuju_id ?? null, catatan_keputusan === undefined, catatan_keputusan ?? null, waktu_keputusan === undefined, waktu_keputusan ?? null, id === undefined, id ?? null, status === undefined, status ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function hitungPermintaanPerbaikanUntukDaftarPermintaan(status, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `permintaan_perbaikan` t WHERE ((? OR t.`status` <=> ?))", [status === undefined, status ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function daftarPermintaanPerbaikanUntukDaftarPermintaan(status, batas, lewati, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`kunjungan_id`, t.`bagian`, t.`isi_baru`, t.`alasan`, t.`pemohon_id`, t.`status`, t.`penyetuju_id`, t.`catatan_keputusan`, t.`waktu_keputusan`, t.`dibuat_pada` FROM `permintaan_perbaikan` t WHERE ((? OR t.`status` <=> ?)) ORDER BY t.`id` DESC LIMIT ? OFFSET ?", [status === undefined, status ?? null, batas ?? 2147483647, lewati ?? 0], koneksi);
    for (const b of baris)
        if (typeof b.isi_baru === 'string')
            b.isi_baru = JSON.parse(b.isi_baru);
    return baris;
}
export async function kelompokPermintaanPerbaikanUntukBerkas(status, kunjungan_id, koneksi = pool) {
    const baris = await baca("SELECT t.`kunjungan_id`, COUNT(*) AS `_count__all` FROM `permintaan_perbaikan` t WHERE ((? OR t.`status` <=> ?)) AND ((? OR t.`kunjungan_id` IN (?))) GROUP BY t.`kunjungan_id`", [status === undefined, status ?? null, kunjungan_id === undefined, (kunjungan_id)?.length ? (kunjungan_id) : [null]], koneksi);
    const hasil = baris.map(b => ({ kunjungan_id: b.kunjungan_id, _count: { _all: Number(b._count__all) } }));
    return hasil;
}
