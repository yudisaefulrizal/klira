import { Router } from 'express';
import { prisma, Prisma } from '@klira/db';
import { tanggalWib } from '@klira/shared';
import type { PenggunaSaya } from '@klira/shared';
import { wajibMasuk } from '../../middleware/auth';
import { buatWajibIzin } from '../../middleware/izin';
import type { LayananAkses } from '../akses/layanan';
import type { LayananIzin } from '../akses/layanan-izin';
import type { RiwayatStat } from './hitung';
import { hitungStatistik } from './hitung';
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
            const where = { fasyankes_id: fas, jenis: 'AMB' as const, ...(lokasi ? { lokasi_id: Number(lokasi) } : {}) };
            const select = { id: true, pasien_id: true, mulai: true, tahap_layanan: true, lokasi_id: true, antrean: { select: { nomor: true, status: true } } } as const;
            const [kunjungan, aktif, poli] = await Promise.all([
                prisma.kunjungan.findMany({ where: { ...where, mulai: { gte: awal, lt: akhir } }, select }),
                prisma.kunjungan.findMany({ where: { ...where, tahap_layanan: { not: 'ditutup' } }, select }),
                prisma.lokasi.findMany({ where: { fasyankes_id: fas, jenis: 'poli' }, select: { id: true, nama: true }, orderBy: { nama: 'asc' } })
            ]);
            const riwayat = await prisma.$queryRaw<RiwayatStat[]>(Prisma.sql `
    SELECT r.kunjungan_id, r.tahap, r.masuk, r.keluar
    FROM riwayat_tahap_layanan r
    JOIN kunjungan k ON k.id = r.kunjungan_id AND k.fasyankes_id = r.fasyankes_id
    LEFT JOIN antrean a ON a.kunjungan_id = k.id
    WHERE r.fasyankes_id = ${fas} AND k.jenis = 'AMB' AND r.tahap <> 'ditutup'
     AND (a.status IS NULL OR a.status <> 'batal')
     ${lokasi ? Prisma.sql `AND k.lokasi_id = ${Number(lokasi)}` : Prisma.empty}
     AND ((r.keluar >= ${awal} AND r.keluar < ${akhir}) OR r.keluar IS NULL
       OR r.keluar >= ${new Date(sekarang.getTime() - 8 * 3600000)})
   `);
            res.set('Cache-Control', 'no-store').json({ data: hitungStatistik(kunjungan, aktif, riwayat, poli, awal, akhir, sekarang) });
        }
        catch (e) {
            next(e);
        }
    });
    return r;
}
