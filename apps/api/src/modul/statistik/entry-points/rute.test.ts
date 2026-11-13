import * as db from '@klira/db';
import express from 'express';
import type { Server } from 'http';
import type { AddressInfo } from 'net';
import type { LayananAkses } from '../../akses/domain/layanan';
import type { LayananIzin } from '../../akses/domain/layanan-izin';
import { buatRuteStatistik } from './rute';

jest.mock('@klira/db', () => {
  const daftarKunjunganUntukBuatRuteStatistik = jest.fn();
  const daftarLokasiUntukBuatRuteStatistik = jest.fn();
  const kunci = jest.fn();
  return { ...jest.requireActual('@klira/db'),
    pool: {},
    daftarKunjunganUntukBuatRuteStatistik: daftarKunjunganUntukBuatRuteStatistik,
    daftarKunjunganUntukBuatRuteStatistik2: daftarKunjunganUntukBuatRuteStatistik,
    daftarLokasiUntukBuatRuteStatistik: daftarLokasiUntukBuatRuteStatistik,
    transaksi: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn({})),
    riwayatStatistik: kunci };
});
jest.mock('../../../middleware/auth', () => ({ wajibMasuk: () => (req: express.Request, res: express.Response, next: express.NextFunction) => { if (!req.headers.authorization)
        return void res.status(401).end(); res.locals.pengguna = { fasyankes_id: 7, izin: req.headers.authorization === 'boleh' ? [{ fitur: 'kunjungan', aksi: 'lihat', cakupan: 'unit' }] : [] }; next(); } }));
let server: Server;
const izin = { catatPenolakan: jest.fn(async () => { }), catatTindakan: jest.fn(async () => { }) } as unknown as LayananIzin;
beforeAll(() => new Promise<void>(resolve => { const app = express(); app.use(buatRuteStatistik({} as LayananAkses, izin)); server = app.listen(0, '127.0.0.1', () => resolve()); }));
afterAll(() => new Promise<void>(resolve => server.close(() => resolve())));
beforeEach(() => { jest.clearAllMocks(); jest.mocked(db.daftarKunjunganUntukBuatRuteStatistik).mockResolvedValue([]); jest.mocked(db.daftarLokasiUntukBuatRuteStatistik).mockResolvedValue([]); jest.mocked(db.riwayatStatistik).mockResolvedValue([]); });
const ambil = (query = '', auth?: string) => fetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}/statistik/pelayanan${query}`, { headers: auth ? { authorization: auth } : {} });
test('wajib masuk dan wajib izin lihat; tanpa akses tidak membaca database', async () => { expect((await ambil()).status).toBe(401); expect((await ambil('', 'tidak')).status).toBe(403); expect(db.daftarKunjunganUntukBuatRuteStatistik).not.toHaveBeenCalled(); });
test('tanggal mustahil, rentang panjang, dan poli tidak sah ditolak', async () => { for (const q of ['?dari=2026-02-30', '?dari=2026-01-01&sampai=2026-03-01', '?lokasi_id=abc', '?lokasi_id=0'])
    expect((await ambil(q, 'boleh')).status).toBe(400); expect(db.riwayatStatistik).not.toHaveBeenCalled(); });
test('scope fasyankes dan poli diterapkan untuk histori maupun antrean; kosong tetap valid', async () => { const res = await ambil('?lokasi_id=9', 'boleh'); expect(res.status).toBe(200); const json = await res.json() as {
    data: {
        total: number;
        tahap: unknown[];
    };
}; expect(json.data.total).toBe(0); expect(json.data.tahap).toHaveLength(4); for (const args of jest.mocked(db.daftarKunjunganUntukBuatRuteStatistik).mock.calls)
    expect(args.slice(0, 3)).toEqual([7, 'AMB', 9]); expect(db.riwayatStatistik).toHaveBeenCalled(); expect(res.headers.get('cache-control')).toBe('no-store'); });
