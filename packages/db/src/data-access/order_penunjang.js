import { baca, tulis, pool } from '../koneksi.js';
export async function kelompokOrderPenunjangUntukPetakan(fasyankes_id, kunjungan_id, status, koneksi = pool) {
    const baris = await baca("SELECT t.`kunjungan_id`, t.`status`, COUNT(*) AS `_count__all` FROM `order_penunjang` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`kunjungan_id` IN (?))) AND ((? OR NOT (t.`status` <=> ?))) GROUP BY t.`kunjungan_id`, t.`status`", [fasyankes_id === undefined, fasyankes_id ?? null, kunjungan_id === undefined, (kunjungan_id)?.length ? (kunjungan_id) : [null], status === undefined, status ?? null], koneksi);
    const hasil = baris.map(b => ({ kunjungan_id: b.kunjungan_id, status: b.status, _count: { _all: Number(b._count__all) } }));
    return hasil;
}
export async function daftarOrderPenunjangUntukDataCetak(fasyankes_id, kunjungan_id, koneksi = pool) {
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
        return [...grup.values()].map(baris => ({ id: baris[0].t1__id, fasyankes_id: baris[0].t1__fasyankes_id, order_id: baris[0].t1__order_id, nilai: baris[0].t1__nilai, satuan: baris[0].t1__satuan, rujukan_teks: baris[0].t1__rujukan_teks, interpretasi: baris[0].t1__interpretasi, catatan: baris[0].t1__catatan, dientri_oleh: baris[0].t1__dientri_oleh, dientri_pada: baris[0].t1__dientri_pada, validator_id: baris[0].t1__validator_id, divalidasi_pada: baris[0].t1__divalidasi_pada }));
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
        return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, kunjungan_id: baris[0].t0__kunjungan_id, pasien_id: baris[0].t0__pasien_id, jenis: baris[0].t0__jenis, master_pemeriksaan_id: baris[0].t0__master_pemeriksaan_id, kode_loinc: baris[0].t0__kode_loinc, nama: baris[0].t0__nama, prioritas: baris[0].t0__prioritas, catatan: baris[0].t0__catatan, status: baris[0].t0__status, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, hasil: petakt1(baris)[0] ?? null }));
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`kunjungan_id` AS `t0__kunjungan_id`, t0.`pasien_id` AS `t0__pasien_id`, t0.`jenis` AS `t0__jenis`, t0.`master_pemeriksaan_id` AS `t0__master_pemeriksaan_id`, t0.`kode_loinc` AS `t0__kode_loinc`, t0.`nama` AS `t0__nama`, t0.`prioritas` AS `t0__prioritas`, t0.`catatan` AS `t0__catatan`, t0.`status` AS `t0__status`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t1.`id` AS `t1__id`, t1.`fasyankes_id` AS `t1__fasyankes_id`, t1.`order_id` AS `t1__order_id`, t1.`nilai` AS `t1__nilai`, t1.`satuan` AS `t1__satuan`, t1.`rujukan_teks` AS `t1__rujukan_teks`, t1.`interpretasi` AS `t1__interpretasi`, t1.`catatan` AS `t1__catatan`, t1.`dientri_oleh` AS `t1__dientri_oleh`, t1.`dientri_pada` AS `t1__dientri_pada`, t1.`validator_id` AS `t1__validator_id`, t1.`divalidasi_pada` AS `t1__divalidasi_pada`\nFROM (SELECT t0.* FROM `order_penunjang` t0 WHERE ((? OR t0.`fasyankes_id` <=> ?)) AND ((? OR t0.`kunjungan_id` <=> ?)) ORDER BY t0.`id` ASC) t0\nLEFT JOIN (SELECT b1.* FROM `hasil_penunjang` b1 WHERE TRUE) t1 ON t0.`id` = t1.`order_id`\nORDER BY t0.`id` ASC, t1.`id` ASC", [fasyankes_id === undefined, fasyankes_id ?? null, kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
    const hasil = petakt0(baris);
    return hasil;
}
export async function tambahOrderPenunjangUntukBuatOrder(fasyankes_id, kunjungan_id, pasien_id, jenis, master_pemeriksaan_id, kode_loinc, nama, prioritas, catatan, dibuat_oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `order_penunjang` (`fasyankes_id`, `kunjungan_id`, `pasien_id`, `jenis`, `master_pemeriksaan_id`, `kode_loinc`, `nama`, `prioritas`, `catatan`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (kunjungan_id === undefined ? null : kunjungan_id) ?? null, (pasien_id === undefined ? null : pasien_id) ?? null, (jenis === undefined ? "lab" : jenis) ?? null, (master_pemeriksaan_id === undefined ? null : master_pemeriksaan_id) ?? null, (kode_loinc === undefined ? null : kode_loinc) ?? null, (nama === undefined ? null : nama) ?? null, (prioritas === undefined ? "rutin" : prioritas) ?? null, (catatan === undefined ? null : catatan) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahOrderPenunjangUntukBuatOrderHasil(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`pasien_id`, t.`jenis`, t.`master_pemeriksaan_id`, t.`kode_loinc`, t.`nama`, t.`prioritas`, t.`catatan`, t.`status`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `order_penunjang` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris order_penunjang tidak ditemukan.');
    return baris[0];
}
export async function cariOrderPenunjangUntukOrder(id, fasyankes_id, koneksi = pool) {
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
        return [...grup.values()].map(baris => ({ id: baris[0].t1__id, fasyankes_id: baris[0].t1__fasyankes_id, kode: baris[0].t1__kode, nama: baris[0].t1__nama, jenis: baris[0].t1__jenis, kode_loinc: baris[0].t1__kode_loinc, jenis_spesimen: baris[0].t1__jenis_spesimen, satuan: baris[0].t1__satuan, rujukan_min: baris[0].t1__rujukan_min, rujukan_maks: baris[0].t1__rujukan_maks, rujukan_teks: baris[0].t1__rujukan_teks, tarif_layanan_id: baris[0].t1__tarif_layanan_id, aktif: baris[0].t1__aktif, dibuat_oleh: baris[0].t1__dibuat_oleh, dibuat_pada: baris[0].t1__dibuat_pada, diubah_pada: baris[0].t1__diubah_pada }));
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
        return [...grup.values()].map(baris => ({ id: baris[0].t2__id, fasyankes_id: baris[0].t2__fasyankes_id, order_id: baris[0].t2__order_id, asal: baris[0].t2__asal, waktu_ambil: baris[0].t2__waktu_ambil, petugas_id: baris[0].t2__petugas_id, dibuat_oleh: baris[0].t2__dibuat_oleh, dibuat_pada: baris[0].t2__dibuat_pada }));
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
        return [...grup.values()].map(baris => ({ id: baris[0].t3__id, fasyankes_id: baris[0].t3__fasyankes_id, order_id: baris[0].t3__order_id, nilai: baris[0].t3__nilai, satuan: baris[0].t3__satuan, rujukan_teks: baris[0].t3__rujukan_teks, interpretasi: baris[0].t3__interpretasi, catatan: baris[0].t3__catatan, dientri_oleh: baris[0].t3__dientri_oleh, dientri_pada: baris[0].t3__dientri_pada, validator_id: baris[0].t3__validator_id, divalidasi_pada: baris[0].t3__divalidasi_pada }));
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
        return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, kunjungan_id: baris[0].t0__kunjungan_id, pasien_id: baris[0].t0__pasien_id, jenis: baris[0].t0__jenis, master_pemeriksaan_id: baris[0].t0__master_pemeriksaan_id, kode_loinc: baris[0].t0__kode_loinc, nama: baris[0].t0__nama, prioritas: baris[0].t0__prioritas, catatan: baris[0].t0__catatan, status: baris[0].t0__status, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, master: petakt1(baris)[0] ?? null, spesimen: petakt2(baris)[0] ?? null, hasil: petakt3(baris)[0] ?? null }));
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`kunjungan_id` AS `t0__kunjungan_id`, t0.`pasien_id` AS `t0__pasien_id`, t0.`jenis` AS `t0__jenis`, t0.`master_pemeriksaan_id` AS `t0__master_pemeriksaan_id`, t0.`kode_loinc` AS `t0__kode_loinc`, t0.`nama` AS `t0__nama`, t0.`prioritas` AS `t0__prioritas`, t0.`catatan` AS `t0__catatan`, t0.`status` AS `t0__status`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t1.`id` AS `t1__id`, t1.`fasyankes_id` AS `t1__fasyankes_id`, t1.`kode` AS `t1__kode`, t1.`nama` AS `t1__nama`, t1.`jenis` AS `t1__jenis`, t1.`kode_loinc` AS `t1__kode_loinc`, t1.`jenis_spesimen` AS `t1__jenis_spesimen`, t1.`satuan` AS `t1__satuan`, t1.`rujukan_min` AS `t1__rujukan_min`, t1.`rujukan_maks` AS `t1__rujukan_maks`, t1.`rujukan_teks` AS `t1__rujukan_teks`, t1.`tarif_layanan_id` AS `t1__tarif_layanan_id`, t1.`aktif` AS `t1__aktif`, t1.`dibuat_oleh` AS `t1__dibuat_oleh`, t1.`dibuat_pada` AS `t1__dibuat_pada`, t1.`diubah_pada` AS `t1__diubah_pada`, t2.`id` AS `t2__id`, t2.`fasyankes_id` AS `t2__fasyankes_id`, t2.`order_id` AS `t2__order_id`, t2.`asal` AS `t2__asal`, t2.`waktu_ambil` AS `t2__waktu_ambil`, t2.`petugas_id` AS `t2__petugas_id`, t2.`dibuat_oleh` AS `t2__dibuat_oleh`, t2.`dibuat_pada` AS `t2__dibuat_pada`, t3.`id` AS `t3__id`, t3.`fasyankes_id` AS `t3__fasyankes_id`, t3.`order_id` AS `t3__order_id`, t3.`nilai` AS `t3__nilai`, t3.`satuan` AS `t3__satuan`, t3.`rujukan_teks` AS `t3__rujukan_teks`, t3.`interpretasi` AS `t3__interpretasi`, t3.`catatan` AS `t3__catatan`, t3.`dientri_oleh` AS `t3__dientri_oleh`, t3.`dientri_pada` AS `t3__dientri_pada`, t3.`validator_id` AS `t3__validator_id`, t3.`divalidasi_pada` AS `t3__divalidasi_pada`\nFROM (SELECT t0.* FROM `order_penunjang` t0 WHERE ((? OR t0.`id` <=> ?)) AND ((? OR t0.`fasyankes_id` <=> ?)) LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `master_pemeriksaan` b1 WHERE TRUE) t1 ON t0.`master_pemeriksaan_id` = t1.`id`\nLEFT JOIN (SELECT b2.* FROM `spesimen` b2 WHERE TRUE) t2 ON t0.`id` = t2.`order_id`\nLEFT JOIN (SELECT b3.* FROM `hasil_penunjang` b3 WHERE TRUE) t3 ON t0.`id` = t3.`order_id`\nORDER BY t1.`id` ASC, t2.`id` ASC, t3.`id` ASC", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    const hasil = petakt0(baris);
    return (hasil[0] ?? null);
}
export async function daftarOrderPenunjangUntukOrdersKunjungan(fasyankes_id, kunjungan_id, koneksi = pool) {
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
        return [...grup.values()].map(baris => ({ id: baris[0].t1__id, fasyankes_id: baris[0].t1__fasyankes_id, kode: baris[0].t1__kode, nama: baris[0].t1__nama, jenis: baris[0].t1__jenis, kode_loinc: baris[0].t1__kode_loinc, jenis_spesimen: baris[0].t1__jenis_spesimen, satuan: baris[0].t1__satuan, rujukan_min: baris[0].t1__rujukan_min, rujukan_maks: baris[0].t1__rujukan_maks, rujukan_teks: baris[0].t1__rujukan_teks, tarif_layanan_id: baris[0].t1__tarif_layanan_id, aktif: baris[0].t1__aktif, dibuat_oleh: baris[0].t1__dibuat_oleh, dibuat_pada: baris[0].t1__dibuat_pada, diubah_pada: baris[0].t1__diubah_pada }));
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
        return [...grup.values()].map(baris => ({ id: baris[0].t2__id, fasyankes_id: baris[0].t2__fasyankes_id, order_id: baris[0].t2__order_id, asal: baris[0].t2__asal, waktu_ambil: baris[0].t2__waktu_ambil, petugas_id: baris[0].t2__petugas_id, dibuat_oleh: baris[0].t2__dibuat_oleh, dibuat_pada: baris[0].t2__dibuat_pada }));
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
        return [...grup.values()].map(baris => ({ id: baris[0].t3__id, fasyankes_id: baris[0].t3__fasyankes_id, order_id: baris[0].t3__order_id, nilai: baris[0].t3__nilai, satuan: baris[0].t3__satuan, rujukan_teks: baris[0].t3__rujukan_teks, interpretasi: baris[0].t3__interpretasi, catatan: baris[0].t3__catatan, dientri_oleh: baris[0].t3__dientri_oleh, dientri_pada: baris[0].t3__dientri_pada, validator_id: baris[0].t3__validator_id, divalidasi_pada: baris[0].t3__divalidasi_pada }));
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
        return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, kunjungan_id: baris[0].t0__kunjungan_id, pasien_id: baris[0].t0__pasien_id, jenis: baris[0].t0__jenis, master_pemeriksaan_id: baris[0].t0__master_pemeriksaan_id, kode_loinc: baris[0].t0__kode_loinc, nama: baris[0].t0__nama, prioritas: baris[0].t0__prioritas, catatan: baris[0].t0__catatan, status: baris[0].t0__status, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, master: petakt1(baris)[0] ?? null, spesimen: petakt2(baris)[0] ?? null, hasil: petakt3(baris)[0] ?? null }));
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`kunjungan_id` AS `t0__kunjungan_id`, t0.`pasien_id` AS `t0__pasien_id`, t0.`jenis` AS `t0__jenis`, t0.`master_pemeriksaan_id` AS `t0__master_pemeriksaan_id`, t0.`kode_loinc` AS `t0__kode_loinc`, t0.`nama` AS `t0__nama`, t0.`prioritas` AS `t0__prioritas`, t0.`catatan` AS `t0__catatan`, t0.`status` AS `t0__status`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t1.`id` AS `t1__id`, t1.`fasyankes_id` AS `t1__fasyankes_id`, t1.`kode` AS `t1__kode`, t1.`nama` AS `t1__nama`, t1.`jenis` AS `t1__jenis`, t1.`kode_loinc` AS `t1__kode_loinc`, t1.`jenis_spesimen` AS `t1__jenis_spesimen`, t1.`satuan` AS `t1__satuan`, t1.`rujukan_min` AS `t1__rujukan_min`, t1.`rujukan_maks` AS `t1__rujukan_maks`, t1.`rujukan_teks` AS `t1__rujukan_teks`, t1.`tarif_layanan_id` AS `t1__tarif_layanan_id`, t1.`aktif` AS `t1__aktif`, t1.`dibuat_oleh` AS `t1__dibuat_oleh`, t1.`dibuat_pada` AS `t1__dibuat_pada`, t1.`diubah_pada` AS `t1__diubah_pada`, t2.`id` AS `t2__id`, t2.`fasyankes_id` AS `t2__fasyankes_id`, t2.`order_id` AS `t2__order_id`, t2.`asal` AS `t2__asal`, t2.`waktu_ambil` AS `t2__waktu_ambil`, t2.`petugas_id` AS `t2__petugas_id`, t2.`dibuat_oleh` AS `t2__dibuat_oleh`, t2.`dibuat_pada` AS `t2__dibuat_pada`, t3.`id` AS `t3__id`, t3.`fasyankes_id` AS `t3__fasyankes_id`, t3.`order_id` AS `t3__order_id`, t3.`nilai` AS `t3__nilai`, t3.`satuan` AS `t3__satuan`, t3.`rujukan_teks` AS `t3__rujukan_teks`, t3.`interpretasi` AS `t3__interpretasi`, t3.`catatan` AS `t3__catatan`, t3.`dientri_oleh` AS `t3__dientri_oleh`, t3.`dientri_pada` AS `t3__dientri_pada`, t3.`validator_id` AS `t3__validator_id`, t3.`divalidasi_pada` AS `t3__divalidasi_pada`\nFROM (SELECT t0.* FROM `order_penunjang` t0 WHERE ((? OR t0.`fasyankes_id` <=> ?)) AND ((? OR t0.`kunjungan_id` <=> ?)) ORDER BY t0.`id` ASC) t0\nLEFT JOIN (SELECT b1.* FROM `master_pemeriksaan` b1 WHERE TRUE) t1 ON t0.`master_pemeriksaan_id` = t1.`id`\nLEFT JOIN (SELECT b2.* FROM `spesimen` b2 WHERE TRUE) t2 ON t0.`id` = t2.`order_id`\nLEFT JOIN (SELECT b3.* FROM `hasil_penunjang` b3 WHERE TRUE) t3 ON t0.`id` = t3.`order_id`\nORDER BY t0.`id` ASC, t1.`id` ASC, t2.`id` ASC, t3.`id` ASC", [fasyankes_id === undefined, fasyankes_id ?? null, kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
    const hasil = petakt0(baris);
    return hasil;
}
export async function ubahOrderPenunjangUntukCatatSpesimen(status, id, fasyankes_id, status2, koneksi = pool) {
    const hasil = await tulis("UPDATE `order_penunjang` t SET `status` = IF(?, t.`status`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`status` <=> ?))", [status === undefined, (status ?? null), id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null, status2 === undefined, status2 ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function ubahOrderPenunjangUntukSimpanHasil(status, id, fasyankes_id, status2, koneksi = pool) {
    const hasil = await tulis("UPDATE `order_penunjang` t SET `status` = IF(?, t.`status`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`status` IN (?)))", [status === undefined, (status ?? null), id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null, status2 === undefined, (status2)?.length ? (status2) : [null]], koneksi);
    return { count: hasil.affectedRows };
}
export async function wajibOrderPenunjangUntukValidasi(id, koneksi = pool) {
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
        return [...grup.values()].map(baris => ({ id: baris[0].t1__id, fasyankes_id: baris[0].t1__fasyankes_id, order_id: baris[0].t1__order_id, nilai: baris[0].t1__nilai, satuan: baris[0].t1__satuan, rujukan_teks: baris[0].t1__rujukan_teks, interpretasi: baris[0].t1__interpretasi, catatan: baris[0].t1__catatan, dientri_oleh: baris[0].t1__dientri_oleh, dientri_pada: baris[0].t1__dientri_pada, validator_id: baris[0].t1__validator_id, divalidasi_pada: baris[0].t1__divalidasi_pada }));
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
        return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, kunjungan_id: baris[0].t0__kunjungan_id, pasien_id: baris[0].t0__pasien_id, jenis: baris[0].t0__jenis, master_pemeriksaan_id: baris[0].t0__master_pemeriksaan_id, kode_loinc: baris[0].t0__kode_loinc, nama: baris[0].t0__nama, prioritas: baris[0].t0__prioritas, catatan: baris[0].t0__catatan, status: baris[0].t0__status, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, hasil: petakt1(baris)[0] ?? null }));
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`kunjungan_id` AS `t0__kunjungan_id`, t0.`pasien_id` AS `t0__pasien_id`, t0.`jenis` AS `t0__jenis`, t0.`master_pemeriksaan_id` AS `t0__master_pemeriksaan_id`, t0.`kode_loinc` AS `t0__kode_loinc`, t0.`nama` AS `t0__nama`, t0.`prioritas` AS `t0__prioritas`, t0.`catatan` AS `t0__catatan`, t0.`status` AS `t0__status`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t1.`id` AS `t1__id`, t1.`fasyankes_id` AS `t1__fasyankes_id`, t1.`order_id` AS `t1__order_id`, t1.`nilai` AS `t1__nilai`, t1.`satuan` AS `t1__satuan`, t1.`rujukan_teks` AS `t1__rujukan_teks`, t1.`interpretasi` AS `t1__interpretasi`, t1.`catatan` AS `t1__catatan`, t1.`dientri_oleh` AS `t1__dientri_oleh`, t1.`dientri_pada` AS `t1__dientri_pada`, t1.`validator_id` AS `t1__validator_id`, t1.`divalidasi_pada` AS `t1__divalidasi_pada`\nFROM (SELECT t0.* FROM `order_penunjang` t0 WHERE ((? OR t0.`id` <=> ?)) LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `hasil_penunjang` b1 WHERE TRUE) t1 ON t0.`id` = t1.`order_id`\nORDER BY t1.`id` ASC", [id === undefined, id ?? null], koneksi);
    const hasil = petakt0(baris);
    if (!hasil[0])
        throw new Error('Baris order_penunjang tidak ditemukan.');
    return hasil[0];
}
export async function cariOrderPenunjangUntukIsiHasil(id, fasyankes_id, koneksi = pool) {
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
        return [...grup.values()].map(baris => ({ id: baris[0].t1__id, fasyankes_id: baris[0].t1__fasyankes_id, order_id: baris[0].t1__order_id, nilai: baris[0].t1__nilai, satuan: baris[0].t1__satuan, rujukan_teks: baris[0].t1__rujukan_teks, interpretasi: baris[0].t1__interpretasi, catatan: baris[0].t1__catatan, dientri_oleh: baris[0].t1__dientri_oleh, dientri_pada: baris[0].t1__dientri_pada, validator_id: baris[0].t1__validator_id, divalidasi_pada: baris[0].t1__divalidasi_pada }));
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
        return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, kunjungan_id: baris[0].t0__kunjungan_id, pasien_id: baris[0].t0__pasien_id, jenis: baris[0].t0__jenis, master_pemeriksaan_id: baris[0].t0__master_pemeriksaan_id, kode_loinc: baris[0].t0__kode_loinc, nama: baris[0].t0__nama, prioritas: baris[0].t0__prioritas, catatan: baris[0].t0__catatan, status: baris[0].t0__status, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, hasil: petakt1(baris)[0] ?? null }));
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`kunjungan_id` AS `t0__kunjungan_id`, t0.`pasien_id` AS `t0__pasien_id`, t0.`jenis` AS `t0__jenis`, t0.`master_pemeriksaan_id` AS `t0__master_pemeriksaan_id`, t0.`kode_loinc` AS `t0__kode_loinc`, t0.`nama` AS `t0__nama`, t0.`prioritas` AS `t0__prioritas`, t0.`catatan` AS `t0__catatan`, t0.`status` AS `t0__status`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t1.`id` AS `t1__id`, t1.`fasyankes_id` AS `t1__fasyankes_id`, t1.`order_id` AS `t1__order_id`, t1.`nilai` AS `t1__nilai`, t1.`satuan` AS `t1__satuan`, t1.`rujukan_teks` AS `t1__rujukan_teks`, t1.`interpretasi` AS `t1__interpretasi`, t1.`catatan` AS `t1__catatan`, t1.`dientri_oleh` AS `t1__dientri_oleh`, t1.`dientri_pada` AS `t1__dientri_pada`, t1.`validator_id` AS `t1__validator_id`, t1.`divalidasi_pada` AS `t1__divalidasi_pada`\nFROM (SELECT t0.* FROM `order_penunjang` t0 WHERE ((? OR t0.`id` <=> ?)) AND ((? OR t0.`fasyankes_id` <=> ?)) LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `hasil_penunjang` b1 WHERE TRUE) t1 ON t0.`id` = t1.`order_id`\nORDER BY t1.`id` ASC", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    const hasil = petakt0(baris);
    return (hasil[0] ?? null);
}
export async function hitungOrderPenunjangUntukRekap(fasyankes_id, dibuat_pada, dibuat_pada2, status, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `order_penunjang` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`dibuat_pada` >= ?) AND (? OR t.`dibuat_pada` < ?)) AND ((? OR t.`status` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null, dibuat_pada === undefined, dibuat_pada ?? null, dibuat_pada2 === undefined, dibuat_pada2 ?? null, status === undefined, status ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function daftarOrderPenunjangUntukRekap(fasyankes_id, dibuat_pada, dibuat_pada2, status, batas, lewati, koneksi = pool) {
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
        return [...grup.values()].map(baris => ({ id: baris[0].t1__id, fasyankes_id: baris[0].t1__fasyankes_id, order_id: baris[0].t1__order_id, nilai: baris[0].t1__nilai, satuan: baris[0].t1__satuan, rujukan_teks: baris[0].t1__rujukan_teks, interpretasi: baris[0].t1__interpretasi, catatan: baris[0].t1__catatan, dientri_oleh: baris[0].t1__dientri_oleh, dientri_pada: baris[0].t1__dientri_pada, validator_id: baris[0].t1__validator_id, divalidasi_pada: baris[0].t1__divalidasi_pada }));
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
        return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, kunjungan_id: baris[0].t0__kunjungan_id, pasien_id: baris[0].t0__pasien_id, jenis: baris[0].t0__jenis, master_pemeriksaan_id: baris[0].t0__master_pemeriksaan_id, kode_loinc: baris[0].t0__kode_loinc, nama: baris[0].t0__nama, prioritas: baris[0].t0__prioritas, catatan: baris[0].t0__catatan, status: baris[0].t0__status, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, hasil: petakt1(baris)[0] ?? null }));
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`kunjungan_id` AS `t0__kunjungan_id`, t0.`pasien_id` AS `t0__pasien_id`, t0.`jenis` AS `t0__jenis`, t0.`master_pemeriksaan_id` AS `t0__master_pemeriksaan_id`, t0.`kode_loinc` AS `t0__kode_loinc`, t0.`nama` AS `t0__nama`, t0.`prioritas` AS `t0__prioritas`, t0.`catatan` AS `t0__catatan`, t0.`status` AS `t0__status`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t1.`id` AS `t1__id`, t1.`fasyankes_id` AS `t1__fasyankes_id`, t1.`order_id` AS `t1__order_id`, t1.`nilai` AS `t1__nilai`, t1.`satuan` AS `t1__satuan`, t1.`rujukan_teks` AS `t1__rujukan_teks`, t1.`interpretasi` AS `t1__interpretasi`, t1.`catatan` AS `t1__catatan`, t1.`dientri_oleh` AS `t1__dientri_oleh`, t1.`dientri_pada` AS `t1__dientri_pada`, t1.`validator_id` AS `t1__validator_id`, t1.`divalidasi_pada` AS `t1__divalidasi_pada`\nFROM (SELECT t0.* FROM `order_penunjang` t0 WHERE ((? OR t0.`fasyankes_id` <=> ?)) AND ((? OR t0.`dibuat_pada` >= ?) AND (? OR t0.`dibuat_pada` < ?)) AND ((? OR t0.`status` <=> ?)) ORDER BY t0.`id` DESC LIMIT ? OFFSET ?) t0\nLEFT JOIN (SELECT b1.* FROM `hasil_penunjang` b1 WHERE TRUE) t1 ON t0.`id` = t1.`order_id`\nORDER BY t0.`id` DESC, t1.`id` ASC", [fasyankes_id === undefined, fasyankes_id ?? null, dibuat_pada === undefined, dibuat_pada ?? null, dibuat_pada2 === undefined, dibuat_pada2 ?? null, status === undefined, status ?? null, batas ?? 2147483647, lewati ?? 0], koneksi);
    const hasil = petakt0(baris);
    return hasil;
}
export async function kelompokOrderPenunjangUntukRekap(fasyankes_id, dibuat_pada, dibuat_pada2, koneksi = pool) {
    const baris = await baca("SELECT t.`status`, COUNT(*) AS `_count__all` FROM `order_penunjang` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`dibuat_pada` >= ?) AND (? OR t.`dibuat_pada` < ?)) GROUP BY t.`status`", [fasyankes_id === undefined, fasyankes_id ?? null, dibuat_pada === undefined, dibuat_pada ?? null, dibuat_pada2 === undefined, dibuat_pada2 ?? null], koneksi);
    const hasil = baris.map(b => ({ status: b.status, _count: { _all: Number(b._count__all) } }));
    return hasil;
}
