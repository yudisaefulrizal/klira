import { Router } from 'express';
import {
    GALAT,
    idParam,
    filterPeriodeKeuangan,
    coaMasukan,
    pengeluaranMasukan,
    fakturSupplierMasukan,
    bayarHutangMasukan,
    piutangMasukan,
    bayarPiutangMasukan,
    jurnalManualMasukan,
    tarifJasaMasukan,
} from '@klira/shared';
import { wajibMasuk } from '../../../middleware/auth.js';
import { alamatDari } from '../../../middleware/audit.js';
import { buatWajibIzin } from '../../../middleware/izin.js';
import { kirimHasil } from '../../../umum/hasil.js';
import { bungkus } from '../../../umum/rute.js';

const gagalValidasi = (res, v) =>
    res.status(400).json({ galat: { kode: 'masukan_tidak_valid', pesan: GALAT.masukanTidakValid, rincian: v.error.flatten() } });

/** Rute API Keuangan & Akuntansi (/api/keuangan/*). */
export function buatRuteKeuangan(layananAkses, layananIzin, layanan) {
    const rute = Router();
    const masuk = wajibMasuk(layananAkses);
    const { wajibIzinSalahSatu } = buatWajibIzin(layananIzin);
    const bolehLihat = wajibIzinSalahSatu(['kasir', 'lihat'], ['klaim', 'lihat']);
    const bolehInput = wajibIzinSalahSatu(['kasir', 'input'], ['klaim', 'input']);

    rute.get('/keuangan/ringkasan', masuk, bolehLihat, bungkus(async (req, res) => {
        const f = filterPeriodeKeuangan.safeParse(req.query);
        if (!f.success) return void gagalValidasi(res, f);
        kirimHasil(res, await layanan.ringkasan(res.locals.pengguna, f.data));
    }));

    rute.get('/keuangan/coa', masuk, bolehLihat, bungkus(async (_req, res) => {
        kirimHasil(res, await layanan.daftarCoa());
    }));

    rute.post('/keuangan/coa', masuk, bolehInput, bungkus(async (req, res) => {
        const v = coaMasukan.safeParse(req.body);
        if (!v.success) return void gagalValidasi(res, v);
        kirimHasil(res, await layanan.tambahCoa(res.locals.pengguna, v.data, alamatDari(req)), 201);
    }));

    rute.get('/keuangan/jurnal', masuk, bolehLihat, bungkus(async (req, res) => {
        const f = filterPeriodeKeuangan.safeParse(req.query);
        if (!f.success) return void gagalValidasi(res, f);
        kirimHasil(res, await layanan.daftarJurnal(f.data));
    }));

    rute.post('/keuangan/jurnal', masuk, bolehInput, bungkus(async (req, res) => {
        const v = jurnalManualMasukan.safeParse(req.body);
        if (!v.success) return void gagalValidasi(res, v);
        kirimHasil(res, await layanan.catatJurnalManual(res.locals.pengguna, v.data, alamatDari(req)), 201);
    }));

    rute.get('/keuangan/pengeluaran', masuk, bolehLihat, bungkus(async (req, res) => {
        const f = filterPeriodeKeuangan.safeParse(req.query);
        if (!f.success) return void gagalValidasi(res, f);
        kirimHasil(res, await layanan.daftarPengeluaran(f.data));
    }));

    rute.post('/keuangan/pengeluaran', masuk, bolehInput, bungkus(async (req, res) => {
        const v = pengeluaranMasukan.safeParse(req.body);
        if (!v.success) return void gagalValidasi(res, v);
        kirimHasil(res, await layanan.tambahPengeluaran(res.locals.pengguna, v.data, alamatDari(req)), 201);
    }));

    rute.get('/keuangan/hutang', masuk, bolehLihat, bungkus(async (_req, res) => {
        kirimHasil(res, await layanan.daftarHutang(res.locals.pengguna));
    }));

    rute.post('/keuangan/hutang', masuk, bolehInput, bungkus(async (req, res) => {
        const v = fakturSupplierMasukan.safeParse(req.body);
        if (!v.success) return void gagalValidasi(res, v);
        kirimHasil(res, await layanan.tambahFakturSupplier(res.locals.pengguna, v.data, alamatDari(req)), 201);
    }));

    rute.post('/keuangan/hutang/:id/bayar', masuk, bolehInput, bungkus(async (req, res) => {
        const id = idParam.safeParse(req.params);
        if (!id.success) return void res.status(404).json({ galat: { kode: 'tidak_ditemukan', pesan: GALAT.tidakDitemukan } });
        const v = bayarHutangMasukan.safeParse(req.body);
        if (!v.success) return void gagalValidasi(res, v);
        kirimHasil(res, await layanan.bayarHutang(res.locals.pengguna, id.data.id, v.data, alamatDari(req)));
    }));

    rute.get('/keuangan/piutang', masuk, bolehLihat, bungkus(async (_req, res) => {
        kirimHasil(res, await layanan.daftarPiutang());
    }));

    rute.post('/keuangan/piutang', masuk, bolehInput, bungkus(async (req, res) => {
        const v = piutangMasukan.safeParse(req.body);
        if (!v.success) return void gagalValidasi(res, v);
        kirimHasil(res, await layanan.tambahPiutang(res.locals.pengguna, v.data, alamatDari(req)), 201);
    }));

    rute.post('/keuangan/piutang/:id/bayar', masuk, bolehInput, bungkus(async (req, res) => {
        const id = idParam.safeParse(req.params);
        if (!id.success) return void res.status(404).json({ galat: { kode: 'tidak_ditemukan', pesan: GALAT.tidakDitemukan } });
        const v = bayarPiutangMasukan.safeParse(req.body);
        if (!v.success) return void gagalValidasi(res, v);
        kirimHasil(res, await layanan.bayarPiutang(res.locals.pengguna, id.data.id, v.data, alamatDari(req)));
    }));

    rute.get('/keuangan/jasa-medis', masuk, bolehLihat, bungkus(async (req, res) => {
        const f = filterPeriodeKeuangan.safeParse(req.query);
        if (!f.success) return void gagalValidasi(res, f);
        kirimHasil(res, await layanan.jasaMedis(res.locals.pengguna, f.data));
    }));

    rute.get('/keuangan/tarif-jasa', masuk, bolehLihat, bungkus(async (_req, res) => {
        kirimHasil(res, await layanan.daftarTarifJasa());
    }));

    rute.patch('/keuangan/tarif-jasa/:id', masuk, bolehInput, bungkus(async (req, res) => {
        const id = idParam.safeParse(req.params);
        if (!id.success) return void res.status(404).json({ galat: { kode: 'tidak_ditemukan', pesan: GALAT.tidakDitemukan } });
        const v = tarifJasaMasukan.safeParse(req.body);
        if (!v.success) return void gagalValidasi(res, v);
        kirimHasil(res, await layanan.simpanTarifJasa(res.locals.pengguna, id.data.id, v.data, alamatDari(req)));
    }));

    return rute;
}
