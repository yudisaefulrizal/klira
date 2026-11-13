import * as db from '@klira/db';
import { Router } from 'express';
import { tanggalWib } from '@klira/shared';
import type { PenggunaSaya } from '@klira/shared';
import { wajibMasuk } from '../../../middleware/auth';
import { buatWajibIzin } from '../../../middleware/izin';
import type { LayananAkses } from '../../akses/domain/layanan';
import type { LayananIzin } from '../../akses/domain/layanan-izin';

import { hitungStatistik } from '../domain/hitung';
export function buatRuteStatistik(akses: LayananAkses, izin: LayananIzin) {
    const r = Router();
    r.get('/statistik/pelayanan', wajibMasuk(akses), buatWajibIzin(izin).wajibIzinSalahSatu(['kunjungan', 'lihat'], ['rekam-medis', 'lihat']), async (req, res, next) => {
        try {
            const sekarang = new Date();
            const hariIni = tanggalWib(sekarang);
            const dari = req.query.dari ?? hariIni, sampai = req.query.sampai ?? hariIni;
            const valid = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s;
            const lokasi = req.query.lokasi_id;
            if (!valid(dari) || !valid(sampai) || (lokasi !== undefined && (typeof lokasi !== 'string' || !/^\d+$/.test(lokasi) || !Number.isSafeInteger(Number(lokasi)) || Number(lokasi) < 1))) {
                res.status(400).json({ galat: { pesan: 'Filter tanggal atau poli tidak valid.' } });
                return;
            }
            const awal = new Date(`${dari}T00:00:00+07:00`);
            const akhir = new Date(new Date(`${sampai}T00:00:00+07:00`).getTime() + 86400000);
            if (akhir <= awal || akhir.getTime() - awal.getTime() > 31 * 86400000 || sampai > hariIni) {
                res.status(400).json({ galat: { pesan: 'Pilih rentang maksimal 31 hari sampai hari ini.' } });
                return;
            }
            const fas = (res.locals.pengguna as PenggunaSaya).fasyankes_id;


            const [kunjungan, aktif, poli] = await Promise.all([
                db.daftarKunjunganUntukBuatRuteStatistik(fas, 'AMB' as const, (lokasi) ? (Number(lokasi)) : undefined, awal, akhir),
                db.daftarKunjunganUntukBuatRuteStatistik2(fas, 'AMB' as const, (lokasi) ? (Number(lokasi)) : undefined, 'ditutup'),
                db.daftarLokasiUntukBuatRuteStatistik(fas, 'poli')
            ]);
            const riwayat = await db.riwayatStatistik(fas, lokasi ? Number(lokasi) : null, awal, akhir, new Date(sekarang.getTime() - 8 * 3600000));
            res.set('Cache-Control', 'no-store').json({ data: hitungStatistik(kunjungan, aktif, riwayat, poli, awal, akhir, sekarang) });
        }
        catch (e) {
            next(e);
        }
    });
    return r;
}
