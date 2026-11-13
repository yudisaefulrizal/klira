import { jest } from '@jest/globals';

const kliraActual0 = await import("@klira/db");
jest.unstable_mockModule('@klira/db', () => {
    const hitungKunjunganUntukKunjunganBerjalan = jest.fn();
    const tambahKunjunganUntukDaftarkan = jest.fn();
    const wajibKunjunganUntukAmbilKunjungan = jest.fn();
    const ringkasanAntreanUntukDaftarkan = jest.fn();
    const tambahAntreanUntukDaftarkan = jest.fn();
    const kunci = jest.fn();
    return { ...kliraActual0,
        pool: {},
        hitungKunjunganUntukKunjunganBerjalan: hitungKunjunganUntukKunjunganBerjalan,
        tambahKunjunganUntukDaftarkan: tambahKunjunganUntukDaftarkan,
        tambahKunjunganUntukDaftarkanHasil: jest.fn(async () => await tambahKunjunganUntukDaftarkan.mock.results.at(-1)?.value),
        wajibKunjunganUntukAmbilKunjungan: wajibKunjunganUntukAmbilKunjungan,
        ringkasanAntreanUntukDaftarkan: ringkasanAntreanUntukDaftarkan,
        tambahAntreanUntukDaftarkan: tambahAntreanUntukDaftarkan,
        transaksi: jest.fn(async (fn) => fn({})),
        kunciPasien: kunci,
        kunciFasyankes: kunci };
});
const db = await import("@klira/db");
const { KunjunganBerjalanError, RepositoriKunjunganMysql } = await import("../data-access/repositori.js");

const repo = new RepositoriKunjunganMysql();

const waktu = new Date('2026-10-29T02:00:00Z');

const data = { pasien_id: 10, jenis: 'AMB', lokasi_id: 3, cara_pembayaran: 'umum', nomor_sep: null, keluhan_singkat: null };

const baru = { id: 22, pasien_id: 10, jenis: 'AMB', status: 'arrived', tahap_layanan: 'menunggu_skrining', cara_pembayaran: 'umum', nomor_sep: null, lokasi_id: 3, keluhan_singkat: null, mulai: waktu, peserta: [], antrean: { id: 32, nomor: 1, status: 'menunggu' } };

beforeEach(() => jest.clearAllMocks());

test('pemeriksaan awal mengabaikan antrean batal, termasuk data lama', async () => {
    jest.mocked(db.hitungKunjunganUntukKunjunganBerjalan).mockResolvedValue(0);
    expect(await repo.kunjunganBerjalan(7, 10)).toBe(false);
    expect(jest.mocked(db.hitungKunjunganUntukKunjunganBerjalan).mock.calls[0].slice(0, 4)).toEqual([7, 10, ['menunggu_skrining', 'pemeriksaan', 'resep', 'kasir'], 'batal']);
});

test('pendaftaran ulang memeriksa kembali dalam transaksi dan membuat kunjungan serta antrean baru', async () => {
    const tx = {};
    jest.mocked(db.hitungKunjunganUntukKunjunganBerjalan).mockImplementation(jest.fn().mockResolvedValue(0));
    jest.mocked(db.tambahKunjunganUntukDaftarkan).mockImplementation(jest.fn().mockResolvedValue(baru));
    jest.mocked(db.wajibKunjunganUntukAmbilKunjungan).mockImplementation(jest.fn().mockResolvedValue(baru));
    jest.mocked(db.ringkasanAntreanUntukDaftarkan).mockImplementation(jest.fn().mockResolvedValue({ _max: { nomor: null } }));
    jest.mocked(db.tambahAntreanUntukDaftarkan).mockImplementation(jest.fn());
    jest.mocked(db.transaksi).mockImplementation(async (fn) => fn(tx));
    const hasil = await repo.daftarkan(7, 4, data, waktu);
    expect(jest.mocked(db.hitungKunjunganUntukKunjunganBerjalan).mock.calls[0].slice(0, 4)).toEqual([7, 10, ['menunggu_skrining', 'pemeriksaan', 'resep', 'kasir'], 'batal']);
    expect(jest.mocked(db.tambahKunjunganUntukDaftarkan).mock.calls.map(args => ({ ...args }))).toEqual(expect.arrayContaining([expect.objectContaining({ 1: 10, 9: waktu })]));
    expect(jest.mocked(db.tambahAntreanUntukDaftarkan).mock.calls.map(args => ({ ...args }))).toEqual(expect.arrayContaining([expect.objectContaining({ 1: 22, 3: new Date('2026-10-29T00:00:00Z'), 4: 1 })]));
    expect(hasil).toMatchObject({ id: 22, pasien_id: 10, antrean: { status: 'menunggu' } });
});

test('kunjungan aktif tetap menolak pendaftaran ganda di dalam transaksi', async () => {
    const tx = {};
    jest.mocked(db.hitungKunjunganUntukKunjunganBerjalan).mockImplementation(jest.fn().mockResolvedValue(1));
    jest.mocked(db.tambahKunjunganUntukDaftarkan).mockImplementation(jest.fn());
    jest.mocked(db.transaksi).mockImplementation(async (fn) => fn(tx));
    await expect(repo.daftarkan(7, 4, data, waktu)).rejects.toBeInstanceOf(KunjunganBerjalanError);
    expect(db.tambahKunjunganUntukDaftarkan).not.toHaveBeenCalled();
});