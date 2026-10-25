import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { GALAT, punyaIzin } from '@klira/shared';
import type { AksiIzin, PenggunaSaya, ResponsGalat } from '@klira/shared';
import type { LayananIzin } from '../modul/akses/layanan-izin';
import type { KonteksTindakan } from '../modul/akses/mesin-izin';

export type SyaratIzin = [fitur: string, aksi: AksiIzin];
export type OpsiWajibIzin = { konteks?: (req: Request) => KonteksTindakan };

function galat403(res: Response): void {
  const badan: ResponsGalat = { galat: { kode: 'tidak_berizin', pesan: GALAT.tidakBerizin } };
  res.status(403).json(badan);
}

/**
 * Pabrik middleware izin. Mengharuskan wajibMasuk (res.locals.pengguna) lebih dulu.
 * Tanpa izin: 403 dan tercatat di audit. Dengan izin: peringatan relevan dievaluasi dan dicatat
 * (tidak pernah memblokir).
 */
export function buatWajibIzin(layanan: LayananIzin) {
  const periksa = (syarat: SyaratIzin[], opsi: OpsiWajibIzin = {}): RequestHandler =>
    (req: Request, res: Response, next: NextFunction) => {
      const pengguna = res.locals.pengguna as PenggunaSaya | undefined;
      if (!pengguna) return void res.status(401).json({ galat: { kode: 'tidak_terautentikasi', pesan: GALAT.tidakTerautentikasi } });
      const cocok = syarat.find(([f, a]) => punyaIzin(pengguna, f, a));
      const alamat = req.ip ?? 'tidak-diketahui';
      if (!cocok) {
        const [f, a] = syarat[0];
        layanan.catatPenolakan(pengguna, f, a, alamat).then(() => galat403(res), next);
        return;
      }
      layanan
        .catatTindakan(pengguna, cocok[0], opsi.konteks?.(req), alamat)
        .catch((e) => console.error('Gagal mencatat peringatan izin', e))
        .then(() => next());
    };
  return {
    /** wajibIzin(fitur, aksi): wajib punya izin fitur x aksi (cakupan apa pun). */
    wajibIzin: (fitur: string, aksi: AksiIzin, opsi?: OpsiWajibIzin) => periksa([[fitur, aksi]], opsi),
    /** Cukup salah satu syarat terpenuhi (mis. pimpinan atau auditor melihat daftar peringatan). */
    wajibIzinSalahSatu: (...syarat: SyaratIzin[]) => periksa(syarat),
  };
}
