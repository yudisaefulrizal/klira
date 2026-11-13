import { z } from 'zod';
// Chat pribadi memakai alamat nomor telepon atau identitas LID WhatsApp.
export function jidWhatsappPribadi(jid) {
    return typeof jid === 'string' && /^\d+(?::\d+)?@(s\.whatsapp\.net|lid)$/.test(jid);
}
export function nomorWhatsapp(nomor) {
    let n = nomor.trim().replace(/[\s()+.-]/g, '');
    if (n.startsWith('0'))
        n = `62${n.slice(1)}`;
    return /^[1-9]\d{7,14}$/.test(n) ? n : null;
}
export const bukaPercakapanWa = z.object({
    nomor: z
        .string()
        .max(40)
        .transform(nomorWhatsapp)
        .refine((n) => n !== null, 'Nomor WhatsApp tidak valid'),
    pasien_id: z.number().int().positive().optional(),
});
export const kirimPesanWa = z
    .object({
    teks: z.string().trim().max(10000).default(''),
    media: z
        .object({
        base64: z.string().max(11200000),
        mime: z.enum([
            'image/jpeg',
            'image/png',
            'image/webp',
            'application/pdf',
            'audio/ogg',
            'audio/mpeg',
            'audio/mp4',
            'video/mp4',
        ]),
        nama: z.string().min(1).max(200),
    })
        .optional(),
})
    .refine((v) => v.teks || v.media, 'Isi pesan atau pilih lampiran');
export const ubahPercakapanWa = z.object({
    pasien_id: z.number().int().positive().optional(),
    penanggung_jawab: z.number().int().positive().nullable().optional(),
});
