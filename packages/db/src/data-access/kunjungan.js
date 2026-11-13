import { baca, tulis, pool } from '../koneksi.js';
export async function daftarKunjunganUntukBuatRuteStatistik(fasyankes_id, jenis, lokasi_id, mulai, mulai2, koneksi = pool) {
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
        return [...grup.values()].map(baris => ({ nomor: baris[0].t1__nomor, awalan: baris[0].t1__awalan, jenis_poli: baris[0].t1__jenis_poli, status: baris[0].t1__status }));
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
        return [...grup.values()].map(baris => ({ id: baris[0].t0__id, pasien_id: baris[0].t0__pasien_id, mulai: baris[0].t0__mulai, tahap_layanan: baris[0].t0__tahap_layanan, lokasi_id: baris[0].t0__lokasi_id, antrean: petakt1(baris)[0] ?? null }));
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`pasien_id` AS `t0__pasien_id`, t0.`mulai` AS `t0__mulai`, t0.`tahap_layanan` AS `t0__tahap_layanan`, t0.`lokasi_id` AS `t0__lokasi_id`, t1.`id` AS `t1__id`, t1.`nomor` AS `t1__nomor`, t1.`awalan` AS `t1__awalan`, t1.`jenis_poli` AS `t1__jenis_poli`, t1.`status` AS `t1__status`\nFROM (SELECT t0.* FROM `kunjungan` t0 WHERE ((? OR t0.`fasyankes_id` <=> ?)) AND ((? OR t0.`jenis` <=> ?)) AND ((? OR t0.`lokasi_id` <=> ?)) AND ((? OR t0.`mulai` >= ?) AND (? OR t0.`mulai` < ?))) t0\nLEFT JOIN (SELECT b1.* FROM `antrean` b1 WHERE TRUE) t1 ON t0.`id` = t1.`kunjungan_id`\nORDER BY t1.`id` ASC", [fasyankes_id === undefined, fasyankes_id ?? null, jenis === undefined, jenis ?? null, lokasi_id === undefined, lokasi_id ?? null, mulai === undefined, mulai ?? null, mulai2 === undefined, mulai2 ?? null], koneksi);
    const hasil = petakt0(baris);
    return hasil;
}
export async function daftarKunjunganUntukBuatRuteStatistik2(fasyankes_id, jenis, lokasi_id, tahap_layanan, koneksi = pool) {
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
        return [...grup.values()].map(baris => ({ nomor: baris[0].t1__nomor, awalan: baris[0].t1__awalan, jenis_poli: baris[0].t1__jenis_poli, status: baris[0].t1__status }));
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
        return [...grup.values()].map(baris => ({ id: baris[0].t0__id, pasien_id: baris[0].t0__pasien_id, mulai: baris[0].t0__mulai, tahap_layanan: baris[0].t0__tahap_layanan, lokasi_id: baris[0].t0__lokasi_id, antrean: petakt1(baris)[0] ?? null }));
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`pasien_id` AS `t0__pasien_id`, t0.`mulai` AS `t0__mulai`, t0.`tahap_layanan` AS `t0__tahap_layanan`, t0.`lokasi_id` AS `t0__lokasi_id`, t1.`id` AS `t1__id`, t1.`nomor` AS `t1__nomor`, t1.`awalan` AS `t1__awalan`, t1.`jenis_poli` AS `t1__jenis_poli`, t1.`status` AS `t1__status`\nFROM (SELECT t0.* FROM `kunjungan` t0 WHERE ((? OR t0.`fasyankes_id` <=> ?)) AND ((? OR t0.`jenis` <=> ?)) AND ((? OR t0.`lokasi_id` <=> ?)) AND ((? OR NOT (t0.`tahap_layanan` <=> ?)))) t0\nLEFT JOIN (SELECT b1.* FROM `antrean` b1 WHERE TRUE) t1 ON t0.`id` = t1.`kunjungan_id`\nORDER BY t1.`id` ASC", [fasyankes_id === undefined, fasyankes_id ?? null, jenis === undefined, jenis ?? null, lokasi_id === undefined, lokasi_id ?? null, tahap_layanan === undefined, tahap_layanan ?? null], koneksi);
    const hasil = petakt0(baris);
    return hasil;
}
export async function hitungKunjunganUntukCari(fasyankes_id, mulai, mulai2, status, pakai, mulai3, mulai4, mulai5, mulai6, tahap_layanan, pakai2, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `kunjungan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`mulai` >= ?) AND (? OR t.`mulai` < ?)) AND ((? OR (EXISTS (SELECT 1 FROM `antrean` r1 WHERE t.`id` = r1.`kunjungan_id` AND (((? OR r1.`status` <=> ?))))))) AND ((? OR t.`mulai` >= ?) AND (? OR t.`mulai` < ?)) AND ((? OR t.`mulai` >= ?) AND (? OR t.`mulai` < ?)) AND ((? OR t.`tahap_layanan` IN (?))) AND ((? OR (NOT (((EXISTS (SELECT 1 FROM `antrean` r2 WHERE t.`id` = r2.`kunjungan_id` AND (((? OR r2.`status` <=> ?))))))))))", [fasyankes_id === undefined, fasyankes_id ?? null, mulai === undefined, mulai ?? null, mulai2 === undefined, mulai2 ?? null, !pakai, status === undefined, status ?? null, mulai3 === undefined, mulai3 ?? null, mulai4 === undefined, mulai4 ?? null, mulai5 === undefined, mulai5 ?? null, mulai6 === undefined, mulai6 ?? null, tahap_layanan === undefined, (tahap_layanan)?.length ? (tahap_layanan) : [null], !pakai2, status === undefined, status ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function daftarKunjunganUntukCari(fasyankes_id, mulai, mulai2, status, pakai, mulai3, mulai4, mulai5, mulai6, tahap_layanan, pakai2, batas, lewati, tipe, peserta_batas, koneksi = pool) {
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
        return [...grup.values()].map(baris => ({ id: baris[0].t1__id, fasyankes_id: baris[0].t1__fasyankes_id, kunjungan_id: baris[0].t1__kunjungan_id, lokasi_id: baris[0].t1__lokasi_id, tanggal: baris[0].t1__tanggal, nomor: baris[0].t1__nomor, awalan: baris[0].t1__awalan, jenis_poli: baris[0].t1__jenis_poli, status: baris[0].t1__status, waktu_daftar: baris[0].t1__waktu_daftar, waktu_panggil: baris[0].t1__waktu_panggil, waktu_mulai: baris[0].t1__waktu_mulai, waktu_selesai: baris[0].t1__waktu_selesai, dibuat_oleh: baris[0].t1__dibuat_oleh, dibuat_pada: baris[0].t1__dibuat_pada }));
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
        return [...grup.values()].map(baris => ({ id: baris[0].t2__id, fasyankes_id: baris[0].t2__fasyankes_id, kunjungan_id: baris[0].t2__kunjungan_id, pengguna_id: baris[0].t2__pengguna_id, tipe: baris[0].t2__tipe, mulai: baris[0].t2__mulai, selesai: baris[0].t2__selesai, dibuat_oleh: baris[0].t2__dibuat_oleh, dibuat_pada: baris[0].t2__dibuat_pada }));
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
        return [...grup.values()].map(baris => ({ id: baris[0].t3__id, fasyankes_id: baris[0].t3__fasyankes_id, nomor_rm: baris[0].t3__nomor_rm, nik: baris[0].t3__nik, nama: baris[0].t3__nama, nomor_hp: baris[0].t3__nomor_hp, ibu_kandung: baris[0].t3__ibu_kandung, tempat_lahir: baris[0].t3__tempat_lahir, tanggal_lahir: baris[0].t3__tanggal_lahir, jenis_kelamin: baris[0].t3__jenis_kelamin, agama: baris[0].t3__agama, suku: baris[0].t3__suku, bahasa: baris[0].t3__bahasa, pekerjaan: baris[0].t3__pekerjaan, pendidikan: baris[0].t3__pendidikan, status_kawin: baris[0].t3__status_kawin, alamat: baris[0].t3__alamat, kode_wilayah: baris[0].t3__kode_wilayah, nomor_paspor: baris[0].t3__nomor_paspor, nomor_kitas: baris[0].t3__nomor_kitas, ihs_number: baris[0].t3__ihs_number, jkn_nomor_kartu: baris[0].t3__jkn_nomor_kartu, asuransi_nama: baris[0].t3__asuransi_nama, asuransi_nomor_polis: baris[0].t3__asuransi_nomor_polis, status_identitas: baris[0].t3__status_identitas, jalur_identitas: baris[0].t3__jalur_identitas, tidak_cakap: baris[0].t3__tidak_cakap, dibuat_oleh: baris[0].t3__dibuat_oleh, dibuat_pada: baris[0].t3__dibuat_pada }));
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
        return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, pasien_id: baris[0].t0__pasien_id, jenis: baris[0].t0__jenis, status: baris[0].t0__status, tahap_layanan: baris[0].t0__tahap_layanan, kunjungan_asal_id: baris[0].t0__kunjungan_asal_id, lokasi_id: baris[0].t0__lokasi_id, cara_pembayaran: baris[0].t0__cara_pembayaran, nomor_sep: baris[0].t0__nomor_sep, spri: baris[0].t0__spri, keluhan_singkat: baris[0].t0__keluhan_singkat, service_type: baris[0].t0__service_type, encounter_id: baris[0].t0__encounter_id, mulai: baris[0].t0__mulai, selesai: baris[0].t0__selesai, waktu_tutup: baris[0].t0__waktu_tutup, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, diarsipkan_pada: baris[0].t0__diarsipkan_pada, retensi_sampai: baris[0].t0__retensi_sampai, antrean: petakt1(baris)[0] ?? null, peserta: petakt2(baris), pasien: petakt3(baris)[0] }));
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`pasien_id` AS `t0__pasien_id`, t0.`jenis` AS `t0__jenis`, t0.`status` AS `t0__status`, t0.`tahap_layanan` AS `t0__tahap_layanan`, t0.`kunjungan_asal_id` AS `t0__kunjungan_asal_id`, t0.`lokasi_id` AS `t0__lokasi_id`, t0.`cara_pembayaran` AS `t0__cara_pembayaran`, t0.`nomor_sep` AS `t0__nomor_sep`, t0.`spri` AS `t0__spri`, t0.`keluhan_singkat` AS `t0__keluhan_singkat`, t0.`service_type` AS `t0__service_type`, t0.`encounter_id` AS `t0__encounter_id`, t0.`mulai` AS `t0__mulai`, t0.`selesai` AS `t0__selesai`, t0.`waktu_tutup` AS `t0__waktu_tutup`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t0.`diarsipkan_pada` AS `t0__diarsipkan_pada`, t0.`retensi_sampai` AS `t0__retensi_sampai`, t1.`id` AS `t1__id`, t1.`fasyankes_id` AS `t1__fasyankes_id`, t1.`kunjungan_id` AS `t1__kunjungan_id`, t1.`lokasi_id` AS `t1__lokasi_id`, t1.`tanggal` AS `t1__tanggal`, t1.`nomor` AS `t1__nomor`, t1.`awalan` AS `t1__awalan`, t1.`jenis_poli` AS `t1__jenis_poli`, t1.`status` AS `t1__status`, t1.`waktu_daftar` AS `t1__waktu_daftar`, t1.`waktu_panggil` AS `t1__waktu_panggil`, t1.`waktu_mulai` AS `t1__waktu_mulai`, t1.`waktu_selesai` AS `t1__waktu_selesai`, t1.`dibuat_oleh` AS `t1__dibuat_oleh`, t1.`dibuat_pada` AS `t1__dibuat_pada`, t2.`id` AS `t2__id`, t2.`fasyankes_id` AS `t2__fasyankes_id`, t2.`kunjungan_id` AS `t2__kunjungan_id`, t2.`pengguna_id` AS `t2__pengguna_id`, t2.`tipe` AS `t2__tipe`, t2.`mulai` AS `t2__mulai`, t2.`selesai` AS `t2__selesai`, t2.`dibuat_oleh` AS `t2__dibuat_oleh`, t2.`dibuat_pada` AS `t2__dibuat_pada`, t3.`id` AS `t3__id`, t3.`fasyankes_id` AS `t3__fasyankes_id`, t3.`nomor_rm` AS `t3__nomor_rm`, t3.`nik` AS `t3__nik`, t3.`nama` AS `t3__nama`, t3.`nomor_hp` AS `t3__nomor_hp`, t3.`ibu_kandung` AS `t3__ibu_kandung`, t3.`tempat_lahir` AS `t3__tempat_lahir`, t3.`tanggal_lahir` AS `t3__tanggal_lahir`, t3.`jenis_kelamin` AS `t3__jenis_kelamin`, t3.`agama` AS `t3__agama`, t3.`suku` AS `t3__suku`, t3.`bahasa` AS `t3__bahasa`, t3.`pekerjaan` AS `t3__pekerjaan`, t3.`pendidikan` AS `t3__pendidikan`, t3.`status_kawin` AS `t3__status_kawin`, t3.`alamat` AS `t3__alamat`, t3.`kode_wilayah` AS `t3__kode_wilayah`, t3.`nomor_paspor` AS `t3__nomor_paspor`, t3.`nomor_kitas` AS `t3__nomor_kitas`, t3.`ihs_number` AS `t3__ihs_number`, t3.`jkn_nomor_kartu` AS `t3__jkn_nomor_kartu`, t3.`asuransi_nama` AS `t3__asuransi_nama`, t3.`asuransi_nomor_polis` AS `t3__asuransi_nomor_polis`, t3.`status_identitas` AS `t3__status_identitas`, t3.`jalur_identitas` AS `t3__jalur_identitas`, t3.`tidak_cakap` AS `t3__tidak_cakap`, t3.`dibuat_oleh` AS `t3__dibuat_oleh`, t3.`dibuat_pada` AS `t3__dibuat_pada`\nFROM (SELECT t0.* FROM `kunjungan` t0 WHERE ((? OR t0.`fasyankes_id` <=> ?)) AND ((? OR t0.`mulai` >= ?) AND (? OR t0.`mulai` < ?)) AND ((? OR (EXISTS (SELECT 1 FROM `antrean` r1 WHERE t0.`id` = r1.`kunjungan_id` AND (((? OR r1.`status` <=> ?))))))) AND ((? OR t0.`mulai` >= ?) AND (? OR t0.`mulai` < ?)) AND ((? OR t0.`mulai` >= ?) AND (? OR t0.`mulai` < ?)) AND ((? OR t0.`tahap_layanan` IN (?))) AND ((? OR (NOT (((EXISTS (SELECT 1 FROM `antrean` r2 WHERE t0.`id` = r2.`kunjungan_id` AND (((? OR r2.`status` <=> ?)))))))))) ORDER BY (CASE WHEN EXISTS (SELECT 1 FROM `antrean` rb WHERE rb.`kunjungan_id` = t0.`id` AND rb.`status` = 'batal') THEN 3 WHEN t0.`tahap_layanan` = 'ditutup' THEN 2 ELSE 1 END) ASC, (CASE WHEN t0.`tahap_layanan` = 'ditutup' THEN t0.`waktu_tutup` END) DESC, t0.`mulai` ASC, t0.`id` ASC LIMIT ? OFFSET ?) t0\nLEFT JOIN (SELECT b1.* FROM `antrean` b1 WHERE TRUE) t1 ON t0.`id` = t1.`kunjungan_id`\nLEFT JOIN (SELECT b2.*, ROW_NUMBER() OVER (PARTITION BY b2.`kunjungan_id` ORDER BY b2.`id` ASC) AS _urutan FROM `peserta_kunjungan` b2 WHERE ((? OR b2.`tipe` <=> ?))) t2 ON t0.`id` = t2.`kunjungan_id` AND t2._urutan <= ?\nLEFT JOIN (SELECT b3.* FROM `pasien` b3 WHERE TRUE) t3 ON t0.`pasien_id` = t3.`id`\nORDER BY (CASE WHEN EXISTS (SELECT 1 FROM `antrean` rb WHERE rb.`kunjungan_id` = t0.`id` AND rb.`status` = 'batal') THEN 3 WHEN t0.`tahap_layanan` = 'ditutup' THEN 2 ELSE 1 END) ASC, (CASE WHEN t0.`tahap_layanan` = 'ditutup' THEN t0.`waktu_tutup` END) DESC, t0.`mulai` ASC, t0.`id` ASC, t1.`id` ASC, t2.`id` ASC, t3.`id` ASC", [fasyankes_id === undefined, fasyankes_id ?? null, mulai === undefined, mulai ?? null, mulai2 === undefined, mulai2 ?? null, !pakai, status === undefined, status ?? null, mulai3 === undefined, mulai3 ?? null, mulai4 === undefined, mulai4 ?? null, mulai5 === undefined, mulai5 ?? null, mulai6 === undefined, mulai6 ?? null, tahap_layanan === undefined, (tahap_layanan)?.length ? (tahap_layanan) : [null], !pakai2, status === undefined, status ?? null, batas ?? 2147483647, lewati ?? 0, tipe === undefined, tipe ?? null, (peserta_batas ?? 2147483647) + (0)], koneksi);
    const hasil = petakt0(baris);
    return hasil;
}
export async function kelompokKunjunganUntukHitungTahap(fasyankes_id, mulai, status, koneksi = pool) {
    const baris = await baca("SELECT t.`tahap_layanan`, COUNT(*) AS `_count__all` FROM `kunjungan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((t.`mulai` >= ? AND t.`mulai` < ?)) AND (NOT (((EXISTS (SELECT 1 FROM `antrean` r1 WHERE t.`id` = r1.`kunjungan_id` AND (((? OR r1.`status` <=> ?)))))))) GROUP BY t.`tahap_layanan`", [fasyankes_id === undefined, fasyankes_id ?? null, mulai.gte ?? null, mulai.lt ?? null, status === undefined, status ?? null], koneksi);
    const hasil = baris.map(b => ({ tahap_layanan: b.tahap_layanan, _count: { _all: Number(b._count__all) } }));
    return hasil;
}
export async function hitungKunjunganUntukHitungTahap(fasyankes_id, mulai, status, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `kunjungan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((t.`mulai` >= ? AND t.`mulai` < ?)) AND (EXISTS (SELECT 1 FROM `antrean` r1 WHERE t.`id` = r1.`kunjungan_id` AND (((? OR r1.`status` <=> ?)))))", [fasyankes_id === undefined, fasyankes_id ?? null, mulai.gte ?? null, mulai.lt ?? null, status === undefined, status ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function ubahKunjunganUntukMulaiAntreanDalam(status, fasyankes_id, id, tahap_layanan, status2, status3, koneksi = pool) {
    const hasil = await tulis("UPDATE `kunjungan` t SET `status` = IF(?, t.`status`, ?) WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`id` <=> ?)) AND ((? OR t.`tahap_layanan` IN (?))) AND (NOT (((EXISTS (SELECT 1 FROM `antrean` r1 WHERE t.`id` = r1.`kunjungan_id` AND (((? OR r1.`status` <=> ?)))))))) AND ((? OR t.`status` IN (?)))", [status === undefined, (status ?? null), fasyankes_id === undefined, fasyankes_id ?? null, id === undefined, id ?? null, tahap_layanan === undefined, (tahap_layanan)?.length ? (tahap_layanan) : [null], status2 === undefined, status2 ?? null, status3 === undefined, (status3)?.length ? (status3) : [null]], koneksi);
    return { count: hasil.affectedRows };
}
export async function wajibKunjunganUntukAmbilKunjungan(id, tipe, peserta_batas, koneksi = pool) {
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
        return [...grup.values()].map(baris => ({ id: baris[0].t1__id, fasyankes_id: baris[0].t1__fasyankes_id, kunjungan_id: baris[0].t1__kunjungan_id, lokasi_id: baris[0].t1__lokasi_id, tanggal: baris[0].t1__tanggal, nomor: baris[0].t1__nomor, awalan: baris[0].t1__awalan, jenis_poli: baris[0].t1__jenis_poli, status: baris[0].t1__status, waktu_daftar: baris[0].t1__waktu_daftar, waktu_panggil: baris[0].t1__waktu_panggil, waktu_mulai: baris[0].t1__waktu_mulai, waktu_selesai: baris[0].t1__waktu_selesai, dibuat_oleh: baris[0].t1__dibuat_oleh, dibuat_pada: baris[0].t1__dibuat_pada }));
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
        return [...grup.values()].map(baris => ({ id: baris[0].t2__id, fasyankes_id: baris[0].t2__fasyankes_id, kunjungan_id: baris[0].t2__kunjungan_id, pengguna_id: baris[0].t2__pengguna_id, tipe: baris[0].t2__tipe, mulai: baris[0].t2__mulai, selesai: baris[0].t2__selesai, dibuat_oleh: baris[0].t2__dibuat_oleh, dibuat_pada: baris[0].t2__dibuat_pada }));
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
        return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, pasien_id: baris[0].t0__pasien_id, jenis: baris[0].t0__jenis, status: baris[0].t0__status, tahap_layanan: baris[0].t0__tahap_layanan, kunjungan_asal_id: baris[0].t0__kunjungan_asal_id, lokasi_id: baris[0].t0__lokasi_id, cara_pembayaran: baris[0].t0__cara_pembayaran, nomor_sep: baris[0].t0__nomor_sep, spri: baris[0].t0__spri, keluhan_singkat: baris[0].t0__keluhan_singkat, service_type: baris[0].t0__service_type, encounter_id: baris[0].t0__encounter_id, mulai: baris[0].t0__mulai, selesai: baris[0].t0__selesai, waktu_tutup: baris[0].t0__waktu_tutup, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, diarsipkan_pada: baris[0].t0__diarsipkan_pada, retensi_sampai: baris[0].t0__retensi_sampai, antrean: petakt1(baris)[0] ?? null, peserta: petakt2(baris) }));
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`pasien_id` AS `t0__pasien_id`, t0.`jenis` AS `t0__jenis`, t0.`status` AS `t0__status`, t0.`tahap_layanan` AS `t0__tahap_layanan`, t0.`kunjungan_asal_id` AS `t0__kunjungan_asal_id`, t0.`lokasi_id` AS `t0__lokasi_id`, t0.`cara_pembayaran` AS `t0__cara_pembayaran`, t0.`nomor_sep` AS `t0__nomor_sep`, t0.`spri` AS `t0__spri`, t0.`keluhan_singkat` AS `t0__keluhan_singkat`, t0.`service_type` AS `t0__service_type`, t0.`encounter_id` AS `t0__encounter_id`, t0.`mulai` AS `t0__mulai`, t0.`selesai` AS `t0__selesai`, t0.`waktu_tutup` AS `t0__waktu_tutup`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t0.`diarsipkan_pada` AS `t0__diarsipkan_pada`, t0.`retensi_sampai` AS `t0__retensi_sampai`, t1.`id` AS `t1__id`, t1.`fasyankes_id` AS `t1__fasyankes_id`, t1.`kunjungan_id` AS `t1__kunjungan_id`, t1.`lokasi_id` AS `t1__lokasi_id`, t1.`tanggal` AS `t1__tanggal`, t1.`nomor` AS `t1__nomor`, t1.`awalan` AS `t1__awalan`, t1.`jenis_poli` AS `t1__jenis_poli`, t1.`status` AS `t1__status`, t1.`waktu_daftar` AS `t1__waktu_daftar`, t1.`waktu_panggil` AS `t1__waktu_panggil`, t1.`waktu_mulai` AS `t1__waktu_mulai`, t1.`waktu_selesai` AS `t1__waktu_selesai`, t1.`dibuat_oleh` AS `t1__dibuat_oleh`, t1.`dibuat_pada` AS `t1__dibuat_pada`, t2.`id` AS `t2__id`, t2.`fasyankes_id` AS `t2__fasyankes_id`, t2.`kunjungan_id` AS `t2__kunjungan_id`, t2.`pengguna_id` AS `t2__pengguna_id`, t2.`tipe` AS `t2__tipe`, t2.`mulai` AS `t2__mulai`, t2.`selesai` AS `t2__selesai`, t2.`dibuat_oleh` AS `t2__dibuat_oleh`, t2.`dibuat_pada` AS `t2__dibuat_pada`\nFROM (SELECT t0.* FROM `kunjungan` t0 WHERE ((? OR t0.`id` <=> ?)) LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `antrean` b1 WHERE TRUE) t1 ON t0.`id` = t1.`kunjungan_id`\nLEFT JOIN (SELECT b2.*, ROW_NUMBER() OVER (PARTITION BY b2.`kunjungan_id` ORDER BY b2.`id` ASC) AS _urutan FROM `peserta_kunjungan` b2 WHERE ((? OR b2.`tipe` <=> ?))) t2 ON t0.`id` = t2.`kunjungan_id` AND t2._urutan <= ?\nORDER BY t1.`id` ASC, t2.`id` ASC", [id === undefined, id ?? null, tipe === undefined, tipe ?? null, (peserta_batas ?? 2147483647) + (0)], koneksi);
    const hasil = petakt0(baris);
    if (!hasil[0])
        throw new Error('Baris kunjungan tidak ditemukan.');
    return hasil[0];
}
export async function hitungKunjunganUntukKunjunganBerjalan(fasyankes_id, pasien_id, tahap_layanan, status, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `kunjungan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`pasien_id` <=> ?)) AND ((? OR t.`tahap_layanan` IN (?))) AND (NOT (((EXISTS (SELECT 1 FROM `antrean` r1 WHERE t.`id` = r1.`kunjungan_id` AND (((? OR r1.`status` <=> ?))))))))", [fasyankes_id === undefined, fasyankes_id ?? null, pasien_id === undefined, pasien_id ?? null, tahap_layanan === undefined, (tahap_layanan)?.length ? (tahap_layanan) : [null], status === undefined, status ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function tambahKunjunganUntukDaftarkan(fasyankes_id, pasien_id, jenis, status, tahap_layanan, lokasi_id, cara_pembayaran, nomor_sep, keluhan_singkat, mulai, dibuat_oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `kunjungan` (`fasyankes_id`, `pasien_id`, `jenis`, `status`, `tahap_layanan`, `lokasi_id`, `cara_pembayaran`, `nomor_sep`, `keluhan_singkat`, `mulai`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (pasien_id === undefined ? null : pasien_id) ?? null, ((jenis === undefined ? null : jenis) ?? null), ((status === undefined ? "arrived" : status) ?? null), ((tahap_layanan === undefined ? "menunggu_skrining" : tahap_layanan) ?? null), (lokasi_id === undefined ? null : lokasi_id) ?? null, ((cara_pembayaran === undefined ? "umum" : cara_pembayaran) ?? null), (nomor_sep === undefined ? null : nomor_sep) ?? null, (keluhan_singkat === undefined ? null : keluhan_singkat) ?? null, (mulai === undefined ? new Date() : mulai) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahKunjunganUntukDaftarkanHasil(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`pasien_id`, t.`jenis`, t.`status`, t.`tahap_layanan`, t.`kunjungan_asal_id`, t.`lokasi_id`, t.`cara_pembayaran`, t.`nomor_sep`, t.`spri`, t.`keluhan_singkat`, t.`service_type`, t.`encounter_id`, t.`mulai`, t.`selesai`, t.`waktu_tutup`, t.`dibuat_oleh`, t.`dibuat_pada`, t.`diarsipkan_pada`, t.`retensi_sampai` FROM `kunjungan` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris kunjungan tidak ditemukan.');
    return baris[0];
}
export async function cariKunjunganUntukTahapSekarang(id, fasyankes_id, koneksi = pool) {
    const baris = await baca("SELECT t.`tahap_layanan` FROM `kunjungan` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) LIMIT 1", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function ubahKunjunganUntukUbahTahap(tahap_layanan, id, fasyankes_id, tahap_layanan2, koneksi = pool) {
    const hasil = await tulis("UPDATE `kunjungan` t SET `tahap_layanan` = IF(?, t.`tahap_layanan`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`tahap_layanan` <=> ?))", [tahap_layanan === undefined, (tahap_layanan ?? null), id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null, tahap_layanan2 === undefined, tahap_layanan2 ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function ubahKunjunganUntukUbahAntrean(status, id, fasyankes_id, status2, koneksi = pool) {
    const hasil = await tulis("UPDATE `kunjungan` t SET `status` = IF(?, t.`status`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`status` IN (?)))", [status === undefined, (status ?? null), id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null, status2 === undefined, (status2)?.length ? (status2) : [null]], koneksi);
    return { count: hasil.affectedRows };
}
export async function cariKunjunganUntukSinkronItemTindakanDalam(id, fasyankes_id, koneksi = pool) {
    const baris = await baca("SELECT t.`tahap_layanan`, t.`cara_pembayaran` FROM `kunjungan` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) LIMIT 1", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function hitungKunjunganUntukKunjunganAda(id, fasyankes_id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `kunjungan` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?))", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function cariKunjunganUntukKunjungan(id, fasyankes_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`pasien_id`, t.`tahap_layanan` FROM `kunjungan` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) LIMIT 1", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function cariKunjunganUntukDataCetak(id, fasyankes_id, koneksi = pool) {
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
        return [...grup.values()].map(baris => ({ id: baris[0].t1__id, fasyankes_id: baris[0].t1__fasyankes_id, nomor_rm: baris[0].t1__nomor_rm, nik: baris[0].t1__nik, nama: baris[0].t1__nama, nomor_hp: baris[0].t1__nomor_hp, ibu_kandung: baris[0].t1__ibu_kandung, tempat_lahir: baris[0].t1__tempat_lahir, tanggal_lahir: baris[0].t1__tanggal_lahir, jenis_kelamin: baris[0].t1__jenis_kelamin, agama: baris[0].t1__agama, suku: baris[0].t1__suku, bahasa: baris[0].t1__bahasa, pekerjaan: baris[0].t1__pekerjaan, pendidikan: baris[0].t1__pendidikan, status_kawin: baris[0].t1__status_kawin, alamat: baris[0].t1__alamat, kode_wilayah: baris[0].t1__kode_wilayah, nomor_paspor: baris[0].t1__nomor_paspor, nomor_kitas: baris[0].t1__nomor_kitas, ihs_number: baris[0].t1__ihs_number, jkn_nomor_kartu: baris[0].t1__jkn_nomor_kartu, asuransi_nama: baris[0].t1__asuransi_nama, asuransi_nomor_polis: baris[0].t1__asuransi_nomor_polis, status_identitas: baris[0].t1__status_identitas, jalur_identitas: baris[0].t1__jalur_identitas, tidak_cakap: baris[0].t1__tidak_cakap, dibuat_oleh: baris[0].t1__dibuat_oleh, dibuat_pada: baris[0].t1__dibuat_pada }));
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
        return [...grup.values()].map(baris => ({ id: baris[0].t2__id, fasyankes_id: baris[0].t2__fasyankes_id, kunjungan_id: baris[0].t2__kunjungan_id, lokasi_id: baris[0].t2__lokasi_id, tanggal: baris[0].t2__tanggal, nomor: baris[0].t2__nomor, awalan: baris[0].t2__awalan, jenis_poli: baris[0].t2__jenis_poli, status: baris[0].t2__status, waktu_daftar: baris[0].t2__waktu_daftar, waktu_panggil: baris[0].t2__waktu_panggil, waktu_mulai: baris[0].t2__waktu_mulai, waktu_selesai: baris[0].t2__waktu_selesai, dibuat_oleh: baris[0].t2__dibuat_oleh, dibuat_pada: baris[0].t2__dibuat_pada }));
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
        return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, pasien_id: baris[0].t0__pasien_id, jenis: baris[0].t0__jenis, status: baris[0].t0__status, tahap_layanan: baris[0].t0__tahap_layanan, kunjungan_asal_id: baris[0].t0__kunjungan_asal_id, lokasi_id: baris[0].t0__lokasi_id, cara_pembayaran: baris[0].t0__cara_pembayaran, nomor_sep: baris[0].t0__nomor_sep, spri: baris[0].t0__spri, keluhan_singkat: baris[0].t0__keluhan_singkat, service_type: baris[0].t0__service_type, encounter_id: baris[0].t0__encounter_id, mulai: baris[0].t0__mulai, selesai: baris[0].t0__selesai, waktu_tutup: baris[0].t0__waktu_tutup, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, diarsipkan_pada: baris[0].t0__diarsipkan_pada, retensi_sampai: baris[0].t0__retensi_sampai, pasien: petakt1(baris)[0], antrean: petakt2(baris)[0] ?? null }));
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`pasien_id` AS `t0__pasien_id`, t0.`jenis` AS `t0__jenis`, t0.`status` AS `t0__status`, t0.`tahap_layanan` AS `t0__tahap_layanan`, t0.`kunjungan_asal_id` AS `t0__kunjungan_asal_id`, t0.`lokasi_id` AS `t0__lokasi_id`, t0.`cara_pembayaran` AS `t0__cara_pembayaran`, t0.`nomor_sep` AS `t0__nomor_sep`, t0.`spri` AS `t0__spri`, t0.`keluhan_singkat` AS `t0__keluhan_singkat`, t0.`service_type` AS `t0__service_type`, t0.`encounter_id` AS `t0__encounter_id`, t0.`mulai` AS `t0__mulai`, t0.`selesai` AS `t0__selesai`, t0.`waktu_tutup` AS `t0__waktu_tutup`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t0.`diarsipkan_pada` AS `t0__diarsipkan_pada`, t0.`retensi_sampai` AS `t0__retensi_sampai`, t1.`id` AS `t1__id`, t1.`fasyankes_id` AS `t1__fasyankes_id`, t1.`nomor_rm` AS `t1__nomor_rm`, t1.`nik` AS `t1__nik`, t1.`nama` AS `t1__nama`, t1.`nomor_hp` AS `t1__nomor_hp`, t1.`ibu_kandung` AS `t1__ibu_kandung`, t1.`tempat_lahir` AS `t1__tempat_lahir`, t1.`tanggal_lahir` AS `t1__tanggal_lahir`, t1.`jenis_kelamin` AS `t1__jenis_kelamin`, t1.`agama` AS `t1__agama`, t1.`suku` AS `t1__suku`, t1.`bahasa` AS `t1__bahasa`, t1.`pekerjaan` AS `t1__pekerjaan`, t1.`pendidikan` AS `t1__pendidikan`, t1.`status_kawin` AS `t1__status_kawin`, t1.`alamat` AS `t1__alamat`, t1.`kode_wilayah` AS `t1__kode_wilayah`, t1.`nomor_paspor` AS `t1__nomor_paspor`, t1.`nomor_kitas` AS `t1__nomor_kitas`, t1.`ihs_number` AS `t1__ihs_number`, t1.`jkn_nomor_kartu` AS `t1__jkn_nomor_kartu`, t1.`asuransi_nama` AS `t1__asuransi_nama`, t1.`asuransi_nomor_polis` AS `t1__asuransi_nomor_polis`, t1.`status_identitas` AS `t1__status_identitas`, t1.`jalur_identitas` AS `t1__jalur_identitas`, t1.`tidak_cakap` AS `t1__tidak_cakap`, t1.`dibuat_oleh` AS `t1__dibuat_oleh`, t1.`dibuat_pada` AS `t1__dibuat_pada`, t2.`id` AS `t2__id`, t2.`fasyankes_id` AS `t2__fasyankes_id`, t2.`kunjungan_id` AS `t2__kunjungan_id`, t2.`lokasi_id` AS `t2__lokasi_id`, t2.`tanggal` AS `t2__tanggal`, t2.`nomor` AS `t2__nomor`, t2.`awalan` AS `t2__awalan`, t2.`jenis_poli` AS `t2__jenis_poli`, t2.`status` AS `t2__status`, t2.`waktu_daftar` AS `t2__waktu_daftar`, t2.`waktu_panggil` AS `t2__waktu_panggil`, t2.`waktu_mulai` AS `t2__waktu_mulai`, t2.`waktu_selesai` AS `t2__waktu_selesai`, t2.`dibuat_oleh` AS `t2__dibuat_oleh`, t2.`dibuat_pada` AS `t2__dibuat_pada`\nFROM (SELECT t0.* FROM `kunjungan` t0 WHERE ((? OR t0.`id` <=> ?)) AND ((? OR t0.`fasyankes_id` <=> ?)) LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `pasien` b1 WHERE TRUE) t1 ON t0.`pasien_id` = t1.`id`\nLEFT JOIN (SELECT b2.* FROM `antrean` b2 WHERE TRUE) t2 ON t0.`id` = t2.`kunjungan_id`\nORDER BY t1.`id` ASC, t2.`id` ASC", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    const hasil = petakt0(baris);
    return (hasil[0] ?? null);
}
export async function cariKunjunganUntukKonteks(id, fasyankes_id, tipe, peserta_batas, koneksi = pool) {
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
        return [...grup.values()].map(baris => ({ id: baris[0].t1__id, fasyankes_id: baris[0].t1__fasyankes_id, nomor_rm: baris[0].t1__nomor_rm, nik: baris[0].t1__nik, nama: baris[0].t1__nama, nomor_hp: baris[0].t1__nomor_hp, ibu_kandung: baris[0].t1__ibu_kandung, tempat_lahir: baris[0].t1__tempat_lahir, tanggal_lahir: baris[0].t1__tanggal_lahir, jenis_kelamin: baris[0].t1__jenis_kelamin, agama: baris[0].t1__agama, suku: baris[0].t1__suku, bahasa: baris[0].t1__bahasa, pekerjaan: baris[0].t1__pekerjaan, pendidikan: baris[0].t1__pendidikan, status_kawin: baris[0].t1__status_kawin, alamat: baris[0].t1__alamat, kode_wilayah: baris[0].t1__kode_wilayah, nomor_paspor: baris[0].t1__nomor_paspor, nomor_kitas: baris[0].t1__nomor_kitas, ihs_number: baris[0].t1__ihs_number, jkn_nomor_kartu: baris[0].t1__jkn_nomor_kartu, asuransi_nama: baris[0].t1__asuransi_nama, asuransi_nomor_polis: baris[0].t1__asuransi_nomor_polis, status_identitas: baris[0].t1__status_identitas, jalur_identitas: baris[0].t1__jalur_identitas, tidak_cakap: baris[0].t1__tidak_cakap, dibuat_oleh: baris[0].t1__dibuat_oleh, dibuat_pada: baris[0].t1__dibuat_pada }));
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
        return [...grup.values()].map(baris => ({ id: baris[0].t2__id, fasyankes_id: baris[0].t2__fasyankes_id, kunjungan_id: baris[0].t2__kunjungan_id, pengguna_id: baris[0].t2__pengguna_id, tipe: baris[0].t2__tipe, mulai: baris[0].t2__mulai, selesai: baris[0].t2__selesai, dibuat_oleh: baris[0].t2__dibuat_oleh, dibuat_pada: baris[0].t2__dibuat_pada }));
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
        return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, pasien_id: baris[0].t0__pasien_id, jenis: baris[0].t0__jenis, status: baris[0].t0__status, tahap_layanan: baris[0].t0__tahap_layanan, kunjungan_asal_id: baris[0].t0__kunjungan_asal_id, lokasi_id: baris[0].t0__lokasi_id, cara_pembayaran: baris[0].t0__cara_pembayaran, nomor_sep: baris[0].t0__nomor_sep, spri: baris[0].t0__spri, keluhan_singkat: baris[0].t0__keluhan_singkat, service_type: baris[0].t0__service_type, encounter_id: baris[0].t0__encounter_id, mulai: baris[0].t0__mulai, selesai: baris[0].t0__selesai, waktu_tutup: baris[0].t0__waktu_tutup, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, diarsipkan_pada: baris[0].t0__diarsipkan_pada, retensi_sampai: baris[0].t0__retensi_sampai, pasien: petakt1(baris)[0], peserta: petakt2(baris) }));
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`pasien_id` AS `t0__pasien_id`, t0.`jenis` AS `t0__jenis`, t0.`status` AS `t0__status`, t0.`tahap_layanan` AS `t0__tahap_layanan`, t0.`kunjungan_asal_id` AS `t0__kunjungan_asal_id`, t0.`lokasi_id` AS `t0__lokasi_id`, t0.`cara_pembayaran` AS `t0__cara_pembayaran`, t0.`nomor_sep` AS `t0__nomor_sep`, t0.`spri` AS `t0__spri`, t0.`keluhan_singkat` AS `t0__keluhan_singkat`, t0.`service_type` AS `t0__service_type`, t0.`encounter_id` AS `t0__encounter_id`, t0.`mulai` AS `t0__mulai`, t0.`selesai` AS `t0__selesai`, t0.`waktu_tutup` AS `t0__waktu_tutup`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t0.`diarsipkan_pada` AS `t0__diarsipkan_pada`, t0.`retensi_sampai` AS `t0__retensi_sampai`, t1.`id` AS `t1__id`, t1.`fasyankes_id` AS `t1__fasyankes_id`, t1.`nomor_rm` AS `t1__nomor_rm`, t1.`nik` AS `t1__nik`, t1.`nama` AS `t1__nama`, t1.`nomor_hp` AS `t1__nomor_hp`, t1.`ibu_kandung` AS `t1__ibu_kandung`, t1.`tempat_lahir` AS `t1__tempat_lahir`, t1.`tanggal_lahir` AS `t1__tanggal_lahir`, t1.`jenis_kelamin` AS `t1__jenis_kelamin`, t1.`agama` AS `t1__agama`, t1.`suku` AS `t1__suku`, t1.`bahasa` AS `t1__bahasa`, t1.`pekerjaan` AS `t1__pekerjaan`, t1.`pendidikan` AS `t1__pendidikan`, t1.`status_kawin` AS `t1__status_kawin`, t1.`alamat` AS `t1__alamat`, t1.`kode_wilayah` AS `t1__kode_wilayah`, t1.`nomor_paspor` AS `t1__nomor_paspor`, t1.`nomor_kitas` AS `t1__nomor_kitas`, t1.`ihs_number` AS `t1__ihs_number`, t1.`jkn_nomor_kartu` AS `t1__jkn_nomor_kartu`, t1.`asuransi_nama` AS `t1__asuransi_nama`, t1.`asuransi_nomor_polis` AS `t1__asuransi_nomor_polis`, t1.`status_identitas` AS `t1__status_identitas`, t1.`jalur_identitas` AS `t1__jalur_identitas`, t1.`tidak_cakap` AS `t1__tidak_cakap`, t1.`dibuat_oleh` AS `t1__dibuat_oleh`, t1.`dibuat_pada` AS `t1__dibuat_pada`, t2.`id` AS `t2__id`, t2.`fasyankes_id` AS `t2__fasyankes_id`, t2.`kunjungan_id` AS `t2__kunjungan_id`, t2.`pengguna_id` AS `t2__pengguna_id`, t2.`tipe` AS `t2__tipe`, t2.`mulai` AS `t2__mulai`, t2.`selesai` AS `t2__selesai`, t2.`dibuat_oleh` AS `t2__dibuat_oleh`, t2.`dibuat_pada` AS `t2__dibuat_pada`\nFROM (SELECT t0.* FROM `kunjungan` t0 WHERE ((? OR t0.`id` <=> ?)) AND ((? OR t0.`fasyankes_id` <=> ?)) LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `pasien` b1 WHERE TRUE) t1 ON t0.`pasien_id` = t1.`id`\nLEFT JOIN (SELECT b2.*, ROW_NUMBER() OVER (PARTITION BY b2.`kunjungan_id` ORDER BY b2.`id` ASC) AS _urutan FROM `peserta_kunjungan` b2 WHERE ((? OR b2.`tipe` <=> ?))) t2 ON t0.`id` = t2.`kunjungan_id` AND t2._urutan <= ?\nORDER BY t1.`id` ASC, t2.`id` ASC", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null, tipe === undefined, tipe ?? null, (peserta_batas ?? 2147483647) + (0)], koneksi);
    const hasil = petakt0(baris);
    return (hasil[0] ?? null);
}
export async function hitungKunjunganUntukKonteks(fasyankes_id, pasien_id, id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `kunjungan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`pasien_id` <=> ?)) AND ((? OR t.`id` < ?))", [fasyankes_id === undefined, fasyankes_id ?? null, pasien_id === undefined, pasien_id ?? null, id === undefined, id ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function daftarKunjunganUntukRiwayatPasien(fasyankes_id, pasien_id, id, batas, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`mulai`, t.`jenis`, t.`lokasi_id` FROM `kunjungan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`pasien_id` <=> ?)) AND ((? OR NOT (t.`id` <=> ?))) ORDER BY t.`id` DESC LIMIT ? OFFSET ?", [fasyankes_id === undefined, fasyankes_id ?? null, pasien_id === undefined, pasien_id ?? null, id === undefined, id ?? null, batas ?? 2147483647, 0], koneksi);
    return baris;
}
export async function cariKunjunganUntukSalinan(id, fasyankes_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`mulai` FROM `kunjungan` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) LIMIT 1", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function cariKunjunganUntukKunjungan2(id, fasyankes_id, koneksi = pool) {
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
        return [...grup.values()].map(baris => ({ nama: baris[0].t1__nama, nomor_rm: baris[0].t1__nomor_rm }));
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
        return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, pasien_id: baris[0].t0__pasien_id, jenis: baris[0].t0__jenis, status: baris[0].t0__status, tahap_layanan: baris[0].t0__tahap_layanan, kunjungan_asal_id: baris[0].t0__kunjungan_asal_id, lokasi_id: baris[0].t0__lokasi_id, cara_pembayaran: baris[0].t0__cara_pembayaran, nomor_sep: baris[0].t0__nomor_sep, spri: baris[0].t0__spri, keluhan_singkat: baris[0].t0__keluhan_singkat, service_type: baris[0].t0__service_type, encounter_id: baris[0].t0__encounter_id, mulai: baris[0].t0__mulai, selesai: baris[0].t0__selesai, waktu_tutup: baris[0].t0__waktu_tutup, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, diarsipkan_pada: baris[0].t0__diarsipkan_pada, retensi_sampai: baris[0].t0__retensi_sampai, pasien: petakt1(baris)[0] }));
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`pasien_id` AS `t0__pasien_id`, t0.`jenis` AS `t0__jenis`, t0.`status` AS `t0__status`, t0.`tahap_layanan` AS `t0__tahap_layanan`, t0.`kunjungan_asal_id` AS `t0__kunjungan_asal_id`, t0.`lokasi_id` AS `t0__lokasi_id`, t0.`cara_pembayaran` AS `t0__cara_pembayaran`, t0.`nomor_sep` AS `t0__nomor_sep`, t0.`spri` AS `t0__spri`, t0.`keluhan_singkat` AS `t0__keluhan_singkat`, t0.`service_type` AS `t0__service_type`, t0.`encounter_id` AS `t0__encounter_id`, t0.`mulai` AS `t0__mulai`, t0.`selesai` AS `t0__selesai`, t0.`waktu_tutup` AS `t0__waktu_tutup`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t0.`diarsipkan_pada` AS `t0__diarsipkan_pada`, t0.`retensi_sampai` AS `t0__retensi_sampai`, t1.`id` AS `t1__id`, t1.`nama` AS `t1__nama`, t1.`nomor_rm` AS `t1__nomor_rm`\nFROM (SELECT t0.* FROM `kunjungan` t0 WHERE ((? OR t0.`id` <=> ?)) AND ((? OR t0.`fasyankes_id` <=> ?)) LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `pasien` b1 WHERE TRUE) t1 ON t0.`pasien_id` = t1.`id`\nORDER BY t1.`id` ASC", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    const hasil = petakt0(baris);
    return (hasil[0] ?? null);
}
export async function daftarKunjunganUntukDaftarPermintaan(id, koneksi = pool) {
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
        return [...grup.values()].map(baris => ({ nama: baris[0].t1__nama, nomor_rm: baris[0].t1__nomor_rm }));
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
        return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, pasien_id: baris[0].t0__pasien_id, jenis: baris[0].t0__jenis, status: baris[0].t0__status, tahap_layanan: baris[0].t0__tahap_layanan, kunjungan_asal_id: baris[0].t0__kunjungan_asal_id, lokasi_id: baris[0].t0__lokasi_id, cara_pembayaran: baris[0].t0__cara_pembayaran, nomor_sep: baris[0].t0__nomor_sep, spri: baris[0].t0__spri, keluhan_singkat: baris[0].t0__keluhan_singkat, service_type: baris[0].t0__service_type, encounter_id: baris[0].t0__encounter_id, mulai: baris[0].t0__mulai, selesai: baris[0].t0__selesai, waktu_tutup: baris[0].t0__waktu_tutup, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, diarsipkan_pada: baris[0].t0__diarsipkan_pada, retensi_sampai: baris[0].t0__retensi_sampai, pasien: petakt1(baris)[0] }));
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`pasien_id` AS `t0__pasien_id`, t0.`jenis` AS `t0__jenis`, t0.`status` AS `t0__status`, t0.`tahap_layanan` AS `t0__tahap_layanan`, t0.`kunjungan_asal_id` AS `t0__kunjungan_asal_id`, t0.`lokasi_id` AS `t0__lokasi_id`, t0.`cara_pembayaran` AS `t0__cara_pembayaran`, t0.`nomor_sep` AS `t0__nomor_sep`, t0.`spri` AS `t0__spri`, t0.`keluhan_singkat` AS `t0__keluhan_singkat`, t0.`service_type` AS `t0__service_type`, t0.`encounter_id` AS `t0__encounter_id`, t0.`mulai` AS `t0__mulai`, t0.`selesai` AS `t0__selesai`, t0.`waktu_tutup` AS `t0__waktu_tutup`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t0.`diarsipkan_pada` AS `t0__diarsipkan_pada`, t0.`retensi_sampai` AS `t0__retensi_sampai`, t1.`id` AS `t1__id`, t1.`nama` AS `t1__nama`, t1.`nomor_rm` AS `t1__nomor_rm`\nFROM (SELECT t0.* FROM `kunjungan` t0 WHERE ((? OR t0.`id` IN (?)))) t0\nLEFT JOIN (SELECT b1.* FROM `pasien` b1 WHERE TRUE) t1 ON t0.`pasien_id` = t1.`id`\nORDER BY t1.`id` ASC", [id === undefined, (id)?.length ? (id) : [null]], koneksi);
    const hasil = petakt0(baris);
    return hasil;
}
export async function hitungKunjunganUntukBerkas(fasyankes_id, tahap_layanan, nama, nik, pakai, waktu_tutup, waktu_tutup2, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `kunjungan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`tahap_layanan` <=> ?)) AND ((? OR (EXISTS (SELECT 1 FROM `pasien` r1 WHERE t.`pasien_id` = r1.`id` AND (((((? OR r1.`nama` LIKE ? ESCAPE '!'))) OR (((? OR r1.`nomor_rm` LIKE ? ESCAPE '!'))) OR (((? OR r1.`nik` LIKE ? ESCAPE '!'))))))))) AND ((? OR t.`waktu_tutup` >= ?) AND (? OR t.`waktu_tutup` < ?))", [fasyankes_id === undefined, fasyankes_id ?? null, tahap_layanan === undefined, tahap_layanan ?? null, !pakai, nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', nik === undefined, '%' + String(nik ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', waktu_tutup === undefined, waktu_tutup ?? null, waktu_tutup2 === undefined, waktu_tutup2 ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function daftarKunjunganUntukBerkas(fasyankes_id, tahap_layanan, nama, nik, pakai, waktu_tutup, waktu_tutup2, batas, lewati, koneksi = pool) {
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
        return [...grup.values()].map(baris => ({ nama: baris[0].t1__nama, nomor_rm: baris[0].t1__nomor_rm }));
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
        return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, pasien_id: baris[0].t0__pasien_id, jenis: baris[0].t0__jenis, status: baris[0].t0__status, tahap_layanan: baris[0].t0__tahap_layanan, kunjungan_asal_id: baris[0].t0__kunjungan_asal_id, lokasi_id: baris[0].t0__lokasi_id, cara_pembayaran: baris[0].t0__cara_pembayaran, nomor_sep: baris[0].t0__nomor_sep, spri: baris[0].t0__spri, keluhan_singkat: baris[0].t0__keluhan_singkat, service_type: baris[0].t0__service_type, encounter_id: baris[0].t0__encounter_id, mulai: baris[0].t0__mulai, selesai: baris[0].t0__selesai, waktu_tutup: baris[0].t0__waktu_tutup, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, diarsipkan_pada: baris[0].t0__diarsipkan_pada, retensi_sampai: baris[0].t0__retensi_sampai, pasien: petakt1(baris)[0] }));
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`pasien_id` AS `t0__pasien_id`, t0.`jenis` AS `t0__jenis`, t0.`status` AS `t0__status`, t0.`tahap_layanan` AS `t0__tahap_layanan`, t0.`kunjungan_asal_id` AS `t0__kunjungan_asal_id`, t0.`lokasi_id` AS `t0__lokasi_id`, t0.`cara_pembayaran` AS `t0__cara_pembayaran`, t0.`nomor_sep` AS `t0__nomor_sep`, t0.`spri` AS `t0__spri`, t0.`keluhan_singkat` AS `t0__keluhan_singkat`, t0.`service_type` AS `t0__service_type`, t0.`encounter_id` AS `t0__encounter_id`, t0.`mulai` AS `t0__mulai`, t0.`selesai` AS `t0__selesai`, t0.`waktu_tutup` AS `t0__waktu_tutup`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t0.`diarsipkan_pada` AS `t0__diarsipkan_pada`, t0.`retensi_sampai` AS `t0__retensi_sampai`, t1.`id` AS `t1__id`, t1.`nama` AS `t1__nama`, t1.`nomor_rm` AS `t1__nomor_rm`\nFROM (SELECT t0.* FROM `kunjungan` t0 WHERE ((? OR t0.`fasyankes_id` <=> ?)) AND ((? OR t0.`tahap_layanan` <=> ?)) AND ((? OR (EXISTS (SELECT 1 FROM `pasien` r1 WHERE t0.`pasien_id` = r1.`id` AND (((((? OR r1.`nama` LIKE ? ESCAPE '!'))) OR (((? OR r1.`nomor_rm` LIKE ? ESCAPE '!'))) OR (((? OR r1.`nik` LIKE ? ESCAPE '!'))))))))) AND ((? OR t0.`waktu_tutup` >= ?) AND (? OR t0.`waktu_tutup` < ?)) ORDER BY t0.`id` DESC LIMIT ? OFFSET ?) t0\nLEFT JOIN (SELECT b1.* FROM `pasien` b1 WHERE TRUE) t1 ON t0.`pasien_id` = t1.`id`\nORDER BY t0.`id` DESC, t1.`id` ASC", [fasyankes_id === undefined, fasyankes_id ?? null, tahap_layanan === undefined, tahap_layanan ?? null, !pakai, nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', nik === undefined, '%' + String(nik ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', waktu_tutup === undefined, waktu_tutup ?? null, waktu_tutup2 === undefined, waktu_tutup2 ?? null, batas ?? 2147483647, lewati ?? 0], koneksi);
    const hasil = petakt0(baris);
    return hasil;
}
export async function hitungKunjunganUntukKunjunganAda2(id, fasyankes_id, pasien_id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `kunjungan` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`pasien_id` <=> ?))", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null, pasien_id === undefined, pasien_id ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function kelompokKunjunganUntukLaporan(fasyankes_id, tahap_layanan, waktu_tutup, waktu_tutup2, koneksi = pool) {
    const baris = await baca("SELECT t.`lokasi_id`, COUNT(*) AS `_count__all` FROM `kunjungan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`tahap_layanan` <=> ?)) AND ((? OR t.`waktu_tutup` >= ?) AND (? OR t.`waktu_tutup` < ?)) GROUP BY t.`lokasi_id`", [fasyankes_id === undefined, fasyankes_id ?? null, tahap_layanan === undefined, tahap_layanan ?? null, waktu_tutup === undefined, waktu_tutup ?? null, waktu_tutup2 === undefined, waktu_tutup2 ?? null], koneksi);
    const hasil = baris.map(b => ({ lokasi_id: b.lokasi_id, _count: { _all: Number(b._count__all) } }));
    return hasil;
}
export async function daftarKunjunganUntukLaporan(fasyankes_id, tahap_layanan, waktu_tutup, waktu_tutup2, koneksi = pool) {
    const baris = await baca("SELECT t.`id` FROM `kunjungan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`tahap_layanan` <=> ?)) AND ((? OR t.`waktu_tutup` >= ?) AND (? OR t.`waktu_tutup` < ?))", [fasyankes_id === undefined, fasyankes_id ?? null, tahap_layanan === undefined, tahap_layanan ?? null, waktu_tutup === undefined, waktu_tutup ?? null, waktu_tutup2 === undefined, waktu_tutup2 ?? null], koneksi);
    return baris;
}
export async function daftarKunjunganUntukKunjunganBanyak(fasyankes_id, id, koneksi = pool) {
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
        return [...grup.values()].map(baris => ({ nama: baris[0].t1__nama, nomor_rm: baris[0].t1__nomor_rm }));
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
        return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, pasien_id: baris[0].t0__pasien_id, jenis: baris[0].t0__jenis, status: baris[0].t0__status, tahap_layanan: baris[0].t0__tahap_layanan, kunjungan_asal_id: baris[0].t0__kunjungan_asal_id, lokasi_id: baris[0].t0__lokasi_id, cara_pembayaran: baris[0].t0__cara_pembayaran, nomor_sep: baris[0].t0__nomor_sep, spri: baris[0].t0__spri, keluhan_singkat: baris[0].t0__keluhan_singkat, service_type: baris[0].t0__service_type, encounter_id: baris[0].t0__encounter_id, mulai: baris[0].t0__mulai, selesai: baris[0].t0__selesai, waktu_tutup: baris[0].t0__waktu_tutup, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, diarsipkan_pada: baris[0].t0__diarsipkan_pada, retensi_sampai: baris[0].t0__retensi_sampai, pasien: petakt1(baris)[0] }));
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`pasien_id` AS `t0__pasien_id`, t0.`jenis` AS `t0__jenis`, t0.`status` AS `t0__status`, t0.`tahap_layanan` AS `t0__tahap_layanan`, t0.`kunjungan_asal_id` AS `t0__kunjungan_asal_id`, t0.`lokasi_id` AS `t0__lokasi_id`, t0.`cara_pembayaran` AS `t0__cara_pembayaran`, t0.`nomor_sep` AS `t0__nomor_sep`, t0.`spri` AS `t0__spri`, t0.`keluhan_singkat` AS `t0__keluhan_singkat`, t0.`service_type` AS `t0__service_type`, t0.`encounter_id` AS `t0__encounter_id`, t0.`mulai` AS `t0__mulai`, t0.`selesai` AS `t0__selesai`, t0.`waktu_tutup` AS `t0__waktu_tutup`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t0.`diarsipkan_pada` AS `t0__diarsipkan_pada`, t0.`retensi_sampai` AS `t0__retensi_sampai`, t1.`id` AS `t1__id`, t1.`nama` AS `t1__nama`, t1.`nomor_rm` AS `t1__nomor_rm`\nFROM (SELECT t0.* FROM `kunjungan` t0 WHERE ((? OR t0.`fasyankes_id` <=> ?)) AND ((? OR t0.`id` IN (?)))) t0\nLEFT JOIN (SELECT b1.* FROM `pasien` b1 WHERE TRUE) t1 ON t0.`pasien_id` = t1.`id`\nORDER BY t1.`id` ASC", [fasyankes_id === undefined, fasyankes_id ?? null, id === undefined, (id)?.length ? (id) : [null]], koneksi);
    const hasil = petakt0(baris);
    return hasil;
}
export async function daftarKunjunganUntukDaftar(fasyankes_id, nama, batas, koneksi = pool) {
    const baris = await baca("SELECT t.`id` FROM `kunjungan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND (EXISTS (SELECT 1 FROM `pasien` r1 WHERE t.`pasien_id` = r1.`id` AND (((((? OR r1.`nama` LIKE ? ESCAPE '!'))) OR (((? OR r1.`nomor_rm` LIKE ? ESCAPE '!'))))))) LIMIT ? OFFSET ?", [fasyankes_id === undefined, fasyankes_id ?? null, nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', batas ?? 2147483647, 0], koneksi);
    return baris;
}
export async function cariKunjunganUntukKunjungan4(id, fasyankes_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`pasien_id`, t.`jenis`, t.`tahap_layanan`, t.`cara_pembayaran` FROM `kunjungan` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) LIMIT 1", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function daftarKunjunganUntukBedSemua(id, tipe, selesai, peserta_batas, koneksi = pool) {
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
        return [...grup.values()].map(baris => ({ nama: baris[0].t1__nama, nomor_rm: baris[0].t1__nomor_rm }));
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
        return [...grup.values()].map(baris => ({ id: baris[0].t2__id, fasyankes_id: baris[0].t2__fasyankes_id, kunjungan_id: baris[0].t2__kunjungan_id, pengguna_id: baris[0].t2__pengguna_id, tipe: baris[0].t2__tipe, mulai: baris[0].t2__mulai, selesai: baris[0].t2__selesai, dibuat_oleh: baris[0].t2__dibuat_oleh, dibuat_pada: baris[0].t2__dibuat_pada }));
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
        return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, pasien_id: baris[0].t0__pasien_id, jenis: baris[0].t0__jenis, status: baris[0].t0__status, tahap_layanan: baris[0].t0__tahap_layanan, kunjungan_asal_id: baris[0].t0__kunjungan_asal_id, lokasi_id: baris[0].t0__lokasi_id, cara_pembayaran: baris[0].t0__cara_pembayaran, nomor_sep: baris[0].t0__nomor_sep, spri: baris[0].t0__spri, keluhan_singkat: baris[0].t0__keluhan_singkat, service_type: baris[0].t0__service_type, encounter_id: baris[0].t0__encounter_id, mulai: baris[0].t0__mulai, selesai: baris[0].t0__selesai, waktu_tutup: baris[0].t0__waktu_tutup, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, diarsipkan_pada: baris[0].t0__diarsipkan_pada, retensi_sampai: baris[0].t0__retensi_sampai, pasien: petakt1(baris)[0], peserta: petakt2(baris) }));
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`pasien_id` AS `t0__pasien_id`, t0.`jenis` AS `t0__jenis`, t0.`status` AS `t0__status`, t0.`tahap_layanan` AS `t0__tahap_layanan`, t0.`kunjungan_asal_id` AS `t0__kunjungan_asal_id`, t0.`lokasi_id` AS `t0__lokasi_id`, t0.`cara_pembayaran` AS `t0__cara_pembayaran`, t0.`nomor_sep` AS `t0__nomor_sep`, t0.`spri` AS `t0__spri`, t0.`keluhan_singkat` AS `t0__keluhan_singkat`, t0.`service_type` AS `t0__service_type`, t0.`encounter_id` AS `t0__encounter_id`, t0.`mulai` AS `t0__mulai`, t0.`selesai` AS `t0__selesai`, t0.`waktu_tutup` AS `t0__waktu_tutup`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t0.`diarsipkan_pada` AS `t0__diarsipkan_pada`, t0.`retensi_sampai` AS `t0__retensi_sampai`, t1.`id` AS `t1__id`, t1.`nama` AS `t1__nama`, t1.`nomor_rm` AS `t1__nomor_rm`, t2.`id` AS `t2__id`, t2.`fasyankes_id` AS `t2__fasyankes_id`, t2.`kunjungan_id` AS `t2__kunjungan_id`, t2.`pengguna_id` AS `t2__pengguna_id`, t2.`tipe` AS `t2__tipe`, t2.`mulai` AS `t2__mulai`, t2.`selesai` AS `t2__selesai`, t2.`dibuat_oleh` AS `t2__dibuat_oleh`, t2.`dibuat_pada` AS `t2__dibuat_pada`\nFROM (SELECT t0.* FROM `kunjungan` t0 WHERE ((? OR t0.`id` IN (?)))) t0\nLEFT JOIN (SELECT b1.* FROM `pasien` b1 WHERE TRUE) t1 ON t0.`pasien_id` = t1.`id`\nLEFT JOIN (SELECT b2.*, ROW_NUMBER() OVER (PARTITION BY b2.`kunjungan_id` ORDER BY b2.`id` ASC) AS _urutan FROM `peserta_kunjungan` b2 WHERE ((? OR b2.`tipe` <=> ?)) AND ((? OR b2.`selesai` <=> ?))) t2 ON t0.`id` = t2.`kunjungan_id` AND t2._urutan <= ?\nORDER BY t1.`id` ASC, t2.`id` ASC", [id === undefined, (id)?.length ? (id) : [null], tipe === undefined, tipe ?? null, selesai === undefined, selesai ?? null, (peserta_batas ?? 2147483647) + (0)], koneksi);
    const hasil = petakt0(baris);
    return hasil;
}
export async function daftarKunjunganUntukPapan(fasyankes_id, jenis, status, tahap_layanan, batas, tipe, selesai, peserta_batas, koneksi = pool) {
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
        return [...grup.values()].map(baris => ({ nama: baris[0].t1__nama, nomor_rm: baris[0].t1__nomor_rm }));
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
        return [...grup.values()].map(baris => ({ id: baris[0].t2__id, fasyankes_id: baris[0].t2__fasyankes_id, kunjungan_id: baris[0].t2__kunjungan_id, pengguna_id: baris[0].t2__pengguna_id, tipe: baris[0].t2__tipe, mulai: baris[0].t2__mulai, selesai: baris[0].t2__selesai, dibuat_oleh: baris[0].t2__dibuat_oleh, dibuat_pada: baris[0].t2__dibuat_pada }));
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
        return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, pasien_id: baris[0].t0__pasien_id, jenis: baris[0].t0__jenis, status: baris[0].t0__status, tahap_layanan: baris[0].t0__tahap_layanan, kunjungan_asal_id: baris[0].t0__kunjungan_asal_id, lokasi_id: baris[0].t0__lokasi_id, cara_pembayaran: baris[0].t0__cara_pembayaran, nomor_sep: baris[0].t0__nomor_sep, spri: baris[0].t0__spri, keluhan_singkat: baris[0].t0__keluhan_singkat, service_type: baris[0].t0__service_type, encounter_id: baris[0].t0__encounter_id, mulai: baris[0].t0__mulai, selesai: baris[0].t0__selesai, waktu_tutup: baris[0].t0__waktu_tutup, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, diarsipkan_pada: baris[0].t0__diarsipkan_pada, retensi_sampai: baris[0].t0__retensi_sampai, pasien: petakt1(baris)[0], peserta: petakt2(baris) }));
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`pasien_id` AS `t0__pasien_id`, t0.`jenis` AS `t0__jenis`, t0.`status` AS `t0__status`, t0.`tahap_layanan` AS `t0__tahap_layanan`, t0.`kunjungan_asal_id` AS `t0__kunjungan_asal_id`, t0.`lokasi_id` AS `t0__lokasi_id`, t0.`cara_pembayaran` AS `t0__cara_pembayaran`, t0.`nomor_sep` AS `t0__nomor_sep`, t0.`spri` AS `t0__spri`, t0.`keluhan_singkat` AS `t0__keluhan_singkat`, t0.`service_type` AS `t0__service_type`, t0.`encounter_id` AS `t0__encounter_id`, t0.`mulai` AS `t0__mulai`, t0.`selesai` AS `t0__selesai`, t0.`waktu_tutup` AS `t0__waktu_tutup`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t0.`diarsipkan_pada` AS `t0__diarsipkan_pada`, t0.`retensi_sampai` AS `t0__retensi_sampai`, t1.`id` AS `t1__id`, t1.`nama` AS `t1__nama`, t1.`nomor_rm` AS `t1__nomor_rm`, t2.`id` AS `t2__id`, t2.`fasyankes_id` AS `t2__fasyankes_id`, t2.`kunjungan_id` AS `t2__kunjungan_id`, t2.`pengguna_id` AS `t2__pengguna_id`, t2.`tipe` AS `t2__tipe`, t2.`mulai` AS `t2__mulai`, t2.`selesai` AS `t2__selesai`, t2.`dibuat_oleh` AS `t2__dibuat_oleh`, t2.`dibuat_pada` AS `t2__dibuat_pada`\nFROM (SELECT t0.* FROM `kunjungan` t0 WHERE ((? OR t0.`fasyankes_id` <=> ?)) AND ((? OR t0.`jenis` <=> ?)) AND ((? OR t0.`status` <=> ?)) AND ((? OR t0.`tahap_layanan` IN (?))) ORDER BY t0.`id` ASC LIMIT ? OFFSET ?) t0\nLEFT JOIN (SELECT b1.* FROM `pasien` b1 WHERE TRUE) t1 ON t0.`pasien_id` = t1.`id`\nLEFT JOIN (SELECT b2.*, ROW_NUMBER() OVER (PARTITION BY b2.`kunjungan_id` ORDER BY b2.`id` ASC) AS _urutan FROM `peserta_kunjungan` b2 WHERE ((? OR b2.`tipe` <=> ?)) AND ((? OR b2.`selesai` <=> ?))) t2 ON t0.`id` = t2.`kunjungan_id` AND t2._urutan <= ?\nORDER BY t0.`id` ASC, t1.`id` ASC, t2.`id` ASC", [fasyankes_id === undefined, fasyankes_id ?? null, jenis === undefined, jenis ?? null, status === undefined, status ?? null, tahap_layanan === undefined, (tahap_layanan)?.length ? (tahap_layanan) : [null], batas ?? 2147483647, 0, tipe === undefined, tipe ?? null, selesai === undefined, selesai ?? null, (peserta_batas ?? 2147483647) + (0)], koneksi);
    const hasil = petakt0(baris);
    return hasil;
}
export async function daftarKunjunganUntukAsal(fasyankes_id, pasien_id, tahap_layanan, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`pasien_id`, t.`jenis`, t.`status`, t.`tahap_layanan`, t.`kunjungan_asal_id`, t.`lokasi_id`, t.`cara_pembayaran`, t.`nomor_sep`, t.`spri`, t.`keluhan_singkat`, t.`service_type`, t.`encounter_id`, t.`mulai`, t.`selesai`, t.`waktu_tutup`, t.`dibuat_oleh`, t.`dibuat_pada`, t.`diarsipkan_pada`, t.`retensi_sampai` FROM `kunjungan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`pasien_id` <=> ?)) AND ((? OR t.`tahap_layanan` IN (?)))", [fasyankes_id === undefined, fasyankes_id ?? null, pasien_id === undefined, pasien_id ?? null, tahap_layanan === undefined, (tahap_layanan)?.length ? (tahap_layanan) : [null]], koneksi);
    return baris;
}
export async function tambahKunjunganUntukAdmisi(fasyankes_id, pasien_id, jenis, status, tahap_layanan, kunjungan_asal_id, cara_pembayaran, nomor_sep, spri, keluhan_singkat, mulai, dibuat_oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `kunjungan` (`fasyankes_id`, `pasien_id`, `jenis`, `status`, `tahap_layanan`, `kunjungan_asal_id`, `cara_pembayaran`, `nomor_sep`, `spri`, `keluhan_singkat`, `mulai`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (pasien_id === undefined ? null : pasien_id) ?? null, ((jenis === undefined ? null : jenis) ?? null), ((status === undefined ? "arrived" : status) ?? null), ((tahap_layanan === undefined ? "menunggu_skrining" : tahap_layanan) ?? null), (kunjungan_asal_id === undefined ? null : kunjungan_asal_id) ?? null, ((cara_pembayaran === undefined ? "umum" : cara_pembayaran) ?? null), (nomor_sep === undefined ? null : nomor_sep) ?? null, (spri === undefined ? null : spri) ?? null, (keluhan_singkat === undefined ? null : keluhan_singkat) ?? null, (mulai === undefined ? new Date() : mulai) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function ubahKunjunganUntukTeruskanDariRawatJalan(status, tahap_layanan, selesai, retensi_sampai, id, koneksi = pool) {
    const hasil = await tulis("UPDATE `kunjungan` t SET `status` = IF(?, t.`status`, ?), `tahap_layanan` = IF(?, t.`tahap_layanan`, ?), `selesai` = IF(?, t.`selesai`, ?), `waktu_tutup` = IF(?, t.`waktu_tutup`, ?), `diarsipkan_pada` = IF(?, t.`diarsipkan_pada`, ?), `retensi_sampai` = IF(?, t.`retensi_sampai`, ?) WHERE ((? OR t.`id` <=> ?))", [status === undefined, (status ?? null), tahap_layanan === undefined, (tahap_layanan ?? null), selesai === undefined, selesai ?? null, selesai === undefined, selesai ?? null, selesai === undefined, selesai ?? null, retensi_sampai === undefined, retensi_sampai ?? null, id === undefined, id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function cariKunjunganUntukDetail(id, fasyankes_id, jenis, koneksi = pool) {
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
        return [...grup.values()].map(baris => ({ nama: baris[0].t1__nama, nomor_rm: baris[0].t1__nomor_rm }));
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
        return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, pasien_id: baris[0].t0__pasien_id, jenis: baris[0].t0__jenis, status: baris[0].t0__status, tahap_layanan: baris[0].t0__tahap_layanan, kunjungan_asal_id: baris[0].t0__kunjungan_asal_id, lokasi_id: baris[0].t0__lokasi_id, cara_pembayaran: baris[0].t0__cara_pembayaran, nomor_sep: baris[0].t0__nomor_sep, spri: baris[0].t0__spri, keluhan_singkat: baris[0].t0__keluhan_singkat, service_type: baris[0].t0__service_type, encounter_id: baris[0].t0__encounter_id, mulai: baris[0].t0__mulai, selesai: baris[0].t0__selesai, waktu_tutup: baris[0].t0__waktu_tutup, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, diarsipkan_pada: baris[0].t0__diarsipkan_pada, retensi_sampai: baris[0].t0__retensi_sampai, pasien: petakt1(baris)[0] }));
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`pasien_id` AS `t0__pasien_id`, t0.`jenis` AS `t0__jenis`, t0.`status` AS `t0__status`, t0.`tahap_layanan` AS `t0__tahap_layanan`, t0.`kunjungan_asal_id` AS `t0__kunjungan_asal_id`, t0.`lokasi_id` AS `t0__lokasi_id`, t0.`cara_pembayaran` AS `t0__cara_pembayaran`, t0.`nomor_sep` AS `t0__nomor_sep`, t0.`spri` AS `t0__spri`, t0.`keluhan_singkat` AS `t0__keluhan_singkat`, t0.`service_type` AS `t0__service_type`, t0.`encounter_id` AS `t0__encounter_id`, t0.`mulai` AS `t0__mulai`, t0.`selesai` AS `t0__selesai`, t0.`waktu_tutup` AS `t0__waktu_tutup`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t0.`diarsipkan_pada` AS `t0__diarsipkan_pada`, t0.`retensi_sampai` AS `t0__retensi_sampai`, t1.`id` AS `t1__id`, t1.`nama` AS `t1__nama`, t1.`nomor_rm` AS `t1__nomor_rm`\nFROM (SELECT t0.* FROM `kunjungan` t0 WHERE ((? OR t0.`id` <=> ?)) AND ((? OR t0.`fasyankes_id` <=> ?)) AND ((? OR t0.`jenis` <=> ?)) LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `pasien` b1 WHERE TRUE) t1 ON t0.`pasien_id` = t1.`id`\nORDER BY t1.`id` ASC", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null, jenis === undefined, jenis ?? null], koneksi);
    const hasil = petakt0(baris);
    return (hasil[0] ?? null);
}
export async function cariKunjunganUntukUbahPenempatan(id, fasyankes_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`pasien_id`, t.`jenis`, t.`status`, t.`tahap_layanan`, t.`kunjungan_asal_id`, t.`lokasi_id`, t.`cara_pembayaran`, t.`nomor_sep`, t.`spri`, t.`keluhan_singkat`, t.`service_type`, t.`encounter_id`, t.`mulai`, t.`selesai`, t.`waktu_tutup`, t.`dibuat_oleh`, t.`dibuat_pada`, t.`diarsipkan_pada`, t.`retensi_sampai` FROM `kunjungan` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) LIMIT 1", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function ubahKunjunganUntukUbahPenempatan(status, id, koneksi = pool) {
    const hasil = await tulis("UPDATE `kunjungan` t SET `status` = IF(?, t.`status`, ?) WHERE ((? OR t.`id` <=> ?))", [status === undefined, (status ?? null), id === undefined, id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function ubahKunjunganUntukPulangkan(status, tahap_layanan, selesai, id, koneksi = pool) {
    const hasil = await tulis("UPDATE `kunjungan` t SET `status` = IF(?, t.`status`, ?), `tahap_layanan` = IF(?, t.`tahap_layanan`, ?), `selesai` = IF(?, t.`selesai`, ?) WHERE ((? OR t.`id` <=> ?))", [status === undefined, (status ?? null), tahap_layanan === undefined, (tahap_layanan ?? null), selesai === undefined, selesai ?? null, id === undefined, id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function cariKunjunganUntukKunjungan5(id, fasyankes_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`pasien_id`, t.`tahap_layanan`, t.`cara_pembayaran` FROM `kunjungan` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) LIMIT 1", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function wajibKunjunganUntukTandaiSiap(id, koneksi = pool) {
    const baris = await baca("SELECT t.`tahap_layanan` FROM `kunjungan` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris kunjungan tidak ditemukan.');
    return baris[0];
}
export async function ubahKunjunganUntukTutup(status, tahap_layanan, selesai, retensi_sampai, id, fasyankes_id, tahap_layanan2, koneksi = pool) {
    const hasil = await tulis("UPDATE `kunjungan` t SET `status` = IF(?, t.`status`, ?), `tahap_layanan` = IF(?, t.`tahap_layanan`, ?), `selesai` = IF(?, t.`selesai`, ?), `waktu_tutup` = IF(?, t.`waktu_tutup`, ?), `diarsipkan_pada` = IF(?, t.`diarsipkan_pada`, ?), `retensi_sampai` = IF(?, t.`retensi_sampai`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`tahap_layanan` <=> ?))", [status === undefined, (status ?? null), tahap_layanan === undefined, (tahap_layanan ?? null), selesai === undefined, selesai ?? null, selesai === undefined, selesai ?? null, selesai === undefined, selesai ?? null, retensi_sampai === undefined, retensi_sampai ?? null, id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null, tahap_layanan2 === undefined, tahap_layanan2 ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function daftarKunjunganSiapKlaim(fasyankesId, batas, koneksi = pool) {
    return baca("SELECT k.id FROM kunjungan k WHERE k.fasyankes_id = ? AND k.cara_pembayaran = 'jkn' AND k.tahap_layanan = 'ditutup' AND NOT EXISTS (SELECT 1 FROM klaim c WHERE c.kunjungan_id = k.id) ORDER BY k.id DESC LIMIT ?", [fasyankesId, batas], koneksi);
}
export function kunciKunjunganRawatInap(id, fasyankesId, koneksi) {
    return baca('SELECT id FROM kunjungan WHERE id = ? AND fasyankes_id = ? FOR UPDATE', [id, fasyankesId], koneksi);
}
