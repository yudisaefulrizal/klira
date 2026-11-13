import { baca, tulis, pool } from '../../koneksi.js';
export async function tambahPasienUntukBuatKunjungan(fasyankes_id, nomor_rm, nama, tanggal_lahir, jenis_kelamin, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `pasien` (`fasyankes_id`, `nomor_rm`, `nama`, `tanggal_lahir`, `jenis_kelamin`) VALUES (?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (nomor_rm === undefined ? null : nomor_rm) ?? null, (nama === undefined ? null : nama) ?? null, (tanggal_lahir === undefined ? null : tanggal_lahir) ?? null, ((jenis_kelamin === undefined ? null : jenis_kelamin) ?? null)], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahPasienUntukBuatKunjunganHasil(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`nomor_rm`, t.`nik`, t.`nama`, t.`nomor_hp`, t.`ibu_kandung`, t.`tempat_lahir`, t.`tanggal_lahir`, t.`jenis_kelamin`, t.`agama`, t.`suku`, t.`bahasa`, t.`pekerjaan`, t.`pendidikan`, t.`status_kawin`, t.`alamat`, t.`kode_wilayah`, t.`nomor_paspor`, t.`nomor_kitas`, t.`ihs_number`, t.`jkn_nomor_kartu`, t.`asuransi_nama`, t.`asuransi_nomor_polis`, t.`status_identitas`, t.`jalur_identitas`, t.`tidak_cakap`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `pasien` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris pasien tidak ditemukan.');
    return baris[0];
}
export async function hapusPasienUntukFarmasiFarmasiIntegrasiTest(fasyankes_id, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `pasien` t WHERE ((? OR t.`fasyankes_id` IN (?)))", [fasyankes_id === undefined, (fasyankes_id)?.length ? (fasyankes_id) : [null]], koneksi);
    return { count: hasil.affectedRows };
}
export async function hitungPasienUntukPasienPasienIntegrasiTest(fasyankes_id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `pasien` t WHERE ((? OR t.`fasyankes_id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function wajibPasienUntukPasienPasienIntegrasiTest(id, koneksi = pool) {
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
        return [...grup.values()].map(baris => ({ id: baris[0].t1__id, fasyankes_id: baris[0].t1__fasyankes_id, pasien_id: baris[0].t1__pasien_id, hubungan: baris[0].t1__hubungan, nama: baris[0].t1__nama, kontak: baris[0].t1__kontak, dibuat_oleh: baris[0].t1__dibuat_oleh, dibuat_pada: baris[0].t1__dibuat_pada }));
    }
    function petakt2(semua) {
        const grup = new Map();
        for (const baris of semua) {
            if (baris.t2__id === null)
                continue;
            const kunci = String(baris.t2__id);
            const isi = grup.get(kunci);
            if (isi)
                isi.push(baris);
            else
                grup.set(kunci, [baris]);
        }
        return [...grup.values()].map(baris => ({ id: baris[0].t2__id, fasyankes_id: baris[0].t2__fasyankes_id, pasien_id: baris[0].t2__pasien_id, jenis: baris[0].t2__jenis, teks_persetujuan_id: baris[0].t2__teks_persetujuan_id, versi_teks: baris[0].t2__versi_teks, tujuan: baris[0].t2__tujuan, penjelasan: baris[0].t2__penjelasan, bentuk: baris[0].t2__bentuk, status: baris[0].t2__status, waktu: baris[0].t2__waktu, penandatangan: baris[0].t2__penandatangan, wali_id: baris[0].t2__wali_id, penandatangan_nama: baris[0].t2__penandatangan_nama, saksi_pengguna_id: baris[0].t2__saksi_pengguna_id, kunjungan_id: baris[0].t2__kunjungan_id, tindakan_kode: baris[0].t2__tindakan_kode, tindakan_nama: baris[0].t2__tindakan_nama, dibuat_oleh: baris[0].t2__dibuat_oleh, dibuat_pada: baris[0].t2__dibuat_pada }));
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
        return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, nomor_rm: baris[0].t0__nomor_rm, nik: baris[0].t0__nik, nama: baris[0].t0__nama, nomor_hp: baris[0].t0__nomor_hp, ibu_kandung: baris[0].t0__ibu_kandung, tempat_lahir: baris[0].t0__tempat_lahir, tanggal_lahir: baris[0].t0__tanggal_lahir, jenis_kelamin: baris[0].t0__jenis_kelamin, agama: baris[0].t0__agama, suku: baris[0].t0__suku, bahasa: baris[0].t0__bahasa, pekerjaan: baris[0].t0__pekerjaan, pendidikan: baris[0].t0__pendidikan, status_kawin: baris[0].t0__status_kawin, alamat: baris[0].t0__alamat, kode_wilayah: baris[0].t0__kode_wilayah, nomor_paspor: baris[0].t0__nomor_paspor, nomor_kitas: baris[0].t0__nomor_kitas, ihs_number: baris[0].t0__ihs_number, jkn_nomor_kartu: baris[0].t0__jkn_nomor_kartu, asuransi_nama: baris[0].t0__asuransi_nama, asuransi_nomor_polis: baris[0].t0__asuransi_nomor_polis, status_identitas: baris[0].t0__status_identitas, jalur_identitas: baris[0].t0__jalur_identitas, tidak_cakap: baris[0].t0__tidak_cakap, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, wali_keluarga: petakt1(baris), persetujuan: petakt2(baris) }));
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`nomor_rm` AS `t0__nomor_rm`, t0.`nik` AS `t0__nik`, t0.`nama` AS `t0__nama`, t0.`nomor_hp` AS `t0__nomor_hp`, t0.`ibu_kandung` AS `t0__ibu_kandung`, t0.`tempat_lahir` AS `t0__tempat_lahir`, t0.`tanggal_lahir` AS `t0__tanggal_lahir`, t0.`jenis_kelamin` AS `t0__jenis_kelamin`, t0.`agama` AS `t0__agama`, t0.`suku` AS `t0__suku`, t0.`bahasa` AS `t0__bahasa`, t0.`pekerjaan` AS `t0__pekerjaan`, t0.`pendidikan` AS `t0__pendidikan`, t0.`status_kawin` AS `t0__status_kawin`, t0.`alamat` AS `t0__alamat`, t0.`kode_wilayah` AS `t0__kode_wilayah`, t0.`nomor_paspor` AS `t0__nomor_paspor`, t0.`nomor_kitas` AS `t0__nomor_kitas`, t0.`ihs_number` AS `t0__ihs_number`, t0.`jkn_nomor_kartu` AS `t0__jkn_nomor_kartu`, t0.`asuransi_nama` AS `t0__asuransi_nama`, t0.`asuransi_nomor_polis` AS `t0__asuransi_nomor_polis`, t0.`status_identitas` AS `t0__status_identitas`, t0.`jalur_identitas` AS `t0__jalur_identitas`, t0.`tidak_cakap` AS `t0__tidak_cakap`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t1.`id` AS `t1__id`, t1.`fasyankes_id` AS `t1__fasyankes_id`, t1.`pasien_id` AS `t1__pasien_id`, t1.`hubungan` AS `t1__hubungan`, t1.`nama` AS `t1__nama`, t1.`kontak` AS `t1__kontak`, t1.`dibuat_oleh` AS `t1__dibuat_oleh`, t1.`dibuat_pada` AS `t1__dibuat_pada`, t2.`id` AS `t2__id`, t2.`fasyankes_id` AS `t2__fasyankes_id`, t2.`pasien_id` AS `t2__pasien_id`, t2.`jenis` AS `t2__jenis`, t2.`teks_persetujuan_id` AS `t2__teks_persetujuan_id`, t2.`versi_teks` AS `t2__versi_teks`, t2.`tujuan` AS `t2__tujuan`, t2.`penjelasan` AS `t2__penjelasan`, t2.`bentuk` AS `t2__bentuk`, t2.`status` AS `t2__status`, t2.`waktu` AS `t2__waktu`, t2.`penandatangan` AS `t2__penandatangan`, t2.`wali_id` AS `t2__wali_id`, t2.`penandatangan_nama` AS `t2__penandatangan_nama`, t2.`saksi_pengguna_id` AS `t2__saksi_pengguna_id`, t2.`kunjungan_id` AS `t2__kunjungan_id`, t2.`tindakan_kode` AS `t2__tindakan_kode`, t2.`tindakan_nama` AS `t2__tindakan_nama`, t2.`dibuat_oleh` AS `t2__dibuat_oleh`, t2.`dibuat_pada` AS `t2__dibuat_pada`\nFROM (SELECT t0.* FROM `pasien` t0 WHERE ((? OR t0.`id` <=> ?)) LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `wali_keluarga` b1 WHERE TRUE) t1 ON t0.`id` = t1.`pasien_id`\nLEFT JOIN (SELECT b2.* FROM `persetujuan` b2 WHERE TRUE) t2 ON t0.`id` = t2.`pasien_id`\nORDER BY t1.`id` ASC, t2.`id` ASC", [id === undefined, id ?? null], koneksi);
    const hasil = petakt0(baris);
    if (!hasil[0])
        throw new Error('Baris pasien tidak ditemukan.');
    return hasil[0];
}
export async function daftarPasienUntukPasienPasienIntegrasiTest(fasyankes_id, koneksi = pool) {
    const baris = await baca("SELECT t.`nomor_rm` FROM `pasien` t WHERE ((? OR t.`fasyankes_id` <=> ?)) ORDER BY t.`id` ASC", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return baris;
}
export async function tambahPasienUntukBuatPasien2(fasyankes_id, nomor_rm, nama, tanggal_lahir, jenis_kelamin, tidak_cakap, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `pasien` (`fasyankes_id`, `nomor_rm`, `nama`, `tanggal_lahir`, `jenis_kelamin`, `tidak_cakap`) VALUES (?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (nomor_rm === undefined ? null : nomor_rm) ?? null, (nama === undefined ? null : nama) ?? null, (tanggal_lahir === undefined ? null : tanggal_lahir) ?? null, ((jenis_kelamin === undefined ? null : jenis_kelamin) ?? null), tidak_cakap], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
