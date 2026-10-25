import { z } from 'zod';
import { KLAIM } from '../teks';
import { AKSI_KLAIM, BERKAS_KLAIM } from '../klaim';
import type { BerkasKlaim, KodeKlaim } from '../klaim';
import type { StatusKlaim } from '../status';
import { idPositif } from './umum';

const G = KLAIM.galat;
const kosongJadiTiada = (v: unknown) => (v === '' || v === null ? undefined : v);
const teksNull = (maks: number) => z.string().trim().max(maks).nullish().transform((v) => v || null);
const tglIso = z.preprocess(kosongJadiTiada, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, G.tanggal).optional());

/** Siapkan klaim satu kunjungan JKN yang sudah ditutup: nomor SEP (boleh menyusul) dan berkas yang sudah lengkap. */
export const siapkanKlaimMasukan = z.object({
  kunjungan_id: idPositif,
  nomor_sep: teksNull(50),
  berkas: z.array(z.enum(BERKAS_KLAIM)).max(BERKAS_KLAIM.length).default([]),
  catatan: teksNull(300),
});
export type SiapkanKlaimMasukan = z.output<typeof siapkanKlaimMasukan>;
export type SiapkanKlaimForm = z.input<typeof siapkanKlaimMasukan>;

/** Ubah SEP dan berkas klaim yang belum final. */
export const ubahBerkasKlaimMasukan = siapkanKlaimMasukan.omit({ kunjungan_id: true });
export type UbahBerkasKlaimMasukan = z.output<typeof ubahBerkasKlaimMasukan>;
export type UbahBerkasKlaimForm = z.input<typeof ubahBerkasKlaimMasukan>;

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
    if (d.aksi === 'dikembalikan' && !d.berita_acara) ctx.addIssue({ code: 'custom', path: ['berita_acara'], message: G.beritaAcara });
    if (d.aksi === 'ditolak' && !d.alasan) ctx.addIssue({ code: 'custom', path: ['alasan'], message: G.alasan });
    if (d.aksi === 'dibayar') {
      if (d.jumlah_dibayar === undefined) ctx.addIssue({ code: 'custom', path: ['jumlah_dibayar'], message: G.jumlah });
      if (!d.dibayar_pada) ctx.addIssue({ code: 'custom', path: ['dibayar_pada'], message: G.tanggal });
    }
  });
export type UbahStatusKlaimMasukan = z.output<typeof ubahStatusKlaimMasukan>;
export type UbahStatusKlaimForm = z.input<typeof ubahStatusKlaimMasukan>;

export const filterKlaim = z.object({
  status: z.preprocess(kosongJadiTiada, z.enum(['menunggu_sep', 'siap_diajukan', 'diajukan', 'dikembalikan', 'diajukan_ulang', 'ditolak', 'dibayar', 'lewat_batas_waktu']).optional()),
  cari: z.string().trim().optional(),
  halaman: z.coerce.number().int().min(1).default(1),
  ukuran: z.coerce.number().int().min(1).max(100).default(20),
});
export type FilterKlaim = z.infer<typeof filterKlaim>;

export type KandidatKlaimDto = { kunjungan_id: number; pasien_nama: string; pasien_nomor_rm: string; jenis: 'AMB' | 'IMP'; waktu_tutup: string; nomor_sep: string | null; resume_ada: boolean; kode_ada: boolean };
export type RiwayatKlaimDto = { dari: StatusKlaim | null; ke: StatusKlaim; alasan: string | null; oleh_nama: string | null; waktu: string };
export type KlaimDto = {
  id: number; kunjungan_id: number; pasien_nama: string; pasien_nomor_rm: string; jenis: 'AMB' | 'IMP'; nomor_sep: string | null; status: StatusKlaim; tanggal_selesai: string; batas_pengajuan: string; batas_ajukan_ulang: string | null;
  sisa_hari: number | null; diagnosis: KodeKlaim[]; tindakan: KodeKlaim[]; berkas: BerkasKlaim[]; berkas_kurang: BerkasKlaim[]; catatan: string | null; diajukan_pada: string | null; dikembalikan_pada: string | null;
  berita_acara: string | null; alasan: string | null; jumlah_dibayar: number | null; dibayar_pada: string | null; kode_beda: boolean; resume_ada: boolean; spri: string | null; riwayat: RiwayatKlaimDto[];
};
export type RingkasanKlaimDto = Record<StatusKlaim, number>;
export type HalamanKlaimDto = { data: KlaimDto[]; halaman: number; ukuran: number; total: number; ringkasan: RingkasanKlaimDto };
