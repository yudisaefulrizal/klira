import { baca, tulis, pool } from '../koneksi.js';

const KOLOM_PEMERIKSAAN = [
    'id', 'fasyankes_id', 'kunjungan_id', 'jenis', 'bagian', 'versi',
    'suhu', 'tensi_sistol', 'tensi_diastol', 'nadi', 'respirasi',
    'tinggi', 'berat', 'lingkar_perut', 'spo2', 'gcs', 'kesadaran',
    'alergi', 'subjek', 'objek', 'asesmen', 'plan', 'instruksi', 'evaluasi',
    'keluhan_utama', 'penyerta', 'riwayat_sekarang', 'riwayat_pribadi', 'riwayat_keluarga', 'kajian_sosial',
    'telah_diobati', 'obat_dikonsumsi', 'kajian_keperawatan', 'diagnosa_keperawatan', 'rencana_asuhan',
    'nyeri_jenis', 'nyeri_skala', 'nyeri_lokasi', 'nyeri_durasi', 'nyeri_frekuensi', 'nyeri_hilang_bila',
    'gizi_bb_turun', 'gizi_asupan_kurang', 'dibuat_oleh', 'dibuat_pada',
];

const SELECT_PEMERIKSAAN = KOLOM_PEMERIKSAAN.map((k) => `t.\`${k}\``).join(', ');
const KOLOM_INSERT = KOLOM_PEMERIKSAAN.filter((k) => k !== 'id' && k !== 'dibuat_pada');

const angka = (v) => (v === null || v === undefined ? null : Number(v));

function normalkanBaris(b) {
    if (!b) return null;
    return {
        ...b,
        suhu: angka(b.suhu),
        tensi_sistol: angka(b.tensi_sistol),
        tensi_diastol: angka(b.tensi_diastol),
        nadi: angka(b.nadi),
        respirasi: angka(b.respirasi),
        tinggi: angka(b.tinggi),
        berat: angka(b.berat),
        lingkar_perut: angka(b.lingkar_perut),
        spo2: angka(b.spo2),
        gcs: angka(b.gcs),
        nyeri_skala: angka(b.nyeri_skala),
        gizi_bb_turun: b.gizi_bb_turun === null ? null : Boolean(b.gizi_bb_turun),
        gizi_asupan_kurang: b.gizi_asupan_kurang === null ? null : Boolean(b.gizi_asupan_kurang),
    };
}

/** Cari satu baris pemeriksaan berdasarkan kunjungan, bagian, dan versi. */
export async function cariPemeriksaanBagian(fasyankes_id, kunjungan_id, versi, bagian, koneksi = pool) {
    const baris = await baca(
        `SELECT ${SELECT_PEMERIKSAAN} FROM \`pemeriksaan\` t WHERE ((? OR t.\`fasyankes_id\` <=> ?)) AND ((? OR t.\`kunjungan_id\` <=> ?)) AND ((? OR t.\`versi\` <=> ?)) AND ((? OR t.\`bagian\` <=> ?)) LIMIT 1`,
        [fasyankes_id === undefined, fasyankes_id ?? null, kunjungan_id === undefined, kunjungan_id ?? null, versi === undefined, versi ?? null, bagian === undefined, bagian ?? null],
        koneksi,
    );
    return normalkanBaris(baris[0] ?? null);
}

/** Simpan baris baru ke tabel pemeriksaan (ralan per bagian atau cppt). */
export async function tambahPemeriksaan(data, koneksi = pool) {
    const nilai = KOLOM_INSERT.map((k) => (data[k] === undefined ? null : data[k]));
    const daftarKolom = KOLOM_INSERT.map((k) => `\`${k}\``).join(', ');
    const placeholder = KOLOM_INSERT.map(() => '?').join(', ');
    const hasil = await tulis(`INSERT INTO \`pemeriksaan\` (${daftarKolom}) VALUES (${placeholder})`, nilai, koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}

/** Daftar keluhan utama dari anamnesis untuk ringkasan riwayat kunjungan pasien. */
export async function daftarAnamnesisUntukRiwayatPasien(fasyankes_id, kunjungan_id, koneksi = pool) {
    return baca(
        "SELECT t.`kunjungan_id`, t.`keluhan_utama` FROM `pemeriksaan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND t.`bagian` = 'anamnesis' AND ((? OR t.`kunjungan_id` IN (?))) ORDER BY t.`versi` DESC",
        [fasyankes_id === undefined, fasyankes_id ?? null, kunjungan_id === undefined, kunjungan_id?.length ? kunjungan_id : [null]],
        koneksi,
    );
}

/** Ambil alergi keperawatan terbaru milik pasien untuk konteks klinis. */
export async function cariKeperawatanUntukKonteks(fasyankes_id, pasien_id, alergi, alergi2, koneksi = pool) {
    const baris = await baca(
        "SELECT t.`alergi` FROM `pemeriksaan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND t.`bagian` = 'keperawatan' AND (EXISTS (SELECT 1 FROM `kunjungan` r1 WHERE t.`kunjungan_id` = r1.`id` AND (((? OR r1.`pasien_id` <=> ?))))) AND ((? OR NOT (t.`alergi` <=> ?))) AND (NOT ((((? OR t.`alergi` <=> ?))))) ORDER BY t.`id` DESC LIMIT 1",
        [fasyankes_id === undefined, fasyankes_id ?? null, pasien_id === undefined, pasien_id ?? null, alergi === undefined, alergi ?? null, alergi2 === undefined, alergi2 ?? null],
        koneksi,
    );
    return baris[0] ?? null;
}

/** Ambil tanda vital terbaru milik pasien untuk konteks klinis. */
export async function cariTandaVitalUntukKonteks(fasyankes_id, pasien_id, koneksi = pool) {
    const baris = await baca(
        "SELECT t.`kunjungan_id`, t.`versi` FROM `pemeriksaan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND t.`bagian` = 'tanda_vital' AND (EXISTS (SELECT 1 FROM `kunjungan` r1 WHERE t.`kunjungan_id` = r1.`id` AND (((? OR r1.`pasien_id` <=> ?))))) ORDER BY t.`id` DESC LIMIT 1",
        [fasyankes_id === undefined, fasyankes_id ?? null, pasien_id === undefined, pasien_id ?? null],
        koneksi,
    );
    return baris[0] ?? null;
}

/** Daftar CPPT rawat inap terbaru untuk suatu kunjungan. */
export async function daftarCppt(fasyankes_id, kunjungan_id, batas, koneksi = pool) {
    const baris = await baca(
        `SELECT ${SELECT_PEMERIKSAAN} FROM \`pemeriksaan\` t WHERE ((? OR t.\`fasyankes_id\` <=> ?)) AND ((? OR t.\`kunjungan_id\` <=> ?)) AND t.\`jenis\` = 'cppt' ORDER BY t.\`id\` DESC LIMIT ? OFFSET ?`,
        [fasyankes_id === undefined, fasyankes_id ?? null, kunjungan_id === undefined, kunjungan_id ?? null, batas ?? 2147483647, 0],
        koneksi,
    );
    return baris.map(normalkanBaris);
}

/** Cari satu baris CPPT berdasarkan id dan fasyankes. */
export async function cariCppt(id, fasyankes_id, koneksi = pool) {
    const baris = await baca(
        `SELECT ${SELECT_PEMERIKSAAN} FROM \`pemeriksaan\` t WHERE ((? OR t.\`id\` <=> ?)) AND ((? OR t.\`fasyankes_id\` <=> ?)) AND t.\`jenis\` = 'cppt' LIMIT 1`,
        [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null],
        koneksi,
    );
    return normalkanBaris(baris[0] ?? null);
}
