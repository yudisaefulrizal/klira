import { Router } from 'express';
import { z } from 'zod';
import { KLINIS, idPositif } from '@klira/shared';
import { wajibMasuk } from '../../../middleware/auth.js';
import { alamatDari } from '../../../middleware/audit.js';
import { buatWajibIzin } from '../../../middleware/izin.js';
import { galatValidasi, kirimHasil } from '../../../umum/hasil.js';
const param = z.object({ entitas: z.string().min(1).max(50), id: z.coerce.number().pipe(idPositif) });
/** API verifikasi pengesahan generik: GET /api/pengesahan/:entitas/:id (izin lihat klinis atau rekam medis). */
export function buatRutePengesahan(layananAkses, layananIzin, layanan) {
    const rute = Router();
    const masuk = wajibMasuk(layananAkses);
    const { wajibIzinSalahSatu } = buatWajibIzin(layananIzin);
    const bungkus = (f) => (req, res, next) => void f(req, res).catch(next);
    rute.get('/pengesahan/:entitas/:id', masuk, wajibIzinSalahSatu(['klinis', 'lihat'], ['rekam-medis', 'lihat']), bungkus(async (req, res) => {
        const p = param.safeParse(req.params);
        if (!p.success)
            return galatValidasi(res, p.error);
        kirimHasil(res, await layanan.verifikasi(res.locals.pengguna, p.data.entitas, p.data.id, alamatDari(req)));
    }));
    rute.get('/pengesahan/:entitas/:id/versi', masuk, wajibIzinSalahSatu(['klinis', 'lihat'], ['rekam-medis', 'lihat']), bungkus(async (req, res) => {
        const p = param.safeParse(req.params);
        if (!p.success)
            return galatValidasi(res, p.error);
        const pengguna = res.locals.pengguna;
        if (!layanan.entitasDikenal(p.data.entitas))
            return void res.status(404).json({ galat: { kode: 'tidak_ditemukan', pesan: KLINIS.galat.entitasTidakDikenal } });
        res.json({ data: await layanan.riwayatVersi(pengguna.fasyankes_id, p.data.entitas, p.data.id) });
    }));
    return rute;
}
