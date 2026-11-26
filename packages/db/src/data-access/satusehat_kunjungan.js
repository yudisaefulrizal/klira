import { baca, tulis, pool } from '../koneksi.js';

/** Ambil seluruh data kunjungan, pasien, DPJP, lokasi, pemeriksaan, diagnosis, tindakan, dan ekstensi poli untuk SATUSEHAT. */
export async function ambilKunjunganUntukSatusehat(kunjungan_id, koneksi = pool) {
    const [kunj] = await baca(
        "SELECT k.`id`, k.`jenis`, k.`status`, k.`tahap_layanan`, k.`mulai`, k.`selesai`, k.`waktu_tutup`, k.`encounter_id`, k.`lokasi_id`, l.`nama` AS `lokasi_nama`, l.`ihs_location_id`, p.`id` AS `pasien_id`, p.`nama` AS `pasien_nama`, p.`nik` AS `pasien_nik`, p.`ihs_number` AS `pasien_ihs`, pk.`pengguna_id` AS `dokter_id`, u.`nama` AS `dokter_nama`, u.`nik` AS `dokter_nik`, pp.`ihs_practitioner_id` FROM `kunjungan` k JOIN `pasien` p ON p.`id` = k.`pasien_id` LEFT JOIN `lokasi` l ON l.`id` = k.`lokasi_id` LEFT JOIN `peserta_kunjungan` pk ON pk.`kunjungan_id` = k.`id` AND pk.`tipe` = 'ATND' LEFT JOIN `pengguna` u ON u.`id` = pk.`pengguna_id` LEFT JOIN `profil_profesi` pp ON pp.`pengguna_id` = pk.`pengguna_id` WHERE k.`id` = ? ORDER BY pk.`id` ASC LIMIT 1",
        [kunjungan_id],
        koneksi,
    );
    if (!kunj)
        return null;

    const [pemeriksaan] = await baca(
        'SELECT `suhu`, `tensi_sistol`, `tensi_diastol`, `nadi`, `respirasi`, `alergi`, `keluhan_utama`, `subjek`, `objek`, `asesmen`, `plan`, `dibuat_pada` FROM `pemeriksaan` WHERE `kunjungan_id` = ? ORDER BY `versi` DESC, `id` DESC LIMIT 1',
        [kunjungan_id],
        koneksi,
    );
    const diagnosis = await baca(
        "SELECT `kode_icd10`, `nama`, `peran`, `urutan` FROM `diagnosis` WHERE `kunjungan_id` = ? AND `versi` = (SELECT COALESCE(MAX(`versi`), 0) FROM `diagnosis` WHERE `kunjungan_id` = ?) ORDER BY FIELD(`peran`, 'utama', 'penyerta'), `urutan` ASC",
        [kunjungan_id, kunjungan_id],
        koneksi,
    );
    const tindakan = await baca(
        'SELECT `kode_icd9cm`, `nama`, `jumlah` FROM `tindakan` WHERE `kunjungan_id` = ? AND `versi` = (SELECT COALESCE(MAX(`versi`), 0) FROM `tindakan` WHERE `kunjungan_id` = ?) ORDER BY `id` ASC',
        [kunjungan_id, kunjungan_id],
        koneksi,
    );
    const obat = await baca(
        "SELECT ir.`id`, r.`status` AS `status_resep`, r.`dibuat_pada` AS `waktu_resep`, r.`waktu_siap`, ir.`aturan_pakai`, ir.`jumlah`, mo.`kfa_kode`, mo.`kfa_nama`, mo.`nama_tampil`, mo.`satuan` FROM `item_resep` ir JOIN `resep` r ON r.`id` = ir.`resep_id` LEFT JOIN `master_obat` mo ON mo.`id` = ir.`master_obat_id` WHERE r.`kunjungan_id` = ? AND r.`status` <> 'dibatalkan' ORDER BY ir.`id` ASC",
        [kunjungan_id],
        koneksi,
    );
    const penunjang = await baca(
        "SELECT op.`id`, op.`jenis`, op.`kode_loinc`, op.`nama`, op.`status`, op.`dibuat_pada`, hp.`nilai`, hp.`satuan`, hp.`interpretasi`, hp.`divalidasi_pada` FROM `order_penunjang` op LEFT JOIN `hasil_penunjang` hp ON hp.`order_id` = op.`id` WHERE op.`kunjungan_id` = ? AND op.`status` <> 'dibatalkan' ORDER BY op.`id` ASC",
        [kunjungan_id],
        koneksi,
    );
    const [odontogram] = await baca('SELECT `gigi`, `intraoral` FROM `odontogram_pasien` WHERE `pasien_id` = ? LIMIT 1', [kunj.pasien_id], koneksi);
    const [ugd] = await baca('SELECT `triase`, `waktu_triase`, `data` FROM `ugd_kunjungan` WHERE `kunjungan_id` = ? LIMIT 1', [kunjungan_id], koneksi);
    const [kia] = await baca('SELECT `layanan`, `data` FROM `kia_kunjungan` WHERE `kunjungan_id` = ? LIMIT 1', [kunjungan_id], koneksi);

    const parseJson = (v) => (typeof v === 'string' ? JSON.parse(v) : v);
    const ugdData = ugd ? parseJson(ugd.data) : null;
    const kiaData = kia ? parseJson(kia.data) : null;
    return {
        ...kunj,
        pemeriksaan: pemeriksaan ?? null,
        diagnosis,
        tindakan,
        obat,
        penunjang,
        odontogram: odontogram ? { gigi: parseJson(odontogram.gigi), intraoral: parseJson(odontogram.intraoral) } : null,
        ugd: ugd ? { triase: ugd.triase, waktu_triase: ugd.waktu_triase, ...(ugdData ?? {}) } : null,
        kia: kia ? { [kia.layanan]: kiaData } : null,
    };
}

export async function catatEncounterSatusehat(kunjungan_id, encounter_id, koneksi = pool) {
    const hasil = await tulis('UPDATE `kunjungan` SET `encounter_id` = ? WHERE `id` = ?', [encounter_id, kunjungan_id], koneksi);
    return { count: hasil.affectedRows };
}

export async function catatIhsPractitioner(pengguna_id, ihs_practitioner_id, koneksi = pool) {
    const hasil = await tulis('UPDATE `profil_profesi` SET `ihs_practitioner_id` = ? WHERE `pengguna_id` = ?', [ihs_practitioner_id, pengguna_id], koneksi);
    return { count: hasil.affectedRows };
}

export async function catatIhsLocation(lokasi_id, ihs_location_id, koneksi = pool) {
    const hasil = await tulis('UPDATE `lokasi` SET `ihs_location_id` = ? WHERE `id` = ?', [ihs_location_id, lokasi_id], koneksi);
    return { count: hasil.affectedRows };
}

/** Daftar kunjungan untuk pemantauan sinkronisasi PCare & SATUSEHAT beserta ringkasan jumlahnya. */
export async function daftarPemantauanIntegrasi({ mulai = null, selesai = null, cari = null, batas = 100 } = {}, koneksi = pool) {
    const kondisi = ["k.`tahap_layanan` = 'ditutup'"];
    const params = [];
    if (mulai) {
        kondisi.push('k.`mulai` >= ?');
        params.push(mulai);
    }
    if (selesai) {
        kondisi.push('k.`mulai` < ?');
        params.push(selesai);
    }
    const q = String(cari ?? '').trim();
    if (q) {
        const pola = `%${q.replace(/[!%_]/g, (c) => `!${c}`)}%`;
        kondisi.push("(p.`nama` LIKE ? ESCAPE '!' OR p.`nomor_rm` LIKE ? ESCAPE '!' OR k.`id_layanan` LIKE ? ESCAPE '!' OR k.`pcare_no_kunjungan` LIKE ? ESCAPE '!' OR k.`encounter_id` LIKE ? ESCAPE '!')");
        params.push(pola, pola, pola, pola, pola);
    }
    params.push(Number(batas) || 100);
    const baris = await baca(
        `SELECT k.\`id\`, k.\`id_layanan\`, k.\`jenis\`, k.\`cara_pembayaran\`, k.\`mulai\`, k.\`waktu_tutup\`, k.\`pcare_no_kunjungan\`, k.\`pcare_status\`, k.\`pcare_pesan\`, k.\`pcare_dikirim_pada\`, k.\`pcare_item_terkirim\`, k.\`encounter_id\`, a.\`pcare_no_urut\`, p.\`id\` AS \`pasien_id\`, p.\`nama\` AS \`pasien_nama\`, p.\`nomor_rm\` AS \`pasien_nomor_rm\`, p.\`nik\` AS \`pasien_nik\`, p.\`jkn_nomor_kartu\`, p.\`ihs_number\` AS \`pasien_ihs\`, COALESCE(l.\`nama\`, '') AS \`poli_nama\`, l.\`ihs_location_id\`, u.\`nama\` AS \`dpjp_nama\`, pp.\`ihs_practitioner_id\`, (SELECT COUNT(*) FROM \`diagnosis\` d WHERE d.\`kunjungan_id\` = k.\`id\`) AS \`jml_diag\`, (SELECT COUNT(*) FROM \`tindakan\` t WHERE t.\`kunjungan_id\` = k.\`id\`) AS \`jml_tindakan\`, (SELECT COUNT(*) FROM \`item_resep\` ir JOIN \`resep\` r ON r.\`id\` = ir.\`resep_id\` WHERE r.\`kunjungan_id\` = k.\`id\` AND r.\`status\` <> 'dibatalkan') AS \`jml_resep\`, (SELECT COUNT(*) FROM \`order_penunjang\` op WHERE op.\`kunjungan_id\` = k.\`id\` AND op.\`status\` <> 'dibatalkan') AS \`jml_penunjang\` FROM \`kunjungan\` k JOIN \`pasien\` p ON p.\`id\` = k.\`pasien_id\` LEFT JOIN \`antrean\` a ON a.\`kunjungan_id\` = k.\`id\` LEFT JOIN \`lokasi\` l ON l.\`id\` = k.\`lokasi_id\` LEFT JOIN \`peserta_kunjungan\` pk ON pk.\`kunjungan_id\` = k.\`id\` AND pk.\`tipe\` = 'ATND' LEFT JOIN \`pengguna\` u ON u.\`id\` = pk.\`pengguna_id\` LEFT JOIN \`profil_profesi\` pp ON pp.\`pengguna_id\` = pk.\`pengguna_id\` WHERE ${kondisi.join(' AND ')} ORDER BY k.\`id\` DESC LIMIT ?`,
        params,
        koneksi,
    );
    const jknIds = baris.filter((b) => b.cara_pembayaran === 'jkn').map((b) => b.id);
    const petaTind = new Set();
    const petaObat = new Set();
    const hitTindBpjs = new Map();
    const hitObatBpjs = new Map();
    if (jknIds.length) {
        const pemetaan = await baca("SELECT `jenis`, `kunci` FROM `pemetaan_bpjs` WHERE `jenis` IN ('tindakan', 'obat')", [], koneksi);
        for (const m of pemetaan) {
            const k = String(m.kunci ?? '').trim().toLowerCase();
            if (!k) continue;
            if (m.jenis === 'tindakan') petaTind.add(k);
            else petaObat.add(k);
        }
        if (petaTind.size) {
            const rows = await baca('SELECT `kunjungan_id`, `tarif_layanan_id`, `kode_icd9cm`, `nama` FROM `tindakan` WHERE `kunjungan_id` IN (?)', [jknIds], koneksi);
            for (const t of rows) {
                const cocok = [t.tarif_layanan_id, t.kode_icd9cm, t.nama].some((v) => v != null && petaTind.has(String(v).trim().toLowerCase()));
                if (cocok) hitTindBpjs.set(t.kunjungan_id, (hitTindBpjs.get(t.kunjungan_id) ?? 0) + 1);
            }
        }
        if (petaObat.size) {
            const rows = await baca(
                "SELECT r.`kunjungan_id`, ir.`master_obat_id`, COALESCE(mo.`nama_tampil`, mo.`kfa_nama`, '') AS `nama_obat` FROM `item_resep` ir JOIN `resep` r ON r.`id` = ir.`resep_id` LEFT JOIN `master_obat` mo ON mo.`id` = ir.`master_obat_id` WHERE r.`kunjungan_id` IN (?) AND r.`status` <> 'dibatalkan'",
                [jknIds],
                koneksi,
            );
            for (const o of rows) {
                const cocok = [o.master_obat_id, o.nama_obat].some((v) => v != null && petaObat.has(String(v).trim().toLowerCase()));
                if (cocok) hitObatBpjs.set(o.kunjungan_id, (hitObatBpjs.get(o.kunjungan_id) ?? 0) + 1);
            }
        }
    }
    for (const b of baris) {
        if (typeof b.pcare_item_terkirim === 'string')
            b.pcare_item_terkirim = JSON.parse(b.pcare_item_terkirim);
        b.jml_tindakan_bpjs = hitTindBpjs.get(b.id) ?? 0;
        b.jml_resep_bpjs = hitObatBpjs.get(b.id) ?? 0;
    }
    return baris;
}
