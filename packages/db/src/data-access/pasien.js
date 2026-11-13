import { baca, tulis, pool } from '../koneksi.js';
export async function cariPasienUntukBuatRuteInstagram(id, fasyankes_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`nama`, t.`nomor_rm` FROM `pasien` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) LIMIT 1", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function cariPasienUntukBuatRuteInstagram2(id, fasyankes_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id` FROM `pasien` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) LIMIT 1", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function hitungPasienUntukCari(fasyankes_id, tahap_layanan, status, pakai, nama, nik, pakai2, mulai, mulai2, pakai3, mulai3, mulai4, mulai5, mulai6, tahap_layanan2, pakai4, pakai5, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `pasien` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR (((NOT EXISTS (SELECT 1 FROM `kunjungan` r1 WHERE t.`id` = r1.`pasien_id` AND (((? OR r1.`tahap_layanan` IN (?))) AND (NOT (((EXISTS (SELECT 1 FROM `antrean` r2 WHERE r1.`id` = r2.`kunjungan_id` AND (((? OR r2.`status` <=> ?))))))))))))))) AND ((((? OR t.`nama` LIKE ? ESCAPE '!'))) OR (((? OR t.`nomor_rm` LIKE ? ESCAPE '!'))) OR ((? AND (((? OR t.`nik` LIKE ? ESCAPE '!'))))) OR ((? AND (((? OR t.`jkn_nomor_kartu` LIKE ? ESCAPE '!')))))) AND ((? OR (EXISTS (SELECT 1 FROM `kunjungan` r3 WHERE t.`id` = r3.`pasien_id` AND (((? OR r3.`mulai` >= ?) AND (? OR r3.`mulai` < ?)) AND ((? OR (EXISTS (SELECT 1 FROM `antrean` r4 WHERE r3.`id` = r4.`kunjungan_id` AND (((? OR r4.`status` <=> ?))))))) AND ((? OR r3.`mulai` >= ?) AND (? OR r3.`mulai` < ?)) AND ((? OR r3.`mulai` >= ?) AND (? OR r3.`mulai` < ?)) AND ((? OR r3.`tahap_layanan` IN (?))) AND ((? OR (NOT (((EXISTS (SELECT 1 FROM `antrean` r5 WHERE r3.`id` = r5.`kunjungan_id` AND (((? OR r5.`status` <=> ?)))))))))))))))", [fasyankes_id === undefined, fasyankes_id ?? null, !pakai, tahap_layanan === undefined, (tahap_layanan)?.length ? (tahap_layanan) : [null], status === undefined, status ?? null, nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', Boolean(pakai2), nik === undefined, String(nik ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', Boolean(pakai2), nik === undefined, String(nik ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', !pakai5, mulai === undefined, mulai ?? null, mulai2 === undefined, mulai2 ?? null, !pakai3, status === undefined, status ?? null, mulai3 === undefined, mulai3 ?? null, mulai4 === undefined, mulai4 ?? null, mulai5 === undefined, mulai5 ?? null, mulai6 === undefined, mulai6 ?? null, tahap_layanan2 === undefined, (tahap_layanan2)?.length ? (tahap_layanan2) : [null], !pakai4, status === undefined, status ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function daftarPasienUntukCari(fasyankes_id, tahap_layanan, status, pakai, nama, nik, pakai2, mulai, mulai2, pakai3, mulai3, mulai4, mulai5, mulai6, tahap_layanan2, pakai4, pakai5, batas, lewati, kunjungan_batas, tipe, koneksi = pool) {
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
        return [...grup.values()].map(baris => ({ id: baris[0].t2__id, fasyankes_id: baris[0].t2__fasyankes_id, kunjungan_id: baris[0].t2__kunjungan_id, lokasi_id: baris[0].t2__lokasi_id, tanggal: baris[0].t2__tanggal, nomor: baris[0].t2__nomor, status: baris[0].t2__status, waktu_daftar: baris[0].t2__waktu_daftar, waktu_panggil: baris[0].t2__waktu_panggil, waktu_mulai: baris[0].t2__waktu_mulai, waktu_selesai: baris[0].t2__waktu_selesai, dibuat_oleh: baris[0].t2__dibuat_oleh, dibuat_pada: baris[0].t2__dibuat_pada }));
    }
    function petakt3(semua) {
        const grup = new Map();
        for (const baris of semua) {
            if (baris.t3__id === null)
                continue;
            const kunci = String(baris.t3__id);
            const isi = grup.get(kunci);
            if (isi)
                isi.push(baris);
            else
                grup.set(kunci, [baris]);
        }
        return [...grup.values()].map(baris => ({ id: baris[0].t3__id, fasyankes_id: baris[0].t3__fasyankes_id, kunjungan_id: baris[0].t3__kunjungan_id, pengguna_id: baris[0].t3__pengguna_id, tipe: baris[0].t3__tipe, mulai: baris[0].t3__mulai, selesai: baris[0].t3__selesai, dibuat_oleh: baris[0].t3__dibuat_oleh, dibuat_pada: baris[0].t3__dibuat_pada }));
    }
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
        return [...grup.values()].map(baris => ({ id: baris[0].t1__id, fasyankes_id: baris[0].t1__fasyankes_id, pasien_id: baris[0].t1__pasien_id, jenis: baris[0].t1__jenis, status: baris[0].t1__status, tahap_layanan: baris[0].t1__tahap_layanan, kunjungan_asal_id: baris[0].t1__kunjungan_asal_id, lokasi_id: baris[0].t1__lokasi_id, cara_pembayaran: baris[0].t1__cara_pembayaran, nomor_sep: baris[0].t1__nomor_sep, spri: baris[0].t1__spri, keluhan_singkat: baris[0].t1__keluhan_singkat, service_type: baris[0].t1__service_type, encounter_id: baris[0].t1__encounter_id, mulai: baris[0].t1__mulai, selesai: baris[0].t1__selesai, waktu_tutup: baris[0].t1__waktu_tutup, dibuat_oleh: baris[0].t1__dibuat_oleh, dibuat_pada: baris[0].t1__dibuat_pada, diarsipkan_pada: baris[0].t1__diarsipkan_pada, retensi_sampai: baris[0].t1__retensi_sampai, antrean: petakt2(baris)[0] ?? null, peserta: petakt3(baris) }));
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
        return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, nomor_rm: baris[0].t0__nomor_rm, nik: baris[0].t0__nik, nama: baris[0].t0__nama, nomor_hp: baris[0].t0__nomor_hp, ibu_kandung: baris[0].t0__ibu_kandung, tempat_lahir: baris[0].t0__tempat_lahir, tanggal_lahir: baris[0].t0__tanggal_lahir, jenis_kelamin: baris[0].t0__jenis_kelamin, agama: baris[0].t0__agama, suku: baris[0].t0__suku, bahasa: baris[0].t0__bahasa, pekerjaan: baris[0].t0__pekerjaan, pendidikan: baris[0].t0__pendidikan, status_kawin: baris[0].t0__status_kawin, alamat: baris[0].t0__alamat, kode_wilayah: baris[0].t0__kode_wilayah, nomor_paspor: baris[0].t0__nomor_paspor, nomor_kitas: baris[0].t0__nomor_kitas, ihs_number: baris[0].t0__ihs_number, jkn_nomor_kartu: baris[0].t0__jkn_nomor_kartu, asuransi_nama: baris[0].t0__asuransi_nama, asuransi_nomor_polis: baris[0].t0__asuransi_nomor_polis, status_identitas: baris[0].t0__status_identitas, jalur_identitas: baris[0].t0__jalur_identitas, tidak_cakap: baris[0].t0__tidak_cakap, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, kunjungan: petakt1(baris) }));
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`nomor_rm` AS `t0__nomor_rm`, t0.`nik` AS `t0__nik`, t0.`nama` AS `t0__nama`, t0.`nomor_hp` AS `t0__nomor_hp`, t0.`ibu_kandung` AS `t0__ibu_kandung`, t0.`tempat_lahir` AS `t0__tempat_lahir`, t0.`tanggal_lahir` AS `t0__tanggal_lahir`, t0.`jenis_kelamin` AS `t0__jenis_kelamin`, t0.`agama` AS `t0__agama`, t0.`suku` AS `t0__suku`, t0.`bahasa` AS `t0__bahasa`, t0.`pekerjaan` AS `t0__pekerjaan`, t0.`pendidikan` AS `t0__pendidikan`, t0.`status_kawin` AS `t0__status_kawin`, t0.`alamat` AS `t0__alamat`, t0.`kode_wilayah` AS `t0__kode_wilayah`, t0.`nomor_paspor` AS `t0__nomor_paspor`, t0.`nomor_kitas` AS `t0__nomor_kitas`, t0.`ihs_number` AS `t0__ihs_number`, t0.`jkn_nomor_kartu` AS `t0__jkn_nomor_kartu`, t0.`asuransi_nama` AS `t0__asuransi_nama`, t0.`asuransi_nomor_polis` AS `t0__asuransi_nomor_polis`, t0.`status_identitas` AS `t0__status_identitas`, t0.`jalur_identitas` AS `t0__jalur_identitas`, t0.`tidak_cakap` AS `t0__tidak_cakap`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t1.`id` AS `t1__id`, t1.`fasyankes_id` AS `t1__fasyankes_id`, t1.`pasien_id` AS `t1__pasien_id`, t1.`jenis` AS `t1__jenis`, t1.`status` AS `t1__status`, t1.`tahap_layanan` AS `t1__tahap_layanan`, t1.`kunjungan_asal_id` AS `t1__kunjungan_asal_id`, t1.`lokasi_id` AS `t1__lokasi_id`, t1.`cara_pembayaran` AS `t1__cara_pembayaran`, t1.`nomor_sep` AS `t1__nomor_sep`, t1.`spri` AS `t1__spri`, t1.`keluhan_singkat` AS `t1__keluhan_singkat`, t1.`service_type` AS `t1__service_type`, t1.`encounter_id` AS `t1__encounter_id`, t1.`mulai` AS `t1__mulai`, t1.`selesai` AS `t1__selesai`, t1.`waktu_tutup` AS `t1__waktu_tutup`, t1.`dibuat_oleh` AS `t1__dibuat_oleh`, t1.`dibuat_pada` AS `t1__dibuat_pada`, t1.`diarsipkan_pada` AS `t1__diarsipkan_pada`, t1.`retensi_sampai` AS `t1__retensi_sampai`, t2.`id` AS `t2__id`, t2.`fasyankes_id` AS `t2__fasyankes_id`, t2.`kunjungan_id` AS `t2__kunjungan_id`, t2.`lokasi_id` AS `t2__lokasi_id`, t2.`tanggal` AS `t2__tanggal`, t2.`nomor` AS `t2__nomor`, t2.`status` AS `t2__status`, t2.`waktu_daftar` AS `t2__waktu_daftar`, t2.`waktu_panggil` AS `t2__waktu_panggil`, t2.`waktu_mulai` AS `t2__waktu_mulai`, t2.`waktu_selesai` AS `t2__waktu_selesai`, t2.`dibuat_oleh` AS `t2__dibuat_oleh`, t2.`dibuat_pada` AS `t2__dibuat_pada`, t3.`id` AS `t3__id`, t3.`fasyankes_id` AS `t3__fasyankes_id`, t3.`kunjungan_id` AS `t3__kunjungan_id`, t3.`pengguna_id` AS `t3__pengguna_id`, t3.`tipe` AS `t3__tipe`, t3.`mulai` AS `t3__mulai`, t3.`selesai` AS `t3__selesai`, t3.`dibuat_oleh` AS `t3__dibuat_oleh`, t3.`dibuat_pada` AS `t3__dibuat_pada`\nFROM (SELECT t0.* FROM `pasien` t0 WHERE ((? OR t0.`fasyankes_id` <=> ?)) AND ((? OR (((NOT EXISTS (SELECT 1 FROM `kunjungan` r1 WHERE t0.`id` = r1.`pasien_id` AND (((? OR r1.`tahap_layanan` IN (?))) AND (NOT (((EXISTS (SELECT 1 FROM `antrean` r2 WHERE r1.`id` = r2.`kunjungan_id` AND (((? OR r2.`status` <=> ?))))))))))))))) AND ((((? OR t0.`nama` LIKE ? ESCAPE '!'))) OR (((? OR t0.`nomor_rm` LIKE ? ESCAPE '!'))) OR ((? AND (((? OR t0.`nik` LIKE ? ESCAPE '!'))))) OR ((? AND (((? OR t0.`jkn_nomor_kartu` LIKE ? ESCAPE '!')))))) AND ((? OR (EXISTS (SELECT 1 FROM `kunjungan` r3 WHERE t0.`id` = r3.`pasien_id` AND (((? OR r3.`mulai` >= ?) AND (? OR r3.`mulai` < ?)) AND ((? OR (EXISTS (SELECT 1 FROM `antrean` r4 WHERE r3.`id` = r4.`kunjungan_id` AND (((? OR r4.`status` <=> ?))))))) AND ((? OR r3.`mulai` >= ?) AND (? OR r3.`mulai` < ?)) AND ((? OR r3.`mulai` >= ?) AND (? OR r3.`mulai` < ?)) AND ((? OR r3.`tahap_layanan` IN (?))) AND ((? OR (NOT (((EXISTS (SELECT 1 FROM `antrean` r5 WHERE r3.`id` = r5.`kunjungan_id` AND (((? OR r5.`status` <=> ?))))))))))))))) ORDER BY t0.`nama` ASC, t0.`id` ASC LIMIT ? OFFSET ?) t0\nLEFT JOIN (SELECT b1.*, ROW_NUMBER() OVER (PARTITION BY b1.`pasien_id` ORDER BY b1.`id` DESC) AS _urutan FROM `kunjungan` b1 WHERE ((? OR b1.`mulai` >= ?) AND (? OR b1.`mulai` < ?)) AND ((? OR (EXISTS (SELECT 1 FROM `antrean` r6 WHERE b1.`id` = r6.`kunjungan_id` AND (((? OR r6.`status` <=> ?))))))) AND ((? OR b1.`mulai` >= ?) AND (? OR b1.`mulai` < ?)) AND ((? OR b1.`mulai` >= ?) AND (? OR b1.`mulai` < ?)) AND ((? OR b1.`tahap_layanan` IN (?))) AND ((? OR (NOT (((EXISTS (SELECT 1 FROM `antrean` r7 WHERE b1.`id` = r7.`kunjungan_id` AND (((? OR r7.`status` <=> ?))))))))))) t1 ON t0.`id` = t1.`pasien_id` AND t1._urutan <= ?\nLEFT JOIN (SELECT b2.* FROM `antrean` b2 WHERE TRUE) t2 ON t1.`id` = t2.`kunjungan_id`\nLEFT JOIN (SELECT b3.*, ROW_NUMBER() OVER (PARTITION BY b3.`kunjungan_id` ORDER BY b3.`id` ASC) AS _urutan FROM `peserta_kunjungan` b3 WHERE ((? OR b3.`tipe` <=> ?))) t3 ON t1.`id` = t3.`kunjungan_id` AND t3._urutan <= ?\nORDER BY t0.`nama` ASC, t0.`id` ASC, t1.`id` DESC, t2.`id` ASC, t3.`id` ASC", [fasyankes_id === undefined, fasyankes_id ?? null, !pakai, tahap_layanan === undefined, (tahap_layanan)?.length ? (tahap_layanan) : [null], status === undefined, status ?? null, nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', Boolean(pakai2), nik === undefined, String(nik ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', Boolean(pakai2), nik === undefined, String(nik ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', !pakai5, mulai === undefined, mulai ?? null, mulai2 === undefined, mulai2 ?? null, !pakai3, status === undefined, status ?? null, mulai3 === undefined, mulai3 ?? null, mulai4 === undefined, mulai4 ?? null, mulai5 === undefined, mulai5 ?? null, mulai6 === undefined, mulai6 ?? null, tahap_layanan2 === undefined, (tahap_layanan2)?.length ? (tahap_layanan2) : [null], !pakai4, status === undefined, status ?? null, batas ?? 2147483647, lewati ?? 0, mulai === undefined, mulai ?? null, mulai2 === undefined, mulai2 ?? null, !pakai3, status === undefined, status ?? null, mulai3 === undefined, mulai3 ?? null, mulai4 === undefined, mulai4 ?? null, mulai5 === undefined, mulai5 ?? null, mulai6 === undefined, mulai6 ?? null, tahap_layanan2 === undefined, (tahap_layanan2)?.length ? (tahap_layanan2) : [null], !pakai4, status === undefined, status ?? null, (kunjungan_batas ?? 2147483647) + (0), tipe === undefined, tipe ?? null, (kunjungan_batas ?? 2147483647) + (0)], koneksi);
    const hasil = petakt0(baris);
    return hasil;
}
export async function cariPasienUntukDetail(id, fasyankes_id, koneksi = pool) {
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
        return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, nomor_rm: baris[0].t0__nomor_rm, nik: baris[0].t0__nik, nama: baris[0].t0__nama, nomor_hp: baris[0].t0__nomor_hp, ibu_kandung: baris[0].t0__ibu_kandung, tempat_lahir: baris[0].t0__tempat_lahir, tanggal_lahir: baris[0].t0__tanggal_lahir, jenis_kelamin: baris[0].t0__jenis_kelamin, agama: baris[0].t0__agama, suku: baris[0].t0__suku, bahasa: baris[0].t0__bahasa, pekerjaan: baris[0].t0__pekerjaan, pendidikan: baris[0].t0__pendidikan, status_kawin: baris[0].t0__status_kawin, alamat: baris[0].t0__alamat, kode_wilayah: baris[0].t0__kode_wilayah, nomor_paspor: baris[0].t0__nomor_paspor, nomor_kitas: baris[0].t0__nomor_kitas, ihs_number: baris[0].t0__ihs_number, jkn_nomor_kartu: baris[0].t0__jkn_nomor_kartu, asuransi_nama: baris[0].t0__asuransi_nama, asuransi_nomor_polis: baris[0].t0__asuransi_nomor_polis, status_identitas: baris[0].t0__status_identitas, jalur_identitas: baris[0].t0__jalur_identitas, tidak_cakap: baris[0].t0__tidak_cakap, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, wali_keluarga: petakt1(baris) }));
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`nomor_rm` AS `t0__nomor_rm`, t0.`nik` AS `t0__nik`, t0.`nama` AS `t0__nama`, t0.`nomor_hp` AS `t0__nomor_hp`, t0.`ibu_kandung` AS `t0__ibu_kandung`, t0.`tempat_lahir` AS `t0__tempat_lahir`, t0.`tanggal_lahir` AS `t0__tanggal_lahir`, t0.`jenis_kelamin` AS `t0__jenis_kelamin`, t0.`agama` AS `t0__agama`, t0.`suku` AS `t0__suku`, t0.`bahasa` AS `t0__bahasa`, t0.`pekerjaan` AS `t0__pekerjaan`, t0.`pendidikan` AS `t0__pendidikan`, t0.`status_kawin` AS `t0__status_kawin`, t0.`alamat` AS `t0__alamat`, t0.`kode_wilayah` AS `t0__kode_wilayah`, t0.`nomor_paspor` AS `t0__nomor_paspor`, t0.`nomor_kitas` AS `t0__nomor_kitas`, t0.`ihs_number` AS `t0__ihs_number`, t0.`jkn_nomor_kartu` AS `t0__jkn_nomor_kartu`, t0.`asuransi_nama` AS `t0__asuransi_nama`, t0.`asuransi_nomor_polis` AS `t0__asuransi_nomor_polis`, t0.`status_identitas` AS `t0__status_identitas`, t0.`jalur_identitas` AS `t0__jalur_identitas`, t0.`tidak_cakap` AS `t0__tidak_cakap`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t1.`id` AS `t1__id`, t1.`fasyankes_id` AS `t1__fasyankes_id`, t1.`pasien_id` AS `t1__pasien_id`, t1.`hubungan` AS `t1__hubungan`, t1.`nama` AS `t1__nama`, t1.`kontak` AS `t1__kontak`, t1.`dibuat_oleh` AS `t1__dibuat_oleh`, t1.`dibuat_pada` AS `t1__dibuat_pada`\nFROM (SELECT t0.* FROM `pasien` t0 WHERE ((? OR t0.`id` <=> ?)) AND ((? OR t0.`fasyankes_id` <=> ?)) LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `wali_keluarga` b1 WHERE TRUE) t1 ON t0.`id` = t1.`pasien_id`\nORDER BY t1.`id` ASC", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    const hasil = petakt0(baris);
    return (hasil[0] ?? null);
}
export async function daftarPasienUntukDuplikat(fasyankes_id, nik, batas, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`nomor_rm`, t.`nik`, t.`nama`, t.`nomor_hp`, t.`ibu_kandung`, t.`tempat_lahir`, t.`tanggal_lahir`, t.`jenis_kelamin`, t.`agama`, t.`suku`, t.`bahasa`, t.`pekerjaan`, t.`pendidikan`, t.`status_kawin`, t.`alamat`, t.`kode_wilayah`, t.`nomor_paspor`, t.`nomor_kitas`, t.`ihs_number`, t.`jkn_nomor_kartu`, t.`asuransi_nama`, t.`asuransi_nomor_polis`, t.`status_identitas`, t.`jalur_identitas`, t.`tidak_cakap`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `pasien` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`nik` <=> ?)) LIMIT ? OFFSET ?", [fasyankes_id === undefined, fasyankes_id ?? null, nik === undefined, nik ?? null, batas ?? 2147483647, 0], koneksi);
    return baris;
}
export async function daftarPasienUntukDuplikat2(fasyankes_id, nama, tanggal_lahir, ibu_kandung, batas, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`nomor_rm`, t.`nik`, t.`nama`, t.`nomor_hp`, t.`ibu_kandung`, t.`tempat_lahir`, t.`tanggal_lahir`, t.`jenis_kelamin`, t.`agama`, t.`suku`, t.`bahasa`, t.`pekerjaan`, t.`pendidikan`, t.`status_kawin`, t.`alamat`, t.`kode_wilayah`, t.`nomor_paspor`, t.`nomor_kitas`, t.`ihs_number`, t.`jkn_nomor_kartu`, t.`asuransi_nama`, t.`asuransi_nomor_polis`, t.`status_identitas`, t.`jalur_identitas`, t.`tidak_cakap`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `pasien` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`nama` <=> ?)) AND ((? OR t.`tanggal_lahir` <=> ?)) AND ((? OR t.`ibu_kandung` <=> ?)) LIMIT ? OFFSET ?", [fasyankes_id === undefined, fasyankes_id ?? null, nama === undefined, nama ?? null, tanggal_lahir === undefined, tanggal_lahir ?? null, ibu_kandung === undefined, ibu_kandung ?? null, batas ?? 2147483647, 0], koneksi);
    return baris;
}
export async function ubahPasienUntukPerbaiki(nik, nama, nomor_hp, ibu_kandung, tempat_lahir, tanggal_lahir, jenis_kelamin, agama, suku, bahasa, pekerjaan, pendidikan, status_kawin, alamat, kode_wilayah, nomor_paspor, nomor_kitas, jkn_nomor_kartu, asuransi_nama, asuransi_nomor_polis, status_identitas, jalur_identitas, tidak_cakap, id, fasyankes_id, koneksi = pool) {
    const hasil = await tulis("UPDATE `pasien` t SET `nik` = IF(?, t.`nik`, ?), `nama` = IF(?, t.`nama`, ?), `nomor_hp` = IF(?, t.`nomor_hp`, ?), `ibu_kandung` = IF(?, t.`ibu_kandung`, ?), `tempat_lahir` = IF(?, t.`tempat_lahir`, ?), `tanggal_lahir` = IF(?, t.`tanggal_lahir`, ?), `jenis_kelamin` = IF(?, t.`jenis_kelamin`, ?), `agama` = IF(?, t.`agama`, ?), `suku` = IF(?, t.`suku`, ?), `bahasa` = IF(?, t.`bahasa`, ?), `pekerjaan` = IF(?, t.`pekerjaan`, ?), `pendidikan` = IF(?, t.`pendidikan`, ?), `status_kawin` = IF(?, t.`status_kawin`, ?), `alamat` = IF(?, t.`alamat`, ?), `kode_wilayah` = IF(?, t.`kode_wilayah`, ?), `nomor_paspor` = IF(?, t.`nomor_paspor`, ?), `nomor_kitas` = IF(?, t.`nomor_kitas`, ?), `jkn_nomor_kartu` = IF(?, t.`jkn_nomor_kartu`, ?), `asuransi_nama` = IF(?, t.`asuransi_nama`, ?), `asuransi_nomor_polis` = IF(?, t.`asuransi_nomor_polis`, ?), `status_identitas` = IF(?, t.`status_identitas`, ?), `jalur_identitas` = IF(?, t.`jalur_identitas`, ?), `tidak_cakap` = IF(?, t.`tidak_cakap`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?))", [nik === undefined, nik ?? null, nama === undefined, nama ?? null, nomor_hp === undefined, nomor_hp ?? null, ibu_kandung === undefined, ibu_kandung ?? null, tempat_lahir === undefined, tempat_lahir ?? null, tanggal_lahir === undefined, tanggal_lahir ?? null, jenis_kelamin === undefined, (jenis_kelamin ?? null), agama === undefined, agama ?? null, suku === undefined, suku ?? null, bahasa === undefined, bahasa ?? null, pekerjaan === undefined, pekerjaan ?? null, pendidikan === undefined, pendidikan ?? null, status_kawin === undefined, status_kawin ?? null, alamat === undefined, alamat ?? null, kode_wilayah === undefined, kode_wilayah ?? null, nomor_paspor === undefined, nomor_paspor ?? null, nomor_kitas === undefined, nomor_kitas ?? null, jkn_nomor_kartu === undefined, jkn_nomor_kartu ?? null, asuransi_nama === undefined, asuransi_nama ?? null, asuransi_nomor_polis === undefined, asuransi_nomor_polis ?? null, status_identitas === undefined, (status_identitas ?? null), jalur_identitas === undefined, jalur_identitas ?? null, tidak_cakap === undefined, tidak_cakap ?? null, id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function tambahPasienUntukDaftarkan(fasyankes_id, nomor_rm, nik, nama, nomor_hp, ibu_kandung, tempat_lahir, tanggal_lahir, jenis_kelamin, agama, suku, bahasa, pekerjaan, pendidikan, status_kawin, alamat, kode_wilayah, nomor_paspor, nomor_kitas, jkn_nomor_kartu, asuransi_nama, asuransi_nomor_polis, status_identitas, jalur_identitas, tidak_cakap, dibuat_oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `pasien` (`fasyankes_id`, `nomor_rm`, `nik`, `nama`, `nomor_hp`, `ibu_kandung`, `tempat_lahir`, `tanggal_lahir`, `jenis_kelamin`, `agama`, `suku`, `bahasa`, `pekerjaan`, `pendidikan`, `status_kawin`, `alamat`, `kode_wilayah`, `nomor_paspor`, `nomor_kitas`, `jkn_nomor_kartu`, `asuransi_nama`, `asuransi_nomor_polis`, `status_identitas`, `jalur_identitas`, `tidak_cakap`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (nomor_rm === undefined ? null : nomor_rm) ?? null, (nik === undefined ? null : nik) ?? null, (nama === undefined ? null : nama) ?? null, (nomor_hp === undefined ? null : nomor_hp) ?? null, (ibu_kandung === undefined ? null : ibu_kandung) ?? null, (tempat_lahir === undefined ? null : tempat_lahir) ?? null, (tanggal_lahir === undefined ? null : tanggal_lahir) ?? null, ((jenis_kelamin === undefined ? null : jenis_kelamin) ?? null), (agama === undefined ? null : agama) ?? null, (suku === undefined ? null : suku) ?? null, (bahasa === undefined ? null : bahasa) ?? null, (pekerjaan === undefined ? null : pekerjaan) ?? null, (pendidikan === undefined ? null : pendidikan) ?? null, (status_kawin === undefined ? null : status_kawin) ?? null, (alamat === undefined ? null : alamat) ?? null, (kode_wilayah === undefined ? null : kode_wilayah) ?? null, (nomor_paspor === undefined ? null : nomor_paspor) ?? null, (nomor_kitas === undefined ? null : nomor_kitas) ?? null, (jkn_nomor_kartu === undefined ? null : jkn_nomor_kartu) ?? null, (asuransi_nama === undefined ? null : asuransi_nama) ?? null, (asuransi_nomor_polis === undefined ? null : asuransi_nomor_polis) ?? null, ((status_identitas === undefined ? "lengkap" : status_identitas) ?? null), (jalur_identitas === undefined ? "nik" : jalur_identitas) ?? null, (tidak_cakap === undefined ? false : tidak_cakap) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahPasienUntukDaftarkanHasil(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`nomor_rm`, t.`nik`, t.`nama`, t.`nomor_hp`, t.`ibu_kandung`, t.`tempat_lahir`, t.`tanggal_lahir`, t.`jenis_kelamin`, t.`agama`, t.`suku`, t.`bahasa`, t.`pekerjaan`, t.`pendidikan`, t.`status_kawin`, t.`alamat`, t.`kode_wilayah`, t.`nomor_paspor`, t.`nomor_kitas`, t.`ihs_number`, t.`jkn_nomor_kartu`, t.`asuransi_nama`, t.`asuransi_nomor_polis`, t.`status_identitas`, t.`jalur_identitas`, t.`tidak_cakap`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `pasien` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris pasien tidak ditemukan.');
    return baris[0];
}
export async function hitungPasienUntukPasienAda(id, fasyankes_id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `pasien` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?))", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function daftarPasienUntukPetakanAntrean(fasyankes_id, id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`nama`, t.`nomor_rm` FROM `pasien` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`id` IN (?)))", [fasyankes_id === undefined, fasyankes_id ?? null, id === undefined, (id)?.length ? (id) : [null]], koneksi);
    return baris;
}
export async function daftarPasienUntukDaftarPembukaan(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`nama`, t.`nomor_rm` FROM `pasien` t WHERE ((? OR t.`id` IN (?)))", [id === undefined, (id)?.length ? (id) : [null]], koneksi);
    return baris;
}
export async function daftarPasienUntukDaftarPenyampaian(fasyankes_id, nama, koneksi = pool) {
    const baris = await baca("SELECT t.`id` FROM `pasien` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((((? OR t.`nama` LIKE ? ESCAPE '!'))) OR (((? OR t.`nomor_rm` LIKE ? ESCAPE '!'))))", [fasyankes_id === undefined, fasyankes_id ?? null, nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%'], koneksi);
    return baris;
}
export async function daftarPasienUntukDaftarHak(fasyankes_id, nama, batas, koneksi = pool) {
    const baris = await baca("SELECT t.`id` FROM `pasien` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((((? OR t.`nama` LIKE ? ESCAPE '!'))) OR (((? OR t.`nomor_rm` LIKE ? ESCAPE '!')))) LIMIT ? OFFSET ?", [fasyankes_id === undefined, fasyankes_id ?? null, nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', batas ?? 2147483647, 0], koneksi);
    return baris;
}
export async function daftarPasienUntukRekap(id, fasyankes_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`nama`, t.`nomor_rm` FROM `pasien` t WHERE ((? OR t.`id` IN (?))) AND ((? OR t.`fasyankes_id` <=> ?))", [id === undefined, (id)?.length ? (id) : [null], fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return baris;
}
export async function cariPasienUntukPasien3(id, fasyankes_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`nama`, t.`tidak_cakap` FROM `pasien` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) LIMIT 1", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function cariPasienUntukBuatRuteWhatsapp(id, fasyankes_id, koneksi = pool) {
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
        return [...grup.values()].map(baris => ({ nama: baris[0].t1__nama, hubungan: baris[0].t1__hubungan, kontak: baris[0].t1__kontak }));
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
        return [...grup.values()].map(baris => ({ id: baris[0].t0__id, nama: baris[0].t0__nama, nomor_hp: baris[0].t0__nomor_hp, wali_keluarga: petakt1(baris) }));
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`nama` AS `t0__nama`, t0.`nomor_hp` AS `t0__nomor_hp`, t1.`id` AS `t1__id`, t1.`nama` AS `t1__nama`, t1.`hubungan` AS `t1__hubungan`, t1.`kontak` AS `t1__kontak`\nFROM (SELECT t0.* FROM `pasien` t0 WHERE ((? OR t0.`id` <=> ?)) AND ((? OR t0.`fasyankes_id` <=> ?)) LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `wali_keluarga` b1 WHERE TRUE) t1 ON t0.`id` = t1.`pasien_id`\nORDER BY t1.`id` ASC", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    const hasil = petakt0(baris);
    return (hasil[0] ?? null);
}
export async function cariPasienUntukBuatRuteWhatsapp2(id, fasyankes_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`nama` FROM `pasien` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) LIMIT 1", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function kunciPasien(pasienId, fasyankesId, koneksi = pool) {
    return baca("SELECT id FROM pasien WHERE id = ? AND fasyankes_id = ? FOR UPDATE", [pasienId, fasyankesId], koneksi);
}
export function kunciPasienRawatInap(id, fasyankesId, koneksi) {
    return baca('SELECT id FROM pasien WHERE id = ? AND fasyankes_id = ? FOR UPDATE', [id, fasyankesId], koneksi);
}
