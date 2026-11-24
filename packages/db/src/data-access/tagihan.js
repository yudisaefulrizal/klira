import { baca, tulis, pool } from '../koneksi.js';
import { kelompokkan } from '../pemeta.js';
export async function simpanTagihanUntukTambahItemTagihanDalam(kunjungan_id, dibuat_oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `tagihan` (`kunjungan_id`, `dibuat_oleh`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `id` = `id`, `id` = LAST_INSERT_ID(`id`)", [(kunjungan_id === undefined ? null : kunjungan_id) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function simpanTagihanUntukTambahItemTagihanDalamHasil(kunjungan_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`kunjungan_id`, t.`status_tagihan`, t.`status_pembayaran`, t.`dibuat_oleh`, t.`dibuat_pada`, t.`alasan_tutup_belum_lunas` FROM `tagihan` t WHERE ((? OR t.`kunjungan_id` <=> ?)) LIMIT 1", [kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris tagihan tidak ditemukan.');
    return baris[0];
}
export async function ubahTagihanUntukTambahItemTagihanDalam(status_tagihan, id, koneksi = pool) {
    const hasil = await tulis("UPDATE `tagihan` t SET `status_tagihan` = IF(?, t.`status_tagihan`, ?) WHERE ((? OR t.`id` <=> ?))", [status_tagihan === undefined, (status_tagihan ?? null), id === undefined, id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function tambahTagihanUntukSinkronItemTindakanDalam(kunjungan_id, dibuat_oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `tagihan` (`kunjungan_id`, `dibuat_oleh`) VALUES (?, ?)", [(kunjungan_id === undefined ? null : kunjungan_id) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahTagihanUntukSinkronItemTindakanDalamHasil(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`kunjungan_id`, t.`status_tagihan`, t.`status_pembayaran`, t.`dibuat_oleh`, t.`dibuat_pada`, t.`alasan_tutup_belum_lunas` FROM `tagihan` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris tagihan tidak ditemukan.');
    return baris[0];
}
export async function cariTagihanUntukGantiItemObatResepDalam(kunjungan_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id` FROM `tagihan` t WHERE ((? OR t.`kunjungan_id` <=> ?)) LIMIT 1", [kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function cariTagihanUntukAmbil(kunjungan_id, koneksi = pool) {
    function petakt1(semua) {
        return kelompokkan(semua, 't1', [
            'id', 'tagihan_id', 'jenis', 'tarif_layanan_id', 'kode', 'nama', 'jumlah', 'harga', 'order_penunjang_id',
            'item_resep_id', 'manual', 'tindakan_sumber', 'harga_acuan', 'alasan_ubah_harga', 'dibuat_oleh',
            'dibuat_pada',
        ]);
    }
    function petakt0(semua) {
        return kelompokkan(semua, 't0', [
            'id', 'kunjungan_id', 'status_tagihan', 'status_pembayaran', 'dibuat_oleh', 'dibuat_pada',
            'alasan_tutup_belum_lunas',
            ['item', (baris) => petakt1(baris)],
        ]);
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`kunjungan_id` AS `t0__kunjungan_id`, t0.`status_tagihan` AS `t0__status_tagihan`, t0.`status_pembayaran` AS `t0__status_pembayaran`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t0.`alasan_tutup_belum_lunas` AS `t0__alasan_tutup_belum_lunas`, t1.`id` AS `t1__id`, t1.`tagihan_id` AS `t1__tagihan_id`, t1.`jenis` AS `t1__jenis`, t1.`tarif_layanan_id` AS `t1__tarif_layanan_id`, t1.`kode` AS `t1__kode`, t1.`nama` AS `t1__nama`, t1.`jumlah` AS `t1__jumlah`, t1.`harga` AS `t1__harga`, t1.`order_penunjang_id` AS `t1__order_penunjang_id`, t1.`item_resep_id` AS `t1__item_resep_id`, t1.`manual` AS `t1__manual`, t1.`tindakan_sumber` AS `t1__tindakan_sumber`, t1.`harga_acuan` AS `t1__harga_acuan`, t1.`alasan_ubah_harga` AS `t1__alasan_ubah_harga`, t1.`dibuat_oleh` AS `t1__dibuat_oleh`, t1.`dibuat_pada` AS `t1__dibuat_pada`\nFROM (SELECT t0.* FROM `tagihan` t0 WHERE ((? OR t0.`kunjungan_id` <=> ?)) LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `item_tagihan` b1 WHERE TRUE) t1 ON t0.`id` = t1.`tagihan_id`\nORDER BY t1.`id` ASC", [kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
    const hasil = petakt0(baris);
    return (hasil[0] ?? null);
}
export async function ambilTagihanUntukTeruskanDariRawatJalan(kunjungan_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`kunjungan_id`, t.`status_tagihan`, t.`status_pembayaran`, t.`dibuat_oleh`, t.`dibuat_pada`, t.`alasan_tutup_belum_lunas` FROM `tagihan` t WHERE ((? OR t.`kunjungan_id` <=> ?)) LIMIT 1", [kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function cariTagihanUntukBuatResep(kunjungan_id, koneksi = pool) {
    function petakt1(semua) {
        return kelompokkan(semua, 't1', [
            'jumlah', 'harga',
        ]);
    }
    function petakt0(semua) {
        return kelompokkan(semua, 't0', [
            'id', 'kunjungan_id', 'status_tagihan', 'status_pembayaran', 'dibuat_oleh', 'dibuat_pada',
            'alasan_tutup_belum_lunas',
            ['item', (baris) => petakt1(baris)],
        ]);
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`kunjungan_id` AS `t0__kunjungan_id`, t0.`status_tagihan` AS `t0__status_tagihan`, t0.`status_pembayaran` AS `t0__status_pembayaran`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t0.`alasan_tutup_belum_lunas` AS `t0__alasan_tutup_belum_lunas`, t1.`id` AS `t1__id`, t1.`jumlah` AS `t1__jumlah`, t1.`harga` AS `t1__harga`\nFROM (SELECT t0.* FROM `tagihan` t0 WHERE ((? OR t0.`kunjungan_id` <=> ?)) LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `item_tagihan` b1 WHERE TRUE) t1 ON t0.`id` = t1.`tagihan_id`\nORDER BY t1.`id` ASC", [kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
    const hasil = petakt0(baris);
    return (hasil[0] ?? null);
}
export async function cariTagihanUntukTagihan(kunjungan_id, koneksi = pool) {
    function petakt1(semua) {
        return kelompokkan(semua, 't1', [
            'id', 'tagihan_id', 'jenis', 'tarif_layanan_id', 'kode', 'nama', 'jumlah', 'harga', 'order_penunjang_id',
            'item_resep_id', 'manual', 'tindakan_sumber', 'harga_acuan', 'alasan_ubah_harga', 'dibuat_oleh',
            'dibuat_pada',
        ]);
    }
    function petakt2(semua) {
        return kelompokkan(semua, 't2', [
            'id', 'tagihan_id', 'shift_id', 'metode', 'jumlah', 'waktu', 'kasir_id',
        ]);
    }
    function petakt0(semua) {
        return kelompokkan(semua, 't0', [
            'id', 'kunjungan_id', 'status_tagihan', 'status_pembayaran', 'dibuat_oleh', 'dibuat_pada',
            'alasan_tutup_belum_lunas',
            ['item', (baris) => petakt1(baris)],
            ['pembayaran', (baris) => petakt2(baris)],
        ]);
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`kunjungan_id` AS `t0__kunjungan_id`, t0.`status_tagihan` AS `t0__status_tagihan`, t0.`status_pembayaran` AS `t0__status_pembayaran`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t0.`alasan_tutup_belum_lunas` AS `t0__alasan_tutup_belum_lunas`, t1.`id` AS `t1__id`, t1.`tagihan_id` AS `t1__tagihan_id`, t1.`jenis` AS `t1__jenis`, t1.`tarif_layanan_id` AS `t1__tarif_layanan_id`, t1.`kode` AS `t1__kode`, t1.`nama` AS `t1__nama`, t1.`jumlah` AS `t1__jumlah`, t1.`harga` AS `t1__harga`, t1.`order_penunjang_id` AS `t1__order_penunjang_id`, t1.`item_resep_id` AS `t1__item_resep_id`, t1.`manual` AS `t1__manual`, t1.`tindakan_sumber` AS `t1__tindakan_sumber`, t1.`harga_acuan` AS `t1__harga_acuan`, t1.`alasan_ubah_harga` AS `t1__alasan_ubah_harga`, t1.`dibuat_oleh` AS `t1__dibuat_oleh`, t1.`dibuat_pada` AS `t1__dibuat_pada`, t2.`id` AS `t2__id`, t2.`tagihan_id` AS `t2__tagihan_id`, t2.`shift_id` AS `t2__shift_id`, t2.`metode` AS `t2__metode`, t2.`jumlah` AS `t2__jumlah`, t2.`waktu` AS `t2__waktu`, t2.`kasir_id` AS `t2__kasir_id`\nFROM (SELECT t0.* FROM `tagihan` t0 WHERE ((? OR t0.`kunjungan_id` <=> ?)) LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `item_tagihan` b1 WHERE TRUE) t1 ON t0.`id` = t1.`tagihan_id`\nLEFT JOIN (SELECT b2.* FROM `pembayaran` b2 WHERE TRUE) t2 ON t0.`id` = t2.`tagihan_id`\nORDER BY t1.`id` ASC, t2.`id` ASC", [kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
    const hasil = petakt0(baris);
    return (hasil[0] ?? null);
}
export async function wajibTagihanUntukBayar(id, koneksi = pool) {
    function petakt1(semua) {
        return kelompokkan(semua, 't1', [
            'jumlah', 'harga',
        ]);
    }
    function petakt2(semua) {
        return kelompokkan(semua, 't2', [
            'jumlah',
        ]);
    }
    function petakt0(semua) {
        return kelompokkan(semua, 't0', [
            'id', 'kunjungan_id', 'status_tagihan', 'status_pembayaran', 'dibuat_oleh', 'dibuat_pada',
            'alasan_tutup_belum_lunas',
            ['item', (baris) => petakt1(baris)],
            ['pembayaran', (baris) => petakt2(baris)],
        ]);
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`kunjungan_id` AS `t0__kunjungan_id`, t0.`status_tagihan` AS `t0__status_tagihan`, t0.`status_pembayaran` AS `t0__status_pembayaran`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t0.`alasan_tutup_belum_lunas` AS `t0__alasan_tutup_belum_lunas`, t1.`id` AS `t1__id`, t1.`jumlah` AS `t1__jumlah`, t1.`harga` AS `t1__harga`, t2.`id` AS `t2__id`, t2.`jumlah` AS `t2__jumlah`\nFROM (SELECT t0.* FROM `tagihan` t0 WHERE ((? OR t0.`id` <=> ?)) LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `item_tagihan` b1 WHERE TRUE) t1 ON t0.`id` = t1.`tagihan_id`\nLEFT JOIN (SELECT b2.* FROM `pembayaran` b2 WHERE TRUE) t2 ON t0.`id` = t2.`tagihan_id`\nORDER BY t1.`id` ASC, t2.`id` ASC", [id === undefined, id ?? null], koneksi);
    const hasil = petakt0(baris);
    if (!hasil[0])
        throw new Error('Baris tagihan tidak ditemukan.');
    return hasil[0];
}
export async function ubahTagihanUntukBayar(status_pembayaran, id, koneksi = pool) {
    const hasil = await tulis("UPDATE `tagihan` t SET `status_pembayaran` = IF(?, t.`status_pembayaran`, ?) WHERE ((? OR t.`id` <=> ?))", [status_pembayaran === undefined, (status_pembayaran ?? null), id === undefined, id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function ubahTagihanUntukHitungUlang(status_tagihan, status_pembayaran, id, koneksi = pool) {
    const hasil = await tulis("UPDATE `tagihan` t SET `status_tagihan` = IF(?, t.`status_tagihan`, ?), `status_pembayaran` = IF(?, t.`status_pembayaran`, ?) WHERE ((? OR t.`id` <=> ?))", [status_tagihan === undefined, (status_tagihan ?? null), status_pembayaran === undefined, (status_pembayaran ?? null), id === undefined, id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function ambilTagihanUntukTutup(kunjungan_id, koneksi = pool) {
    function petakt1(semua) {
        return kelompokkan(semua, 't1', [
            'jumlah', 'harga',
        ]);
    }
    function petakt2(semua) {
        return kelompokkan(semua, 't2', [
            'jumlah',
        ]);
    }
    function petakt0(semua) {
        return kelompokkan(semua, 't0', [
            'id', 'kunjungan_id', 'status_tagihan', 'status_pembayaran', 'dibuat_oleh', 'dibuat_pada',
            'alasan_tutup_belum_lunas',
            ['item', (baris) => petakt1(baris)],
            ['pembayaran', (baris) => petakt2(baris)],
        ]);
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`kunjungan_id` AS `t0__kunjungan_id`, t0.`status_tagihan` AS `t0__status_tagihan`, t0.`status_pembayaran` AS `t0__status_pembayaran`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t0.`alasan_tutup_belum_lunas` AS `t0__alasan_tutup_belum_lunas`, t1.`id` AS `t1__id`, t1.`jumlah` AS `t1__jumlah`, t1.`harga` AS `t1__harga`, t2.`id` AS `t2__id`, t2.`jumlah` AS `t2__jumlah`\nFROM (SELECT t0.* FROM `tagihan` t0 WHERE ((? OR t0.`kunjungan_id` <=> ?)) LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `item_tagihan` b1 WHERE TRUE) t1 ON t0.`id` = t1.`tagihan_id`\nLEFT JOIN (SELECT b2.* FROM `pembayaran` b2 WHERE TRUE) t2 ON t0.`id` = t2.`tagihan_id`\nORDER BY t1.`id` ASC, t2.`id` ASC", [kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
    const hasil = petakt0(baris);
    return (hasil[0] ?? null);
}
export async function ubahTagihanUntukTutup(alasan_tutup_belum_lunas, id, koneksi = pool) {
    const hasil = await tulis("UPDATE `tagihan` t SET `alasan_tutup_belum_lunas` = IF(?, t.`alasan_tutup_belum_lunas`, ?) WHERE ((? OR t.`id` <=> ?))", [alasan_tutup_belum_lunas === undefined, alasan_tutup_belum_lunas ?? null, id === undefined, id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function wajibTagihanUntukBuatOrder(id, koneksi = pool) {
    function petakt1(semua) {
        return kelompokkan(semua, 't1', [
            'harga', 'jumlah',
        ]);
    }
    function petakt0(semua) {
        return kelompokkan(semua, 't0', [
            'id', 'kunjungan_id', 'status_tagihan', 'status_pembayaran', 'dibuat_oleh', 'dibuat_pada',
            'alasan_tutup_belum_lunas',
            ['item', (baris) => petakt1(baris)],
        ]);
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`kunjungan_id` AS `t0__kunjungan_id`, t0.`status_tagihan` AS `t0__status_tagihan`, t0.`status_pembayaran` AS `t0__status_pembayaran`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t0.`alasan_tutup_belum_lunas` AS `t0__alasan_tutup_belum_lunas`, t1.`id` AS `t1__id`, t1.`harga` AS `t1__harga`, t1.`jumlah` AS `t1__jumlah`\nFROM (SELECT t0.* FROM `tagihan` t0 WHERE ((? OR t0.`id` <=> ?)) LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `item_tagihan` b1 WHERE TRUE) t1 ON t0.`id` = t1.`tagihan_id`\nORDER BY t1.`id` ASC", [id === undefined, id ?? null], koneksi);
    const hasil = petakt0(baris);
    if (!hasil[0])
        throw new Error('Baris tagihan tidak ditemukan.');
    return hasil[0];
}
export async function kunciTagihanKunjungan(kunjunganId, koneksi = pool) {
    return baca("SELECT id FROM tagihan WHERE kunjungan_id = ? FOR UPDATE", [kunjunganId], koneksi);
}
