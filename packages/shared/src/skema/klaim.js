import { z } from 'zod';
import { KLAIM } from '../teks.js';
import { AKSI_KLAIM, BERKAS_KLAIM } from '../klaim.js';
import { idPositif } from './umum.js';
const G = KLAIM.galat;
const kosongJadiTiada = (v) => (v === '' || v === null ? undefined : v);
const teksNull = (maks) => z.string().trim().max(maks).nullish().transform((v) => v || null);
const tglIso = z.preprocess(kosongJadiTiada, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, G.tanggal).optional());
/** Siapkan klaim satu kunjungan JKN yang sudah ditutup: nomor SEP (boleh menyusul) dan berkas yang sudah lengkap. */
export const siapkanKlaimMasukan = z.object({
    kunjungan_id: idPositif,
    nomor_sep: teksNull(50),
    berkas: z.array(z.enum(BERKAS_KLAIM)).max(BERKAS_KLAIM.length).default([]),
    catatan: teksNull(300),
});
/** Ubah SEP dan berkas klaim yang belum final. */
export const ubahBerkasKlaimMasukan = siapkanKlaimMasukan.omit({ kunjungan_id: true });
/** Ubah status klaim: pengajuan, pengembalian berkas (berita acara), pengajuan ulang, penolakan (alasan), pembayaran (jumlah dan tanggal). */
export const ubahStatusKlaimMasukan = z
    .object({
    aksi: z.enum(AKSI_KLAIM, { error: G.aksi }),
    berita_acara: teksNull(2000),
    alasan: teksNull(500),
    jumlah_dibayar: z.preprocess((v) => (v === '' || v === null ? undefined : v), z.coerce.number({ error: G.jumlah }).int(G.jumlah).positive(G.jumlah).max(1_000_000_000, G.jumlah).optional()),
    dibayar_pada: tglIso,
})
    .superRefine((d, ctx) => {
    if (d.aksi === 'dikembalikan' && !d.berita_acara)
        ctx.addIssue({ code: 'custom', path: ['berita_acara'], message: G.beritaAcara });
    if (d.aksi === 'ditolak' && !d.alasan)
        ctx.addIssue({ code: 'custom', path: ['alasan'], message: G.alasan });
    if (d.aksi === 'dibayar') {
        if (d.jumlah_dibayar === undefined)
            ctx.addIssue({ code: 'custom', path: ['jumlah_dibayar'], message: G.jumlah });
        if (!d.dibayar_pada)
            ctx.addIssue({ code: 'custom', path: ['dibayar_pada'], message: G.tanggal });
    }
});
export const filterKlaim = z.object({
    status: z.preprocess(kosongJadiTiada, z.enum(['menunggu_sep', 'siap_diajukan', 'diajukan', 'dikembalikan', 'diajukan_ulang', 'ditolak', 'dibayar', 'lewat_batas_waktu']).optional()),
    cari: z.string().trim().optional(),
    halaman: z.coerce.number().int().min(1).default(1),
    ukuran: z.coerce.number().int().min(1).max(100).default(20),
});
