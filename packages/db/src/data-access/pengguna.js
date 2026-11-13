import { baca, tulis, pool } from '../koneksi.js';
export async function daftarPenggunaUntukNamaPengguna(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`nama` FROM `pengguna` t WHERE ((? OR t.`id` IN (?)))", [id === undefined, (id)?.length ? (id) : [null]], koneksi);
    return baris;
}
export async function hitungPenggunaUntukPenggunaAda(id, fasyankes_id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `pengguna` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?))", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function ambilPenggunaUntukAmbilSnapshot(id, koneksi = pool) {
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
        return [...grup.values()].map(baris => ({ profesi: baris[0].t1__profesi, nomor_sip: baris[0].t1__nomor_sip, masa_berlaku_sip: baris[0].t1__masa_berlaku_sip }));
    }
    function petakt5(semua) {
        const grup = new Map();
        for (const baris of semua) {
            if (baris.t5__id === null)
                continue;
            const kunci = String(baris.t5__id);
            const isi = grup.get(kunci);
            if (isi)
                isi.push(baris);
            else
                grup.set(kunci, [baris]);
        }
        return [...grup.values()].map(baris => ({ id: baris[0].t5__id, fasyankes_id: baris[0].t5__fasyankes_id, fitur: baris[0].t5__fitur, aksi: baris[0].t5__aksi, cakupan: baris[0].t5__cakupan, dibuat_oleh: baris[0].t5__dibuat_oleh, dibuat_pada: baris[0].t5__dibuat_pada }));
    }
    function petakt4(semua) {
        const grup = new Map();
        for (const baris of semua) {
            if (baris.t4__id === null)
                continue;
            const kunci = String(baris.t4__id);
            const isi = grup.get(kunci);
            if (isi)
                isi.push(baris);
            else
                grup.set(kunci, [baris]);
        }
        return [...grup.values()].map(baris => ({ id: baris[0].t4__id, fasyankes_id: baris[0].t4__fasyankes_id, jenis_akun_id: baris[0].t4__jenis_akun_id, izin_id: baris[0].t4__izin_id, dibuat_oleh: baris[0].t4__dibuat_oleh, dibuat_pada: baris[0].t4__dibuat_pada, izin: petakt5(baris)[0] }));
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
        return [...grup.values()].map(baris => ({ id: baris[0].t3__id, fasyankes_id: baris[0].t3__fasyankes_id, nama: baris[0].t3__nama, syarat_profesi: baris[0].t3__syarat_profesi, aktif: baris[0].t3__aktif, diubah_oleh: baris[0].t3__diubah_oleh, alasan_perubahan: baris[0].t3__alasan_perubahan, dibuat_oleh: baris[0].t3__dibuat_oleh, dibuat_pada: baris[0].t3__dibuat_pada, izin: petakt4(baris) }));
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
        return [...grup.values()].map(baris => ({ id: baris[0].t2__id, fasyankes_id: baris[0].t2__fasyankes_id, pengguna_id: baris[0].t2__pengguna_id, jenis_akun_id: baris[0].t2__jenis_akun_id, mulai: baris[0].t2__mulai, selesai: baris[0].t2__selesai, ditetapkan_oleh: baris[0].t2__ditetapkan_oleh, dibuat_oleh: baris[0].t2__dibuat_oleh, dibuat_pada: baris[0].t2__dibuat_pada, jenis_akun: petakt3(baris)[0] }));
    }
    function petakt7(semua) {
        const grup = new Map();
        for (const baris of semua) {
            if (baris.t7__id === null)
                continue;
            const kunci = String(baris.t7__id);
            const isi = grup.get(kunci);
            if (isi)
                isi.push(baris);
            else
                grup.set(kunci, [baris]);
        }
        return [...grup.values()].map(baris => ({ id: baris[0].t7__id, fasyankes_id: baris[0].t7__fasyankes_id, fitur: baris[0].t7__fitur, aksi: baris[0].t7__aksi, cakupan: baris[0].t7__cakupan, dibuat_oleh: baris[0].t7__dibuat_oleh, dibuat_pada: baris[0].t7__dibuat_pada }));
    }
    function petakt6(semua) {
        const grup = new Map();
        for (const baris of semua) {
            if (baris.t6__id === null)
                continue;
            const kunci = String(baris.t6__id);
            const isi = grup.get(kunci);
            if (isi)
                isi.push(baris);
            else
                grup.set(kunci, [baris]);
        }
        return [...grup.values()].map(baris => ({ id: baris[0].t6__id, fasyankes_id: baris[0].t6__fasyankes_id, pengguna_id: baris[0].t6__pengguna_id, izin_id: baris[0].t6__izin_id, tipe: baris[0].t6__tipe, alasan: baris[0].t6__alasan, mulai: baris[0].t6__mulai, selesai: baris[0].t6__selesai, ditetapkan_oleh: baris[0].t6__ditetapkan_oleh, dibuat_oleh: baris[0].t6__dibuat_oleh, dibuat_pada: baris[0].t6__dibuat_pada, izin: petakt7(baris)[0] }));
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
        return [...grup.values()].map(baris => ({ id: baris[0].t0__id, aktif: baris[0].t0__aktif, profil_profesi: petakt1(baris), penugasan_jenis: petakt2(baris), izin_per_akun: petakt6(baris) }));
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`aktif` AS `t0__aktif`, t1.`id` AS `t1__id`, t1.`profesi` AS `t1__profesi`, t1.`nomor_sip` AS `t1__nomor_sip`, t1.`masa_berlaku_sip` AS `t1__masa_berlaku_sip`, t2.`id` AS `t2__id`, t2.`fasyankes_id` AS `t2__fasyankes_id`, t2.`pengguna_id` AS `t2__pengguna_id`, t2.`jenis_akun_id` AS `t2__jenis_akun_id`, t2.`mulai` AS `t2__mulai`, t2.`selesai` AS `t2__selesai`, t2.`ditetapkan_oleh` AS `t2__ditetapkan_oleh`, t2.`dibuat_oleh` AS `t2__dibuat_oleh`, t2.`dibuat_pada` AS `t2__dibuat_pada`, t3.`id` AS `t3__id`, t3.`fasyankes_id` AS `t3__fasyankes_id`, t3.`nama` AS `t3__nama`, t3.`syarat_profesi` AS `t3__syarat_profesi`, t3.`aktif` AS `t3__aktif`, t3.`diubah_oleh` AS `t3__diubah_oleh`, t3.`alasan_perubahan` AS `t3__alasan_perubahan`, t3.`dibuat_oleh` AS `t3__dibuat_oleh`, t3.`dibuat_pada` AS `t3__dibuat_pada`, t4.`id` AS `t4__id`, t4.`fasyankes_id` AS `t4__fasyankes_id`, t4.`jenis_akun_id` AS `t4__jenis_akun_id`, t4.`izin_id` AS `t4__izin_id`, t4.`dibuat_oleh` AS `t4__dibuat_oleh`, t4.`dibuat_pada` AS `t4__dibuat_pada`, t5.`id` AS `t5__id`, t5.`fasyankes_id` AS `t5__fasyankes_id`, t5.`fitur` AS `t5__fitur`, t5.`aksi` AS `t5__aksi`, t5.`cakupan` AS `t5__cakupan`, t5.`dibuat_oleh` AS `t5__dibuat_oleh`, t5.`dibuat_pada` AS `t5__dibuat_pada`, t6.`id` AS `t6__id`, t6.`fasyankes_id` AS `t6__fasyankes_id`, t6.`pengguna_id` AS `t6__pengguna_id`, t6.`izin_id` AS `t6__izin_id`, t6.`tipe` AS `t6__tipe`, t6.`alasan` AS `t6__alasan`, t6.`mulai` AS `t6__mulai`, t6.`selesai` AS `t6__selesai`, t6.`ditetapkan_oleh` AS `t6__ditetapkan_oleh`, t6.`dibuat_oleh` AS `t6__dibuat_oleh`, t6.`dibuat_pada` AS `t6__dibuat_pada`, t7.`id` AS `t7__id`, t7.`fasyankes_id` AS `t7__fasyankes_id`, t7.`fitur` AS `t7__fitur`, t7.`aksi` AS `t7__aksi`, t7.`cakupan` AS `t7__cakupan`, t7.`dibuat_oleh` AS `t7__dibuat_oleh`, t7.`dibuat_pada` AS `t7__dibuat_pada`\nFROM (SELECT t0.* FROM `pengguna` t0 WHERE ((? OR t0.`id` <=> ?)) LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `profil_profesi` b1 WHERE TRUE) t1 ON t0.`id` = t1.`pengguna_id`\nLEFT JOIN (SELECT b2.* FROM `penugasan_jenis` b2 WHERE TRUE) t2 ON t0.`id` = t2.`pengguna_id`\nLEFT JOIN (SELECT b3.* FROM `jenis_akun` b3 WHERE TRUE) t3 ON t2.`jenis_akun_id` = t3.`id`\nLEFT JOIN (SELECT b4.* FROM `izin_jenis_akun` b4 WHERE TRUE) t4 ON t3.`id` = t4.`jenis_akun_id`\nLEFT JOIN (SELECT b5.* FROM `izin` b5 WHERE TRUE) t5 ON t4.`izin_id` = t5.`id`\nLEFT JOIN (SELECT b6.* FROM `izin_per_akun` b6 WHERE TRUE) t6 ON t0.`id` = t6.`pengguna_id`\nLEFT JOIN (SELECT b7.* FROM `izin` b7 WHERE TRUE) t7 ON t6.`izin_id` = t7.`id`\nORDER BY t1.`id` ASC, t2.`id` ASC, t3.`id` ASC, t4.`id` ASC, t5.`id` ASC, t6.`id` ASC, t7.`id` ASC", [id === undefined, id ?? null], koneksi);
    const hasil = petakt0(baris);
    return (hasil[0] ?? null);
}
export async function cariPenggunaUntukCariAkunByUsername(username, aktif, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`nama`, t.`username`, t.`kata_sandi_hash`, t.`aktif`, t.`wajib_ganti_kredensial` FROM `pengguna` t WHERE ((? OR t.`username` <=> ?)) AND ((? OR t.`aktif` <=> ?)) ORDER BY t.`id` ASC LIMIT 1", [username === undefined, username ?? null, aktif === undefined, aktif ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function cariPenggunaUntukUsernameDipakai(username, id, koneksi = pool) {
    const baris = await baca("SELECT t.`id` FROM `pengguna` t WHERE ((? OR t.`username` <=> ?)) AND ((? OR NOT (t.`id` <=> ?))) LIMIT 1", [username === undefined, username ?? null, id === undefined, id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function ubahPenggunaUntukGantiKredensial(username, kata_sandi_hash, wajib_ganti_kredensial, id, koneksi = pool) {
    const hasil = await tulis("UPDATE `pengguna` t SET `username` = IF(?, t.`username`, ?), `kata_sandi_hash` = IF(?, t.`kata_sandi_hash`, ?), `wajib_ganti_kredensial` = IF(?, t.`wajib_ganti_kredensial`, ?) WHERE ((? OR t.`id` <=> ?))", [username === undefined, username ?? null, kata_sandi_hash === undefined, kata_sandi_hash ?? null, wajib_ganti_kredensial === undefined, wajib_ganti_kredensial ?? null, id === undefined, id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function cariPenggunaUntukBuatRuteInstagram(id, fasyankes_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`nama` FROM `pengguna` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) LIMIT 1", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function cariPenggunaUntukBuatRuteInstagram2(id, fasyankes_id, aktif, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`nama`, t.`nik`, t.`username`, t.`kata_sandi_hash`, t.`aktif`, t.`wajib_ganti_kredensial`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `pengguna` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`aktif` <=> ?)) LIMIT 1", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null, aktif === undefined, aktif ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function daftarPenggunaUntukOpsi(fasyankes_id, aktif, nama, batas, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`nama` FROM `pengguna` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`aktif` <=> ?)) AND (EXISTS (SELECT 1 FROM `profil_profesi` r1 WHERE t.`id` = r1.`pengguna_id` AND (((? OR r1.`aktif` <=> ?))))) AND ((? OR t.`nama` LIKE ? ESCAPE '!')) ORDER BY t.`nama` ASC LIMIT ? OFFSET ?", [fasyankes_id === undefined, fasyankes_id ?? null, aktif === undefined, aktif ?? null, aktif === undefined, aktif ?? null, nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', batas ?? 2147483647, 0], koneksi);
    return baris;
}
export async function daftarPenggunaUntukOpsi2(fasyankes_id, aktif, nama, batas, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`nama` FROM `pengguna` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`aktif` <=> ?)) AND (NOT EXISTS (SELECT 1 FROM `profil_profesi` r1 WHERE t.`id` = r1.`pengguna_id` AND (TRUE))) AND ((? OR t.`nama` LIKE ? ESCAPE '!')) ORDER BY t.`nama` ASC LIMIT ? OFFSET ?", [fasyankes_id === undefined, fasyankes_id ?? null, aktif === undefined, aktif ?? null, nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', batas ?? 2147483647, 0], koneksi);
    return baris;
}
export async function daftarPenggunaUntukRiwayat(id, fasyankes_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`nama` FROM `pengguna` t WHERE ((? OR t.`id` IN (?))) AND ((? OR t.`fasyankes_id` <=> ?))", [id === undefined, (id)?.length ? (id) : [null], fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return baris;
}
export async function hitungPenggunaUntukDpjpSah(id, fasyankes_id, aktif, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `pengguna` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`aktif` <=> ?)) AND (EXISTS (SELECT 1 FROM `profil_profesi` r1 WHERE t.`id` = r1.`pengguna_id` AND (((? OR r1.`aktif` <=> ?)))))", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null, aktif === undefined, aktif ?? null, aktif === undefined, aktif ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function daftarPenggunaUntukOpsi3(fasyankes_id, aktif, batas, profil_profesi_batas, koneksi = pool) {
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
        return [...grup.values()].map(baris => ({ profesi: baris[0].t1__profesi }));
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
        return [...grup.values()].map(baris => ({ id: baris[0].t0__id, nama: baris[0].t0__nama, profil_profesi: petakt1(baris) }));
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`nama` AS `t0__nama`, t1.`id` AS `t1__id`, t1.`profesi` AS `t1__profesi`\nFROM (SELECT t0.* FROM `pengguna` t0 WHERE ((? OR t0.`fasyankes_id` <=> ?)) AND ((? OR t0.`aktif` <=> ?)) AND (EXISTS (SELECT 1 FROM `profil_profesi` r1 WHERE t0.`id` = r1.`pengguna_id` AND (((? OR r1.`aktif` <=> ?))))) ORDER BY t0.`nama` ASC LIMIT ? OFFSET ?) t0\nLEFT JOIN (SELECT b1.*, ROW_NUMBER() OVER (PARTITION BY b1.`pengguna_id` ORDER BY b1.`id` ASC) AS _urutan FROM `profil_profesi` b1 WHERE ((? OR b1.`aktif` <=> ?))) t1 ON t0.`id` = t1.`pengguna_id` AND t1._urutan <= ?\nORDER BY t0.`nama` ASC, t1.`id` ASC", [fasyankes_id === undefined, fasyankes_id ?? null, aktif === undefined, aktif ?? null, aktif === undefined, aktif ?? null, batas ?? 2147483647, 0, aktif === undefined, aktif ?? null, (profil_profesi_batas ?? 2147483647) + (0)], koneksi);
    const hasil = petakt0(baris);
    return hasil;
}
export async function ambilPenggunaUntukTerakhir(id, koneksi = pool) {
    const baris = await baca("SELECT t.`nama` FROM `pengguna` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function hitungPenggunaUntukPenggunaAda3(id, fasyankes_id, aktif, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `pengguna` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`aktif` <=> ?))", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null, aktif === undefined, aktif ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function cariPenggunaUntukKonteks(id, fasyankes_id, koneksi = pool) {
    const baris = await baca("SELECT t.`nama` FROM `pengguna` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) LIMIT 1", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function hitungPenggunaUntukDpjpSah2(id, fasyankes_id, aktif, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `pengguna` t WHERE ((? OR t.`id` IN (?))) AND ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`aktif` <=> ?)) AND (EXISTS (SELECT 1 FROM `profil_profesi` r1 WHERE t.`id` = r1.`pengguna_id` AND (((? OR r1.`aktif` <=> ?)))))", [id === undefined, (id)?.length ? (id) : [null], fasyankes_id === undefined, fasyankes_id ?? null, aktif === undefined, aktif ?? null, aktif === undefined, aktif ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function daftarPenggunaUntukSaksiOpsi(fasyankes_id, aktif, batas, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`nama` FROM `pengguna` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`aktif` <=> ?)) AND (EXISTS (SELECT 1 FROM `profil_profesi` r1 WHERE t.`id` = r1.`pengguna_id` AND (((? OR r1.`aktif` <=> ?))))) ORDER BY t.`nama` ASC, t.`id` ASC LIMIT ? OFFSET ?", [fasyankes_id === undefined, fasyankes_id ?? null, aktif === undefined, aktif ?? null, aktif === undefined, aktif ?? null, batas ?? 2147483647, 0], koneksi);
    return baris;
}
export async function cariPenggunaUntukSaksi(id, fasyankes_id, aktif, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`nama` FROM `pengguna` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`aktif` <=> ?)) AND (EXISTS (SELECT 1 FROM `profil_profesi` r1 WHERE t.`id` = r1.`pengguna_id` AND (((? OR r1.`aktif` <=> ?))))) LIMIT 1", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null, aktif === undefined, aktif ?? null, aktif === undefined, aktif ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function hitungPenggunaUntukDaftar(fasyankes_id, nama, pakai, aktif, pakai2, jenis_akun_id, aktif2, mulai, selesai, selesai2, pakai3, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `pengguna` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND (((? OR (((((? OR t.`nama` LIKE ? ESCAPE '!'))) OR (((? OR t.`username` LIKE ? ESCAPE '!'))))))) AND ((? OR (((? OR t.`aktif` <=> ?))))) AND ((? OR ((EXISTS (SELECT 1 FROM `penugasan_jenis` r1 WHERE t.`id` = r1.`pengguna_id` AND (((? OR r1.`jenis_akun_id` <=> ?)) AND (EXISTS (SELECT 1 FROM `jenis_akun` r2 WHERE r1.`jenis_akun_id` = r2.`id` AND (((? OR r2.`aktif` <=> ?))))) AND ((? OR r1.`mulai` <= ?)) AND ((((? OR r1.`selesai` <=> ?))) OR (((? OR r1.`selesai` > ?)))))))))))", [fasyankes_id === undefined, fasyankes_id ?? null, !pakai, nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', !pakai2, aktif === undefined, aktif ?? null, !pakai3, jenis_akun_id === undefined, jenis_akun_id ?? null, aktif2 === undefined, aktif2 ?? null, mulai === undefined, mulai ?? null, selesai === undefined, selesai ?? null, selesai2 === undefined, selesai2 ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function daftarPenggunaUntukDaftar(fasyankes_id, nama, pakai, aktif, pakai2, jenis_akun_id, aktif2, mulai, selesai, selesai2, pakai3, batas, lewati, tipe, diterima_untuk_akun, sumber, koneksi = pool) {
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
        return [...grup.values()].map(baris => ({ nama: baris[0].t2__nama }));
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
        return [...grup.values()].map(baris => ({ jenis_akun: petakt2(baris)[0] }));
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
        return [...grup.values()].map(baris => ({ id: baris[0].t3__id }));
    }
    function petakt4(semua) {
        const grup = new Map();
        for (const baris of semua) {
            if (baris.t4__id === null)
                continue;
            const kunci = String(baris.t4__id);
            const isi = grup.get(kunci);
            if (isi)
                isi.push(baris);
            else
                grup.set(kunci, [baris]);
        }
        return [...grup.values()].map(baris => ({ id: baris[0].t4__id }));
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
        return [...grup.values()].map(baris => ({ id: baris[0].t0__id, nama: baris[0].t0__nama, username: baris[0].t0__username, aktif: baris[0].t0__aktif, penugasan_jenis: petakt1(baris), izin_per_akun: petakt3(baris), peringatan_izin: petakt4(baris) }));
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`nama` AS `t0__nama`, t0.`username` AS `t0__username`, t0.`aktif` AS `t0__aktif`, t1.`id` AS `t1__id`, t2.`id` AS `t2__id`, t2.`nama` AS `t2__nama`, t3.`id` AS `t3__id`, t4.`id` AS `t4__id`\nFROM (SELECT t0.* FROM `pengguna` t0 WHERE ((? OR t0.`fasyankes_id` <=> ?)) AND (((? OR (((((? OR t0.`nama` LIKE ? ESCAPE '!'))) OR (((? OR t0.`username` LIKE ? ESCAPE '!'))))))) AND ((? OR (((? OR t0.`aktif` <=> ?))))) AND ((? OR ((EXISTS (SELECT 1 FROM `penugasan_jenis` r1 WHERE t0.`id` = r1.`pengguna_id` AND (((? OR r1.`jenis_akun_id` <=> ?)) AND (EXISTS (SELECT 1 FROM `jenis_akun` r2 WHERE r1.`jenis_akun_id` = r2.`id` AND (((? OR r2.`aktif` <=> ?))))) AND ((? OR r1.`mulai` <= ?)) AND ((((? OR r1.`selesai` <=> ?))) OR (((? OR r1.`selesai` > ?))))))))))) ORDER BY t0.`nama` ASC, t0.`id` ASC LIMIT ? OFFSET ?) t0\nLEFT JOIN (SELECT b1.* FROM `penugasan_jenis` b1 WHERE (EXISTS (SELECT 1 FROM `jenis_akun` r3 WHERE b1.`jenis_akun_id` = r3.`id` AND (((? OR r3.`aktif` <=> ?))))) AND ((? OR b1.`mulai` <= ?)) AND ((((? OR b1.`selesai` <=> ?))) OR (((? OR b1.`selesai` > ?))))) t1 ON t0.`id` = t1.`pengguna_id`\nLEFT JOIN (SELECT b2.* FROM `jenis_akun` b2 WHERE TRUE) t2 ON t1.`jenis_akun_id` = t2.`id`\nLEFT JOIN (SELECT b3.* FROM `izin_per_akun` b3 WHERE ((? OR b3.`tipe` <=> ?)) AND ((? OR b3.`mulai` <= ?)) AND ((((? OR b3.`selesai` <=> ?))) OR (((? OR b3.`selesai` > ?))))) t3 ON t0.`id` = t3.`pengguna_id`\nLEFT JOIN (SELECT b4.* FROM `peringatan_izin` b4 WHERE ((? OR b4.`diterima_untuk_akun` <=> ?)) AND ((? OR NOT (b4.`sumber` <=> ?)))) t4 ON t0.`id` = t4.`pengguna_id`\nORDER BY t0.`nama` ASC, t0.`id` ASC, t1.`id` ASC, t2.`id` ASC, t3.`id` ASC, t4.`id` ASC", [fasyankes_id === undefined, fasyankes_id ?? null, !pakai, nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', !pakai2, aktif === undefined, aktif ?? null, !pakai3, jenis_akun_id === undefined, jenis_akun_id ?? null, aktif2 === undefined, aktif2 ?? null, mulai === undefined, mulai ?? null, selesai === undefined, selesai ?? null, selesai2 === undefined, selesai2 ?? null, batas ?? 2147483647, lewati ?? 0, aktif2 === undefined, aktif2 ?? null, mulai === undefined, mulai ?? null, selesai === undefined, selesai ?? null, selesai2 === undefined, selesai2 ?? null, tipe === undefined, tipe ?? null, mulai === undefined, mulai ?? null, selesai === undefined, selesai ?? null, selesai2 === undefined, selesai2 ?? null, diterima_untuk_akun === undefined, diterima_untuk_akun ?? null, sumber === undefined, sumber ?? null], koneksi);
    const hasil = petakt0(baris);
    return hasil;
}
export async function cariPenggunaUntukUbahAktif(id, fasyankes_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`nama`, t.`aktif` FROM `pengguna` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) LIMIT 1", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function ubahPenggunaUntukUbahAktif(aktif, id, koneksi = pool) {
    const hasil = await tulis("UPDATE `pengguna` t SET `aktif` = IF(?, t.`aktif`, ?) WHERE ((? OR t.`id` <=> ?))", [aktif === undefined, aktif ?? null, id === undefined, id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function hitungPenggunaUntukCekDuplikat(username, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `pengguna` t WHERE ((? OR t.`username` <=> ?))", [username === undefined, username ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function hitungPenggunaUntukCekDuplikat2(fasyankes_id, nik, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `pengguna` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`nik` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null, nik === undefined, nik ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function tambahPenggunaUntukBuatAkun(fasyankes_id, nama, nik, username, kata_sandi_hash, aktif, dibuat_oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `pengguna` (`fasyankes_id`, `nama`, `nik`, `username`, `kata_sandi_hash`, `aktif`, `wajib_ganti_kredensial`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (nama === undefined ? null : nama) ?? null, (nik === undefined ? null : nik) ?? null, (username === undefined ? null : username) ?? null, (kata_sandi_hash === undefined ? null : kata_sandi_hash) ?? null, (aktif === undefined ? true : aktif) ?? null, (aktif === undefined ? true : aktif) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahPenggunaUntukBuatAkunHasil(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`nama`, t.`nik`, t.`username`, t.`kata_sandi_hash`, t.`aktif`, t.`wajib_ganti_kredensial`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `pengguna` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris pengguna tidak ditemukan.');
    return baris[0];
}
export async function hitungPenggunaUntukSeedPimpinanPertama(fasyankes_id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `pengguna` t WHERE ((? OR t.`fasyankes_id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function tambahPenggunaUntukSeedPimpinanPertama(fasyankes_id, nama, nik, username, kata_sandi_hash, wajib_ganti_kredensial, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `pengguna` (`fasyankes_id`, `nama`, `nik`, `username`, `kata_sandi_hash`, `wajib_ganti_kredensial`) VALUES (?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (nama === undefined ? null : nama) ?? null, (nik === undefined ? null : nik) ?? null, (username === undefined ? null : username) ?? null, (kata_sandi_hash === undefined ? null : kata_sandi_hash) ?? null, (wajib_ganti_kredensial === undefined ? true : wajib_ganti_kredensial) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function kunciPengguna(id, koneksi = pool) {
    return baca("SELECT id FROM pengguna WHERE id = ? FOR UPDATE", [id], koneksi);
}
export async function cariPenggunaDemo(fasyankesId, username, koneksi = pool) {
    const baris = await baca('SELECT id, nik, kata_sandi_hash FROM pengguna WHERE fasyankes_id = ? AND username = ?', [fasyankesId, username], koneksi);
    return baris[0] ?? null;
}
export async function tambahPenggunaDemo(fasyankesId, nama, nik, username, hash, koneksi = pool) {
    const hasil = await tulis('INSERT INTO pengguna (fasyankes_id, nama, nik, username, kata_sandi_hash, wajib_ganti_kredensial) VALUES (?, ?, ?, ?, ?, false)', [fasyankesId, nama, nik, username, hash], koneksi);
    return hasil.insertId;
}
