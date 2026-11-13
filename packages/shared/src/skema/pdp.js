import { z } from 'zod';
import { PDP } from '../umum/teks.js';
import { BUTIR_PERJANJIAN, DASAR_PEMROSESAN, DASAR_PEMUSNAHAN, HUBUNGAN_PEMOHON, JENIS_HAK, SALURAN_HAK } from '../administrasi/pdp.js';
import { idPositif, teksWajib } from './umum.js';
const G = PDP.galat;
const kosongJadiTiada = (v) => (v === '' || v === null ? undefined : v);
const teksNull = (maks) => z.string().trim().max(maks).nullish().transform((v) => v || null);
const tglIso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, G.tanggal);
/** Tanggal dan jam: bentuk datetime-local (TTTT-BB-HHTjj:mm, dibaca WIB) atau ISO lengkap. */
const waktuIso = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?$/, G.waktu);
const waktuOpsional = z.preprocess(kosongJadiTiada, waktuIso.optional());
const halamanUkuran = { halaman: z.coerce.number().int().min(1).default(1), ukuran: z.coerce.number().int().min(1).max(100).default(20) };
/** Waktu dari isian (datetime-local dibaca WIB) menjadi Date. */
export const waktuDariIsian = (s) => new Date(/(Z|[+-]\d{2}:\d{2})$/.test(s) ? s : `${s.length === 16 ? `${s}:00` : s}+07:00`);
// ---- Permintaan hak pasien ----
export const hakMasukan = z.object({
    pasien_id: idPositif, jenis: z.enum(JENIS_HAK, { error: G.jenisHak }), saluran: z.enum(SALURAN_HAK, { error: G.saluran }), pemohon_nama: teksWajib(200),
    pemohon_hubungan: z.enum(HUBUNGAN_PEMOHON, { error: G.hubungan }), verifikasi: teksWajib(300), rincian: teksNull(1000),
});
export const prosesHakMasukan = z.discriminatedUnion('tahap', [
    z.object({ tahap: z.literal('keputusan'), keputusan: z.enum(['setujui', 'tolak'], { error: G.keputusan }), alasan: teksNull(500) }).superRefine((d, ctx) => {
        if (d.keputusan === 'tolak' && !d.alasan)
            ctx.addIssue({ code: 'custom', path: ['alasan'], message: G.alasanTolak });
    }),
    z.object({ tahap: z.literal('pelaksanaan'), pelaksanaan: teksWajib(1000) }),
    z.object({ tahap: z.literal('notifikasi'), catatan: teksNull(300) }),
]);
export const filterHak = z.object({
    status: z.preprocess(kosongJadiTiada, z.enum(['diterima', 'disetujui', 'ditolak', 'dilaksanakan', 'selesai']).optional()), cari: z.string().trim().optional(), ...halamanUkuran,
});
// ---- Teks pemberitahuan dan penarikan persetujuan ----
export const pemberitahuanMasukan = z.object({ judul: teksWajib(200), tujuan: teksWajib(500), isi: teksWajib(20000) });
export const tarikMasukan = z.object({ persetujuan_id: idPositif, alasan: teksWajib(500) });
export const filterPersetujuanPdp = z.object({ cari: z.string().trim().optional(), status: z.preprocess(kosongJadiTiada, z.enum(['diberikan', 'ditarik']).optional()), ...halamanUkuran });
// ---- ROPA ----
export const ropaMasukan = z.object({
    nama_kegiatan: teksWajib(200), ppdp_nama: teksNull(200), sumber_tujuan: teksWajib(500), dasar: z.enum(DASAR_PEMROSESAN, { error: G.dasar }), tujuan: teksWajib(500), jenis_data: teksWajib(500), kategori_subjek: teksWajib(300),
    pihak_akses: teksWajib(500), pemenuhan_hak: teksWajib(500), aliran: teksWajib(500), masa_retensi: teksWajib(200), pengamanan: teksWajib(500), transfer: teksWajib(300),
});
// ---- DPIA ----
export const dpiaMasukan = z.object({
    pemrosesan: teksWajib(200), ropa_id: idPositif.nullish().transform((v) => v ?? null), risiko: teksWajib(4000), mitigasi: teksWajib(4000), saran_ppdp: teksNull(4000), tinjau_ulang_pada: tglIso, tandai_ditinjau: z.boolean().default(false),
});
// ---- Insiden ----
export const insidenMasukan = z
    .object({
    waktu_kejadian: waktuOpsional, waktu_diketahui: waktuIso, siber: z.boolean().default(false), uraian: teksWajib(4000), data_terungkap: teksWajib(1000), pasien_ids: z.array(idPositif).max(500, G.pasienBanyak).default([]),
    penanganan: teksNull(4000), pemulihan: teksNull(4000), kontak_ppdp: teksNull(200), notifikasi_pasien_pada: waktuOpsional, notifikasi_lembaga_pada: waktuOpsional,
})
    .superRefine((d, ctx) => {
    if (d.waktu_kejadian && waktuDariIsian(d.waktu_kejadian) > waktuDariIsian(d.waktu_diketahui))
        ctx.addIssue({ code: 'custom', path: ['waktu_kejadian'], message: G.kejadianSesudahDiketahui });
});
export const pemusnahanMasukan = z.object({
    cakupan: teksWajib(500), dasar: z.enum(DASAR_PEMUSNAHAN, { error: G.dasarMusnah }), permintaan_hak_id: idPositif.nullish().transform((v) => v ?? null), pasien_id: idPositif.nullish().transform((v) => v ?? null), jadwal: tglIso,
});
export const prosesPemusnahanMasukan = z.discriminatedUnion('tahap', [
    z.object({ tahap: z.literal('perintah'), prosesor_id: idPositif, nomor_perintah: teksWajib(100) }),
    z.object({ tahap: z.literal('pelaksanaan'), pelaksana: teksWajib(200), metode: teksWajib(300), mencakup_cadangan: z.boolean().default(false), pelaksanaan_pada: waktuOpsional }),
    z.object({ tahap: z.literal('berita_acara'), berita_acara: teksWajib(4000) }),
]);
// ---- Prosesor ----
const subProsesor = z.object({ nama: teksWajib(200), layanan: teksWajib(300), persetujuan_pada: tglIso });
export const prosesorMasukan = z.object({
    nama: teksWajib(200), layanan: teksWajib(300), lokasi_data: teksWajib(200), nomor_perjanjian: teksNull(100), butir_perjanjian: z.array(z.enum(BUTIR_PERJANJIAN)).max(BUTIR_PERJANJIAN.length).default([]),
    sub_prosesor: z.array(subProsesor).max(20, G.subBanyak).default([]), sla_lapor_jam: z.preprocess(kosongJadiTiada, z.coerce.number({ error: G.sla }).int(G.sla).min(1, G.sla).max(72, G.sla).optional()).transform((v) => v ?? null), aktif: z.boolean().default(true),
});
export const filterUmumPdp = z.object({ ...halamanUkuran });
