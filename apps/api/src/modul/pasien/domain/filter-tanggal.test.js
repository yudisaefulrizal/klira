import { jest } from '@jest/globals';

const kliraActual0 = await import("@klira/db");
jest.unstable_mockModule('@klira/db', () => ({
    ...kliraActual0, pool: {},
    ambilSesiAntreanAktif: jest.fn().mockResolvedValue(null),
    kelompokKunjunganUntukHitungTahap: jest.fn().mockResolvedValue([]),
    hitungKunjunganUntukHitungTahap: jest.fn().mockResolvedValue(0),
    hitungKunjunganUntukCari: jest.fn().mockResolvedValue(0),
    daftarKunjunganUntukCari: jest.fn().mockResolvedValue([]),
    hitungPasienUntukCari: jest.fn().mockResolvedValue(0),
    daftarPasienUntukCari: jest.fn().mockResolvedValue([]),
    daftarAntreanSementaraJkn: jest.fn().mockResolvedValue([]),
}));
const db = await import("@klira/db");
const { filterPasien, TAHAP_BERJALAN } = await import("@klira/shared");
const { RepositoriPasienMysql } = await import("../data-access/repositori.js");

const repo = new RepositoriPasienMysql();

beforeEach(() => jest.clearAllMocks());

test('tanpa tanggal memuat antrean sesi aktif (tanpa sesi: kosong, status tutup, antrean sementara JKN); tanggal mustahil ditolak', async () => {
    jest.mocked(db.daftarAntreanSementaraJkn).mockResolvedValueOnce([{ id: 3 }]);
    const h = await repo.cari({ tahap: 'semua', lewati: 0, ambil: 20 });
    expect(db.ambilSesiAntreanAktif).toHaveBeenCalled();
    expect(db.daftarKunjunganUntukCari).not.toHaveBeenCalled();
    expect(h).toMatchObject({ data: [], total: 0, sesi_antrean: { id: null, status: 'tutup' }, antrean_sementara_jkn: [{ id: 3 }] });
    expect(filterPasien.safeParse({ tanggal: '2026-02-30' }).success).toBe(false);
});

test.each(['semua', 'ditutup', 'batal'])('filter %s dan jumlah tahap memakai batas hari WIB yang sama', async (tahap) => {
    await repo.cari({ tanggal: '2026-10-29', tahap, lewati: 0, ambil: 20 });
    const mulai = { gte: new Date('2026-10-28T17:00:00Z'), lt: new Date('2026-10-29T17:00:00Z') };
    const daftar = jest.mocked(db.daftarKunjunganUntukCari).mock.calls[0];
    const hitung = jest.mocked(db.hitungKunjunganUntukCari).mock.calls[0];
    expect(daftar.slice(0, hitung.length)).toEqual(hitung);
    const posisi = tahap === 'batal' ? 0 : tahap === 'semua' ? 4 : 6;
    expect(daftar.slice(posisi, posisi + 2)).toEqual([mulai.gte, mulai.lt]);
    expect(db.kelompokKunjunganUntukHitungTahap).toHaveBeenCalledWith(mulai, 'batal');
    expect(db.hitungKunjunganUntukHitungTahap).toHaveBeenCalledWith(mulai, 'batal');
});

test('pencarian tetap mengikuti tanggal terpilih', async () => {
    await repo.cari({ tanggal: '2026-10-28', cari: 'Siti', tahap: 'semua', lewati: 0, ambil: 20 });
    const args = jest.mocked(db.daftarPasienUntukCari).mock.calls[0];
    expect(args.slice(9, 11)).toEqual([new Date('2026-10-27T17:00:00Z'), new Date('2026-10-28T17:00:00Z')]);
    expect(args[15]).toBe(true);
});

test('pemilih pasien tanpa tanggal dapat mencari pasien yang belum berkunjung', async () => {
    await repo.cari({ cari: 'Siti', tahap: 'semua', lewati: 0, ambil: 10 });
    const args = jest.mocked(db.daftarPasienUntukCari).mock.calls[0];
    expect(args.slice(9, 11)).toEqual([undefined, undefined]);
    expect(args[15]).toBe(false);
});

test.each([undefined, 'Siti'])('semua mencakup tahap selesai dan batal pada tanggal terpilih (cari: %s)', async (cari) => {
    await repo.cari({ tanggal: '2026-10-29', cari, tahap: 'semua', lewati: 0, ambil: 20 });
    if (cari) {
        const args = jest.mocked(db.daftarPasienUntukCari).mock.calls[0];
        expect(args[8]).toBe(false); // tidak membatasi hanya antrean batal
        expect(args[14]).toBe(false); // tidak mengecualikan antrean batal
        expect(args[13]).toBeUndefined(); // seluruh tahap
    }
    else {
        const args = jest.mocked(db.daftarKunjunganUntukCari).mock.calls[0];
        expect(args[3]).toBe(false);
        expect(args[9]).toBe(false);
        expect(args[8]).toBeUndefined();
    }
});

test('pemilih kunjungan mengecualikan pasien dengan kunjungan berjalan sebelum paginasi', async () => {
    await repo.cari({ cari: 'Siti', tahap: 'semua', untuk_kunjungan: 'true', lewati: 0, ambil: 20 });
    const args = jest.mocked(db.daftarPasienUntukCari).mock.calls[0];
    expect(args.slice(0, 3)).toEqual([[...TAHAP_BERJALAN], 'batal', true]);
    expect(args.slice(16, 18)).toEqual([20, 0]);
    expect(jest.mocked(db.hitungPasienUntukCari).mock.calls[0]).toEqual(args.slice(0, 16));
    expect(filterPasien.parse({ untuk_kunjungan: 'true' }).untuk_kunjungan).toBe('true');
    expect(filterPasien.safeParse({ untuk_kunjungan: 'salah' }).success).toBe(false);
});

test.each([undefined, 'true'])('pencarian nomor JKN lengkap atau awalan tetap dibatasi fasilitas (pemilih: %s)', async (untuk_kunjungan) => {
    for (const cari of ['0001234567890', '000123']) {
        await repo.cari({ cari, tahap: 'semua', untuk_kunjungan, lewati: 0, ambil: 20 });
        const args = jest.mocked(db.daftarPasienUntukCari).mock.calls.at(-1);
        expect(args.slice(3, 6)).toEqual([cari, cari, true]);
        expect(jest.mocked(db.hitungPasienUntukCari).mock.calls.at(-1)).toEqual(args.slice(0, 16));
    }
});