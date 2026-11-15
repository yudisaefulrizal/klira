import { Router } from 'express';
import { GALAT, layananUjiParam, ujiEndpointMasukan } from '@klira/shared';
import { wajibMasuk } from '../../../middleware/auth.js';
import { alamatDari } from '../../../middleware/audit.js';
import { buatWajibIzin } from '../../../middleware/izin.js';
function galatValidasi(res, e) {
    res.status(400).json({ galat: { kode: 'tidak_valid', pesan: GALAT.tidakValid, rincian: e.issues.map((i) => ({ jalur: i.path.join('.'), pesan: i.message })) } });
}
const status = { tidak_valid: 400, tidak_ditemukan: 404, belum_lengkap: 409, dilarang: 403 };
/**
 * Rute Test endpoint memakai izin fitur `satusehat` (admin integrasi): lihat untuk membaca katalog, perbaikan untuk mengirim.
 * Permintaan hanya dari katalog dan hanya ke lingkungan sandbox/server tiruan.
 */
export function buatRuteUjiEndpoint(layananAkses, layananIzin, layanan) {
    const rute = Router();
    const masuk = wajibMasuk(layananAkses);
    const { wajibIzin } = buatWajibIzin(layananIzin);
    const pengguna = (res) => res.locals.pengguna;
    const bungkus = (f) => (req, res, next) => void f(req, res).catch(next);
    rute.get('/test-endpoint/:layanan/katalog', masuk, wajibIzin('satusehat', 'lihat'), bungkus(async (req, res) => {
        const p = layananUjiParam.safeParse(req.params);
        if (!p.success)
            return void res.status(404).json({ galat: { kode: 'tidak_ditemukan', pesan: GALAT.tidakDitemukan } });
        res.json({ data: await layanan.katalog(pengguna(res), p.data.layanan) });
    }));
    rute.post('/test-endpoint/kirim', masuk, wajibIzin('satusehat', 'perbaikan'), bungkus(async (req, res) => {
        const m = ujiEndpointMasukan.safeParse(req.body ?? {});
        if (!m.success)
            return galatValidasi(res, m.error);
        const h = await layanan.kirim(pengguna(res), m.data, alamatDari(req));
        if (h.ok)
            return void res.json({ data: h.data });
        res.status(status[h.kode] ?? 400).json({ galat: { kode: h.kode, pesan: h.pesan, ...(h.rincian ? { rincian: h.rincian } : h.bidang ? { rincian: [{ jalur: h.bidang, pesan: h.pesan }] } : {}) } });
    }));
    return rute;
}
