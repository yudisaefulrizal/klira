import { baca, tulis, pool } from '../koneksi.js';
export async function hapusIgPercakapanUntukBersihkanDalam(fasyankes_id, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `ig_percakapan` t WHERE ((? OR t.`fasyankes_id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function ambilIgPercakapanUntukPerbarui(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`jid`, t.`nama`, t.`foto_profil`, t.`profil_diperbarui_pada`, t.`pasien_id`, t.`status`, t.`penanggung_jawab`, t.`diperbarui_pada` FROM `ig_percakapan` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function ubahIgPercakapanUntukPerbarui(nama, foto_profil, profil_diperbarui_pada, id, fasyankes_id, jid, nama2, koneksi = pool) {
    const hasil = await tulis("UPDATE `ig_percakapan` t SET `nama` = IF(?, t.`nama`, ?), `foto_profil` = IF(?, t.`foto_profil`, ?), `profil_diperbarui_pada` = IF(?, t.`profil_diperbarui_pada`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`jid` <=> ?)) AND ((? OR t.`nama` <=> ?))", [nama === undefined, nama ?? null, foto_profil === undefined, foto_profil ?? null, profil_diperbarui_pada === undefined, profil_diperbarui_pada ?? null, id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null, jid === undefined, jid ?? null, nama2 === undefined, nama2 ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function hitungIgPercakapanUntukMulaiLogin(koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `ig_percakapan` t WHERE TRUE", [], koneksi);
    return Number(baris.jumlah);
}
export async function daftarIgPercakapanUntukBuatRuteInstagram(fasyankes_id, batas, lewati, pesan_batas, pengguna_id, koneksi = pool) {
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
        return [...grup.values()].map(baris => ({ id: baris[0].t1__id, percakapan_id: baris[0].t1__percakapan_id, ig_id: baris[0].t1__ig_id, arah: baris[0].t1__arah, isi: baris[0].t1__isi, jenis: baris[0].t1__jenis, media_id: baris[0].t1__media_id, status: baris[0].t1__status, dibuat_oleh: baris[0].t1__dibuat_oleh, dibuat_pada: baris[0].t1__dibuat_pada }));
    }
    function petakt2(semua) {
        const grup = new Map();
        for (const baris of semua) {
            if (baris.t2__percakapan_id === null)
                continue;
            const kunci = JSON.stringify([baris.t2__percakapan_id, baris.t2__pengguna_id]);
            const isi = grup.get(kunci);
            if (isi)
                isi.push(baris);
            else
                grup.set(kunci, [baris]);
        }
        return [...grup.values()].map(baris => ({ percakapan_id: baris[0].t2__percakapan_id, pengguna_id: baris[0].t2__pengguna_id, pesan_id: baris[0].t2__pesan_id }));
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
        return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, jid: baris[0].t0__jid, nama: baris[0].t0__nama, foto_profil: baris[0].t0__foto_profil, profil_diperbarui_pada: baris[0].t0__profil_diperbarui_pada, pasien_id: baris[0].t0__pasien_id, status: baris[0].t0__status, penanggung_jawab: baris[0].t0__penanggung_jawab, diperbarui_pada: baris[0].t0__diperbarui_pada, pesan: petakt1(baris), baca: petakt2(baris) }));
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`jid` AS `t0__jid`, t0.`nama` AS `t0__nama`, t0.`foto_profil` AS `t0__foto_profil`, t0.`profil_diperbarui_pada` AS `t0__profil_diperbarui_pada`, t0.`pasien_id` AS `t0__pasien_id`, t0.`status` AS `t0__status`, t0.`penanggung_jawab` AS `t0__penanggung_jawab`, t0.`diperbarui_pada` AS `t0__diperbarui_pada`, t1.`id` AS `t1__id`, t1.`percakapan_id` AS `t1__percakapan_id`, t1.`ig_id` AS `t1__ig_id`, t1.`arah` AS `t1__arah`, t1.`isi` AS `t1__isi`, t1.`jenis` AS `t1__jenis`, t1.`media_id` AS `t1__media_id`, t1.`status` AS `t1__status`, t1.`dibuat_oleh` AS `t1__dibuat_oleh`, t1.`dibuat_pada` AS `t1__dibuat_pada`, t2.`percakapan_id` AS `t2__percakapan_id`, t2.`pengguna_id` AS `t2__pengguna_id`, t2.`pesan_id` AS `t2__pesan_id`\nFROM (SELECT t0.* FROM `ig_percakapan` t0 WHERE ((? OR t0.`fasyankes_id` <=> ?)) ORDER BY t0.`diperbarui_pada` DESC LIMIT ? OFFSET ?) t0\nLEFT JOIN (SELECT b1.*, ROW_NUMBER() OVER (PARTITION BY b1.`percakapan_id` ORDER BY b1.`id` DESC) AS _urutan FROM `ig_pesan` b1 WHERE TRUE) t1 ON t0.`id` = t1.`percakapan_id` AND t1._urutan <= ?\nLEFT JOIN (SELECT b2.* FROM `ig_baca` b2 WHERE ((? OR b2.`pengguna_id` <=> ?))) t2 ON t0.`id` = t2.`percakapan_id`\nORDER BY t0.`diperbarui_pada` DESC, t1.`id` DESC, t2.`percakapan_id` ASC, t2.`pengguna_id` ASC", [fasyankes_id === undefined, fasyankes_id ?? null, batas ?? 2147483647, lewati ?? 0, (pesan_batas ?? 2147483647) + (0), pengguna_id === undefined, pengguna_id ?? null], koneksi);
    const hasil = petakt0(baris);
    return hasil;
}
export async function cariIgPercakapanUntukBuatRuteInstagram(id, fasyankes_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`jid`, t.`nama`, t.`foto_profil`, t.`profil_diperbarui_pada`, t.`pasien_id`, t.`status`, t.`penanggung_jawab`, t.`diperbarui_pada` FROM `ig_percakapan` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) LIMIT 1", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function ubahIgPercakapanUntukBuatRuteInstagram(pasien_id, penanggung_jawab, id, pasien_id2, pasien_id3, koneksi = pool) {
    const hasil = await tulis("UPDATE `ig_percakapan` t SET `pasien_id` = IF(?, t.`pasien_id`, ?), `penanggung_jawab` = IF(?, t.`penanggung_jawab`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((((? OR t.`pasien_id` <=> ?))) OR (((? OR t.`pasien_id` <=> ?))))", [pasien_id === undefined, pasien_id ?? null, penanggung_jawab === undefined, penanggung_jawab ?? null, id === undefined, id ?? null, pasien_id2 === undefined, pasien_id2 ?? null, pasien_id3 === undefined, pasien_id3 ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function ubahIgPercakapanUntukBuatRuteInstagram2(pasien_id, penanggung_jawab, id, koneksi = pool) {
    const hasil = await tulis("UPDATE `ig_percakapan` t SET `pasien_id` = IF(?, t.`pasien_id`, ?), `penanggung_jawab` = IF(?, t.`penanggung_jawab`, ?) WHERE ((? OR t.`id` <=> ?))", [pasien_id === undefined, pasien_id ?? null, penanggung_jawab === undefined, penanggung_jawab ?? null, id === undefined, id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function ubahIgPercakapanUntukBuatRuteInstagram3(diperbarui_pada, id, koneksi = pool) {
    const hasil = await tulis("UPDATE `ig_percakapan` t SET `diperbarui_pada` = IF(?, t.`diperbarui_pada`, ?) WHERE ((? OR t.`id` <=> ?))", [diperbarui_pada === undefined, diperbarui_pada ?? null, id === undefined, id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function simpanIgPercakapanUntukWebhookInstagram(fasyankes_id, jid, nama, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `ig_percakapan` (`fasyankes_id`, `jid`, `nama`) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE `id` = `id`, `id` = LAST_INSERT_ID(`id`)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (jid === undefined ? null : jid) ?? null, (nama === undefined ? null : nama) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function simpanIgPercakapanUntukWebhookInstagramHasil(fasyankes_id, jid, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`jid`, t.`nama`, t.`foto_profil`, t.`profil_diperbarui_pada`, t.`pasien_id`, t.`status`, t.`penanggung_jawab`, t.`diperbarui_pada` FROM `ig_percakapan` t WHERE (((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`jid` <=> ?))) LIMIT 1", [fasyankes_id === undefined, fasyankes_id ?? null, jid === undefined, jid ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris ig_percakapan tidak ditemukan.');
    return baris[0];
}
export async function daftarIgPercakapanUntukRapikanRiwayatInstagram(id, fasyankes_id, batas, koneksi = pool) {
    const baris = await baca("SELECT t.`id` FROM `ig_percakapan` t WHERE ((? OR t.`id` > ?)) AND ((? OR t.`fasyankes_id` <=> ?)) ORDER BY t.`id` ASC LIMIT ? OFFSET ?", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null, batas ?? 2147483647, 0], koneksi);
    return baris;
}
export async function kunciIgPercakapan(id, koneksi = pool) {
    return baca("SELECT id FROM ig_percakapan WHERE id = ? FOR UPDATE", [id], koneksi);
}
export async function hitungIgPercakapanBelumDibaca(penggunaId, fasyankesId, koneksi = pool) {
    return baca("SELECT COUNT(DISTINCT CASE WHEN p.id > COALESCE(b.pesan_id, 0) THEN c.id END) AS belum,\n             MAX(p.id) AS terbaru\n      FROM ig_percakapan c\n      LEFT JOIN ig_pesan p ON p.percakapan_id = c.id AND p.arah = 'masuk'\n      LEFT JOIN ig_baca b ON b.percakapan_id = c.id AND b.pengguna_id = ?\n      WHERE c.fasyankes_id = ?", [penggunaId, fasyankesId], koneksi);
}
export async function kunciIgPercakapanFasyankes(fasyankesId, koneksi = pool) {
    return baca("SELECT id FROM ig_percakapan WHERE fasyankes_id = ? ORDER BY id FOR UPDATE", [fasyankesId], koneksi);
}
