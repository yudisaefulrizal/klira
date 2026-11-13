import { baca, tulis, pool } from '../koneksi.js';
export async function tambahItemTagihanUntukTambahItemTagihanDalam(fasyankes_id, tagihan_id, jenis, tarif_layanan_id, kode, nama, jumlah, harga, order_penunjang_id, item_resep_id, dibuat_oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `item_tagihan` (`fasyankes_id`, `tagihan_id`, `jenis`, `tarif_layanan_id`, `kode`, `nama`, `jumlah`, `harga`, `order_penunjang_id`, `item_resep_id`, `harga_acuan`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (tagihan_id === undefined ? null : tagihan_id) ?? null, ((jenis === undefined ? null : jenis) ?? null), (tarif_layanan_id === undefined ? null : tarif_layanan_id) ?? null, (kode === undefined ? null : kode) ?? null, (nama === undefined ? null : nama) ?? null, (jumlah === undefined ? 1 : jumlah) ?? null, (harga === undefined ? null : harga) ?? null, (order_penunjang_id === undefined ? null : order_penunjang_id) ?? null, (item_resep_id === undefined ? null : item_resep_id) ?? null, (harga === undefined ? null : harga) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function daftarItemTagihanUntukTambahItemTagihanDalam(tagihan_id, koneksi = pool) {
    const baris = await baca("SELECT t.`harga` FROM `item_tagihan` t WHERE ((? OR t.`tagihan_id` <=> ?))", [tagihan_id === undefined, tagihan_id ?? null], koneksi);
    return baris;
}
export async function daftarItemTagihanUntukSinkronItemTindakanDalam(tagihan_id, tindakan_sumber, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`tagihan_id`, t.`jenis`, t.`tarif_layanan_id`, t.`kode`, t.`nama`, t.`jumlah`, t.`harga`, t.`order_penunjang_id`, t.`item_resep_id`, t.`manual`, t.`tindakan_sumber`, t.`harga_acuan`, t.`alasan_ubah_harga`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `item_tagihan` t WHERE ((? OR t.`tagihan_id` <=> ?)) AND ((? OR t.`tindakan_sumber` <=> ?)) ORDER BY t.`id` ASC", [tagihan_id === undefined, tagihan_id ?? null, tindakan_sumber === undefined, tindakan_sumber ?? null], koneksi);
    return baris;
}
export async function hapusItemTagihanUntukSinkronItemTindakanDalam(tagihan_id, tindakan_sumber, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `item_tagihan` t WHERE ((? OR t.`tagihan_id` <=> ?)) AND ((? OR t.`tindakan_sumber` <=> ?))", [tagihan_id === undefined, tagihan_id ?? null, tindakan_sumber === undefined, tindakan_sumber ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function tambahBanyakItemTagihanUntukSinkronItemTindakanDalam(data, koneksi = pool) {
    if (!data.length)
        return { count: 0 };
    const nilai = data.map(d => [(d.fasyankes_id === undefined ? null : d.fasyankes_id) ?? null, (d.tagihan_id === undefined ? null : d.tagihan_id) ?? null, ((d.jenis === undefined ? null : d.jenis) ?? null), (d.tarif_layanan_id === undefined ? null : d.tarif_layanan_id) ?? null, (d.kode === undefined ? null : d.kode) ?? null, (d.nama === undefined ? null : d.nama) ?? null, (d.jumlah === undefined ? 1 : d.jumlah) ?? null, (d.harga === undefined ? null : d.harga) ?? null, (d.order_penunjang_id === undefined ? null : d.order_penunjang_id) ?? null, (d.item_resep_id === undefined ? null : d.item_resep_id) ?? null, (d.manual === undefined ? false : d.manual) ?? null, (d.tindakan_sumber === undefined ? false : d.tindakan_sumber) ?? null, (d.harga_acuan === undefined ? null : d.harga_acuan) ?? null, (d.alasan_ubah_harga === undefined ? null : d.alasan_ubah_harga) ?? null, (d.dibuat_oleh === undefined ? null : d.dibuat_oleh) ?? null, (d.dibuat_pada === undefined ? new Date() : d.dibuat_pada) ?? null]);
    const hasil = await tulis("INSERT INTO `item_tagihan` (`fasyankes_id`, `tagihan_id`, `jenis`, `tarif_layanan_id`, `kode`, `nama`, `jumlah`, `harga`, `order_penunjang_id`, `item_resep_id`, `manual`, `tindakan_sumber`, `harga_acuan`, `alasan_ubah_harga`, `dibuat_oleh`, `dibuat_pada`) VALUES ?", [nilai], koneksi);
    return { count: hasil.affectedRows };
}
export async function hapusItemTagihanUntukGantiItemObatResepDalam(fasyankes_id, item_resep_id, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `item_tagihan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`item_resep_id` IN (?)))", [fasyankes_id === undefined, fasyankes_id ?? null, item_resep_id === undefined, (item_resep_id)?.length ? (item_resep_id) : [null]], koneksi);
    return { count: hasil.affectedRows };
}
export async function ubahItemTagihanUntukTeruskanDariRawatJalan(tagihan_id, tagihan_id2, koneksi = pool) {
    const hasil = await tulis("UPDATE `item_tagihan` t SET `tagihan_id` = IF(?, t.`tagihan_id`, ?) WHERE ((? OR t.`tagihan_id` <=> ?))", [tagihan_id === undefined, tagihan_id ?? null, tagihan_id2 === undefined, tagihan_id2 ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function cariItemTagihanUntukLengkapiHarga(id, fasyankes_id, kunjungan_id, koneksi = pool) {
    function petakt1(semua) {
        const grup = new Map();
        for (const baris of semua) {
            if (baris.t1__id === null)
                continue;
            const kunci = String(baris.t1__id);
            const isi = grup.get(kunci);
            if (isi)
                isi.push(baris);
            else
                grup.set(kunci, [baris]);
        }
        return [...grup.values()].map(baris => ({ id: baris[0].t1__id }));
    }
    function petakt0(semua) {
        const grup = new Map();
        for (const baris of semua) {
            if (baris.t0__id === null)
                continue;
            const kunci = String(baris.t0__id);
            const isi = grup.get(kunci);
            if (isi)
                isi.push(baris);
            else
                grup.set(kunci, [baris]);
        }
        return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, tagihan_id: baris[0].t0__tagihan_id, jenis: baris[0].t0__jenis, tarif_layanan_id: baris[0].t0__tarif_layanan_id, kode: baris[0].t0__kode, nama: baris[0].t0__nama, jumlah: baris[0].t0__jumlah, harga: baris[0].t0__harga, order_penunjang_id: baris[0].t0__order_penunjang_id, item_resep_id: baris[0].t0__item_resep_id, manual: baris[0].t0__manual, tindakan_sumber: baris[0].t0__tindakan_sumber, harga_acuan: baris[0].t0__harga_acuan, alasan_ubah_harga: baris[0].t0__alasan_ubah_harga, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, tagihan: petakt1(baris)[0] }));
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`tagihan_id` AS `t0__tagihan_id`, t0.`jenis` AS `t0__jenis`, t0.`tarif_layanan_id` AS `t0__tarif_layanan_id`, t0.`kode` AS `t0__kode`, t0.`nama` AS `t0__nama`, t0.`jumlah` AS `t0__jumlah`, t0.`harga` AS `t0__harga`, t0.`order_penunjang_id` AS `t0__order_penunjang_id`, t0.`item_resep_id` AS `t0__item_resep_id`, t0.`manual` AS `t0__manual`, t0.`tindakan_sumber` AS `t0__tindakan_sumber`, t0.`harga_acuan` AS `t0__harga_acuan`, t0.`alasan_ubah_harga` AS `t0__alasan_ubah_harga`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t1.`id` AS `t1__id`\nFROM (SELECT t0.* FROM `item_tagihan` t0 WHERE ((? OR t0.`id` <=> ?)) AND ((? OR t0.`fasyankes_id` <=> ?)) AND (EXISTS (SELECT 1 FROM `tagihan` r1 WHERE t0.`tagihan_id` = r1.`id` AND (((? OR r1.`kunjungan_id` <=> ?))))) LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `tagihan` b1 WHERE TRUE) t1 ON t0.`tagihan_id` = t1.`id`\nORDER BY t1.`id` ASC", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null, kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
    const hasil = petakt0(baris);
    return (hasil[0] ?? null);
}
export async function ubahItemTagihanUntukLengkapiHarga(harga, id, harga2, koneksi = pool) {
    const hasil = await tulis("UPDATE `item_tagihan` t SET `harga` = IF(?, t.`harga`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`harga` <=> ?))", [harga === undefined, harga ?? null, id === undefined, id ?? null, harga2 === undefined, harga2 ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function cariItemTagihanUntukUbahHarga(id, tagihan_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`tagihan_id`, t.`jenis`, t.`tarif_layanan_id`, t.`kode`, t.`nama`, t.`jumlah`, t.`harga`, t.`order_penunjang_id`, t.`item_resep_id`, t.`manual`, t.`tindakan_sumber`, t.`harga_acuan`, t.`alasan_ubah_harga`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `item_tagihan` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`tagihan_id` <=> ?)) LIMIT 1", [id === undefined, id ?? null, tagihan_id === undefined, tagihan_id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function ubahItemTagihanUntukUbahHarga(harga, harga_acuan, alasan_ubah_harga, id, koneksi = pool) {
    const hasil = await tulis("UPDATE `item_tagihan` t SET `harga` = IF(?, t.`harga`, ?), `harga_acuan` = IF(?, t.`harga_acuan`, ?), `alasan_ubah_harga` = IF(?, t.`alasan_ubah_harga`, ?) WHERE ((? OR t.`id` <=> ?))", [harga === undefined, harga ?? null, harga_acuan === undefined, harga_acuan ?? null, alasan_ubah_harga === undefined, alasan_ubah_harga ?? null, id === undefined, id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function tambahItemTagihanUntukTambahItem(fasyankes_id, tagihan_id, jenis, tarif_layanan_id, kode, nama, jumlah, harga, manual, dibuat_oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `item_tagihan` (`fasyankes_id`, `tagihan_id`, `jenis`, `tarif_layanan_id`, `kode`, `nama`, `jumlah`, `harga`, `manual`, `harga_acuan`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (tagihan_id === undefined ? null : tagihan_id) ?? null, ((jenis === undefined ? null : jenis) ?? null), (tarif_layanan_id === undefined ? null : tarif_layanan_id) ?? null, (kode === undefined ? null : kode) ?? null, (nama === undefined ? null : nama) ?? null, (jumlah === undefined ? 1 : jumlah) ?? null, (harga === undefined ? null : harga) ?? null, (manual === undefined ? false : manual) ?? null, (harga === undefined ? null : harga) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function hapusItemTagihanUntukHapusItem(id, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `item_tagihan` t WHERE ((? OR t.`id` <=> ?))", [id === undefined, id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
