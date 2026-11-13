import { z } from 'zod';
import { RAWAT_INAP } from '../umum/teks.js';
import { DISPOSISI_PULANG, INDIKATOR_KELAS, KELAS_RAWAT } from '../umum/status.js';
import { tandaVitalIsi } from './klinis.js';
import { NILAI_CARA_PEMBAYARAN } from './kunjungan.js';
import { idPositif, teksOpsional, teksWajib } from './umum.js';
const R = RAWAT_INAP.galat;
const teksNull = (maks) => z.string().trim().max(maks).nullish().transform((v) => v || null);
const kelas = z.enum(KELAS_RAWAT.nilai, { error: R.kelas });
const indikator = z.enum(INDIKATOR_KELAS.nilai, { error: R.indikator }).default('kelas_tetap');
const dpjpBersama = z.array(idPositif).max(10, R.dpjpBanyak).default([]);
/** DPJP utama tidak boleh ikut daftar DPJP bersama dan daftar tidak boleh ganda. */
const periksaDpjp = (d, ctx) => {
    if (d.dpjp_bersama.includes(d.dpjp_id) || new Set(d.dpjp_bersama).size !== d.dpjp_bersama.length)
        ctx.addIssue({ code: 'custom', path: ['dpjp_bersama'], message: R.dpjpGanda });
};
/** Admisi (3.3): pasien, ruang/bed (boleh menyusul: menunggu ruangan), kelas dan indikator, DPJP, SPRI. Dari rawat jalan: kunjungan berjalan ikut diteruskan. */
export const admisiMasukan = z
    .object({
    pasien_id: idPositif, bed_id: idPositif.nullish(), kelas, indikator, tarif_id: idPositif.nullish(), dpjp_id: idPositif, dpjp_bersama: dpjpBersama, spri: teksNull(100), keluhan_singkat: teksNull(500),
    cara_pembayaran: z.enum(NILAI_CARA_PEMBAYARAN).default('umum'),
})
    .superRefine(periksaDpjp);
/** Ubah penempatan: pindah bed/kelas (bed kosong = tetap di bed sekarang) dan/atau ganti DPJP; alasan wajib bila pindah. */
export const penempatanMasukan = z
    .object({ bed_id: idPositif.nullish(), kelas, indikator, tarif_id: idPositif.nullish(), dpjp_id: idPositif, dpjp_bersama: dpjpBersama, alasan: teksOpsional(300) })
    .superRefine(periksaDpjp);
/** Catatan harian (CPPT): SOAP, instruksi, tanda vital opsional; disahkan saat disimpan. */
export const catatanHarianMasukan = z.object({
    subjektif: teksWajib(2000), objektif: teksWajib(2000), asesmen: teksWajib(2000), rencana: teksWajib(2000), instruksi: teksNull(2000), tanda_vital: tandaVitalIsi.nullish(),
});
/** Pemulangan: ringkasan, diagnosis akhir, kondisi dan disposisi, tindak lanjut; resume medis dibuat dari isian ini bila diminta. */
export const pemulanganMasukan = z.object({
    disposisi: z.enum(DISPOSISI_PULANG.nilai, { error: R.disposisi }),
    kondisi_pulang: teksWajib(300), diagnosis_akhir: teksWajib(500), ringkasan: teksWajib(3000), tindak_lanjut: teksNull(1000), terapi: teksNull(1000), buat_resume: z.boolean().default(true),
});
