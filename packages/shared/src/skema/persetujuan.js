import { z } from 'zod';
import { PERSETUJUAN_TINDAKAN } from '../teks.js';
import { BENTUK_PERSETUJUAN, PENANDATANGAN_PERSETUJUAN } from './pasien.js';
import { POLA_ICD9CM } from '../klinis.js';
import { idPositif, teksWajib } from './umum.js';
const kosongJadiNull = (v) => (v === undefined || v === null || (typeof v === 'string' && v.trim() === '') ? null : v);
/**
 * Persetujuan tindakan (4.4, MODAL-BERTAHAP): tindakan, penjelasan yang diberikan, bentuk, penandatangan (pasien atau wali), saksi nakes.
 * Tindakan boleh berkode ICD-9 CM (dari tindakan kunjungan) atau teks bebas.
 */
export const persetujuanTindakanMasukan = z
    .object({
    tindakan_kode: z.preprocess(kosongJadiNull, z.string().trim().regex(POLA_ICD9CM, PERSETUJUAN_TINDAKAN.galat.kode).nullable()),
    tindakan_nama: teksWajib(255),
    penjelasan: teksWajib(4000),
    bentuk: z.enum(BENTUK_PERSETUJUAN),
    penandatangan: z.enum(PENANDATANGAN_PERSETUJUAN),
    wali_id: z.preprocess(kosongJadiNull, idPositif.nullable()),
    saksi_pengguna_id: idPositif,
    teks_persetujuan_id: idPositif,
})
    .superRefine((d, ctx) => {
    if (d.penandatangan === 'wali' && !d.wali_id)
        ctx.addIssue({ code: 'custom', path: ['wali_id'], message: PERSETUJUAN_TINDAKAN.galat.waliWajib });
})
    .transform((d) => ({ ...d, wali_id: d.penandatangan === 'wali' ? d.wali_id : null }));
