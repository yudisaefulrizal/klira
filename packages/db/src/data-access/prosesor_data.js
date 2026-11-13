import { baca, tulis, pool } from '../koneksi.js';
export async function hitungProsesorDataUntukDaftarProsesor(fasyankes_id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `prosesor_data` t WHERE ((? OR t.`fasyankes_id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function daftarProsesorDataUntukDaftarProsesor(fasyankes_id, batas, lewati, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`nama`, t.`layanan`, t.`lokasi_data`, t.`nomor_perjanjian`, t.`butir_perjanjian`, t.`sub_prosesor`, t.`sla_lapor_jam`, t.`aktif`, t.`dibuat_oleh`, t.`dibuat_pada`, t.`diperbarui_pada` FROM `prosesor_data` t WHERE ((? OR t.`fasyankes_id` <=> ?)) ORDER BY t.`aktif` DESC, t.`nama` ASC LIMIT ? OFFSET ?", [fasyankes_id === undefined, fasyankes_id ?? null, batas ?? 2147483647, lewati ?? 0], koneksi);
    for (const b of baris)
        if (typeof b.butir_perjanjian === 'string')
            b.butir_perjanjian = JSON.parse(b.butir_perjanjian);
    for (const b of baris)
        if (typeof b.sub_prosesor === 'string')
            b.sub_prosesor = JSON.parse(b.sub_prosesor);
    return baris;
}
export async function cariProsesorDataUntukProsesor(id, fasyankes_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`nama`, t.`layanan`, t.`lokasi_data`, t.`nomor_perjanjian`, t.`butir_perjanjian`, t.`sub_prosesor`, t.`sla_lapor_jam`, t.`aktif`, t.`dibuat_oleh`, t.`dibuat_pada`, t.`diperbarui_pada` FROM `prosesor_data` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) LIMIT 1", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    for (const b of baris)
        if (typeof b.butir_perjanjian === 'string')
            b.butir_perjanjian = JSON.parse(b.butir_perjanjian);
    for (const b of baris)
        if (typeof b.sub_prosesor === 'string')
            b.sub_prosesor = JSON.parse(b.sub_prosesor);
    return (baris[0] ?? null);
}
export async function daftarProsesorDataUntukProsesorAktif(fasyankes_id, aktif, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`nama` FROM `prosesor_data` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`aktif` <=> ?)) ORDER BY t.`nama` ASC", [fasyankes_id === undefined, fasyankes_id ?? null, aktif === undefined, aktif ?? null], koneksi);
    return baris;
}
export async function daftarProsesorDataUntukNamaProsesor(fasyankes_id, id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`nama` FROM `prosesor_data` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`id` IN (?)))", [fasyankes_id === undefined, fasyankes_id ?? null, id === undefined, (id)?.length ? (id) : [null]], koneksi);
    return baris;
}
export async function tambahProsesorDataUntukBuatProsesor(fasyankes_id, nama, layanan, lokasi_data, nomor_perjanjian, butir_perjanjian, sub_prosesor, sla_lapor_jam, aktif, dibuat_oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `prosesor_data` (`fasyankes_id`, `nama`, `layanan`, `lokasi_data`, `nomor_perjanjian`, `butir_perjanjian`, `sub_prosesor`, `sla_lapor_jam`, `aktif`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (nama === undefined ? null : nama) ?? null, (layanan === undefined ? null : layanan) ?? null, (lokasi_data === undefined ? null : lokasi_data) ?? null, (nomor_perjanjian === undefined ? null : nomor_perjanjian) ?? null, JSON.stringify((butir_perjanjian === undefined ? null : butir_perjanjian) ?? null), JSON.stringify((sub_prosesor === undefined ? null : sub_prosesor) ?? null), (sla_lapor_jam === undefined ? null : sla_lapor_jam) ?? null, (aktif === undefined ? true : aktif) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahProsesorDataUntukBuatProsesorHasil(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`nama`, t.`layanan`, t.`lokasi_data`, t.`nomor_perjanjian`, t.`butir_perjanjian`, t.`sub_prosesor`, t.`sla_lapor_jam`, t.`aktif`, t.`dibuat_oleh`, t.`dibuat_pada`, t.`diperbarui_pada` FROM `prosesor_data` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    for (const b of baris)
        if (typeof b.butir_perjanjian === 'string')
            b.butir_perjanjian = JSON.parse(b.butir_perjanjian);
    for (const b of baris)
        if (typeof b.sub_prosesor === 'string')
            b.sub_prosesor = JSON.parse(b.sub_prosesor);
    if (!baris[0])
        throw new Error('Baris prosesor_data tidak ditemukan.');
    return baris[0];
}
export async function ubahProsesorDataUntukUbahProsesor(nama, layanan, lokasi_data, nomor_perjanjian, butir_perjanjian, sub_prosesor, sla_lapor_jam, aktif, diperbarui_pada, id, fasyankes_id, koneksi = pool) {
    const hasil = await tulis("UPDATE `prosesor_data` t SET `nama` = IF(?, t.`nama`, ?), `layanan` = IF(?, t.`layanan`, ?), `lokasi_data` = IF(?, t.`lokasi_data`, ?), `nomor_perjanjian` = IF(?, t.`nomor_perjanjian`, ?), `butir_perjanjian` = IF(?, t.`butir_perjanjian`, ?), `sub_prosesor` = IF(?, t.`sub_prosesor`, ?), `sla_lapor_jam` = IF(?, t.`sla_lapor_jam`, ?), `aktif` = IF(?, t.`aktif`, ?), `diperbarui_pada` = IF(?, t.`diperbarui_pada`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?))", [nama === undefined, nama ?? null, layanan === undefined, layanan ?? null, lokasi_data === undefined, lokasi_data ?? null, nomor_perjanjian === undefined, nomor_perjanjian ?? null, butir_perjanjian === undefined, JSON.stringify(butir_perjanjian ?? null), sub_prosesor === undefined, JSON.stringify(sub_prosesor ?? null), sla_lapor_jam === undefined, sla_lapor_jam ?? null, aktif === undefined, aktif ?? null, diperbarui_pada === undefined, diperbarui_pada ?? null, id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
