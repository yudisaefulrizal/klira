import { baca, tulis, pool } from '../../koneksi.js';
export async function tambahPenggunaUntukBuatPengguna(fasyankes_id, nama, nik, username, kata_sandi_hash, wajib_ganti_kredensial, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `pengguna` (`fasyankes_id`, `nama`, `nik`, `username`, `kata_sandi_hash`, `wajib_ganti_kredensial`) VALUES (?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (nama === undefined ? null : nama) ?? null, (nik === undefined ? null : nik) ?? null, (username === undefined ? null : username) ?? null, (kata_sandi_hash === undefined ? null : kata_sandi_hash) ?? null, (wajib_ganti_kredensial === undefined ? true : wajib_ganti_kredensial) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahPenggunaUntukBuatPenggunaHasil(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`nama`, t.`nik`, t.`username`, t.`kata_sandi_hash`, t.`aktif`, t.`wajib_ganti_kredensial`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `pengguna` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris pengguna tidak ditemukan.');
    return baris[0];
}
export async function hapusPenggunaUntukAksesIzinIntegrasiTest(fasyankes_id, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `pengguna` t WHERE ((? OR t.`fasyankes_id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function tambahPenggunaUntukBuatPengguna2(fasyankes_id, nama, nik, username, kata_sandi_hash, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `pengguna` (`fasyankes_id`, `nama`, `nik`, `username`, `kata_sandi_hash`) VALUES (?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (nama === undefined ? null : nama) ?? null, (nik === undefined ? null : nik) ?? null, (username === undefined ? null : username) ?? null, (kata_sandi_hash === undefined ? null : kata_sandi_hash) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function hapusPenggunaUntukAksesRepositoriIntegrasiTest(id, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `pengguna` t WHERE ((? OR t.`id` IN (?)))", [id === undefined, (id)?.length ? (id) : [null]], koneksi);
    return { count: hasil.affectedRows };
}
export async function hapusPenggunaUntukFarmasiFarmasiIntegrasiTest(fasyankes_id, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `pengguna` t WHERE ((? OR t.`fasyankes_id` IN (?)))", [fasyankes_id === undefined, (fasyankes_id)?.length ? (fasyankes_id) : [null]], koneksi);
    return { count: hasil.affectedRows };
}
export async function hitungPenggunaUntukPenggunaPembuatanIntegrasiTest(username, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `pengguna` t WHERE ((? OR t.`username` <=> ?))", [username === undefined, username ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function wajibPenggunaUntukPenggunaPembuatanIntegrasiTest(id, koneksi = pool) {
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
        return [...grup.values()].map(baris => ({ id: baris[0].t1__id, fasyankes_id: baris[0].t1__fasyankes_id, pengguna_id: baris[0].t1__pengguna_id, profesi: baris[0].t1__profesi, nomor_sip: baris[0].t1__nomor_sip, masa_berlaku_sip: baris[0].t1__masa_berlaku_sip, ihs_practitioner_id: baris[0].t1__ihs_practitioner_id, aktif: baris[0].t1__aktif, dibuat_oleh: baris[0].t1__dibuat_oleh, dibuat_pada: baris[0].t1__dibuat_pada }));
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
        return [...grup.values()].map(baris => ({ id: baris[0].t2__id, fasyankes_id: baris[0].t2__fasyankes_id, pengguna_id: baris[0].t2__pengguna_id, jenis_akun_id: baris[0].t2__jenis_akun_id, mulai: baris[0].t2__mulai, selesai: baris[0].t2__selesai, ditetapkan_oleh: baris[0].t2__ditetapkan_oleh, dibuat_oleh: baris[0].t2__dibuat_oleh, dibuat_pada: baris[0].t2__dibuat_pada }));
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
        return [...grup.values()].map(baris => ({ id: baris[0].t3__id, fasyankes_id: baris[0].t3__fasyankes_id, pengguna_id: baris[0].t3__pengguna_id, izin_id: baris[0].t3__izin_id, tipe: baris[0].t3__tipe, alasan: baris[0].t3__alasan, mulai: baris[0].t3__mulai, selesai: baris[0].t3__selesai, ditetapkan_oleh: baris[0].t3__ditetapkan_oleh, dibuat_oleh: baris[0].t3__dibuat_oleh, dibuat_pada: baris[0].t3__dibuat_pada }));
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
        return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, nama: baris[0].t0__nama, nik: baris[0].t0__nik, username: baris[0].t0__username, kata_sandi_hash: baris[0].t0__kata_sandi_hash, aktif: baris[0].t0__aktif, wajib_ganti_kredensial: baris[0].t0__wajib_ganti_kredensial, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, profil_profesi: petakt1(baris), penugasan_jenis: petakt2(baris), izin_per_akun: petakt3(baris) }));
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`nama` AS `t0__nama`, t0.`nik` AS `t0__nik`, t0.`username` AS `t0__username`, t0.`kata_sandi_hash` AS `t0__kata_sandi_hash`, t0.`aktif` AS `t0__aktif`, t0.`wajib_ganti_kredensial` AS `t0__wajib_ganti_kredensial`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t1.`id` AS `t1__id`, t1.`fasyankes_id` AS `t1__fasyankes_id`, t1.`pengguna_id` AS `t1__pengguna_id`, t1.`profesi` AS `t1__profesi`, t1.`nomor_sip` AS `t1__nomor_sip`, t1.`masa_berlaku_sip` AS `t1__masa_berlaku_sip`, t1.`ihs_practitioner_id` AS `t1__ihs_practitioner_id`, t1.`aktif` AS `t1__aktif`, t1.`dibuat_oleh` AS `t1__dibuat_oleh`, t1.`dibuat_pada` AS `t1__dibuat_pada`, t2.`id` AS `t2__id`, t2.`fasyankes_id` AS `t2__fasyankes_id`, t2.`pengguna_id` AS `t2__pengguna_id`, t2.`jenis_akun_id` AS `t2__jenis_akun_id`, t2.`mulai` AS `t2__mulai`, t2.`selesai` AS `t2__selesai`, t2.`ditetapkan_oleh` AS `t2__ditetapkan_oleh`, t2.`dibuat_oleh` AS `t2__dibuat_oleh`, t2.`dibuat_pada` AS `t2__dibuat_pada`, t3.`id` AS `t3__id`, t3.`fasyankes_id` AS `t3__fasyankes_id`, t3.`pengguna_id` AS `t3__pengguna_id`, t3.`izin_id` AS `t3__izin_id`, t3.`tipe` AS `t3__tipe`, t3.`alasan` AS `t3__alasan`, t3.`mulai` AS `t3__mulai`, t3.`selesai` AS `t3__selesai`, t3.`ditetapkan_oleh` AS `t3__ditetapkan_oleh`, t3.`dibuat_oleh` AS `t3__dibuat_oleh`, t3.`dibuat_pada` AS `t3__dibuat_pada`\nFROM (SELECT t0.* FROM `pengguna` t0 WHERE ((? OR t0.`id` <=> ?)) LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `profil_profesi` b1 WHERE TRUE) t1 ON t0.`id` = t1.`pengguna_id`\nLEFT JOIN (SELECT b2.* FROM `penugasan_jenis` b2 WHERE TRUE) t2 ON t0.`id` = t2.`pengguna_id`\nLEFT JOIN (SELECT b3.* FROM `izin_per_akun` b3 WHERE TRUE) t3 ON t0.`id` = t3.`pengguna_id`\nORDER BY t1.`id` ASC, t2.`id` ASC, t3.`id` ASC", [id === undefined, id ?? null], koneksi);
    const hasil = petakt0(baris);
    if (!hasil[0])
        throw new Error('Baris pengguna tidak ditemukan.');
    return hasil[0];
}
export async function wajibPenggunaUntukPenggunaPembuatanIntegrasiTest2(username, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`nama`, t.`nik`, t.`username`, t.`kata_sandi_hash`, t.`aktif`, t.`wajib_ganti_kredensial`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `pengguna` t WHERE ((? OR t.`username` <=> ?)) LIMIT 1", [username === undefined, username ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris pengguna tidak ditemukan.');
    return baris[0];
}
export async function hitungPenggunaUntukPenggunaPenggunaIntegrasiTest(fasyankes_id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `pengguna` t WHERE ((? OR t.`fasyankes_id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function wajibPenggunaUntukSrcSkemaTest2(koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`nama`, t.`nik`, t.`username`, t.`kata_sandi_hash`, t.`aktif`, t.`wajib_ganti_kredensial`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `pengguna` t WHERE TRUE LIMIT 1", [], koneksi);
    if (!baris[0])
        throw new Error('Baris pengguna tidak ditemukan.');
    return baris[0];
}
