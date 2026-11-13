import * as db from '@klira/db';
import { filterPasien, TAHAP_BERJALAN } from '@klira/shared';
import { RepositoriPasienMysql } from '../data-access/repositori';

jest.mock('@klira/db', () => ({
  ...jest.requireActual('@klira/db'), pool: {},
  kelompokKunjunganUntukHitungTahap: jest.fn().mockResolvedValue([]),
  hitungKunjunganUntukHitungTahap: jest.fn().mockResolvedValue(0),
  hitungKunjunganUntukCari: jest.fn().mockResolvedValue(0),
  daftarKunjunganUntukCari: jest.fn().mockResolvedValue([]),
  hitungPasienUntukCari: jest.fn().mockResolvedValue(0),
  daftarPasienUntukCari: jest.fn().mockResolvedValue([]),
}));
const repo = new RepositoriPasienMysql();
beforeEach(() => jest.clearAllMocks());

test('tanggal bawaan mengikuti pergantian hari WIB dan menolak tanggal mustahil', async () => {
  jest.useFakeTimers().setSystemTime(new Date('2026-10-28T17:00:00Z'));
  try {
    await repo.cari(7, { tahap: 'semua', lewati: 0, ambil: 20 });
    const args = jest.mocked(db.daftarKunjunganUntukCari).mock.calls[0];
    expect(args.slice(5, 7)).toEqual([new Date('2026-10-28T17:00:00Z'), new Date('2026-10-29T17:00:00Z')]);
    expect(filterPasien.safeParse({ tanggal: '2026-02-30' }).success).toBe(false);
  } finally { jest.useRealTimers(); }
});

test.each(['semua', 'ditutup', 'batal'] as const)('filter %s dan jumlah tahap memakai batas hari WIB yang sama', async tahap => {
  await repo.cari(7, { tanggal: '2026-10-29', tahap, lewati: 0, ambil: 20 });
  const mulai = { gte: new Date('2026-10-28T17:00:00Z'), lt: new Date('2026-10-29T17:00:00Z') };
  const daftar = jest.mocked(db.daftarKunjunganUntukCari).mock.calls[0];
  const hitung = jest.mocked(db.hitungKunjunganUntukCari).mock.calls[0];
  expect(daftar.slice(0, hitung.length)).toEqual(hitung);
  expect(daftar[0]).toBe(7);
  const posisi = tahap === 'batal' ? 1 : tahap === 'semua' ? 5 : 7;
  expect(daftar.slice(posisi, posisi + 2)).toEqual([mulai.gte, mulai.lt]);
  expect(db.kelompokKunjunganUntukHitungTahap).toHaveBeenCalledWith(7, mulai, 'batal');
  expect(db.hitungKunjunganUntukHitungTahap).toHaveBeenCalledWith(7, mulai, 'batal');
});

test('pencarian tetap mengikuti tanggal terpilih', async () => {
  await repo.cari(7, { tanggal: '2026-10-28', cari: 'Siti', tahap: 'semua', lewati: 0, ambil: 20 });
  const args = jest.mocked(db.daftarPasienUntukCari).mock.calls[0];
  expect(args.slice(10, 12)).toEqual([new Date('2026-10-27T17:00:00Z'), new Date('2026-10-28T17:00:00Z')]);
  expect(args[16]).toBe(true);
});

test('pemilih pasien tanpa tanggal dapat mencari pasien yang belum berkunjung', async () => {
  await repo.cari(7, { cari: 'Siti', tahap: 'semua', lewati: 0, ambil: 10 });
  const args = jest.mocked(db.daftarPasienUntukCari).mock.calls[0];
  expect(args.slice(10, 12)).toEqual([undefined, undefined]);
  expect(args[16]).toBe(false);
});

test.each([undefined, 'Siti'])('semua mencakup tahap selesai dan batal pada tanggal terpilih (cari: %s)', async cari => {
  await repo.cari(7, { tanggal: '2026-10-29', cari, tahap: 'semua', lewati: 0, ambil: 20 });
  if (cari) {
    const args = jest.mocked(db.daftarPasienUntukCari).mock.calls[0];
    expect(args[9]).toBe(false); // tidak membatasi hanya antrean batal
    expect(args[15]).toBe(false); // tidak mengecualikan antrean batal
    expect(args[14]).toBeUndefined(); // seluruh tahap
  } else {
    const args = jest.mocked(db.daftarKunjunganUntukCari).mock.calls[0];
    expect(args[4]).toBe(false);
    expect(args[10]).toBe(false);
    expect(args[9]).toBeUndefined();
  }
});

test('pemilih kunjungan mengecualikan pasien dengan kunjungan berjalan sebelum paginasi', async () => {
  await repo.cari(7, { cari: 'Siti', tahap: 'semua', untuk_kunjungan: 'true', lewati: 0, ambil: 20 });
  const args = jest.mocked(db.daftarPasienUntukCari).mock.calls[0];
  expect(args.slice(0, 4)).toEqual([7, [...TAHAP_BERJALAN], 'batal', true]);
  expect(args.slice(17, 19)).toEqual([20, 0]);
  expect(jest.mocked(db.hitungPasienUntukCari).mock.calls[0]).toEqual(args.slice(0, 17));
  expect(filterPasien.parse({ untuk_kunjungan: 'true' }).untuk_kunjungan).toBe('true');
  expect(filterPasien.safeParse({ untuk_kunjungan: 'salah' }).success).toBe(false);
});

test.each([undefined, 'true'] as const)('pencarian nomor JKN lengkap atau awalan tetap dibatasi fasilitas (pemilih: %s)', async untuk_kunjungan => {
  for (const cari of ['0001234567890', '000123']) {
    await repo.cari(7, { cari, tahap: 'semua', untuk_kunjungan, lewati: 0, ambil: 20 });
    const args = jest.mocked(db.daftarPasienUntukCari).mock.calls.at(-1)!;
    expect(args[0]).toBe(7);
    expect(args.slice(4, 7)).toEqual([cari, cari, true]);
    expect(jest.mocked(db.hitungPasienUntukCari).mock.calls.at(-1)).toEqual(args.slice(0, 17));
  }
});
