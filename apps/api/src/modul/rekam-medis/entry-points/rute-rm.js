import { Router } from 'express';
import { filterBerkas, filterPerbaikan, idParam, keputusanPerbaikanMasukan, perbaikanMasukan } from '@klira/shared';
import { wajibMasuk } from '../../../middleware/auth.js';
import { alamatDari } from '../../../middleware/audit.js';
import { buatWajibIzin } from '../../../middleware/izin.js';
import { galatValidasi, kirimHasil } from '../../../umum/hasil.js';
import { bungkus, pengguna, tidakAda } from '../../../umum/rute.js';
/**
 * Rute Rekam medis (3.1, 4.2): perbaikan catatan (pemohon: izin `klinis` perbaikan; peninjau: `rekam-medis` perbaikan),
 * daftar berkas (lihat `rekam-medis` atau `klinis`). Dibatasi pada fasyankes akun; tidak ada rute hapus.
 */
export function buatRuteRm(layananAkses, layananIzin, layanan) {
    const rute = Router();
    const masuk = wajibMasuk(layananAkses);
    const { wajibIzin, wajibIzinSalahSatu } = buatWajibIzin(layananIzin);
    const lihatBerkas = wajibIzinSalahSatu(['rekam-medis', 'lihat'], ['klinis', 'lihat']);
    rute.get('/rekam-medis/berkas', masuk, lihatBerkas, bungkus(async (req, res) => {
        const f = filterBerkas.safeParse(req.query);
        if (!f.success)
            return galatValidasi(res, f.error);
        res.json({ data: await layanan.berkas(pengguna(res), f.data) });
    }));
    rute.post('/kunjungan/:id/perbaikan', masuk, wajibIzin('klinis', 'perbaikan'), bungkus(async (req, res) => {
        const id = idParam.safeParse(req.params);
        if (!id.success)
            return tidakAda(res);
        const m = perbaikanMasukan.safeParse(req.body ?? {});
        if (!m.success)
            return galatValidasi(res, m.error);
        kirimHasil(res, await layanan.ajukanPerbaikan(pengguna(res), id.data.id, m.data, alamatDari(req)), 201);
    }));
    rute.get('/rekam-medis/perbaikan', masuk, wajibIzin('rekam-medis', 'lihat'), bungkus(async (req, res) => {
        const f = filterPerbaikan.safeParse(req.query);
        if (!f.success)
            return galatValidasi(res, f.error);
        res.json({ data: await layanan.daftarPerbaikan(pengguna(res), f.data) });
    }));
    rute.post('/rekam-medis/perbaikan/:id/keputusan', masuk, wajibIzin('rekam-medis', 'perbaikan'), bungkus(async (req, res) => {
        const id = idParam.safeParse(req.params);
        if (!id.success)
            return tidakAda(res);
        const m = keputusanPerbaikanMasukan.safeParse(req.body ?? {});
        if (!m.success)
            return galatValidasi(res, m.error);
        kirimHasil(res, await layanan.putuskan(pengguna(res), id.data.id, m.data, alamatDari(req)));
    }));
    return rute;
}
