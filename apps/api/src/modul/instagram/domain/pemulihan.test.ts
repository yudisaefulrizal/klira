import * as db from '@klira/db';
import { pangkasPesanInstagram } from '@klira/db';
import { pulihkanPengirimanInstagram } from './pemulihan';
jest.mock('@klira/db', () => {
  const daftarIgPesanUntukPulihkanPengirimanInstagram = jest.fn();
  const ubahIgPesanUntukPulihkanPengirimanInstagram = jest.fn();
  return { ...jest.requireActual('@klira/db'),
    pool: {},
    daftarIgPesanUntukPulihkanPengirimanInstagram: daftarIgPesanUntukPulihkanPengirimanInstagram,
    ubahIgPesanUntukPulihkanPengirimanInstagram: ubahIgPesanUntukPulihkanPengirimanInstagram,
    transaksi: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn({})),
    kunciPercakapanInstagram: jest.fn(),
    pangkasPesanInstagram: jest.fn() };
});
it('mengubah kiriman yang terhenti menjadi belum pasti tanpa pengiriman ulang', async () => {
  const waktu = Date.now();
  jest.mocked(db.daftarIgPesanUntukPulihkanPengirimanInstagram).mockResolvedValue([{ id: 9, percakapan_id: 4 }] as never);
  jest.mocked(db.transaksi).mockImplementation(async (fn: unknown) => (fn as (tx: unknown) => Promise<unknown>)(db.pool) as never);
  await pulihkanPengirimanInstagram();
  const query = jest.mocked(db.daftarIgPesanUntukPulihkanPengirimanInstagram).mock.calls[0][2];
  const batas = query!.getTime();
  expect(batas).toBeGreaterThanOrEqual(waktu - 120000);
  expect(batas).toBeLessThanOrEqual(Date.now() - 120000);
  expect(jest.mocked(db.ubahIgPesanUntukPulihkanPengirimanInstagram).mock.calls.map(args => ({ ...args }))).toEqual(expect.arrayContaining([expect.objectContaining({ 0: 'belum pasti', 1: 9, 2: 'mengirim', 3: new Date(batas) })]));
  expect(pangkasPesanInstagram).toHaveBeenCalledWith(db.pool, 4);
});
