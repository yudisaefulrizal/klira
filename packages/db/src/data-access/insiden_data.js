import { baca, tulis, pool } from '../koneksi.js';
import { wajibId } from '../wajib.js';
export async function hitungInsidenDataUntukRingkasan(notifikasi_pasien_pada, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `insiden_data` t WHERE ((((? OR t.`notifikasi_pasien_pada` <=> ?))) OR (((? OR t.`notifikasi_lembaga_pada` <=> ?))))", [notifikasi_pasien_pada === undefined, notifikasi_pasien_pada ?? null, notifikasi_pasien_pada === undefined, notifikasi_pasien_pada ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function hitungInsidenDataUntukRingkasan2(notifikasi_pasien_pada, batas_notifikasi, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `insiden_data` t WHERE ((((? OR t.`notifikasi_pasien_pada` <=> ?))) OR (((? OR t.`notifikasi_lembaga_pada` <=> ?)))) AND ((? OR t.`batas_notifikasi` < ?))", [notifikasi_pasien_pada === undefined, notifikasi_pasien_pada ?? null, notifikasi_pasien_pada === undefined, notifikasi_pasien_pada ?? null, batas_notifikasi === undefined, batas_notifikasi ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function hitungInsidenDataUntukDaftarInsiden(koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `insiden_data` t WHERE TRUE", [], koneksi);
    return Number(baris.jumlah);
}
export async function daftarInsidenDataUntukDaftarInsiden(batas, lewati, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`waktu_kejadian`, t.`waktu_diketahui`, t.`siber`, t.`uraian`, t.`data_terungkap`, t.`penanganan`, t.`pemulihan`, t.`kontak_ppdp`, t.`batas_notifikasi`, t.`notifikasi_pasien_pada`, t.`notifikasi_lembaga_pada`, t.`dibuat_oleh`, t.`dibuat_pada`, t.`diperbarui_pada` FROM `insiden_data` t WHERE TRUE ORDER BY t.`waktu_diketahui` DESC LIMIT ? OFFSET ?", [batas ?? 2147483647, lewati ?? 0], koneksi);
    return baris;
}
export async function cariInsidenDataUntukInsiden(id, koneksi = pool) {
    wajibId('cariInsidenDataUntukInsiden', id);
    const baris = await baca("SELECT t.`id`, t.`waktu_kejadian`, t.`waktu_diketahui`, t.`siber`, t.`uraian`, t.`data_terungkap`, t.`penanganan`, t.`pemulihan`, t.`kontak_ppdp`, t.`batas_notifikasi`, t.`notifikasi_pasien_pada`, t.`notifikasi_lembaga_pada`, t.`dibuat_oleh`, t.`dibuat_pada`, t.`diperbarui_pada` FROM `insiden_data` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function tambahInsidenDataUntukBuatInsiden(waktu_kejadian, waktu_diketahui, siber, uraian, data_terungkap, penanganan, pemulihan, kontak_ppdp, batas_notifikasi, notifikasi_pasien_pada, notifikasi_lembaga_pada, dibuat_oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `insiden_data` (`waktu_kejadian`, `waktu_diketahui`, `siber`, `uraian`, `data_terungkap`, `penanganan`, `pemulihan`, `kontak_ppdp`, `batas_notifikasi`, `notifikasi_pasien_pada`, `notifikasi_lembaga_pada`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [(waktu_kejadian === undefined ? null : waktu_kejadian) ?? null, (waktu_diketahui === undefined ? null : waktu_diketahui) ?? null, (siber === undefined ? false : siber) ?? null, (uraian === undefined ? null : uraian) ?? null, (data_terungkap === undefined ? null : data_terungkap) ?? null, (penanganan === undefined ? null : penanganan) ?? null, (pemulihan === undefined ? null : pemulihan) ?? null, (kontak_ppdp === undefined ? null : kontak_ppdp) ?? null, (batas_notifikasi === undefined ? null : batas_notifikasi) ?? null, (notifikasi_pasien_pada === undefined ? null : notifikasi_pasien_pada) ?? null, (notifikasi_lembaga_pada === undefined ? null : notifikasi_lembaga_pada) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahInsidenDataUntukBuatInsidenHasil(id, koneksi = pool) {
    wajibId('tambahInsidenDataUntukBuatInsidenHasil', id);
    const baris = await baca("SELECT t.`id`, t.`waktu_kejadian`, t.`waktu_diketahui`, t.`siber`, t.`uraian`, t.`data_terungkap`, t.`penanganan`, t.`pemulihan`, t.`kontak_ppdp`, t.`batas_notifikasi`, t.`notifikasi_pasien_pada`, t.`notifikasi_lembaga_pada`, t.`dibuat_oleh`, t.`dibuat_pada`, t.`diperbarui_pada` FROM `insiden_data` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris insiden_data tidak ditemukan.');
    return baris[0];
}
export async function ubahInsidenDataUntukUbahInsiden(waktu_kejadian, waktu_diketahui, siber, uraian, data_terungkap, penanganan, pemulihan, kontak_ppdp, batas_notifikasi, notifikasi_pasien_pada, notifikasi_lembaga_pada, diperbarui_pada, id, koneksi = pool) {
    wajibId('ubahInsidenDataUntukUbahInsiden', id);
    const hasil = await tulis("UPDATE `insiden_data` t SET `waktu_kejadian` = IF(?, t.`waktu_kejadian`, ?), `waktu_diketahui` = IF(?, t.`waktu_diketahui`, ?), `siber` = IF(?, t.`siber`, ?), `uraian` = IF(?, t.`uraian`, ?), `data_terungkap` = IF(?, t.`data_terungkap`, ?), `penanganan` = IF(?, t.`penanganan`, ?), `pemulihan` = IF(?, t.`pemulihan`, ?), `kontak_ppdp` = IF(?, t.`kontak_ppdp`, ?), `batas_notifikasi` = IF(?, t.`batas_notifikasi`, ?), `notifikasi_pasien_pada` = IF(?, t.`notifikasi_pasien_pada`, ?), `notifikasi_lembaga_pada` = IF(?, t.`notifikasi_lembaga_pada`, ?), `diperbarui_pada` = IF(?, t.`diperbarui_pada`, ?) WHERE ((? OR t.`id` <=> ?))", [waktu_kejadian === undefined, waktu_kejadian ?? null, waktu_diketahui === undefined, waktu_diketahui ?? null, siber === undefined, siber ?? null, uraian === undefined, uraian ?? null, data_terungkap === undefined, data_terungkap ?? null, penanganan === undefined, penanganan ?? null, pemulihan === undefined, pemulihan ?? null, kontak_ppdp === undefined, kontak_ppdp ?? null, batas_notifikasi === undefined, batas_notifikasi ?? null, notifikasi_pasien_pada === undefined, notifikasi_pasien_pada ?? null, notifikasi_lembaga_pada === undefined, notifikasi_lembaga_pada ?? null, diperbarui_pada === undefined, diperbarui_pada ?? null, id === undefined, id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
