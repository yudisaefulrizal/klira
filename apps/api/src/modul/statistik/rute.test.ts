import express from 'express';
import type { Server } from 'http';
import type { AddressInfo } from 'net';
import type { LayananAkses } from '../akses/layanan';
import type { LayananIzin } from '../akses/layanan-izin';
import { buatRuteStatistik } from './rute';
import { prisma } from '@klira/db';
jest.mock('@klira/db', () => ({ prisma: { kunjungan: { findMany: jest.fn() }, lokasi: { findMany: jest.fn() }, $queryRaw: jest.fn() }, Prisma: { sql: jest.fn((...v: unknown[]) => v), empty: '' } }));
jest.mock('../../middleware/auth', () => ({ wajibMasuk: () => (req: express.Request, res: express.Response, next: express.NextFunction) => { if (!req.headers.authorization)
        return void res.status(401).end(); res.locals.pengguna = { fasyankes_id: 7, izin: req.headers.authorization === 'boleh' ? [{ fitur: 'kunjungan', aksi: 'lihat', cakupan: 'unit' }] : [] }; next(); } }));
let server: Server;
const izin = { catatPenolakan: jest.fn(async () => { }), catatTindakan: jest.fn(async () => { }) } as unknown as LayananIzin;
beforeAll(() => new Promise<void>(resolve => { const app = express(); app.use(buatRuteStatistik({} as LayananAkses, izin)); server = app.listen(0, '127.0.0.1', () => resolve()); }));
afterAll(() => new Promise<void>(resolve => server.close(() => resolve())));
beforeEach(() => { jest.clearAllMocks(); jest.mocked(prisma.kunjungan.findMany).mockResolvedValue([]); jest.mocked(prisma.lokasi.findMany).mockResolvedValue([]); jest.mocked(prisma.$queryRaw).mockResolvedValue([]); });
const ambil = (query = '', auth?: string) => fetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}/statistik/pelayanan${query}`, { headers: auth ? { authorization: auth } : {} });
test('wajib masuk dan wajib izin lihat; tanpa akses tidak membaca database', async () => { expect((await ambil()).status).toBe(401); expect((await ambil('', 'tidak')).status).toBe(403); expect(prisma.kunjungan.findMany).not.toHaveBeenCalled(); });
test('tanggal mustahil, rentang panjang, dan poli tidak sah ditolak', async () => { for (const q of ['?dari=2026-02-30', '?dari=2026-01-01&sampai=2026-03-01', '?lokasi_id=abc', '?lokasi_id=0'])
    expect((await ambil(q, 'boleh')).status).toBe(400); expect(prisma.$queryRaw).not.toHaveBeenCalled(); });
test('scope fasyankes dan poli diterapkan untuk histori maupun antrean; kosong tetap valid', async () => { const res = await ambil('?lokasi_id=9', 'boleh'); expect(res.status).toBe(200); const json = await res.json() as {
    data: {
        total: number;
        tahap: unknown[];
    };
}; expect(json.data.total).toBe(0); expect(json.data.tahap).toHaveLength(4); for (const [args] of jest.mocked(prisma.kunjungan.findMany).mock.calls)
    expect(args?.where).toMatchObject({ fasyankes_id: 7, lokasi_id: 9, jenis: 'AMB' }); expect(prisma.$queryRaw).toHaveBeenCalled(); expect(res.headers.get('cache-control')).toBe('no-store'); });
