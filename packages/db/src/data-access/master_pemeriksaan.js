import { baca, tulis, pool } from '../koneksi.js';
import { wajibId } from '../wajib.js';
export async function hitungMasterPemeriksaanUntukHitungKesiapan(aktif, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `master_pemeriksaan` t WHERE ((? OR t.`aktif` <=> ?))", [aktif === undefined, aktif ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function hitungMasterPemeriksaanUntukHitungKesiapan2(aktif, tarif_layanan_id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `master_pemeriksaan` t WHERE ((? OR t.`aktif` <=> ?)) AND ((? OR t.`tarif_layanan_id` <=> ?))", [aktif === undefined, aktif ?? null, tarif_layanan_id === undefined, tarif_layanan_id ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function daftarMasterPemeriksaanUntukMasterAktifDari(aktif, jenis, id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`kode`, t.`nama`, t.`jenis`, t.`kode_loinc`, t.`jenis_spesimen`, t.`satuan`, t.`rujukan_min`, t.`rujukan_maks`, t.`rujukan_teks`, t.`tarif_layanan_id`, t.`aktif`, t.`dibuat_oleh`, t.`dibuat_pada`, t.`diubah_pada` FROM `master_pemeriksaan` t WHERE ((? OR t.`aktif` <=> ?)) AND ((? OR t.`jenis` <=> ?)) AND ((? OR t.`id` IN (?)))", [aktif === undefined, aktif ?? null, jenis === undefined, jenis ?? null, id === undefined, (id)?.length ? (id) : [null]], koneksi);
    return baris;
}
export async function daftarMasterPemeriksaanUntukDaftarMaster(jenis, aktif, nama, kode_loinc, pakai, batas, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`kode`, t.`nama`, t.`jenis`, t.`kode_loinc`, t.`jenis_spesimen`, t.`satuan`, t.`rujukan_min`, t.`rujukan_maks`, t.`rujukan_teks`, t.`tarif_layanan_id`, t.`aktif`, t.`dibuat_oleh`, t.`dibuat_pada`, t.`diubah_pada` FROM `master_pemeriksaan` t WHERE ((? OR t.`jenis` <=> ?)) AND ((? OR t.`aktif` <=> ?)) AND ((? OR ((((? OR t.`nama` LIKE ? ESCAPE '!'))) OR (((? OR t.`kode` LIKE ? ESCAPE '!'))) OR (((? OR t.`kode_loinc` LIKE ? ESCAPE '!')))))) ORDER BY t.`nama` ASC, t.`id` ASC LIMIT ? OFFSET ?", [jenis === undefined, jenis ?? null, aktif === undefined, aktif ?? null, !pakai, nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', kode_loinc === undefined, '%' + String(kode_loinc ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', batas ?? 2147483647, 0], koneksi);
    return baris;
}
export async function cariMasterPemeriksaanUntukMaster(id, koneksi = pool) {
    wajibId('cariMasterPemeriksaanUntukMaster', id);
    const baris = await baca("SELECT t.`id`, t.`kode`, t.`nama`, t.`jenis`, t.`kode_loinc`, t.`jenis_spesimen`, t.`satuan`, t.`rujukan_min`, t.`rujukan_maks`, t.`rujukan_teks`, t.`tarif_layanan_id`, t.`aktif`, t.`dibuat_oleh`, t.`dibuat_pada`, t.`diubah_pada` FROM `master_pemeriksaan` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function tambahMasterPemeriksaanUntukBuatMaster(kode, nama, jenis, kode_loinc, jenis_spesimen, satuan, rujukan_min, rujukan_maks, rujukan_teks, tarif_layanan_id, aktif, dibuat_oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `master_pemeriksaan` (`kode`, `nama`, `jenis`, `kode_loinc`, `jenis_spesimen`, `satuan`, `rujukan_min`, `rujukan_maks`, `rujukan_teks`, `tarif_layanan_id`, `aktif`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [(kode === undefined ? null : kode) ?? null, (nama === undefined ? null : nama) ?? null, (jenis === undefined ? "lab" : jenis) ?? null, (kode_loinc === undefined ? null : kode_loinc) ?? null, (jenis_spesimen === undefined ? null : jenis_spesimen) ?? null, (satuan === undefined ? null : satuan) ?? null, (rujukan_min === undefined ? null : rujukan_min) ?? null, (rujukan_maks === undefined ? null : rujukan_maks) ?? null, (rujukan_teks === undefined ? null : rujukan_teks) ?? null, (tarif_layanan_id === undefined ? null : tarif_layanan_id) ?? null, (aktif === undefined ? true : aktif) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahMasterPemeriksaanUntukBuatMasterHasil(id, koneksi = pool) {
    wajibId('tambahMasterPemeriksaanUntukBuatMasterHasil', id);
    const baris = await baca("SELECT t.`id`, t.`kode`, t.`nama`, t.`jenis`, t.`kode_loinc`, t.`jenis_spesimen`, t.`satuan`, t.`rujukan_min`, t.`rujukan_maks`, t.`rujukan_teks`, t.`tarif_layanan_id`, t.`aktif`, t.`dibuat_oleh`, t.`dibuat_pada`, t.`diubah_pada` FROM `master_pemeriksaan` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris master_pemeriksaan tidak ditemukan.');
    return baris[0];
}
export async function ubahMasterPemeriksaanUntukUbahMaster(kode, nama, kode_loinc, jenis_spesimen, satuan, rujukan_min, rujukan_maks, rujukan_teks, tarif_layanan_id, aktif, diubah_pada, id, koneksi = pool) {
    wajibId('ubahMasterPemeriksaanUntukUbahMaster', id);
    const hasil = await tulis("UPDATE `master_pemeriksaan` t SET `kode` = IF(?, t.`kode`, ?), `nama` = IF(?, t.`nama`, ?), `kode_loinc` = IF(?, t.`kode_loinc`, ?), `jenis_spesimen` = IF(?, t.`jenis_spesimen`, ?), `satuan` = IF(?, t.`satuan`, ?), `rujukan_min` = IF(?, t.`rujukan_min`, ?), `rujukan_maks` = IF(?, t.`rujukan_maks`, ?), `rujukan_teks` = IF(?, t.`rujukan_teks`, ?), `tarif_layanan_id` = IF(?, t.`tarif_layanan_id`, ?), `aktif` = IF(?, t.`aktif`, ?), `diubah_pada` = IF(?, t.`diubah_pada`, ?) WHERE ((? OR t.`id` <=> ?))", [kode === undefined, kode ?? null, nama === undefined, nama ?? null, kode_loinc === undefined, kode_loinc ?? null, jenis_spesimen === undefined, jenis_spesimen ?? null, satuan === undefined, satuan ?? null, rujukan_min === undefined, rujukan_min ?? null, rujukan_maks === undefined, rujukan_maks ?? null, rujukan_teks === undefined, rujukan_teks ?? null, tarif_layanan_id === undefined, tarif_layanan_id ?? null, aktif === undefined, aktif ?? null, diubah_pada === undefined, diubah_pada ?? null, id === undefined, id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
