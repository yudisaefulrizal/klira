import { jest } from '@jest/globals';

const { default: express } = await import("express");
const { buatRuteFarmasi } = await import("../entry-points/rute.js");
const { buatRuteKasirLengkap } = await import("../../kasir/entry-points/rute-kasir.js");

let server;

const serahTerima = jest.fn().mockResolvedValue({ ok: true, data: { resep: [], kekurangan: [] } });

const bayar = jest.fn().mockResolvedValue({ ok: true, data: {} });

const resepKunjungan = jest.fn().mockResolvedValue({ ok: true, data: [] });

const akses = {
    saya: async (sesi) => sesi ? { id: 8, fasyankes_id: 4, izin: [{ fitur: sesi, aksi: 'input', cakupan: 'unit' }] } : null,
};

const izin = { catatPenolakan: jest.fn().mockResolvedValue(undefined), catatTindakan: jest.fn().mockResolvedValue(undefined) };

beforeAll(() => new Promise((resolve, reject) => {
    const app = express();
    app.use(express.json());
    app.use(buatRuteKasirLengkap(akses, izin, { bayar }));
    app.use(buatRuteFarmasi(akses, izin, { serahTerima, resepKunjungan }));
    server = app.listen(0, '127.0.0.1', (error) => { if (error)
        reject(error);
    else
        resolve(); });
}));

afterAll(() => new Promise((resolve) => server.close(() => resolve())));

beforeEach(() => jest.clearAllMocks());

async function panggil(jalur, fitur, badan = {}) {
    return fetch(`http://127.0.0.1:${server.address().port}${jalur}`, {
        method: 'POST', headers: { 'content-type': 'application/json', ...(fitur ? { cookie: `klira_sesi=${fitur}` } : {}) }, body: JSON.stringify(badan),
    });
}

test('penyerahan memerlukan sesi dan izin farmasi; izin kasir saja tidak cukup', async () => {
    expect((await panggil('/kunjungan/12/serah-terima-obat')).status).toBe(401);
    expect((await panggil('/kunjungan/12/serah-terima-obat', 'kasir')).status).toBe(403);
    expect(serahTerima).not.toHaveBeenCalled();
    expect((await panggil('/kunjungan/12/serah-terima-obat', 'farmasi')).status).toBe(200);
    expect(serahTerima).toHaveBeenCalledWith(expect.objectContaining({ id: 8, fasyankes_id: 4 }), 12, { izinkan_stok_kurang: false }, expect.any(String));
    expect(bayar).not.toHaveBeenCalled();
});

test('izin farmasi tidak memberi akses mencatat pembayaran', async () => {
    expect((await panggil('/kunjungan/12/pembayaran', 'farmasi', { pembayaran: [{ metode: 'tunai', jumlah: 5000 }] })).status).toBe(403);
    expect(bayar).not.toHaveBeenCalled();
    expect((await panggil('/kunjungan/12/pembayaran', 'kasir', { pembayaran: [{ metode: 'tunai', jumlah: 5000 }] })).status).toBe(201);
    expect(serahTerima).not.toHaveBeenCalled();
});

test('penyerahan menolak stok override tanpa alasan dan id tidak sah sebelum layanan', async () => {
    expect((await panggil('/kunjungan/12/serah-terima-obat', 'farmasi', { izinkan_stok_kurang: true })).status).toBe(400);
    expect((await panggil('/kunjungan/abc/serah-terima-obat', 'farmasi')).status).toBe(404);
    expect(serahTerima).not.toHaveBeenCalled();
});