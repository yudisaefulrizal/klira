import { baca, tulis, pool } from '../koneksi.js';
import { kelompokkan } from '../pemeta.js';
import { wajibId } from '../wajib.js';
export async function daftarLokasiUntukBacaKlinikPublik(jenis, status_operasional, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`nama` FROM `lokasi` t WHERE ((? OR t.`jenis` <=> ?)) AND ((? OR t.`status_operasional` <=> ?)) ORDER BY t.`nama` ASC", [jenis === undefined, jenis ?? null, status_operasional === undefined, status_operasional ?? null], koneksi);
    return baris;
}
export async function daftarLokasiUntukBuatRuteStatistik(jenis, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`nama` FROM `lokasi` t WHERE ((? OR t.`jenis` <=> ?)) ORDER BY t.`nama` ASC", [jenis === undefined, jenis ?? null], koneksi);
    return baris;
}
export async function hitungLokasiUntukDaftar(jenis, status_operasional, nama, ihs_location_id, pakai, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `lokasi` t WHERE ((? OR t.`jenis` <=> ?)) AND ((? OR t.`status_operasional` <=> ?)) AND ((? OR ((((? OR t.`nama` LIKE ? ESCAPE '!'))) OR (((? OR t.`ihs_location_id` LIKE ? ESCAPE '!'))) OR ((EXISTS (SELECT 1 FROM `lokasi` r1 WHERE t.`induk_id` = r1.`id` AND (((? OR r1.`nama` LIKE ? ESCAPE '!')))))))))", [jenis === undefined, jenis ?? null, status_operasional === undefined, status_operasional ?? null, !pakai, nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', ihs_location_id === undefined, '%' + String(ihs_location_id ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%'], koneksi);
    return Number(baris.jumlah);
}
export async function daftarLokasiUntukDaftar(jenis, status_operasional, nama, ihs_location_id, pakai, batas, lewati, koneksi = pool) {
    function petakt1(semua) {
        return kelompokkan(semua, 't1', [
            'nama',
        ]);
    }
    function petakt0(semua) {
        return kelompokkan(semua, 't0', [
            'id', 'nama', 'jenis', 'induk_id', 'status_operasional', 'ihs_location_id', 'dibuat_oleh', 'dibuat_pada',
            ['induk', (baris) => petakt1(baris)[0] ?? null],
        ]);
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`nama` AS `t0__nama`, t0.`jenis` AS `t0__jenis`, t0.`induk_id` AS `t0__induk_id`, t0.`status_operasional` AS `t0__status_operasional`, t0.`ihs_location_id` AS `t0__ihs_location_id`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t1.`id` AS `t1__id`, t1.`nama` AS `t1__nama`\nFROM (SELECT t0.* FROM `lokasi` t0 WHERE ((? OR t0.`jenis` <=> ?)) AND ((? OR t0.`status_operasional` <=> ?)) AND ((? OR ((((? OR t0.`nama` LIKE ? ESCAPE '!'))) OR (((? OR t0.`ihs_location_id` LIKE ? ESCAPE '!'))) OR ((EXISTS (SELECT 1 FROM `lokasi` r1 WHERE t0.`induk_id` = r1.`id` AND (((? OR r1.`nama` LIKE ? ESCAPE '!'))))))))) ORDER BY t0.`nama` ASC, t0.`id` ASC LIMIT ? OFFSET ?) t0\nLEFT JOIN (SELECT b1.* FROM `lokasi` b1 WHERE TRUE) t1 ON t0.`induk_id` = t1.`id`\nORDER BY t0.`nama` ASC, t0.`id` ASC, t1.`id` ASC", [jenis === undefined, jenis ?? null, status_operasional === undefined, status_operasional ?? null, !pakai, nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', ihs_location_id === undefined, '%' + String(ihs_location_id ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', batas ?? 2147483647, lewati ?? 0], koneksi);
    const hasil = petakt0(baris);
    return hasil;
}
export async function cariLokasiUntukAmbil(id, jenis, koneksi = pool) {
    function petakt1(semua) {
        return kelompokkan(semua, 't1', [
            'nama',
        ]);
    }
    function petakt0(semua) {
        return kelompokkan(semua, 't0', [
            'id', 'nama', 'jenis', 'induk_id', 'status_operasional', 'ihs_location_id', 'dibuat_oleh', 'dibuat_pada',
            ['induk', (baris) => petakt1(baris)[0] ?? null],
        ]);
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`nama` AS `t0__nama`, t0.`jenis` AS `t0__jenis`, t0.`induk_id` AS `t0__induk_id`, t0.`status_operasional` AS `t0__status_operasional`, t0.`ihs_location_id` AS `t0__ihs_location_id`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t1.`id` AS `t1__id`, t1.`nama` AS `t1__nama`\nFROM (SELECT t0.* FROM `lokasi` t0 WHERE ((? OR t0.`id` <=> ?)) AND ((? OR t0.`jenis` <=> ?)) LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `lokasi` b1 WHERE TRUE) t1 ON t0.`induk_id` = t1.`id`\nORDER BY t1.`id` ASC", [id === undefined, id ?? null, jenis === undefined, jenis ?? null], koneksi);
    const hasil = petakt0(baris);
    return (hasil[0] ?? null);
}
export async function tambahLokasiUntukBuat(nama, jenis, induk_id, status_operasional, ihs_location_id, dibuat_oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `lokasi` (`nama`, `jenis`, `induk_id`, `status_operasional`, `ihs_location_id`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?)", [(nama === undefined ? null : nama) ?? null, ((jenis === undefined ? null : jenis) ?? null), (induk_id === undefined ? null : induk_id) ?? null, ((status_operasional === undefined ? "O" : status_operasional) ?? null), (ihs_location_id === undefined ? null : ihs_location_id) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahLokasiUntukBuatHasil(id, koneksi = pool) {
    function petakt1(semua) {
        return kelompokkan(semua, 't1', [
            'nama',
        ]);
    }
    function petakt0(semua) {
        return kelompokkan(semua, 't0', [
            'id', 'nama', 'jenis', 'induk_id', 'status_operasional', 'ihs_location_id', 'dibuat_oleh', 'dibuat_pada',
            ['induk', (baris) => petakt1(baris)[0] ?? null],
        ]);
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`nama` AS `t0__nama`, t0.`jenis` AS `t0__jenis`, t0.`induk_id` AS `t0__induk_id`, t0.`status_operasional` AS `t0__status_operasional`, t0.`ihs_location_id` AS `t0__ihs_location_id`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t1.`id` AS `t1__id`, t1.`nama` AS `t1__nama`\nFROM (SELECT t0.* FROM `lokasi` t0 WHERE ((? OR t0.`id` <=> ?)) LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `lokasi` b1 WHERE TRUE) t1 ON t0.`induk_id` = t1.`id`\nORDER BY t1.`id` ASC", [id === undefined, id ?? null], koneksi);
    const hasil = petakt0(baris);
    if (!hasil[0])
        throw new Error('Baris lokasi tidak ditemukan.');
    return hasil[0];
}
export async function ubahLokasiUntukUbah(nama, induk_id, status_operasional, ihs_location_id, id, koneksi = pool) {
    wajibId('ubahLokasiUntukUbah', id);
    const hasil = await tulis("UPDATE `lokasi` t SET `nama` = IF(?, t.`nama`, ?), `induk_id` = IF(?, t.`induk_id`, ?), `status_operasional` = IF(?, t.`status_operasional`, ?), `ihs_location_id` = IF(?, t.`ihs_location_id`, ?) WHERE ((? OR t.`id` <=> ?))", [nama === undefined, nama ?? null, induk_id === undefined, induk_id ?? null, status_operasional === undefined, (status_operasional ?? null), ihs_location_id === undefined, ihs_location_id ?? null, id === undefined, id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function ubahLokasiUntukSetAktif(status_operasional, id, koneksi = pool) {
    wajibId('ubahLokasiUntukSetAktif', id);
    const hasil = await tulis("UPDATE `lokasi` t SET `status_operasional` = IF(?, t.`status_operasional`, ?) WHERE ((? OR t.`id` <=> ?))", [status_operasional === undefined, (status_operasional ?? null), id === undefined, id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function daftarLokasiUntukOpsi(jenis, status_operasional, nama, batas, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`nama` FROM `lokasi` t WHERE ((? OR t.`jenis` <=> ?)) AND ((? OR t.`status_operasional` <=> ?)) AND ((? OR t.`nama` LIKE ? ESCAPE '!')) ORDER BY t.`nama` ASC LIMIT ? OFFSET ?", [jenis === undefined, jenis ?? null, status_operasional === undefined, status_operasional ?? null, nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', batas ?? 2147483647, 0], koneksi);
    return baris;
}
/** Jumlah lokasi sejenis dengan nama sama (tanpa beda huruf besar/kecil), di luar lokasi yang sedang diubah. */
export async function hitungLokasiUntukNamaAda(jenis, nama, kecuali_id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `lokasi` t WHERE t.`jenis` = ? AND LOWER(TRIM(t.`nama`)) = LOWER(TRIM(?)) AND (? OR t.`id` <> ?)", [jenis, nama, kecuali_id === undefined, kecuali_id ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function hitungLokasiUntukLokasiAda(id, jenis, koneksi = pool) {
    wajibId('hitungLokasiUntukLokasiAda', id);
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `lokasi` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`jenis` <=> ?))", [id === undefined, id ?? null, jenis === undefined, jenis ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function hitungLokasiUntukHitungKesiapan(jenis, status_operasional, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `lokasi` t WHERE ((? OR t.`jenis` <=> ?)) AND ((? OR t.`status_operasional` <=> ?))", [jenis === undefined, jenis ?? null, status_operasional === undefined, status_operasional ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function daftarLokasiUntukPetakan(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`nama` FROM `lokasi` t WHERE ((? OR t.`id` IN (?)))", [id === undefined, (id)?.length ? (id) : [null]], koneksi);
    return baris;
}
export async function hitungLokasiUntukPoliOperasional(id, jenis, status_operasional, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `lokasi` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`jenis` <=> ?)) AND ((? OR t.`status_operasional` <=> ?))", [id === undefined, id ?? null, jenis === undefined, jenis ?? null, status_operasional === undefined, status_operasional ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function daftarLokasiUntukOpsi2(jenis, status_operasional, batas, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`nama` FROM `lokasi` t WHERE ((? OR t.`jenis` <=> ?)) AND ((? OR t.`status_operasional` <=> ?)) ORDER BY t.`nama` ASC LIMIT ? OFFSET ?", [jenis === undefined, jenis ?? null, status_operasional === undefined, status_operasional ?? null, batas ?? 2147483647, 0], koneksi);
    return baris;
}
export async function wajibLokasiUntukUbahAntrean(id, koneksi = pool) {
    wajibId('wajibLokasiUntukUbahAntrean', id);
    const baris = await baca("SELECT t.`id`, t.`nama`, t.`status_operasional` FROM `lokasi` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris lokasi tidak ditemukan.');
    return baris[0];
}
export async function daftarLokasiUntukPetakanAntrean(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`nama` FROM `lokasi` t WHERE ((? OR t.`id` IN (?)))", [id === undefined, (id)?.length ? (id) : [null]], koneksi);
    return baris;
}
export async function cariLokasiUntukKonteks(id, koneksi = pool) {
    wajibId('cariLokasiUntukKonteks', id);
    const baris = await baca("SELECT t.`nama`, t.`kategori_poli` FROM `lokasi` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function daftarLokasiUntukLaporan(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`nama` FROM `lokasi` t WHERE ((? OR t.`id` IN (?)))", [id === undefined, (id)?.length ? (id) : [null]], koneksi);
    return baris;
}
export async function daftarLokasiUntukBedSemua(jenis, batas, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`nama`, t.`jenis`, t.`induk_id`, t.`status_operasional`, t.`ihs_location_id`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `lokasi` t WHERE ((? OR t.`jenis` <=> ?)) ORDER BY t.`induk_id` ASC, t.`nama` ASC LIMIT ? OFFSET ?", [jenis === undefined, jenis ?? null, batas ?? 2147483647, 0], koneksi);
    return baris;
}
export async function cariLokasiUntukAsal(id, koneksi = pool) {
    wajibId('cariLokasiUntukAsal', id);
    const baris = await baca("SELECT t.`nama` FROM `lokasi` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function cariLokasiUntukPastikanBedBebas(id, jenis, koneksi = pool) {
    wajibId('cariLokasiUntukPastikanBedBebas', id);
    const baris = await baca("SELECT t.`id`, t.`nama`, t.`jenis`, t.`induk_id`, t.`status_operasional`, t.`ihs_location_id`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `lokasi` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`jenis` <=> ?)) LIMIT 1", [id === undefined, id ?? null, jenis === undefined, jenis ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function ubahLokasiUntukTempatkan(status_operasional, id, koneksi = pool) {
    wajibId('ubahLokasiUntukTempatkan', id);
    const hasil = await tulis("UPDATE `lokasi` t SET `status_operasional` = IF(?, t.`status_operasional`, ?) WHERE ((? OR t.`id` <=> ?))", [status_operasional === undefined, (status_operasional ?? null), id === undefined, id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function daftarLokasiUntukDetail(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`nama`, t.`induk_id` FROM `lokasi` t WHERE ((? OR t.`id` IN (?)))", [id === undefined, (id)?.length ? (id) : [null]], koneksi);
    return baris;
}
export function kunciLokasiRawatInap(id, koneksi) {
    return baca('SELECT id FROM lokasi WHERE id = ? FOR UPDATE', [id], koneksi);
}

/** Poli (layanan) beserta kategori, awalan antrean, semua status operasional; untuk opsi pendaftaran, panggilan, dan master. */
export async function daftarPoli(koneksi = pool) {
    return baca("SELECT t.`id`, t.`nama`, t.`kategori_poli`, t.`awalan_antrean`, t.`status_operasional` FROM `lokasi` t WHERE t.`jenis` = 'poli' ORDER BY t.`nama` ASC", [], koneksi);
}
/** Awalan antrean dan kategori untuk sekumpulan poli (master). */
export async function daftarAwalanPoli(ids, koneksi = pool) {
    if (!ids.length)
        return [];
    return baca("SELECT t.`id`, t.`awalan_antrean`, t.`kategori_poli` FROM `lokasi` t WHERE t.`id` IN (?)", [ids], koneksi);
}
export async function ubahAwalanPoli(id, awalan_antrean, koneksi = pool) {
    const hasil = await tulis("UPDATE `lokasi` t SET t.`awalan_antrean` = ? WHERE t.`id` = ? AND t.`jenis` = 'poli'", [awalan_antrean, id], koneksi);
    return { count: hasil.affectedRows };
}
export async function ubahKategoriPoli(id, kategori_poli, koneksi = pool) {
    const hasil = await tulis("UPDATE `lokasi` t SET t.`kategori_poli` = ? WHERE t.`id` = ? AND t.`jenis` = 'poli'", [kategori_poli ?? 'umum', id], koneksi);
    return { count: hasil.affectedRows };
}
/** Ruang periksa milik satu poli (semua status operasional). */
export async function daftarRuangPeriksaUntukPoli(poli_id, koneksi = pool) {
    return baca("SELECT t.`id`, t.`nama`, t.`status_operasional` FROM `lokasi` t WHERE t.`jenis` = 'ruang_periksa' AND t.`induk_id` = ? ORDER BY t.`nama` ASC, t.`id` ASC", [poli_id], koneksi);
}
/** Semua ruang periksa operasional beserta poli induknya (layar panggilan). */
export async function daftarRuangPeriksaOperasional(koneksi = pool) {
    return baca("SELECT t.`id`, t.`nama`, t.`induk_id` FROM `lokasi` t WHERE t.`jenis` = 'ruang_periksa' AND t.`status_operasional` = 'O' ORDER BY t.`nama` ASC, t.`id` ASC", [], koneksi);
}
/** Jumlah lokasi anak per induk (ruang periksa per poli, bed per ruang rawat inap). */
export async function hitungAnakLokasi(induk_ids, koneksi = pool) {
    if (!induk_ids.length)
        return [];
    return baca("SELECT t.`induk_id`, COUNT(*) AS `jumlah` FROM `lokasi` t WHERE t.`induk_id` IN (?) GROUP BY t.`induk_id`", [induk_ids], koneksi);
}
export async function hapusLokasi(id, koneksi = pool) {
    const hasil = await tulis('DELETE FROM `lokasi` WHERE `id` = ?', [id], koneksi);
    return { count: hasil.affectedRows };
}
export async function ubahTarifLokasi(id, tarif_id, koneksi = pool) {
    const hasil = await tulis("UPDATE `lokasi` SET `tarif_id` = ? WHERE `id` = ? AND `jenis` = 'ruang'", [tarif_id ?? null, id], koneksi);
    return { count: hasil.affectedRows };
}
export async function daftarTarifRuang(ids, koneksi = pool) {
    if (!ids.length)
        return [];
    return baca('SELECT l.`id`, l.`tarif_id`, t.`nama` AS `tarif_nama`, t.`harga_umum`, t.`harga_jkn` FROM `lokasi` l LEFT JOIN `tarif_layanan` t ON t.`id` = l.`tarif_id` WHERE l.`id` IN (?)', [ids], koneksi);
}
