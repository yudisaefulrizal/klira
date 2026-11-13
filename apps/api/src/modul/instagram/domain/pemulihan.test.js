import { jest } from '@jest/globals';

const kliraActual0 = await import("@klira/db");
jest.unstable_mockModule('@klira/db', () => {
    const daftarIgPesanUntukPulihkanPengirimanInstagram = jest.fn();
    const ubahIgPesanUntukPulihkanPengirimanInstagram = jest.fn();
    return { ...kliraActual0,
        pool: {},
        daftarIgPesanUntukPulihkanPengirimanInstagram: daftarIgPesanUntukPulihkanPengirimanInstagram,
        ubahIgPesanUntukPulihkanPengirimanInstagram: ubahIgPesanUntukPulihkanPengirimanInstagram,
        transaksi: jest.fn(async (fn) => fn({})),
        kunciPercakapanInstagram: jest.fn(),
        pangkasPesanInstagram: jest.fn() };
});
const db = await import("@klira/db");
const { pangkasPesanInstagram } = await import("@klira/db");
const { pulihkanPengirimanInstagram } = await import("./pemulihan.js");

it('mengubah kiriman yang terhenti menjadi belum pasti tanpa pengiriman ulang', async () => {
    const waktu = Date.now();
    jest.mocked(db.daftarIgPesanUntukPulihkanPengirimanInstagram).mockResolvedValue([{ id: 9, percakapan_id: 4 }]);
    jest.mocked(db.transaksi).mockImplementation(async (fn) => fn(db.pool));
    await pulihkanPengirimanInstagram();
    const query = jest.mocked(db.daftarIgPesanUntukPulihkanPengirimanInstagram).mock.calls[0][2];
    const batas = query.getTime();
    expect(batas).toBeGreaterThanOrEqual(waktu - 120000);
    expect(batas).toBeLessThanOrEqual(Date.now() - 120000);
    expect(jest.mocked(db.ubahIgPesanUntukPulihkanPengirimanInstagram).mock.calls.map(args => ({ ...args }))).toEqual(expect.arrayContaining([expect.objectContaining({ 0: 'belum pasti', 1: 9, 2: 'mengirim', 3: new Date(batas) })]));
    expect(pangkasPesanInstagram).toHaveBeenCalledWith(db.pool, 4);
});