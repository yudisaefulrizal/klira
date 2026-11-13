import { Router } from 'express';
import { GALAT, idParam, persetujuanTindakanMasukan } from '@klira/shared';
import { wajibMasuk } from '../../../middleware/auth.js';
import { alamatDari } from '../../../middleware/audit.js';
import { buatWajibIzin } from '../../../middleware/izin.js';
import { galatValidasi, kirimHasil } from '../../hasil.js';
/** Rute persetujuan tindakan (izin `persetujuan`; lihat boleh juga lewat klinis atau rekam medis). Tidak ada rute ubah atau hapus. */
export function buatRutePersetujuan(layananAkses, layananIzin, layanan) {
    const rute = Router();
    const masuk = wajibMasuk(layananAkses);
    const { wajibIzin, wajibIzinSalahSatu } = buatWajibIzin(layananIzin);
    const pengguna = (res) => res.locals.pengguna;
    const bungkus = (f) => (req, res, next) => void f(req, res).catch(next);
    const tidakAda = (res) => void res.status(404).json({ galat: { kode: 'tidak_ditemukan', pesan: GALAT.tidakDitemukan } });
    rute.get('/kunjungan/:id/persetujuan-tindakan/siap', masuk, wajibIzin('persetujuan', 'input'), bungkus(async (req, res) => {
        const id = idParam.safeParse(req.params);
        if (!id.success)
            return tidakAda(res);
        kirimHasil(res, await layanan.siapkan(pengguna(res), id.data.id));
    }));
    rute.get('/kunjungan/:id/persetujuan-tindakan', masuk, wajibIzinSalahSatu(['persetujuan', 'lihat'], ['klinis', 'lihat'], ['rekam-medis', 'lihat']), bungkus(async (req, res) => {
        const id = idParam.safeParse(req.params);
        if (!id.success)
            return tidakAda(res);
        kirimHasil(res, await layanan.daftar(pengguna(res), id.data.id, alamatDari(req)));
    }));
    rute.post('/kunjungan/:id/persetujuan-tindakan', masuk, wajibIzin('persetujuan', 'input'), bungkus(async (req, res) => {
        const id = idParam.safeParse(req.params);
        if (!id.success)
            return tidakAda(res);
        const m = persetujuanTindakanMasukan.safeParse(req.body ?? {});
        if (!m.success)
            return galatValidasi(res, m.error);
        kirimHasil(res, await layanan.catat(pengguna(res), id.data.id, m.data, alamatDari(req)), 201);
    }));
    return rute;
}
