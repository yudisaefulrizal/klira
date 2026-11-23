import { z } from 'zod';
import { idPositif, teksWajib } from './umum.js';

const POLA_TANGGAL = /^\d{4}-\d{2}-\d{2}$/;
const tgl = z.string().regex(POLA_TANGGAL, 'Tanggal harus format YYYY-MM-DD');

export const filterPeriodeKeuangan = z.object({
    dari: tgl.optional(),
    sampai: tgl.optional(),
    batas: z.coerce.number().int().min(1).max(200).default(50),
});

export const coaMasukan = z.object({
    kode: z.string().trim().regex(/^[0-9]{4,10}$/, 'Kode akun 4-10 digit angka'),
    nama: teksWajib(120),
    tipe: z.enum(['aset', 'kewajiban', 'ekuitas', 'pendapatan', 'beban']),
});

export const pengeluaranMasukan = z.object({
    tanggal: tgl,
    kategori: z.enum(['gaji', 'listrik_air', 'atk', 'pemeliharaan', 'rumah_tangga', 'lainnya']),
    metode: z.enum(['tunai', 'transfer']),
    jumlah: z.coerce.number().int().positive(),
    penerima: z.string().trim().max(120).optional().default(''),
    keterangan: teksWajib(300),
});

export const fakturSupplierMasukan = z.object({
    nomor_faktur: teksWajib(60),
    supplier: teksWajib(150),
    tanggal_faktur: tgl,
    jatuh_tempo: tgl.optional().nullable(),
    total: z.coerce.number().int().positive(),
    catatan: z.string().trim().max(300).optional().default(''),
});

export const bayarHutangMasukan = z.object({
    tanggal: tgl,
    metode: z.enum(['tunai', 'transfer']),
    jumlah: z.coerce.number().int().positive(),
    catatan: z.string().trim().max(300).optional().default(''),
});

export const piutangMasukan = z.object({
    kunjungan_id: idPositif,
    tagihan_id: idPositif.optional().nullable(),
    penjamin: teksWajib(120),
    total: z.coerce.number().int().positive(),
    jatuh_tempo: tgl.optional().nullable(),
    catatan: z.string().trim().max(300).optional().default(''),
});

export const bayarPiutangMasukan = z.object({
    tanggal: tgl,
    metode: z.enum(['tunai', 'transfer', 'qris']),
    jumlah: z.coerce.number().int().positive(),
    catatan: z.string().trim().max(300).optional().default(''),
});

export const jurnalManualMasukan = z.object({
    tanggal: tgl,
    keterangan: teksWajib(300),
    baris: z.array(z.object({
        akun_kode: z.string().trim().min(1).max(20),
        debit: z.coerce.number().int().min(0).default(0),
        kredit: z.coerce.number().int().min(0).default(0),
        keterangan: z.string().trim().max(200).optional().default(''),
    })).min(2).refine((baris) => {
        const d = baris.reduce((s, b) => s + b.debit, 0);
        const k = baris.reduce((s, b) => s + b.kredit, 0);
        return d > 0 && d === k;
    }, 'Total debit harus sama dengan total kredit dan lebih dari 0'),
});

export const tarifJasaMasukan = z.object({
    jasa_klinik: z.coerce.number().int().min(0).default(0),
    jasa_dpjp: z.coerce.number().int().min(0).default(0),
    jasa_perawat: z.coerce.number().int().min(0).default(0),
});
