import { z } from 'zod';
import { POLA_ICD9CM } from '../klinis.js';
import { MASTER } from '../teks.js';
import { profilProfesiMasukan, statusOperasional } from './entitas.js';
import { idPositif, tanggal, teksOpsional, teksWajib } from './umum.js';
/** Jenis master pada tab Master data (3.1); Wilayah hanya baca. SIP tenaga ada di Praktisi. */
export const JENIS_MASTER_UBAH = ['poli', 'ruang', 'bed', 'praktisi', 'jadwal', 'tarif'];
export const JENIS_MASTER = [...JENIS_MASTER_UBAH, 'wilayah'];
export const jenisMasterUbah = z.enum(JENIS_MASTER_UBAH, { error: MASTER.galat.jenisTakDikenal });
export const jenisMaster = z.enum(JENIS_MASTER, { error: MASTER.galat.jenisTakDikenal });
export const jenisTarif = z.enum(['konsultasi', 'tindakan', 'lab', 'kamar', 'obat']);
export const tingkatWilayah = z.enum(['provinsi', 'kabupaten_kota', 'kecamatan', 'kelurahan_desa']);
const jam = z.string().trim().regex(/^([01]\d|2[0-3]):[0-5]\d$/, MASTER.galat.waktu);
const harga = z.number({ error: MASTER.galat.angka }).int(MASTER.galat.angka).min(0, MASTER.galat.angka).max(2_000_000_000, MASTER.galat.angka);
export const poliMasukan = z.object({
    nama: teksWajib(200),
    ihs_location_id: teksOpsional(100),
    status_operasional: statusOperasional.default('O'),
});
export const ruangMasukan = poliMasukan.extend({ induk_id: idPositif.nullish() });
export const bedMasukan = poliMasukan.extend({
    induk_id: z.number({ error: MASTER.galat.indukBed }).int(MASTER.galat.indukBed).positive(MASTER.galat.indukBed),
});
export const praktisiMasukan = profilProfesiMasukan.extend({ pengguna_id: idPositif });
export const praktisiUbah = praktisiMasukan.omit({ pengguna_id: true });
const jadwalDasar = z.object({
    pengguna_id: idPositif,
    lokasi_id: idPositif,
    hari: z.number({ error: MASTER.galat.wajib }).int().min(1, MASTER.galat.wajib).max(7, MASTER.galat.wajib),
    jam_mulai: jam,
    jam_selesai: jam,
    kuota: z.number({ error: MASTER.galat.kuota }).int(MASTER.galat.kuota).min(1, MASTER.galat.kuota).max(10000, MASTER.galat.kuota),
    berlaku_dari: tanggal,
    berlaku_sampai: tanggal.nullish(),
});
export const jadwalMasukan = jadwalDasar
    .refine((j) => j.jam_selesai > j.jam_mulai, { path: ['jam_selesai'], message: MASTER.galat.jamSelesai })
    .refine((j) => !j.berlaku_sampai || j.berlaku_sampai >= j.berlaku_dari, { path: ['berlaku_sampai'], message: MASTER.galat.berlakuSampai });
/** Awalan kode tarif tindakan yang dibuat otomatis bila kode dikosongkan (TND-001, TND-002, ... per fasyankes). */
export const AWALAN_KODE_TINDAKAN = 'TND-';
/** Kode tindakan berikutnya dari kode yang sudah ada: nomor terbesar berpola TND-nnn ditambah satu (minimal tiga digit). */
export function kodeTindakanBerikut(kodeAda) {
    const pola = new RegExp(`^${AWALAN_KODE_TINDAKAN}(\\d+)$`);
    const maks = kodeAda.reduce((m, k) => Math.max(m, Number(pola.exec(k)?.[1] ?? 0)), 0);
    return `${AWALAN_KODE_TINDAKAN}${String(maks + 1).padStart(3, '0')}`;
}
/**
 * Tarif layanan. Jenis tindakan: kode ICD-9-CM wajib (keberadaan di kamus diperiksa server), harga umum boleh kosong,
 * kode tarif boleh kosong (dibuat otomatis). Jenis lain: kode dan harga umum wajib, kode ICD-9-CM diabaikan.
 */
export const tarifMasukan = z
    .object({
    kode: teksOpsional(50),
    nama: teksWajib(200),
    jenis: jenisTarif,
    harga_umum: harga.nullish(),
    harga_jkn: harga.nullish(),
    kode_icd9cm: z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? null : v), z.string().trim().regex(POLA_ICD9CM, MASTER.galat.icd9Format).nullish()),
})
    .superRefine((d, ctx) => {
    if (d.jenis === 'tindakan') {
        if (!d.kode_icd9cm)
            ctx.addIssue({ code: 'custom', path: ['kode_icd9cm'], message: MASTER.galat.icd9Wajib });
        return;
    }
    if (!d.kode)
        ctx.addIssue({ code: 'custom', path: ['kode'], message: MASTER.galat.kodeWajib });
    if (d.harga_umum === null || d.harga_umum === undefined)
        ctx.addIssue({ code: 'custom', path: ['harga_umum'], message: MASTER.galat.hargaWajib });
})
    .transform((d) => ({
    kode: d.kode || null, nama: d.nama, jenis: d.jenis, harga_umum: d.harga_umum ?? null, harga_jkn: d.harga_jkn ?? null,
    kode_icd9cm: d.jenis === 'tindakan' ? (d.kode_icd9cm ?? null) : null,
}));
export const SKEMA_MASTER = {
    poli: poliMasukan, ruang: ruangMasukan, bed: bedMasukan, praktisi: praktisiMasukan, jadwal: jadwalMasukan, tarif: tarifMasukan,
};
/** Skema saat mengubah: praktisi tidak memuat pengguna (profil milik pengguna yang sama). */
export const SKEMA_MASTER_UBAH = { ...SKEMA_MASTER, praktisi: praktisiUbah };
export const ubahAktifMaster = z.object({ aktif: z.boolean() });
export const STATUS_FILTER_MASTER = ['semua', 'aktif', 'nonaktif'];
const kosongJadiTiada = (v) => (v === '' ? undefined : v);
export const filterMaster = z.object({
    cari: z.preprocess(kosongJadiTiada, z.string().trim().max(100).optional()),
    status: z.preprocess(kosongJadiTiada, z.enum(STATUS_FILTER_MASTER).default('semua')),
    tingkat: z.preprocess(kosongJadiTiada, tingkatWilayah.optional()),
    halaman: z.coerce.number().int().min(1).default(1),
    ukuran: z.coerce.number().int().min(1).max(100).default(20),
});
export const SUMBER_OPSI_MASTER = ['poli', 'ruang', 'praktisi', 'pengguna-tanpa-profil'];
export const sumberOpsiMaster = z.enum(SUMBER_OPSI_MASTER);
const opsiDari = (peta) => Object.entries(peta).map(([nilai, label]) => ({ nilai, label }));
const B = MASTER.bidang;
const K = MASTER.kolom;
const P = MASTER.petunjuk;
const SYARAT_TINDAKAN = { kunci: 'jenis', nilai: 'tindakan' };
const bidangLokasi = (induk) => [
    { kunci: 'nama', label: B.nama, tipe: 'teks', wajib: true, maks: 200 },
    ...induk,
    { kunci: 'status_operasional', label: B.status_operasional, tipe: 'pilihan', wajib: true, opsi: opsiDari(MASTER.operasional), nilaiAwal: 'O', petunjuk: P.status_operasional },
    { kunci: 'ihs_location_id', label: B.ihs_location_id, tipe: 'teks', maks: 100, petunjuk: P.ihs_location_id },
];
export const DEFINISI_MASTER = {
    poli: {
        bidang: bidangLokasi([]),
        kolom: [{ kunci: 'nama', label: K.nama }, { kunci: 'ihs_location_id', label: K.ihs }],
        punyaStatus: true,
    },
    ruang: {
        bidang: bidangLokasi([{ kunci: 'induk_id', label: B.induk_poli, tipe: 'rujukan', rujukan: 'poli' }]),
        kolom: [{ kunci: 'nama', label: K.nama }, { kunci: 'induk_nama', label: K.indukPoli }, { kunci: 'ihs_location_id', label: K.ihs }],
        punyaStatus: true,
    },
    bed: {
        bidang: bidangLokasi([{ kunci: 'induk_id', label: B.induk_ruang, tipe: 'rujukan', rujukan: 'ruang', wajib: true }]),
        kolom: [{ kunci: 'nama', label: K.nama }, { kunci: 'induk_nama', label: K.indukRuang }, { kunci: 'ihs_location_id', label: K.ihs }],
        punyaStatus: true,
    },
    praktisi: {
        bidang: [
            { kunci: 'pengguna_id', label: B.pengguna_id, tipe: 'rujukan', rujukan: 'pengguna-tanpa-profil', wajib: true, hanyaTambah: true },
            { kunci: 'profesi', label: B.profesi, tipe: 'teks', wajib: true, maks: 100 },
            { kunci: 'nomor_sip', label: B.nomor_sip, tipe: 'teks', maks: 100, petunjuk: P.nomor_sip },
            { kunci: 'masa_berlaku_sip', label: B.masa_berlaku_sip, tipe: 'tanggal' },
            { kunci: 'ihs_practitioner_id', label: B.ihs_practitioner_id, tipe: 'teks', maks: 100, petunjuk: P.ihs_practitioner_id },
        ],
        kolom: [{ kunci: 'pengguna_nama', label: K.praktisi }, { kunci: 'profesi', label: K.profesi }, { kunci: 'nomor_sip', label: K.sip }, { kunci: 'masa_berlaku_sip', label: K.berlaku }, { kunci: 'ihs_practitioner_id', label: K.ihs }],
        punyaStatus: true,
    },
    jadwal: {
        bidang: [
            { kunci: 'pengguna_id', label: B.praktisi_id, tipe: 'rujukan', rujukan: 'praktisi', wajib: true },
            { kunci: 'lokasi_id', label: B.lokasi_id, tipe: 'rujukan', rujukan: 'poli', wajib: true },
            { kunci: 'hari', label: B.hari, tipe: 'pilihan', wajib: true, opsi: opsiDari(MASTER.hari), nilaiAwal: '1', numerik: true },
            { kunci: 'jam_mulai', label: B.jam_mulai, tipe: 'waktu', wajib: true },
            { kunci: 'jam_selesai', label: B.jam_selesai, tipe: 'waktu', wajib: true },
            { kunci: 'kuota', label: B.kuota, tipe: 'angka', wajib: true },
            { kunci: 'berlaku_dari', label: B.berlaku_dari, tipe: 'tanggal', wajib: true },
            { kunci: 'berlaku_sampai', label: B.berlaku_sampai, tipe: 'tanggal' },
        ],
        kolom: [{ kunci: 'pengguna_nama', label: K.praktisi }, { kunci: 'lokasi_nama', label: K.poli }, { kunci: 'hari', label: K.hari }, { kunci: 'jam', label: K.jam }, { kunci: 'kuota', label: K.kuota }, { kunci: 'periode', label: K.periode }],
        punyaStatus: true,
    },
    tarif: {
        bidang: [
            { kunci: 'jenis', label: B.jenis, tipe: 'pilihan', wajib: true, opsi: opsiDari(MASTER.jenisTarif), nilaiAwal: 'konsultasi' },
            { kunci: 'kode', label: B.kode, tipe: 'teks', wajib: true, maks: 50, wajibKecuali: SYARAT_TINDAKAN, petunjukKecuali: P.kodeTarif },
            { kunci: 'nama', label: B.nama, tipe: 'teks', wajib: true, maks: 200 },
            { kunci: 'kode_icd9cm', label: B.kode_icd9cm, tipe: 'icd9cm', wajib: true, tampilBila: SYARAT_TINDAKAN, petunjuk: P.kode_icd9cm },
            { kunci: 'harga_umum', label: B.harga_umum, tipe: 'angka', wajib: true, petunjuk: P.perubahanHarga, wajibKecuali: SYARAT_TINDAKAN, petunjukKecuali: P.hargaTindakan },
            { kunci: 'harga_jkn', label: B.harga_jkn, tipe: 'angka', petunjuk: P.perubahanHarga },
        ],
        kolom: [{ kunci: 'kode', label: K.kode }, { kunci: 'nama', label: K.nama }, { kunci: 'jenis', label: K.jenis }, { kunci: 'kode_icd9cm', label: K.icd9cm }, { kunci: 'harga_umum', label: K.hargaUmum }, { kunci: 'harga_jkn', label: K.hargaJkn }],
        punyaStatus: true,
    },
    wilayah: {
        bidang: [],
        kolom: [{ kunci: 'kode', label: K.kode }, { kunci: 'nama', label: K.nama }, { kunci: 'tingkat', label: K.tingkat }, { kunci: 'induk_kode', label: K.indukKode }, { kunci: 'contoh', label: K.asal }],
        punyaStatus: false,
    },
};
const rupiah = (n) => (typeof n === 'number' ? `Rp ${n.toLocaleString('id-ID')}` : '-');
/** Teks sel tabel master (satu tempat agar web dan uji sama). */
export function teksSelMaster(kunci, baris) {
    const v = baris[kunci];
    switch (kunci) {
        case 'hari': return MASTER.hari[Number(v)] ?? '-';
        case 'jam': return `${baris.jam_mulai}-${baris.jam_selesai}`;
        case 'periode': return baris.berlaku_sampai ? `${baris.berlaku_dari} s/d ${baris.berlaku_sampai}` : `${baris.berlaku_dari} s/d -`;
        case 'jenis': return MASTER.jenisTarif[v] ?? String(v ?? '-');
        case 'tingkat': return MASTER.tingkat[v] ?? String(v ?? '-');
        case 'harga_umum':
        case 'harga_jkn': return rupiah(v);
        case 'contoh': return v ? MASTER.contoh : MASTER.resmi;
        default: return v === null || v === undefined || v === '' ? '-' : String(v);
    }
}
