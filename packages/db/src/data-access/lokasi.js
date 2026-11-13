import { baca, tulis, pool } from '../koneksi.js';
export async function daftarLokasiUntukBacaKlinikPublik(fasyankes_id, jenis, status_operasional, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`nama` FROM `lokasi` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`jenis` <=> ?)) AND ((? OR t.`status_operasional` <=> ?)) ORDER BY t.`nama` ASC", [fasyankes_id === undefined, fasyankes_id ?? null, jenis === undefined, jenis ?? null, status_operasional === undefined, status_operasional ?? null], koneksi);
    return baris;
}
export async function daftarLokasiUntukBuatRuteStatistik(fasyankes_id, jenis, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`nama` FROM `lokasi` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`jenis` <=> ?)) ORDER BY t.`nama` ASC", [fasyankes_id === undefined, fasyankes_id ?? null, jenis === undefined, jenis ?? null], koneksi);
    return baris;
}
export async function hitungLokasiUntukDaftar(fasyankes_id, jenis, status_operasional, nama, ihs_location_id, pakai, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `lokasi` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`jenis` <=> ?)) AND ((? OR t.`status_operasional` <=> ?)) AND ((? OR ((((? OR t.`nama` LIKE ? ESCAPE '!'))) OR (((? OR t.`ihs_location_id` LIKE ? ESCAPE '!'))) OR ((EXISTS (SELECT 1 FROM `lokasi` r1 WHERE t.`induk_id` = r1.`id` AND (((? OR r1.`nama` LIKE ? ESCAPE '!')))))))))", [fasyankes_id === undefined, fasyankes_id ?? null, jenis === undefined, jenis ?? null, status_operasional === undefined, status_operasional ?? null, !pakai, nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', ihs_location_id === undefined, '%' + String(ihs_location_id ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%'], koneksi);
    return Number(baris.jumlah);
}
export async function daftarLokasiUntukDaftar(fasyankes_id, jenis, status_operasional, nama, ihs_location_id, pakai, batas, lewati, koneksi = pool) {
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
        return [...grup.values()].map(baris => ({ nama: baris[0].t1__nama }));
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
        return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, nama: baris[0].t0__nama, jenis: baris[0].t0__jenis, induk_id: baris[0].t0__induk_id, status_operasional: baris[0].t0__status_operasional, ihs_location_id: baris[0].t0__ihs_location_id, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, induk: petakt1(baris)[0] ?? null }));
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`nama` AS `t0__nama`, t0.`jenis` AS `t0__jenis`, t0.`induk_id` AS `t0__induk_id`, t0.`status_operasional` AS `t0__status_operasional`, t0.`ihs_location_id` AS `t0__ihs_location_id`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t1.`id` AS `t1__id`, t1.`nama` AS `t1__nama`\nFROM (SELECT t0.* FROM `lokasi` t0 WHERE ((? OR t0.`fasyankes_id` <=> ?)) AND ((? OR t0.`jenis` <=> ?)) AND ((? OR t0.`status_operasional` <=> ?)) AND ((? OR ((((? OR t0.`nama` LIKE ? ESCAPE '!'))) OR (((? OR t0.`ihs_location_id` LIKE ? ESCAPE '!'))) OR ((EXISTS (SELECT 1 FROM `lokasi` r1 WHERE t0.`induk_id` = r1.`id` AND (((? OR r1.`nama` LIKE ? ESCAPE '!'))))))))) ORDER BY t0.`nama` ASC, t0.`id` ASC LIMIT ? OFFSET ?) t0\nLEFT JOIN (SELECT b1.* FROM `lokasi` b1 WHERE TRUE) t1 ON t0.`induk_id` = t1.`id`\nORDER BY t0.`nama` ASC, t0.`id` ASC, t1.`id` ASC", [fasyankes_id === undefined, fasyankes_id ?? null, jenis === undefined, jenis ?? null, status_operasional === undefined, status_operasional ?? null, !pakai, nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', ihs_location_id === undefined, '%' + String(ihs_location_id ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', batas ?? 2147483647, lewati ?? 0], koneksi);
    const hasil = petakt0(baris);
    return hasil;
}
export async function cariLokasiUntukAmbil(id, fasyankes_id, jenis, koneksi = pool) {
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
        return [...grup.values()].map(baris => ({ nama: baris[0].t1__nama }));
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
        return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, nama: baris[0].t0__nama, jenis: baris[0].t0__jenis, induk_id: baris[0].t0__induk_id, status_operasional: baris[0].t0__status_operasional, ihs_location_id: baris[0].t0__ihs_location_id, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, induk: petakt1(baris)[0] ?? null }));
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`nama` AS `t0__nama`, t0.`jenis` AS `t0__jenis`, t0.`induk_id` AS `t0__induk_id`, t0.`status_operasional` AS `t0__status_operasional`, t0.`ihs_location_id` AS `t0__ihs_location_id`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t1.`id` AS `t1__id`, t1.`nama` AS `t1__nama`\nFROM (SELECT t0.* FROM `lokasi` t0 WHERE ((? OR t0.`id` <=> ?)) AND ((? OR t0.`fasyankes_id` <=> ?)) AND ((? OR t0.`jenis` <=> ?)) LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `lokasi` b1 WHERE TRUE) t1 ON t0.`induk_id` = t1.`id`\nORDER BY t1.`id` ASC", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null, jenis === undefined, jenis ?? null], koneksi);
    const hasil = petakt0(baris);
    return (hasil[0] ?? null);
}
export async function tambahLokasiUntukBuat(fasyankes_id, nama, jenis, induk_id, status_operasional, ihs_location_id, dibuat_oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `lokasi` (`fasyankes_id`, `nama`, `jenis`, `induk_id`, `status_operasional`, `ihs_location_id`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (nama === undefined ? null : nama) ?? null, ((jenis === undefined ? null : jenis) ?? null), (induk_id === undefined ? null : induk_id) ?? null, ((status_operasional === undefined ? "O" : status_operasional) ?? null), (ihs_location_id === undefined ? null : ihs_location_id) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahLokasiUntukBuatHasil(id, koneksi = pool) {
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
        return [...grup.values()].map(baris => ({ nama: baris[0].t1__nama }));
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
        return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, nama: baris[0].t0__nama, jenis: baris[0].t0__jenis, induk_id: baris[0].t0__induk_id, status_operasional: baris[0].t0__status_operasional, ihs_location_id: baris[0].t0__ihs_location_id, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, induk: petakt1(baris)[0] ?? null }));
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`nama` AS `t0__nama`, t0.`jenis` AS `t0__jenis`, t0.`induk_id` AS `t0__induk_id`, t0.`status_operasional` AS `t0__status_operasional`, t0.`ihs_location_id` AS `t0__ihs_location_id`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t1.`id` AS `t1__id`, t1.`nama` AS `t1__nama`\nFROM (SELECT t0.* FROM `lokasi` t0 WHERE ((? OR t0.`id` <=> ?)) LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `lokasi` b1 WHERE TRUE) t1 ON t0.`induk_id` = t1.`id`\nORDER BY t1.`id` ASC", [id === undefined, id ?? null], koneksi);
    const hasil = petakt0(baris);
    if (!hasil[0])
        throw new Error('Baris lokasi tidak ditemukan.');
    return hasil[0];
}
export async function ubahLokasiUntukUbah(nama, induk_id, status_operasional, ihs_location_id, id, fasyankes_id, koneksi = pool) {
    const hasil = await tulis("UPDATE `lokasi` t SET `nama` = IF(?, t.`nama`, ?), `induk_id` = IF(?, t.`induk_id`, ?), `status_operasional` = IF(?, t.`status_operasional`, ?), `ihs_location_id` = IF(?, t.`ihs_location_id`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?))", [nama === undefined, nama ?? null, induk_id === undefined, induk_id ?? null, status_operasional === undefined, (status_operasional ?? null), ihs_location_id === undefined, ihs_location_id ?? null, id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function ubahLokasiUntukSetAktif(status_operasional, id, fasyankes_id, koneksi = pool) {
    const hasil = await tulis("UPDATE `lokasi` t SET `status_operasional` = IF(?, t.`status_operasional`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?))", [status_operasional === undefined, (status_operasional ?? null), id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function daftarLokasiUntukOpsi(fasyankes_id, jenis, status_operasional, nama, batas, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`nama` FROM `lokasi` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`jenis` <=> ?)) AND ((? OR t.`status_operasional` <=> ?)) AND ((? OR t.`nama` LIKE ? ESCAPE '!')) ORDER BY t.`nama` ASC LIMIT ? OFFSET ?", [fasyankes_id === undefined, fasyankes_id ?? null, jenis === undefined, jenis ?? null, status_operasional === undefined, status_operasional ?? null, nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', batas ?? 2147483647, 0], koneksi);
    return baris;
}
/** Jumlah lokasi sejenis dengan nama sama (tanpa beda huruf besar/kecil), di luar lokasi yang sedang diubah. */
export async function hitungLokasiUntukNamaAda(fasyankes_id, jenis, nama, kecuali_id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `lokasi` t WHERE t.`fasyankes_id` = ? AND t.`jenis` = ? AND LOWER(TRIM(t.`nama`)) = LOWER(TRIM(?)) AND (? OR t.`id` <> ?)", [fasyankes_id, jenis, nama, kecuali_id === undefined, kecuali_id ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function hitungLokasiUntukLokasiAda(id, fasyankes_id, jenis, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `lokasi` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`jenis` <=> ?))", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null, jenis === undefined, jenis ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function hitungLokasiUntukHitungKesiapan(fasyankes_id, jenis, status_operasional, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `lokasi` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`jenis` <=> ?)) AND ((? OR t.`status_operasional` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null, jenis === undefined, jenis ?? null, status_operasional === undefined, status_operasional ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function daftarLokasiUntukPetakan(id, fasyankes_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`nama` FROM `lokasi` t WHERE ((? OR t.`id` IN (?))) AND ((? OR t.`fasyankes_id` <=> ?))", [id === undefined, (id)?.length ? (id) : [null], fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return baris;
}
export async function hitungLokasiUntukPoliOperasional(id, fasyankes_id, jenis, status_operasional, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `lokasi` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`jenis` <=> ?)) AND ((? OR t.`status_operasional` <=> ?))", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null, jenis === undefined, jenis ?? null, status_operasional === undefined, status_operasional ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function daftarLokasiUntukOpsi2(fasyankes_id, jenis, status_operasional, batas, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`nama` FROM `lokasi` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`jenis` <=> ?)) AND ((? OR t.`status_operasional` <=> ?)) ORDER BY t.`nama` ASC LIMIT ? OFFSET ?", [fasyankes_id === undefined, fasyankes_id ?? null, jenis === undefined, jenis ?? null, status_operasional === undefined, status_operasional ?? null, batas ?? 2147483647, 0], koneksi);
    return baris;
}
export async function wajibLokasiUntukUbahAntrean(id, fasyankes_id, koneksi = pool) {
    const baris = await baca("SELECT t.`nama`, t.`status_operasional` FROM `lokasi` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) LIMIT 1", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris lokasi tidak ditemukan.');
    return baris[0];
}
export async function daftarLokasiUntukPetakanAntrean(fasyankes_id, id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`nama` FROM `lokasi` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`id` IN (?)))", [fasyankes_id === undefined, fasyankes_id ?? null, id === undefined, (id)?.length ? (id) : [null]], koneksi);
    return baris;
}
export async function cariLokasiUntukKonteks(id, fasyankes_id, koneksi = pool) {
    const baris = await baca("SELECT t.`nama` FROM `lokasi` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) LIMIT 1", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function daftarLokasiUntukLaporan(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`nama` FROM `lokasi` t WHERE ((? OR t.`id` IN (?)))", [id === undefined, (id)?.length ? (id) : [null]], koneksi);
    return baris;
}
export async function daftarLokasiUntukBedSemua(fasyankes_id, jenis, batas, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`nama`, t.`jenis`, t.`induk_id`, t.`status_operasional`, t.`ihs_location_id`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `lokasi` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`jenis` <=> ?)) ORDER BY t.`induk_id` ASC, t.`nama` ASC LIMIT ? OFFSET ?", [fasyankes_id === undefined, fasyankes_id ?? null, jenis === undefined, jenis ?? null, batas ?? 2147483647, 0], koneksi);
    return baris;
}
export async function cariLokasiUntukAsal(id, koneksi = pool) {
    const baris = await baca("SELECT t.`nama` FROM `lokasi` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function cariLokasiUntukPastikanBedBebas(id, fasyankes_id, jenis, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`nama`, t.`jenis`, t.`induk_id`, t.`status_operasional`, t.`ihs_location_id`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `lokasi` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`jenis` <=> ?)) LIMIT 1", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null, jenis === undefined, jenis ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function ubahLokasiUntukTempatkan(status_operasional, id, koneksi = pool) {
    const hasil = await tulis("UPDATE `lokasi` t SET `status_operasional` = IF(?, t.`status_operasional`, ?) WHERE ((? OR t.`id` <=> ?))", [status_operasional === undefined, (status_operasional ?? null), id === undefined, id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function daftarLokasiUntukDetail(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`nama`, t.`induk_id` FROM `lokasi` t WHERE ((? OR t.`id` IN (?)))", [id === undefined, (id)?.length ? (id) : [null]], koneksi);
    return baris;
}
export function kunciLokasiRawatInap(id, fasyankesId, koneksi) {
    return baca('SELECT id FROM lokasi WHERE id = ? AND fasyankes_id = ? FOR UPDATE', [id, fasyankesId], koneksi);
}

/** Poli beserta jenis dan awalan antrean (semua status operasional), untuk opsi pendaftaran dan master. */
export async function daftarPoliUntukJenis(fasyankes_id, koneksi = pool) {
    return baca("SELECT t.`id`, t.`nama`, t.`jenis_poli`, t.`awalan_antrean`, t.`status_operasional` FROM `lokasi` t WHERE t.`fasyankes_id` = ? AND t.`jenis` = 'poli' ORDER BY t.`nama` ASC", [fasyankes_id], koneksi);
}
/** Jenis poli dan awalan untuk sekumpulan lokasi (master). */
export async function daftarJenisPoliUntukLokasi(ids, fasyankes_id, koneksi = pool) {
    if (!ids.length)
        return [];
    return baca("SELECT t.`id`, t.`jenis_poli`, t.`awalan_antrean` FROM `lokasi` t WHERE t.`id` IN (?) AND t.`fasyankes_id` = ?", [ids, fasyankes_id], koneksi);
}
export async function ubahLokasiUntukJenisPoli(id, fasyankes_id, jenis_poli, awalan_antrean, koneksi = pool) {
    const hasil = await tulis("UPDATE `lokasi` t SET t.`jenis_poli` = ?, t.`awalan_antrean` = ? WHERE t.`id` = ? AND t.`fasyankes_id` = ? AND t.`jenis` = 'poli'", [jenis_poli, awalan_antrean, id, fasyankes_id], koneksi);
    return { count: hasil.affectedRows };
}
