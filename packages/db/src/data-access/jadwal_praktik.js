import { baca, tulis, pool } from '../koneksi.js';
import { kelompokkan } from '../pemeta.js';
import { wajibId } from '../wajib.js';
export async function daftarJadwalPraktikUntukBacaKlinikPublik(aktif, lokasi_id, koneksi = pool) {
    function petakt1(semua) {
        return kelompokkan(semua, 't1', [
            'nama',
        ]);
    }
    function petakt0(semua) {
        return kelompokkan(semua, 't0', [
            'hari', 'shift_id', 'lokasi_id',
            ['pengguna', (baris) => petakt1(baris)[0]],
        ]);
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`hari` AS `t0__hari`, t0.`shift_id` AS `t0__shift_id`, t0.`lokasi_id` AS `t0__lokasi_id`, t1.`id` AS `t1__id`, t1.`nama` AS `t1__nama`\nFROM (SELECT t0.* FROM `jadwal_praktik` t0 WHERE ((? OR t0.`lokasi_id` IN (?))) AND (EXISTS (SELECT 1 FROM `pengguna` r1 WHERE t0.`pengguna_id` = r1.`id` AND (((? OR r1.`aktif` <=> ?)) AND (EXISTS (SELECT 1 FROM `profil_profesi` r2 WHERE r1.`id` = r2.`pengguna_id` AND (((? OR r2.`aktif` <=> ?)))))))) ORDER BY t0.`hari` ASC, t0.`shift_id` ASC) t0\nLEFT JOIN (SELECT b1.* FROM `pengguna` b1 WHERE TRUE) t1 ON t0.`pengguna_id` = t1.`id`\nORDER BY t0.`hari` ASC, t0.`shift_id` ASC, t1.`id` ASC", [lokasi_id === undefined, (lokasi_id)?.length ? (lokasi_id) : [null], aktif === undefined, aktif ?? null, aktif === undefined, aktif ?? null], koneksi);
    const hasil = petakt0(baris);
    return hasil;
}
export async function hitungJadwalPraktikUntukDaftar(nama, pakai, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `jadwal_praktik` t WHERE ((? OR (((EXISTS (SELECT 1 FROM `pengguna` r1 WHERE t.`pengguna_id` = r1.`id` AND (((? OR r1.`nama` LIKE ? ESCAPE '!')))))) OR ((EXISTS (SELECT 1 FROM `lokasi` r2 WHERE t.`lokasi_id` = r2.`id` AND (((? OR r2.`nama` LIKE ? ESCAPE '!')))))))))", [!pakai, nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%'], koneksi);
    return Number(baris.jumlah);
}
export async function daftarJadwalPraktikUntukDaftar(nama, pakai, batas, lewati, koneksi = pool) {
    function petakt1(semua) {
        return kelompokkan(semua, 't1', [
            'nama',
        ]);
    }
    function petakt2(semua) {
        return kelompokkan(semua, 't2', [
            'nama',
        ]);
    }
    function petakt0(semua) {
        return kelompokkan(semua, 't0', [
            'id', 'pengguna_id', 'lokasi_id', 'hari', 'shift_id', 'kuota', 'dibuat_oleh', 'dibuat_pada',
            ['pengguna', (baris) => petakt1(baris)[0]],
            ['lokasi', (baris) => petakt2(baris)[0]],
        ]);
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`pengguna_id` AS `t0__pengguna_id`, t0.`lokasi_id` AS `t0__lokasi_id`, t0.`hari` AS `t0__hari`, t0.`shift_id` AS `t0__shift_id`, t0.`kuota` AS `t0__kuota`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t1.`id` AS `t1__id`, t1.`nama` AS `t1__nama`, t2.`id` AS `t2__id`, t2.`nama` AS `t2__nama`\nFROM (SELECT t0.* FROM `jadwal_praktik` t0 WHERE ((? OR (((EXISTS (SELECT 1 FROM `pengguna` r1 WHERE t0.`pengguna_id` = r1.`id` AND (((? OR r1.`nama` LIKE ? ESCAPE '!')))))) OR ((EXISTS (SELECT 1 FROM `lokasi` r2 WHERE t0.`lokasi_id` = r2.`id` AND (((? OR r2.`nama` LIKE ? ESCAPE '!'))))))))) ORDER BY t0.`hari` ASC, t0.`shift_id` ASC, t0.`id` ASC LIMIT ? OFFSET ?) t0\nLEFT JOIN (SELECT b1.* FROM `pengguna` b1 WHERE TRUE) t1 ON t0.`pengguna_id` = t1.`id`\nLEFT JOIN (SELECT b2.* FROM `lokasi` b2 WHERE TRUE) t2 ON t0.`lokasi_id` = t2.`id`\nORDER BY t0.`hari` ASC, t0.`shift_id` ASC, t0.`id` ASC, t1.`id` ASC, t2.`id` ASC", [!pakai, nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', batas ?? 2147483647, lewati ?? 0], koneksi);
    const hasil = petakt0(baris);
    return hasil;
}
export async function cariJadwalPraktikUntukAmbil(id, koneksi = pool) {
    function petakt1(semua) {
        return kelompokkan(semua, 't1', [
            'nama',
        ]);
    }
    function petakt2(semua) {
        return kelompokkan(semua, 't2', [
            'nama',
        ]);
    }
    function petakt0(semua) {
        return kelompokkan(semua, 't0', [
            'id', 'pengguna_id', 'lokasi_id', 'hari', 'shift_id', 'kuota', 'dibuat_oleh', 'dibuat_pada',
            ['pengguna', (baris) => petakt1(baris)[0]],
            ['lokasi', (baris) => petakt2(baris)[0]],
        ]);
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`pengguna_id` AS `t0__pengguna_id`, t0.`lokasi_id` AS `t0__lokasi_id`, t0.`hari` AS `t0__hari`, t0.`shift_id` AS `t0__shift_id`, t0.`kuota` AS `t0__kuota`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t1.`id` AS `t1__id`, t1.`nama` AS `t1__nama`, t2.`id` AS `t2__id`, t2.`nama` AS `t2__nama`\nFROM (SELECT t0.* FROM `jadwal_praktik` t0 WHERE ((? OR t0.`id` <=> ?)) LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `pengguna` b1 WHERE TRUE) t1 ON t0.`pengguna_id` = t1.`id`\nLEFT JOIN (SELECT b2.* FROM `lokasi` b2 WHERE TRUE) t2 ON t0.`lokasi_id` = t2.`id`\nORDER BY t1.`id` ASC, t2.`id` ASC", [id === undefined, id ?? null], koneksi);
    const hasil = petakt0(baris);
    return (hasil[0] ?? null);
}
export async function tambahJadwalPraktikUntukBuat(pengguna_id, lokasi_id, hari, shift_id, kuota, dibuat_oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `jadwal_praktik` (`pengguna_id`, `lokasi_id`, `hari`, `shift_id`, `kuota`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?)", [(pengguna_id === undefined ? null : pengguna_id) ?? null, (lokasi_id === undefined ? null : lokasi_id) ?? null, (hari === undefined ? null : hari) ?? null, (shift_id === undefined ? null : shift_id) ?? null, (kuota === undefined ? null : kuota) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahJadwalPraktikUntukBuatHasil(id, koneksi = pool) {
    function petakt1(semua) {
        return kelompokkan(semua, 't1', [
            'nama',
        ]);
    }
    function petakt2(semua) {
        return kelompokkan(semua, 't2', [
            'nama',
        ]);
    }
    function petakt0(semua) {
        return kelompokkan(semua, 't0', [
            'id', 'pengguna_id', 'lokasi_id', 'hari', 'shift_id', 'kuota', 'dibuat_oleh', 'dibuat_pada',
            ['pengguna', (baris) => petakt1(baris)[0]],
            ['lokasi', (baris) => petakt2(baris)[0]],
        ]);
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`pengguna_id` AS `t0__pengguna_id`, t0.`lokasi_id` AS `t0__lokasi_id`, t0.`hari` AS `t0__hari`, t0.`shift_id` AS `t0__shift_id`, t0.`kuota` AS `t0__kuota`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t1.`id` AS `t1__id`, t1.`nama` AS `t1__nama`, t2.`id` AS `t2__id`, t2.`nama` AS `t2__nama`\nFROM (SELECT t0.* FROM `jadwal_praktik` t0 WHERE ((? OR t0.`id` <=> ?)) LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `pengguna` b1 WHERE TRUE) t1 ON t0.`pengguna_id` = t1.`id`\nLEFT JOIN (SELECT b2.* FROM `lokasi` b2 WHERE TRUE) t2 ON t0.`lokasi_id` = t2.`id`\nORDER BY t1.`id` ASC, t2.`id` ASC", [id === undefined, id ?? null], koneksi);
    const hasil = petakt0(baris);
    if (!hasil[0])
        throw new Error('Baris jadwal_praktik tidak ditemukan.');
    return hasil[0];
}
export async function ubahJadwalPraktikUntukUbah(pengguna_id, lokasi_id, hari, shift_id, kuota, id, koneksi = pool) {
    wajibId('ubahJadwalPraktikUntukUbah', id);
    const hasil = await tulis("UPDATE `jadwal_praktik` t SET `pengguna_id` = IF(?, t.`pengguna_id`, ?), `lokasi_id` = IF(?, t.`lokasi_id`, ?), `hari` = IF(?, t.`hari`, ?), `shift_id` = IF(?, t.`shift_id`, ?), `kuota` = IF(?, t.`kuota`, ?) WHERE ((? OR t.`id` <=> ?))", [pengguna_id === undefined, pengguna_id ?? null, lokasi_id === undefined, lokasi_id ?? null, hari === undefined, hari ?? null, shift_id === undefined, shift_id ?? null, kuota === undefined, kuota ?? null, id === undefined, id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function hitungJadwalPraktikUntukHitungKesiapan(koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `jadwal_praktik` t WHERE TRUE", [], koneksi);
    return Number(baris.jumlah);
}
export async function hitungJadwalPraktikUntukDokterDiPoli(pengguna_id, lokasi_id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `jadwal_praktik` t WHERE ((? OR t.`pengguna_id` <=> ?)) AND ((? OR t.`lokasi_id` <=> ?))", [pengguna_id === undefined, pengguna_id ?? null, lokasi_id === undefined, lokasi_id ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function daftarJadwalPraktikUntukOpsi(koneksi = pool) {
    const baris = await baca("SELECT t.`pengguna_id`, t.`lokasi_id` FROM `jadwal_praktik` t WHERE TRUE", [], koneksi);
    return baris;
}

export async function hapusJadwalPraktikUntukHapus(id, koneksi = pool) {
    const hasil = await tulis("DELETE FROM `jadwal_praktik` WHERE `id` = ?", [id], koneksi);
    return { count: hasil.affectedRows };
}

/** Jadwal lain milik dokter yang sama pada hari dan shift yang sama (bentrok), dengan nama poli-nya; null bila tidak ada. */
export async function cariJadwalPraktikUntukBentrok(pengguna_id, hari, shift_id, kecuali_id, koneksi = pool) {
    const [baris] = await baca("SELECT j.`id`, l.`nama` AS lokasi_nama FROM `jadwal_praktik` j JOIN `lokasi` l ON l.`id` = j.`lokasi_id` WHERE j.`pengguna_id` = ? AND j.`hari` = ? AND j.`shift_id` = ? AND (? IS NULL OR j.`id` <> ?) LIMIT 1", [pengguna_id, hari, shift_id, kecuali_id ?? null, kecuali_id ?? null], koneksi);
    return baris ?? null;
}
