import { Router } from 'express';
import { bayarMasukan, bukaShiftMasukan, filterRekap, GALAT, idParam, lengkapiHargaMasukan, tambahItemTarifMasukan, tutupKunjunganMasukan, tutupShiftMasukan, ubahHargaMasukan } from '@klira/shared';
import { wajibMasuk } from '../../../middleware/auth.js';
import { alamatDari } from '../../../middleware/audit.js';
import { buatWajibIzin } from '../../../middleware/izin.js';
import { galatValidasi, kirimHasil } from '../../../umum/hasil.js';
/**
 * Rute kasir (3.1, 3.3, 4.5): shift dan rekap, pembayaran, tutup kunjungan. Izin fitur `kasir` (lihat, input, perbaikan);
 * shift dimiliki akun yang membuka. Semua dibatasi pada fasyankes akun; satu-satunya hapus adalah item tambahan kasir sebelum tutup.
 */
export function buatRuteKasirLengkap(layananAkses, layananIzin, layanan) {
    const rute = Router();
    const masuk = wajibMasuk(layananAkses);
    const { wajibIzin } = buatWajibIzin(layananIzin);
    const pengguna = (res) => res.locals.pengguna;
    const bungkus = (f) => (req, res, next) => void f(req, res).catch(next);
    const tidakAda = (res) => void res.status(404).json({ galat: { kode: 'tidak_ditemukan', pesan: GALAT.tidakDitemukan } });
    rute.get('/kasir/shift', masuk, wajibIzin('kasir', 'lihat'), bungkus(async (_req, res) => {
        res.json({ data: { terbuka: await layanan.shiftSaya(pengguna(res)) } });
    }));
    rute.post('/kasir/shift/buka', masuk, wajibIzin('kasir', 'input'), bungkus(async (req, res) => {
        const m = bukaShiftMasukan.safeParse(req.body ?? {});
        if (!m.success)
            return galatValidasi(res, m.error);
        kirimHasil(res, await layanan.bukaShift(pengguna(res), m.data, alamatDari(req)), 201);
    }));
    rute.post('/kasir/shift/tutup', masuk, wajibIzin('kasir', 'input'), bungkus(async (req, res) => {
        const m = tutupShiftMasukan.safeParse(req.body ?? {});
        if (!m.success)
            return galatValidasi(res, m.error);
        kirimHasil(res, await layanan.tutupShift(pengguna(res), m.data, alamatDari(req)));
    }));
    rute.get('/kasir/rekap', masuk, wajibIzin('kasir', 'lihat'), bungkus(async (req, res) => {
        const f = filterRekap.safeParse(req.query);
        if (!f.success)
            return galatValidasi(res, f.error);
        res.json({ data: await layanan.rekap(pengguna(res), f.data.tanggal) });
    }));
    rute.get('/kunjungan/:id/kasir', masuk, wajibIzin('kasir', 'lihat'), bungkus(async (req, res) => {
        const id = idParam.safeParse(req.params);
        if (!id.success)
            return tidakAda(res);
        kirimHasil(res, await layanan.kunjungan(pengguna(res), id.data.id, alamatDari(req)));
    }));
    rute.post('/kunjungan/:id/pembayaran', masuk, wajibIzin('kasir', 'input'), bungkus(async (req, res) => {
        const id = idParam.safeParse(req.params);
        if (!id.success)
            return tidakAda(res);
        const m = bayarMasukan.safeParse(req.body ?? {});
        if (!m.success)
            return galatValidasi(res, m.error);
        kirimHasil(res, await layanan.bayar(pengguna(res), id.data.id, m.data, alamatDari(req)), 201);
    }));
    rute.post('/kunjungan/:id/tagihan/item/:itemId/harga', masuk, wajibIzin('kasir', 'perbaikan'), bungkus(async (req, res) => {
        const id = idParam.safeParse(req.params);
        const itemId = idParam.safeParse({ id: req.params.itemId });
        if (!id.success || !itemId.success)
            return tidakAda(res);
        const m = lengkapiHargaMasukan.safeParse(req.body ?? {});
        if (!m.success)
            return galatValidasi(res, m.error);
        kirimHasil(res, await layanan.lengkapiHarga(pengguna(res), id.data.id, itemId.data.id, m.data, alamatDari(req)));
    }));
    rute.post('/kunjungan/:id/tagihan/item/:itemId/ubah-harga', masuk, wajibIzin('kasir', 'input'), bungkus(async (req, res) => {
        const id = idParam.safeParse(req.params);
        const itemId = idParam.safeParse({ id: req.params.itemId });
        if (!id.success || !itemId.success)
            return tidakAda(res);
        const m = ubahHargaMasukan.safeParse(req.body ?? {});
        if (!m.success)
            return galatValidasi(res, m.error);
        kirimHasil(res, await layanan.ubahHarga(pengguna(res), id.data.id, itemId.data.id, m.data, alamatDari(req)));
    }));
    rute.post('/kunjungan/:id/tagihan/item', masuk, wajibIzin('kasir', 'input'), bungkus(async (req, res) => {
        const id = idParam.safeParse(req.params);
        if (!id.success)
            return tidakAda(res);
        const m = tambahItemTarifMasukan.safeParse(req.body ?? {});
        if (!m.success)
            return galatValidasi(res, m.error);
        kirimHasil(res, await layanan.tambahItem(pengguna(res), id.data.id, m.data, alamatDari(req)), 201);
    }));
    rute.delete('/kunjungan/:id/tagihan/item/:itemId', masuk, wajibIzin('kasir', 'perbaikan'), bungkus(async (req, res) => {
        const id = idParam.safeParse(req.params);
        const itemId = idParam.safeParse({ id: req.params.itemId });
        if (!id.success || !itemId.success)
            return tidakAda(res);
        kirimHasil(res, await layanan.hapusItem(pengguna(res), id.data.id, itemId.data.id, alamatDari(req)));
    }));
    rute.post('/kunjungan/:id/tutup', masuk, wajibIzin('kasir', 'perbaikan'), bungkus(async (req, res) => {
        const id = idParam.safeParse(req.params);
        if (!id.success)
            return tidakAda(res);
        const m = tutupKunjunganMasukan.safeParse(req.body ?? {});
        if (!m.success)
            return galatValidasi(res, m.error);
        kirimHasil(res, await layanan.tutup(pengguna(res), id.data.id, m.data, alamatDari(req)));
    }));
    return rute;
}
