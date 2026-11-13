import { baca, tulis, pool } from '../koneksi.js';
export async function ambilIgKoneksi(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`aktif`, t.`status`, t.`akun_id`, t.`username`, t.`api_key`, t.`webhook_secret`, t.`webhook_id`, t.`penyedia`, t.`oauth_user_id`, t.`access_token`, t.`token_berakhir`, t.`token_diperbarui`, t.`generasi`, t.`webhook_aktif` FROM `ig_koneksi` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function ubahIgKoneksiUntukPutuskanDanBersihkan(aktif, status, akun_id, api_key, token_berakhir, generasi, fasyankes_id, koneksi = pool) {
    const hasil = await tulis("UPDATE `ig_koneksi` t SET `aktif` = IF(?, t.`aktif`, ?), `status` = IF(?, t.`status`, ?), `akun_id` = IF(?, t.`akun_id`, ?), `username` = IF(?, t.`username`, ?), `api_key` = IF(?, t.`api_key`, ?), `webhook_secret` = IF(?, t.`webhook_secret`, ?), `webhook_id` = IF(?, t.`webhook_id`, ?), `oauth_user_id` = IF(?, t.`oauth_user_id`, ?), `access_token` = IF(?, t.`access_token`, ?), `token_berakhir` = IF(?, t.`token_berakhir`, ?), `token_diperbarui` = IF(?, t.`token_diperbarui`, ?), `generasi` = IF(?, t.`generasi`, t.`generasi` + ?), `webhook_aktif` = IF(?, t.`webhook_aktif`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?))", [aktif === undefined, aktif ?? null, status === undefined, status ?? null, akun_id === undefined, akun_id ?? null, akun_id === undefined, akun_id ?? null, api_key === undefined, api_key ?? null, api_key === undefined, api_key ?? null, api_key === undefined, api_key ?? null, api_key === undefined, api_key ?? null, api_key === undefined, api_key ?? null, token_berakhir === undefined, token_berakhir ?? null, token_berakhir === undefined, token_berakhir ?? null, generasi === undefined, generasi ?? null, aktif === undefined, aktif ?? null, generasi === undefined, generasi ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function simpanIgKoneksiUntukMulaiLogin(id, fasyankes_id, akun_id, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `ig_koneksi` (`id`, `fasyankes_id`, `akun_id`, `username`) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE `id` = `id`, `id` = LAST_INSERT_ID(`id`)", [(id === undefined ? 1 : id) ?? null, (fasyankes_id === undefined ? null : fasyankes_id) ?? null, (akun_id === undefined ? null : akun_id) ?? null, (akun_id === undefined ? null : akun_id) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function ubahIgKoneksiUntukMulaiLogin(generasi, koneksi = pool) {
    const hasil = await tulis("UPDATE `ig_koneksi` t SET `generasi` = IF(?, t.`generasi`, t.`generasi` + ?) WHERE ((? OR t.`id` <=> ?))", [generasi === undefined, generasi ?? null, generasi === undefined, generasi ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function ubahIgKoneksiUntukMulaiLoginHasil(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`aktif`, t.`status`, t.`akun_id`, t.`username`, t.`api_key`, t.`webhook_secret`, t.`webhook_id`, t.`penyedia`, t.`oauth_user_id`, t.`access_token`, t.`token_berakhir`, t.`token_diperbarui`, t.`generasi`, t.`webhook_aktif` FROM `ig_koneksi` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris ig_koneksi tidak ditemukan.');
    return baris[0];
}
export async function ubahIgKoneksiUntukSelesaikanLogin(aktif, status, akun_id, username, api_key, penyedia, oauth_user_id, access_token, token_berakhir, token_diperbarui, id, fasyankes_id, generasi, koneksi = pool) {
    const hasil = await tulis("UPDATE `ig_koneksi` t SET `aktif` = IF(?, t.`aktif`, ?), `status` = IF(?, t.`status`, ?), `akun_id` = IF(?, t.`akun_id`, ?), `username` = IF(?, t.`username`, ?), `api_key` = IF(?, t.`api_key`, ?), `webhook_secret` = IF(?, t.`webhook_secret`, ?), `webhook_id` = IF(?, t.`webhook_id`, ?), `penyedia` = IF(?, t.`penyedia`, ?), `oauth_user_id` = IF(?, t.`oauth_user_id`, ?), `access_token` = IF(?, t.`access_token`, ?), `token_berakhir` = IF(?, t.`token_berakhir`, ?), `token_diperbarui` = IF(?, t.`token_diperbarui`, ?), `webhook_aktif` = IF(?, t.`webhook_aktif`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`generasi` <=> ?))", [aktif === undefined, aktif ?? null, status === undefined, status ?? null, akun_id === undefined, akun_id ?? null, username === undefined, username ?? null, api_key === undefined, api_key ?? null, api_key === undefined, api_key ?? null, api_key === undefined, api_key ?? null, penyedia === undefined, penyedia ?? null, oauth_user_id === undefined, oauth_user_id ?? null, access_token === undefined, access_token ?? null, token_berakhir === undefined, token_berakhir ?? null, token_diperbarui === undefined, token_diperbarui ?? null, aktif === undefined, aktif ?? null, id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null, generasi === undefined, generasi ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function ubahIgKoneksiUntukBuatRuteInstagram(aktif, status, access_token, generasi, generasi2, koneksi = pool) {
    const hasil = await tulis("UPDATE `ig_koneksi` t SET `aktif` = IF(?, t.`aktif`, ?), `status` = IF(?, t.`status`, ?), `access_token` = IF(?, t.`access_token`, ?), `generasi` = IF(?, t.`generasi`, t.`generasi` + ?), `webhook_aktif` = IF(?, t.`webhook_aktif`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`generasi` <=> ?))", [aktif === undefined, aktif ?? null, status === undefined, status ?? null, access_token === undefined, access_token ?? null, generasi === undefined, generasi ?? null, aktif === undefined, aktif ?? null, generasi === undefined, generasi ?? null, generasi2 === undefined, generasi2 ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function cariIgKoneksiUntukBuatRuteInstagramPublik(penyedia, akun_id, oauth_user_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`aktif`, t.`status`, t.`akun_id`, t.`username`, t.`api_key`, t.`webhook_secret`, t.`webhook_id`, t.`penyedia`, t.`oauth_user_id`, t.`access_token`, t.`token_berakhir`, t.`token_diperbarui`, t.`generasi`, t.`webhook_aktif` FROM `ig_koneksi` t WHERE ((? OR t.`penyedia` <=> ?)) AND ((((? OR t.`akun_id` <=> ?))) OR (((? OR t.`oauth_user_id` <=> ?)))) LIMIT 1", [penyedia === undefined, penyedia ?? null, akun_id === undefined, akun_id ?? null, oauth_user_id === undefined, oauth_user_id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function ubahIgKoneksiUntukBuatRuteInstagramPublik(aktif, status, access_token, token_berakhir, generasi, akun_id, koneksi = pool) {
    const hasil = await tulis("UPDATE `ig_koneksi` t SET `aktif` = IF(?, t.`aktif`, ?), `status` = IF(?, t.`status`, ?), `access_token` = IF(?, t.`access_token`, ?), `token_berakhir` = IF(?, t.`token_berakhir`, ?), `generasi` = IF(?, t.`generasi`, t.`generasi` + ?), `webhook_aktif` = IF(?, t.`webhook_aktif`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`akun_id` <=> ?))", [aktif === undefined, aktif ?? null, status === undefined, status ?? null, access_token === undefined, access_token ?? null, token_berakhir === undefined, token_berakhir ?? null, generasi === undefined, generasi ?? null, aktif === undefined, aktif ?? null, generasi === undefined, generasi ?? null, akun_id === undefined, akun_id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function ubahIgKoneksiUntukBuatRuteInstagramPublik2(aktif, status, akun_id, api_key, token_berakhir, generasi, koneksi = pool) {
    const hasil = await tulis("UPDATE `ig_koneksi` t SET `aktif` = IF(?, t.`aktif`, ?), `status` = IF(?, t.`status`, ?), `akun_id` = IF(?, t.`akun_id`, ?), `username` = IF(?, t.`username`, ?), `api_key` = IF(?, t.`api_key`, ?), `webhook_secret` = IF(?, t.`webhook_secret`, ?), `webhook_id` = IF(?, t.`webhook_id`, ?), `oauth_user_id` = IF(?, t.`oauth_user_id`, ?), `access_token` = IF(?, t.`access_token`, ?), `token_berakhir` = IF(?, t.`token_berakhir`, ?), `token_diperbarui` = IF(?, t.`token_diperbarui`, ?), `generasi` = IF(?, t.`generasi`, t.`generasi` + ?), `webhook_aktif` = IF(?, t.`webhook_aktif`, ?) WHERE ((? OR t.`id` <=> ?))", [aktif === undefined, aktif ?? null, status === undefined, status ?? null, akun_id === undefined, akun_id ?? null, akun_id === undefined, akun_id ?? null, api_key === undefined, api_key ?? null, api_key === undefined, api_key ?? null, api_key === undefined, api_key ?? null, api_key === undefined, api_key ?? null, api_key === undefined, api_key ?? null, token_berakhir === undefined, token_berakhir ?? null, token_berakhir === undefined, token_berakhir ?? null, generasi === undefined, generasi ?? null, aktif === undefined, aktif ?? null, generasi === undefined, generasi ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function ubahIgKoneksiUntukPerbaruiTokenInstagram(status, access_token, id, generasi, access_token2, koneksi = pool) {
    const hasil = await tulis("UPDATE `ig_koneksi` t SET `status` = IF(?, t.`status`, ?), `access_token` = IF(?, t.`access_token`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`generasi` <=> ?)) AND ((? OR t.`access_token` <=> ?))", [status === undefined, status ?? null, access_token === undefined, access_token ?? null, id === undefined, id ?? null, generasi === undefined, generasi ?? null, access_token2 === undefined, access_token2 ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function ubahIgKoneksiUntukPerbaruiTokenInstagram2(access_token, token_berakhir, token_diperbarui, id, aktif, generasi, access_token2, koneksi = pool) {
    const hasil = await tulis("UPDATE `ig_koneksi` t SET `access_token` = IF(?, t.`access_token`, ?), `token_berakhir` = IF(?, t.`token_berakhir`, ?), `token_diperbarui` = IF(?, t.`token_diperbarui`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`aktif` <=> ?)) AND ((? OR t.`generasi` <=> ?)) AND ((? OR t.`access_token` <=> ?))", [access_token === undefined, access_token ?? null, token_berakhir === undefined, token_berakhir ?? null, token_diperbarui === undefined, token_diperbarui ?? null, id === undefined, id ?? null, aktif === undefined, aktif ?? null, generasi === undefined, generasi ?? null, access_token2 === undefined, access_token2 ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function ubahIgKoneksiUntukPerbaruiTokenInstagram3(aktif, status, access_token, generasi, generasi2, access_token2, koneksi = pool) {
    const hasil = await tulis("UPDATE `ig_koneksi` t SET `aktif` = IF(?, t.`aktif`, ?), `status` = IF(?, t.`status`, ?), `access_token` = IF(?, t.`access_token`, ?), `generasi` = IF(?, t.`generasi`, t.`generasi` + ?), `webhook_aktif` = IF(?, t.`webhook_aktif`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`generasi` <=> ?)) AND ((? OR t.`access_token` <=> ?))", [aktif === undefined, aktif ?? null, status === undefined, status ?? null, access_token === undefined, access_token ?? null, generasi === undefined, generasi ?? null, aktif === undefined, aktif ?? null, generasi === undefined, generasi ?? null, generasi2 === undefined, generasi2 ?? null, access_token2 === undefined, access_token2 ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function kunciIgKoneksi(koneksi = pool) {
    return baca("SELECT id FROM ig_koneksi WHERE id = 1 FOR UPDATE", [], koneksi);
}
