import { jest } from '@jest/globals';

const { default: express } = await import("express");
const { buatRutePasien } = await import("../entry-points/rute.js");

let user;

const perbaiki = jest.fn(async () => ({ ok: true, data: { id: 9 } }));

const layanan = { perbaiki };

const akses = { saya: async () => user };

const izin = { catatPenolakan: async () => { }, catatTindakan: async () => { } };

const app = express();

app.use(express.json());

app.use(buatRutePasien(akses, izin, layanan));

const server = app.listen(0, '127.0.0.1');

let url;

beforeAll(async () => {
    if (!server.listening)
        await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
    url = `http://127.0.0.1:${server.address().port}/pasien/9`;
});

afterAll(() => server.close());

beforeEach(() => { jest.clearAllMocks(); user = { id: 7, fasyankes_id: 2, izin: [{ fitur: 'pasien', aksi: 'perbaikan', cakupan: 'unit' }] }; });

const dasar = { nama: 'Ayu', nik: '3201010101900001', tanggal_lahir: '1990-05-01', jenis_kelamin: 'perempuan', wali: [] };

const kirim = (body = dasar) => fetch(url, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

it('menolak tanpa sesi atau hanya memiliki izin lihat', async () => {
    user = null;
    expect((await kirim()).status).toBe(401);
    user = { id: 7, fasyankes_id: 2, izin: [{ fitur: 'pasien', aksi: 'lihat', cakupan: 'unit' }] };
    expect((await kirim()).status).toBe(403);
    expect(perbaiki).not.toHaveBeenCalled();
});

it('memvalidasi data sebelum meneruskan perubahan', async () => {
    expect((await kirim({ ...dasar, nama: '' })).status).toBe(400);
    expect(perbaiki).not.toHaveBeenCalled();
});

it('menyimpan lewat izin perbaikan dengan identitas pelaku dari sesi', async () => {
    expect((await kirim()).status).toBe(200);
    expect(perbaiki).toHaveBeenCalledWith(user, 9, expect.objectContaining({ nama: 'Ayu', jalur_identitas: 'nik' }), expect.any(String));
});