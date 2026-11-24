import { baca, tulis, pool } from '../koneksi.js';
import { kelompokkan } from '../pemeta.js';
export async function ambilFasyankesUntukPengaturanWebsite(id, koneksi = pool) {
    function petakt1(semua) {
        return kelompokkan(semua, 't1', [
            'aktif', 'slug', 'domain', 'judul', 'ringkasan', 'tentang', 'alamat', 'whatsapp', 'telepon', 'email',
            'jam_operasional', 'warna_utama', 'logo_url', 'hero_url', 'tampilkan_jadwal', 'tampilkan_nama_praktisi',
        ]);
    }
    function petakt0(semua) {
        return kelompokkan(semua, 't0', [
            'nama',
            ['website_klinik', (baris) => petakt1(baris)[0] ?? null],
        ]);
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`nama` AS `t0__nama`, t1.`id` AS `t1__id`, t1.`aktif` AS `t1__aktif`, t1.`slug` AS `t1__slug`, t1.`domain` AS `t1__domain`, t1.`judul` AS `t1__judul`, t1.`ringkasan` AS `t1__ringkasan`, t1.`tentang` AS `t1__tentang`, t1.`alamat` AS `t1__alamat`, t1.`whatsapp` AS `t1__whatsapp`, t1.`telepon` AS `t1__telepon`, t1.`email` AS `t1__email`, t1.`jam_operasional` AS `t1__jam_operasional`, t1.`warna_utama` AS `t1__warna_utama`, t1.`logo_url` AS `t1__logo_url`, t1.`hero_url` AS `t1__hero_url`, t1.`tampilkan_jadwal` AS `t1__tampilkan_jadwal`, t1.`tampilkan_nama_praktisi` AS `t1__tampilkan_nama_praktisi`\nFROM (SELECT t0.* FROM `fasyankes` t0 WHERE ((? OR t0.`id` <=> ?)) LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `website_klinik` b1 LIMIT 1) t1 ON TRUE\nORDER BY t1.`id` ASC", [id === undefined, id ?? null], koneksi);
    const hasil = petakt0(baris);
    return (hasil[0] ?? null);
}
export async function ambilFasyankesUntukBuatRuteLayarPanggilan(id, koneksi = pool) {
    function petakt1(semua) {
        return kelompokkan(semua, 't1', [
            'logo_url',
        ]);
    }
    function petakt0(semua) {
        return kelompokkan(semua, 't0', [
            'nama',
            ['website_klinik', (baris) => petakt1(baris)[0] ?? null],
        ]);
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`nama` AS `t0__nama`, t1.`id` AS `t1__id`, t1.`logo_url` AS `t1__logo_url`\nFROM (SELECT t0.* FROM `fasyankes` t0 WHERE ((? OR t0.`id` <=> ?)) LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `website_klinik` b1 LIMIT 1) t1 ON TRUE\nORDER BY t1.`id` ASC", [id === undefined, id ?? null], koneksi);
    const hasil = petakt0(baris);
    return (hasil[0] ?? null);
}
export async function ambilFasyankesUntukAmbil(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`nama`, t.`jenis`, t.`bentuk_usaha`, t.`kode_registrasi`, t.`organization_id`, t.`status_akreditasi`, t.`tanggal_akreditasi`, t.`puskesmas_wilayah` FROM `fasyankes` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function hitungFasyankesUntukKodeDipakaiLain(kode_registrasi, id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `fasyankes` t WHERE ((? OR t.`kode_registrasi` <=> ?)) AND ((? OR NOT (t.`id` <=> ?)))", [kode_registrasi === undefined, kode_registrasi ?? null, id === undefined, id ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function ubahFasyankesUntukSimpan(nama, jenis, bentuk_usaha, kode_registrasi, organization_id, status_akreditasi, tanggal_akreditasi, puskesmas_wilayah, id, koneksi = pool) {
    const hasil = await tulis("UPDATE `fasyankes` t SET `nama` = IF(?, t.`nama`, ?), `jenis` = IF(?, t.`jenis`, ?), `bentuk_usaha` = IF(?, t.`bentuk_usaha`, ?), `kode_registrasi` = IF(?, t.`kode_registrasi`, ?), `organization_id` = IF(?, t.`organization_id`, ?), `status_akreditasi` = IF(?, t.`status_akreditasi`, ?), `tanggal_akreditasi` = IF(?, t.`tanggal_akreditasi`, ?), `puskesmas_wilayah` = IF(?, t.`puskesmas_wilayah`, ?) WHERE ((? OR t.`id` <=> ?))", [nama === undefined, nama ?? null, jenis === undefined, (jenis ?? null), bentuk_usaha === undefined, bentuk_usaha ?? null, kode_registrasi === undefined, kode_registrasi ?? null, organization_id === undefined, organization_id ?? null, status_akreditasi === undefined, status_akreditasi ?? null, tanggal_akreditasi === undefined, tanggal_akreditasi ?? null, puskesmas_wilayah === undefined, puskesmas_wilayah ?? null, id === undefined, id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function ubahFasyankesUntukSimpanHasil(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`nama`, t.`jenis`, t.`bentuk_usaha`, t.`kode_registrasi`, t.`organization_id`, t.`status_akreditasi`, t.`tanggal_akreditasi`, t.`puskesmas_wilayah` FROM `fasyankes` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris fasyankes tidak ditemukan.');
    return baris[0];
}
export async function ambilFasyankesUntukUpgrade(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id` FROM `fasyankes` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function tambahFasyankesUntukJalankanSeed(nama, jenis, kode_registrasi, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `fasyankes` (`nama`, `jenis`, `kode_registrasi`) VALUES (?, ?, ?)", [(nama === undefined ? null : nama) ?? null, ((jenis === undefined ? null : jenis) ?? null), (kode_registrasi === undefined ? null : kode_registrasi) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahFasyankesUntukJalankanSeedHasil(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`nama`, t.`jenis`, t.`bentuk_usaha`, t.`kode_registrasi`, t.`organization_id`, t.`status_akreditasi`, t.`tanggal_akreditasi`, t.`puskesmas_wilayah`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `fasyankes` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris fasyankes tidak ditemukan.');
    return baris[0];
}
export async function kunciFasyankes(fasyankesId, koneksi = pool) {
    return baca("SELECT id FROM fasyankes WHERE id = ? FOR UPDATE", [fasyankesId], koneksi);
}
/** Id fasyankes yang ada, paling banyak `batas` baris (penjaga satu instalasi satu fasyankes). */
export async function daftarIdFasyankes(batas = 2, koneksi = pool) {
    const baris = await baca("SELECT `id` FROM `fasyankes` ORDER BY `id` LIMIT ?", [batas], koneksi);
    return baris.map((b) => b.id);
}
