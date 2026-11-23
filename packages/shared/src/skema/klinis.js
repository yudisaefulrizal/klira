import { z } from 'zod';
import { GALAT, KLINIS } from '../umum/teks.js';
import { BAGIAN_KLINIS, BAGIAN_NARASI, BAGIAN_TEMPLAT, KESADARAN, JENIS_FAVORIT, JENIS_NYERI, JENIS_TINDAK_LANJUT, MAKS_NARASI, SKALA_NYERI_MAKS, PERAN_DIAGNOSIS, POLA_ICD10, POLA_ICD9CM, SISTEM_TERMINOLOGI, TANDA_VITAL, } from '../klinis/klinis.js';
import { BIDANG_TEKS_PEMERIKSAAN } from '../klinis/default-klinis.js';
import { idPositif, tanggal, teksWajib } from './umum.js';
const kosongJadiNull = (v) => (v === undefined || v === null || (typeof v === 'string' && v.trim() === '') ? null : v);
/** Teks opsional yang dinormalkan: kosong menjadi null (isi kanonik untuk hash harus stabil). */
const teksNull = (maks) => z.preprocess(kosongJadiNull, z.string().trim().max(maks).nullable());
export const bagianKlinis = z.enum(BAGIAN_KLINIS);
// Anamnesa (P7: urutan dan isian mengikuti formulir klinik)
const anamnesisDasar = {
    penyerta: teksNull(1000),
    riwayat_sekarang: teksNull(1000),
    riwayat_pribadi: teksNull(1000),
    riwayat_keluarga: teksNull(1000),
    kajian_sosial: teksNull(1000),
};
export const anamnesisIsi = z.object({ keluhan_utama: teksWajib(1000), ...anamnesisDasar });
// Tanda vital: angka per kunci (kosong = tidak diukur), minimal satu nilai.
const angkaTandaVital = (t) => z.preprocess((v) => (typeof v === 'string' ? (v.trim() === '' ? null : Number(v.replace(',', '.'))) : kosongJadiNull(v)), z.number(KLINIS.galat.angka).min(t.min, KLINIS.galat.rentang(t.min, t.max)).max(t.max, KLINIS.galat.rentang(t.min, t.max)).nullable());
const bentukTandaVital = Object.fromEntries(TANDA_VITAL.map((t) => [t.kunci, angkaTandaVital(t)]));
export const tandaVitalIsi = z.object({ ...bentukTandaVital, kesadaran: z.preprocess(kosongJadiNull, z.enum(KESADARAN, KLINIS.galat.kesadaran).nullable()) }).refine((d) => Object.values(d).some((v) => v !== null), { message: KLINIS.galat.tandaVitalKosong });
// Skrining keperawatan (P6): teks opsional, nyeri bersyarat, gizi ya/tidak (hasil dihitung, tidak disimpan).
const yaTidak = z.preprocess((v) => (v === null || v === undefined || v === '' ? false : v), z.boolean());
const skalaNyeri = z.preprocess((v) => (typeof v === 'string' ? (v.trim() === '' ? null : Number(v)) : kosongJadiNull(v)), z.number(KLINIS.galat.angka).int(KLINIS.galat.skalaNyeri).min(0, KLINIS.galat.skalaNyeri).max(SKALA_NYERI_MAKS, KLINIS.galat.skalaNyeri).nullable());
export const keperawatanIsi = z
    .object({
    kajian_keperawatan: teksNull(1000),
    telah_diobati: teksNull(1000),
    alergi: teksNull(500),
    obat_dikonsumsi: teksNull(1000),
    diagnosa_keperawatan: teksNull(500),
    rencana_asuhan: teksNull(1000),
    nyeri_jenis: z.preprocess((v) => (v === null || v === undefined || v === '' ? 'tidak' : v), z.enum(JENIS_NYERI)),
    nyeri_skala: skalaNyeri,
    nyeri_lokasi: teksNull(200),
    nyeri_durasi: teksNull(200),
    nyeri_frekuensi: teksNull(200),
    nyeri_hilang_bila: teksNull(200),
    gizi_bb_turun: yaTidak,
    gizi_asupan_kurang: yaTidak,
})
    .superRefine((d, ctx) => {
    if (d.nyeri_jenis !== 'tidak' && d.nyeri_skala === null)
        ctx.addIssue({ code: 'custom', path: ['nyeri_skala'], message: KLINIS.galat.skalaNyeriWajib });
})
    // Tidak nyeri: isian nyeri lain disembunyikan di form dan disimpan null.
    .transform((d) => (d.nyeri_jenis === 'tidak' ? { ...d, nyeri_skala: null, nyeri_lokasi: null, nyeri_durasi: null, nyeri_frekuensi: null, nyeri_hilang_bila: null } : d));
// Pemeriksaan fisik terstruktur (P7): teks per bidang (maks 300) dan tanggal odontogram (YYYY-MM-DD), minimal satu terisi.
const POLA_TANGGAL = /^\d{4}-\d{2}-\d{2}$/;
/** Tanggal kalender YYYY-MM-DD yang sah (mis. 2026-02-30 ditolak). */
export const tanggalKalenderSah = (v) => {
    if (!POLA_TANGGAL.test(v))
        return false;
    const d = new Date(`${v}T00:00:00.000Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
};
const tanggalOdontogram = z.preprocess(kosongJadiNull, z.string().trim().refine(tanggalKalenderSah, KLINIS.galat.tanggalOdontogram).nullable());
const bentukPemeriksaan = {
    ...Object.fromEntries(BIDANG_TEKS_PEMERIKSAAN.map((b) => [b, teksNull(300)])),
    odontogram_tanggal: tanggalOdontogram,
};
export const pemeriksaanIsi = z.object(bentukPemeriksaan).refine((d) => Object.values(d).some((v) => v !== null), { message: KLINIS.galat.pemeriksaanKosong });
// Diagnosis ICD-10: tepat satu peran utama.
export const diagnosisItem = z.object({
    kode: z.string().trim().toUpperCase().regex(POLA_ICD10, KLINIS.galat.kodeIcd10),
    nama: teksWajib(500),
    peran: z.enum(PERAN_DIAGNOSIS),
    snomed: teksNull(30),
});
export const diagnosisIsi = z
    .object({ item: z.array(diagnosisItem).min(1, KLINIS.galat.diagnosisKosong).max(20) })
    .superRefine((d, ctx) => {
    if (d.item.filter((i) => i.peran === 'utama').length !== 1)
        ctx.addIssue({ code: 'custom', path: ['item'], message: KLINIS.galat.diagnosisUtama });
    const kode = d.item.map((i) => i.kode);
    if (new Set(kode).size !== kode.length)
        ctx.addIssue({ code: 'custom', path: ['item'], message: KLINIS.galat.kodeGanda });
});
// Tindakan ICD-9 CM; `tarif_layanan_id` = tindakan klinik (tarif jenis tindakan) yang dipilih, kosong bila dari kamus.
export const MAKS_JUMLAH_TINDAKAN = 100;
export const tindakanItem = z
    .object({
    kode: z.string().trim().regex(POLA_ICD9CM, KLINIS.galat.kodeIcd9),
    nama: teksWajib(500),
    /** Tanpa tarif dan jumlah 1 tidak ikut dalam isi (undefined) agar hash pengesahan catatan lama tetap sama. */
    tarif_layanan_id: z.preprocess((v) => (v === null ? undefined : v), idPositif.optional()),
    jumlah: z.preprocess((v) => (v === null || v === '' ? undefined : typeof v === 'string' ? Number(v) : v), z.number(KLINIS.galat.jumlahTindakan).int(KLINIS.galat.jumlahTindakan).min(1, KLINIS.galat.jumlahTindakan).max(MAKS_JUMLAH_TINDAKAN, KLINIS.galat.jumlahTindakan).optional()).transform((n) => (n === 1 ? undefined : n)).optional(),
    performer_id: idPositif.nullish(),
    mulai: tanggal.transform((d) => d.toISOString()),
    selesai: z.preprocess(kosongJadiNull, tanggal.transform((d) => d.toISOString()).nullable()),
})
    .refine((t) => !t.selesai || t.selesai >= t.mulai, { path: ['selesai'], message: KLINIS.galat.selesaiSebelumMulai });
/** Kunci keunikan tindakan dalam satu kunjungan: pasangan kode dan tindakan klinik (dua tarif berbeda berkode sama boleh). */
export const kunciTindakan = (t) => `${t.kode}|${t.tarif_layanan_id ?? ''}`;
/** Kode tindakan unik (urutan pertama dipertahankan) untuk pengkodean dan klaim: dua tindakan klinik berkode sama dikodekan sekali. */
export const unikPerKode = (daftar) => daftar.filter((x, i) => daftar.findIndex((y) => y.kode === x.kode) === i);
export const tindakanIsi = z.object({ item: z.array(tindakanItem).max(30) }).superRefine((d, ctx) => {
    const kunci = d.item.map(kunciTindakan);
    if (new Set(kunci).size !== kunci.length)
        ctx.addIssue({ code: 'custom', path: ['item'], message: KLINIS.galat.tindakanGanda });
});
// Rencana tindak lanjut: pilihan saja, belum menjalankan admisi.
export const tindakLanjutIsi = z
    .object({
    jenis: z.enum(JENIS_TINDAK_LANJUT),
    tujuan: teksNull(300),
    spri: teksNull(100),
    catatan: teksNull(1000),
})
    .superRefine((d, ctx) => {
    if (d.jenis === 'rujuk' && !d.tujuan)
        ctx.addIssue({ code: 'custom', path: ['tujuan'], message: KLINIS.galat.tujuanRujuk });
})
    .transform((d) => ({ ...d, tujuan: d.jenis === 'pulang' ? null : d.tujuan, spri: d.jenis === 'rawat_inap' ? d.spri : null }));
/** Narasi formulir (P7): diagnosa banding, KIE, obat yang diberikan di poli; panjang maksimal per bagian. */
const narasiIsi = (b) => z.object({ isi: teksNull(MAKS_NARASI[b]) });
export const SKEMA_NARASI = Object.fromEntries(BAGIAN_NARASI.map((b) => [b, narasiIsi(b)]));
/** Skema isi per bagian; `alasan` wajib saat memperbaiki bagian yang sudah disahkan. */
export const SKEMA_BAGIAN = {
    diagnosis_banding: SKEMA_NARASI.diagnosis_banding, kie: SKEMA_NARASI.kie, obat_poli: SKEMA_NARASI.obat_poli, evaluasi: SKEMA_NARASI.evaluasi, subjek: SKEMA_NARASI.subjek, objek: SKEMA_NARASI.objek, asesmen: SKEMA_NARASI.asesmen, plan: SKEMA_NARASI.plan, instruksi: SKEMA_NARASI.instruksi,
    anamnesis: anamnesisIsi, tanda_vital: tandaVitalIsi, keperawatan: keperawatanIsi, pemeriksaan: pemeriksaanIsi, diagnosis: diagnosisIsi, tindakan: tindakanIsi, tindak_lanjut: tindakLanjutIsi,
};
export const simpanBagianMasukan = z.object({ isi: z.unknown(), alasan: z.string().trim().max(500).optional() });
export const bagianParam = z.object({ id: z.coerce.number().int().positive(), bagian: bagianKlinis });
export const selesaiPemeriksaanMasukan = z.object({ tahap: z.enum(['resep', 'kasir']).default('kasir') });
// Draf alur klinis (4.2 Draf): isi sementara disimpan di server, bukan di peramban klinik bersama.
export const ALUR_DRAF_KLINIS = ['pemeriksaan-klinis', 'skrining', 'hasil-lab', 'persetujuan-tindakan'];
/** Masa berlaku draf klinis di server sejak pembaruan terakhir. */
export const KEDALUWARSA_DRAF_KLINIS_JAM = 12;
export const BATAS_ISI_DRAF_KLINIS = 80_000;
export const drafParam = z.object({ id: z.coerce.number().int().positive(), alur: z.enum(ALUR_DRAF_KLINIS) });
export const drafMasukan = z.object({
    langkah: z.number().int().min(0).max(20),
    isi: z.record(z.string(), z.unknown()).refine((v) => JSON.stringify(v).length <= BATAS_ISI_DRAF_KLINIS, { message: GALAT.tidakValid }),
});
// Terminologi
export const sistemTerminologi = z.enum(SISTEM_TERMINOLOGI);
export const cariTerminologiMasukan = z.object({
    sistem: sistemTerminologi,
    q: z.string().trim().min(1, KLINIS.galat.pencarianKosong).max(100),
    batas: z.coerce.number().int().min(1).max(50).default(10),
});
// Favorit dan templat
export const favoritMasukan = z.object({ jenis: z.enum(JENIS_FAVORIT), kode: teksWajib(50), nama: teksWajib(255) });
export const ubahFavoritMasukan = z.object({ urutan: z.number().int().min(0).max(10_000) });
export const filterFavorit = z.object({ jenis: z.enum(JENIS_FAVORIT).optional() });
const templatAnamnesis = z.object({ keluhan_utama: teksNull(1000), ...anamnesisDasar });
const templatPemeriksaan = z.object(bentukPemeriksaan);
export const templatMasukan = z.discriminatedUnion('bagian', [
    z.object({ bagian: z.literal('anamnesis'), nama: teksWajib(100), isi: templatAnamnesis }),
    z.object({ bagian: z.literal('pemeriksaan'), nama: teksWajib(100), isi: templatPemeriksaan }),
]);
export const filterTemplat = z.object({ bagian: z.enum(BAGIAN_TEMPLAT).optional() });
// Family folder
export const keluargaMasukan = z.object({ anggota_pasien_id: idPositif, hubungan: teksWajib(100) });
export const ubahKeluargaMasukan = z
    .object({ hubungan: teksWajib(100).optional(), dibatasi: z.boolean().optional() })
    .refine((d) => d.hubungan !== undefined || d.dibatasi !== undefined, { message: KLINIS.galat.tidakAdaPerubahan });
/** Penjelajahan kamus tanpa kata pencarian. */
export const kamusTerminologiMasukan = z.object({
    sistem: sistemTerminologi,
    halaman: z.coerce.number().int().min(1).max(100000).default(1),
    ukuran: z.coerce.number().int().min(1).max(50).default(30),
    awalan: z.string().regex(/^[A-Za-z0-9]$/).transform((v) => v.toUpperCase()).optional(),
});
/** Samarkan nomor identitas untuk cetak: 4 digit awal dan akhir terlihat. */
export const samarNomor = (v) => {
    const s = (v ?? '').trim();
    return !s ? null : s.length <= 8 ? s : `${s.slice(0, 4)}${'•'.repeat(s.length - 8)}${s.slice(-4)}`;
};
// Odontogram kumulatif pasien (FDI 2-digit + intraoral standar Kemenkes).
const itemOdontogram = z.object({
    kondisi: z.enum(['sou', 'car', 'amf', 'cof', 'rrx', 'mis', 'non', 'imx', 'poc', 'prd', 'goyang']),
    catatan: z.string().trim().max(100).optional().default(''),
});
const intraoralOdontogram = z.object({
    oklusi: z.enum(['', 'Normal', 'Crossbite', 'Openbite', 'Steep bite']).default(''),
    torus_palatinus: z.enum(['', 'Tidak ada', 'Kecil', 'Sedang', 'Besar', 'Multiple']).default(''),
    torus_mandibularis: z.enum(['', 'Tidak ada', 'Sisi kiri', 'Sisi kanan', 'Kedua sisi']).default(''),
    palatum: z.enum(['', 'Dalam', 'Sedang', 'Rendah']).default(''),
    diastema: z.enum(['', 'Tidak ada', 'Ada']).default(''),
    anomali: z.enum(['', 'Tidak ada', 'Ada']).default(''),
    gingiva: z.enum(['', 'Normal', 'Hiperemis', 'Berdarah', 'Resesi']).default(''),
    kalkulus: z.enum(['', 'Tidak ada', 'Sedikit', 'Sedang', 'Banyak']).default(''),
});
export const odontogramMasukan = z.object({
    kunjungan_id: idPositif.optional().nullable(),
    gigi: z.record(z.string().regex(/^(?:[1-4][1-8]|[5-8][1-5])$/), itemOdontogram).default({}),
    intraoral: intraoralOdontogram.default({}),
});
// KIA terstruktur per kunjungan (ANC, KB, Anak/Imunisasi).
const teksKia = (maks = 60) => z.string().trim().max(maks).optional().default('');
const tanggalKia = z.string().trim().refine((v) => v === '' || tanggalKalenderSah(v), KLINIS.galat.tanggalOdontogram).optional().default('');
export const kiaMasukan = z.object({
    layanan: z.enum(['anc', 'kb', 'anak']),
    data: z.object({
        g: teksKia(5), p: teksKia(5), a: teksKia(5), hpht: tanggalKia,
        tfu: teksKia(10), djj: teksKia(10), letak: teksKia(30), lila: teksKia(10), tt: teksKia(10),
        metode_kb: teksKia(40), status_kb: teksKia(30), kontrol_kb: tanggalKia,
        lk: teksKia(10), vaksin: teksKia(100), vaksin_kfa: teksKia(30), batch_vaksin: teksKia(50), dosis_vaksin: teksKia(80), jadwal_vaksin: tanggalKia,
    }).default({}),
});
// UGD terstruktur per kunjungan (Triase PMK 47/2018 & survei primer ABCDE).
export const ugdMasukan = z.object({
    triase: z.enum(['merah', 'kuning', 'hijau', 'hitam']),
    data: z.object({
        zona: teksKia(50),
        cara_datang: teksKia(40),
        jenis_kasus: teksKia(40),
        airway: teksKia(60),
        breathing: teksKia(60),
        circulation: teksKia(60),
        disability: teksKia(40),
        temuan_trauma: teksKia(250),
        catatan: teksKia(250),
    }).default({}),
});
