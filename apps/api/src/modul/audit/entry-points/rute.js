import { Router } from 'express';
import { GALAT, eksporAudit, filterAudit, idParam } from '@klira/shared';
import { wajibMasuk } from '../../../middleware/auth.js';
import { alamatDari } from '../../../middleware/audit.js';
import { buatWajibIzin } from '../../../middleware/izin.js';
import { bungkus, pengguna } from '../../../umum/rute.js';
import { galatValidasi } from '../../../umum/hasil.js';
/** Rute tab Log audit: semuanya butuh izin fitur `audit` (lihat). */
export function buatRuteAudit(layananAkses, layananIzin, layanan) {
    const rute = Router();
    const masuk = wajibMasuk(layananAkses);
    const { wajibIzin } = buatWajibIzin(layananIzin);
    const izin = wajibIzin('audit', 'lihat');
    rute.get('/audit', masuk, izin, bungkus(async (req, res) => {
        const h = filterAudit.safeParse(req.query);
        if (!h.success)
            return galatValidasi(res, h.error);
        res.json({ data: await layanan.daftar(pengguna(res), h.data) });
    }));
    rute.post('/audit/ekspor', masuk, izin, bungkus(async (req, res) => {
        const h = eksporAudit.safeParse(req.body ?? {});
        if (!h.success)
            return galatValidasi(res, h.error);
        const { csv } = await layanan.ekspor(pengguna(res), h.data, alamatDari(req));
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="log-audit.csv"');
        res.send(csv);
    }));
    rute.get('/audit/:id', masuk, izin, bungkus(async (req, res) => {
        const h = idParam.safeParse(req.params);
        if (!h.success)
            return galatValidasi(res, h.error);
        const d = await layanan.detail(pengguna(res), h.data.id);
        if (!d) {
            const badan = { galat: { kode: 'tidak_ditemukan', pesan: GALAT.tidakDitemukan } };
            return void res.status(404).json(badan);
        }
        res.json({ data: d });
    }));
    return rute;
}
