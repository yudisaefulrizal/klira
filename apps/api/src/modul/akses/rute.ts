import { Router } from 'express';
import type { Request } from 'express';
import { GALAT, MASUK } from '@klira/shared';
import type { ResponsGalat } from '@klira/shared';
import { opsiCookieSesi } from '../../config/cookie';
import { galat401, idSesiDariPermintaan } from '../../middleware/auth';
import type { LayananAkses } from './layanan';
import { NAMA_COOKIE_SESI, skemaMasuk } from './skema';

const alamatDari = (req: Request) => req.ip ?? 'tidak-diketahui';

export function buatRuteAkses(layanan: LayananAkses, baseUrl: string): Router {
  const rute = Router();

  rute.post('/masuk', async (req, res, next) => {
    try {
      const masukan = skemaMasuk.safeParse(req.body ?? {});
      if (!masukan.success) {
        const badan: ResponsGalat = { galat: { kode: 'tidak_valid', pesan: GALAT.tidakValid } };
        return void res.status(400).json(badan);
      }
      const hasil = await layanan.masuk(masukan.data.username, masukan.data.kata_sandi, alamatDari(req));
      if (!hasil.ok) {
        const terkunci = hasil.alasan === 'terkunci';
        const badan: ResponsGalat = {
          galat: terkunci ? { kode: 'terlalu_banyak', pesan: MASUK.terlaluBanyak } : { kode: 'tidak_terautentikasi', pesan: MASUK.gagal },
        };
        return void res.status(terkunci ? 429 : 401).json(badan);
      }
      res.cookie(NAMA_COOKIE_SESI, hasil.idSesi, { ...opsiCookieSesi(baseUrl), expires: hasil.kedaluwarsa });
      res.json({ data: hasil.pengguna });
    } catch (galat) {
      next(galat);
    }
  });

  rute.post('/keluar', async (req, res, next) => {
    try {
      await layanan.keluar(idSesiDariPermintaan(req), alamatDari(req));
      res.clearCookie(NAMA_COOKIE_SESI, opsiCookieSesi(baseUrl));
      res.json({ data: { ok: true } });
    } catch (galat) {
      next(galat);
    }
  });

  rute.get('/saya', async (req, res, next) => {
    try {
      const pengguna = await layanan.saya(idSesiDariPermintaan(req));
      if (!pengguna) return void galat401(res);
      res.json({ data: pengguna });
    } catch (galat) {
      next(galat);
    }
  });

  return rute;
}
