import { baca, tulis, pool } from '../koneksi.js';
export async function hitungWaPesanUntukBersihkanDalam(fasyankes_id, status, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `wa_pesan` t WHERE (EXISTS (SELECT 1 FROM `wa_percakapan` r1 WHERE t.`percakapan_id` = r1.`id` AND (((? OR r1.`fasyankes_id` <=> ?))))) AND ((? OR t.`status` IN (?)))", [fasyankes_id === undefined, fasyankes_id ?? null, status === undefined, (status)?.length ? (status) : [null]], koneksi);
    return Number(baris.jumlah);
}
export async function hapusWaPesanUntukBersihkanDalam(fasyankes_id, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `wa_pesan` t WHERE (EXISTS (SELECT 1 FROM `wa_percakapan` r1 WHERE t.`percakapan_id` = r1.`id` AND (((? OR r1.`fasyankes_id` <=> ?)))))", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function hitungWaPesanUntukBuatRuteWhatsapp(percakapan_id, arah, id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `wa_pesan` t WHERE ((? OR t.`percakapan_id` <=> ?)) AND ((? OR t.`arah` <=> ?)) AND ((? OR t.`id` > ?))", [percakapan_id === undefined, percakapan_id ?? null, arah === undefined, arah ?? null, id === undefined, id ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function daftarWaPesanUntukBuatRuteWhatsapp(percakapan_id, batas, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`percakapan_id`, t.`wa_id`, t.`arah`, t.`isi`, t.`jenis`, t.`media_id`, t.`status`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `wa_pesan` t WHERE ((? OR t.`percakapan_id` <=> ?)) ORDER BY t.`id` DESC LIMIT ? OFFSET ?", [percakapan_id === undefined, percakapan_id ?? null, batas ?? 2147483647, 0], koneksi);
    return baris;
}
export async function cariWaPesanUntukBuatRuteWhatsapp(id, percakapan_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`percakapan_id`, t.`wa_id`, t.`arah`, t.`isi`, t.`jenis`, t.`media_id`, t.`status`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `wa_pesan` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`percakapan_id` <=> ?)) LIMIT 1", [id === undefined, id ?? null, percakapan_id === undefined, percakapan_id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function tambahWaPesanUntukBuatRuteWhatsapp(percakapan_id, arah, isi, jenis, media_id, status, dibuat_oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `wa_pesan` (`percakapan_id`, `arah`, `isi`, `jenis`, `media_id`, `status`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?)", [(percakapan_id === undefined ? null : percakapan_id) ?? null, (arah === undefined ? null : arah) ?? null, (isi === undefined ? null : isi) ?? null, (jenis === undefined ? "text" : jenis) ?? null, (media_id === undefined ? null : media_id) ?? null, (status === undefined ? null : status) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahWaPesanUntukBuatRuteWhatsappHasil(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`percakapan_id`, t.`wa_id`, t.`arah`, t.`isi`, t.`jenis`, t.`media_id`, t.`status`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `wa_pesan` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris wa_pesan tidak ditemukan.');
    return baris[0];
}
export async function ambilWaPesanUntukTerima(wa_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`percakapan_id`, t.`wa_id`, t.`arah`, t.`isi`, t.`jenis`, t.`media_id`, t.`status`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `wa_pesan` t WHERE ((? OR t.`wa_id` <=> ?)) LIMIT 1", [wa_id === undefined, wa_id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function tambahWaPesanUntukTerima(percakapan_id, wa_id, arah, isi, jenis, media_id, status, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `wa_pesan` (`percakapan_id`, `wa_id`, `arah`, `isi`, `jenis`, `media_id`, `status`) VALUES (?, ?, ?, ?, ?, ?, ?)", [(percakapan_id === undefined ? null : percakapan_id) ?? null, (wa_id === undefined ? null : wa_id) ?? null, (arah === undefined ? null : arah) ?? null, (isi === undefined ? null : isi) ?? null, (jenis === undefined ? "text" : jenis) ?? null, (media_id === undefined ? null : media_id) ?? null, (status === undefined ? null : status) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function ubahWaPesanUntukHubungkan(status, wa_id, status2, status3, pakai, koneksi = pool) {
    const hasil = await tulis("UPDATE `wa_pesan` t SET `status` = IF(?, t.`status`, ?) WHERE ((? OR t.`wa_id` <=> ?)) AND ((((? OR t.`status` NOT IN (?)))) AND ((? OR (((? OR NOT (t.`status` <=> ?)))))))", [status === undefined, status ?? null, wa_id === undefined, wa_id ?? null, (status2 === undefined) || !(status2)?.length, (status2)?.length ? (status2) : [null], !pakai, status3 === undefined, status3 ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function cariWaPesanUntukKirim(arah, status, fasyankes_id, koneksi = pool) {
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
        return [...grup.values()].map(baris => ({ id: baris[0].t1__id, fasyankes_id: baris[0].t1__fasyankes_id, jid: baris[0].t1__jid, nama: baris[0].t1__nama, foto_profil: baris[0].t1__foto_profil, foto_periksa_setelah: baris[0].t1__foto_periksa_setelah, pasien_id: baris[0].t1__pasien_id, status: baris[0].t1__status, penanggung_jawab: baris[0].t1__penanggung_jawab, diperbarui_pada: baris[0].t1__diperbarui_pada }));
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
        return [...grup.values()].map(baris => ({ id: baris[0].t0__id, percakapan_id: baris[0].t0__percakapan_id, wa_id: baris[0].t0__wa_id, arah: baris[0].t0__arah, isi: baris[0].t0__isi, jenis: baris[0].t0__jenis, media_id: baris[0].t0__media_id, status: baris[0].t0__status, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, percakapan: petakt1(baris)[0] }));
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`percakapan_id` AS `t0__percakapan_id`, t0.`wa_id` AS `t0__wa_id`, t0.`arah` AS `t0__arah`, t0.`isi` AS `t0__isi`, t0.`jenis` AS `t0__jenis`, t0.`media_id` AS `t0__media_id`, t0.`status` AS `t0__status`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t1.`id` AS `t1__id`, t1.`fasyankes_id` AS `t1__fasyankes_id`, t1.`jid` AS `t1__jid`, t1.`nama` AS `t1__nama`, t1.`foto_profil` AS `t1__foto_profil`, t1.`foto_periksa_setelah` AS `t1__foto_periksa_setelah`, t1.`pasien_id` AS `t1__pasien_id`, t1.`status` AS `t1__status`, t1.`penanggung_jawab` AS `t1__penanggung_jawab`, t1.`diperbarui_pada` AS `t1__diperbarui_pada`\nFROM (SELECT t0.* FROM `wa_pesan` t0 WHERE ((? OR t0.`arah` <=> ?)) AND ((? OR t0.`status` <=> ?)) AND (EXISTS (SELECT 1 FROM `wa_percakapan` r1 WHERE t0.`percakapan_id` = r1.`id` AND (((? OR r1.`fasyankes_id` <=> ?))))) ORDER BY t0.`id` ASC LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `wa_percakapan` b1 WHERE TRUE) t1 ON t0.`percakapan_id` = t1.`id`\nORDER BY t0.`id` ASC, t1.`id` ASC", [arah === undefined, arah ?? null, status === undefined, status ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    const hasil = petakt0(baris);
    return (hasil[0] ?? null);
}
export async function ubahWaPesanUntukKirim(status, id, koneksi = pool) {
    const hasil = await tulis("UPDATE `wa_pesan` t SET `status` = IF(?, t.`status`, ?) WHERE ((? OR t.`id` <=> ?))", [status === undefined, status ?? null, id === undefined, id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function ubahWaPesanUntukKirim2(wa_id, status, id, status2, koneksi = pool) {
    const hasil = await tulis("UPDATE `wa_pesan` t SET `wa_id` = IF(?, t.`wa_id`, ?), `status` = IF(?, t.`status`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`status` <=> ?))", [wa_id === undefined, wa_id ?? null, status === undefined, status ?? null, id === undefined, id ?? null, status2 === undefined, status2 ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function ubahWaPesanUntukDetak(status, status2, koneksi = pool) {
    const hasil = await tulis("UPDATE `wa_pesan` t SET `status` = IF(?, t.`status`, ?) WHERE ((? OR t.`status` <=> ?))", [status === undefined, status ?? null, status2 === undefined, status2 ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function daftarWaPesanUntukPangkasPesanWhatsapp(percakapan_id, status, lewati, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`media_id` FROM `wa_pesan` t WHERE ((? OR t.`percakapan_id` <=> ?)) AND ((? OR t.`status` NOT IN (?))) ORDER BY t.`id` DESC LIMIT ? OFFSET ?", [percakapan_id === undefined, percakapan_id ?? null, (status === undefined) || !(status)?.length, (status)?.length ? (status) : [null], 2147483647, lewati ?? 0], koneksi);
    return baris;
}
export async function hapusWaPesanUntukPangkasPesanWhatsapp(id, status, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `wa_pesan` t WHERE ((? OR t.`id` IN (?))) AND ((? OR t.`status` NOT IN (?)))", [id === undefined, (id)?.length ? (id) : [null], (status === undefined) || !(status)?.length, (status)?.length ? (status) : [null]], koneksi);
    return { count: hasil.affectedRows };
}
export async function daftarWaPesanUntukPangkasPesanWhatsapp2(media_id, koneksi = pool) {
    const baris = await baca("SELECT t.`media_id` FROM `wa_pesan` t WHERE ((? OR t.`media_id` IN (?)))", [media_id === undefined, (media_id)?.length ? (media_id) : [null]], koneksi);
    return baris;
}
