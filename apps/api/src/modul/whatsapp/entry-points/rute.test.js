import { jest } from '@jest/globals';

const kliraActual0 = await import("../../pesan/domain/bersihkan.js");
const kliraActual1 = await import("@klira/db");
jest.unstable_mockModule('../../pesan/domain/bersihkan.js', () => ({ ...kliraActual0, putuskanDanBersihkan: jest.fn(async () => ({ percakapan: 1, pesan: 2 })) }));
jest.unstable_mockModule('@klira/db', () => {
    const cariWaPercakapanUntukBuatRuteWhatsapp = jest.fn();
    const ambilWaPercakapanUntukBuatRuteWhatsapp = jest.fn();
    const simpanWaPercakapanUntukBuatRuteWhatsapp = jest.fn();
    const ubahWaPercakapanUntukBuatRuteWhatsapp2 = jest.fn();
    const ubahWaPercakapanUntukBuatRuteWhatsapp = jest.fn();
    const ambilWaKoneksi = jest.fn();
    const simpanWaKoneksiUntukBuatRuteWhatsapp = jest.fn();
    const cariWaMediaUntukBuatRuteWhatsapp = jest.fn();
    const daftarWaPesanUntukBuatRuteWhatsapp = jest.fn();
    const cariWaPesanUntukBuatRuteWhatsapp = jest.fn();
    const tambahWaPesanUntukBuatRuteWhatsapp = jest.fn();
    const simpanWaBacaUntukBuatRuteWhatsapp = jest.fn();
    const ubahWaBacaUntukBuatRuteWhatsapp = jest.fn();
    const cariPasienUntukBuatRuteWhatsapp = jest.fn();
    const cariPenggunaUntukBuatRuteInstagram = jest.fn();
    const kunci = jest.fn();
    return { ...kliraActual1,
        pool: {},
        cariWaPercakapanUntukBuatRuteWhatsapp: cariWaPercakapanUntukBuatRuteWhatsapp,
        ambilWaPercakapanUntukBuatRuteWhatsapp: ambilWaPercakapanUntukBuatRuteWhatsapp,
        simpanWaPercakapanUntukBuatRuteWhatsapp: simpanWaPercakapanUntukBuatRuteWhatsapp,
        simpanWaPercakapanUntukBuatRuteWhatsappHasil: jest.fn(async () => await simpanWaPercakapanUntukBuatRuteWhatsapp.mock.results.at(-1)?.value),
        ubahWaPercakapanUntukBuatRuteWhatsapp2: ubahWaPercakapanUntukBuatRuteWhatsapp2,
        ubahWaPercakapanUntukBuatRuteWhatsapp3: ubahWaPercakapanUntukBuatRuteWhatsapp2,
        ubahWaPercakapanUntukBuatRuteWhatsapp: ubahWaPercakapanUntukBuatRuteWhatsapp,
        ambilWaKoneksi: ambilWaKoneksi,
        simpanWaKoneksiUntukBuatRuteWhatsapp: simpanWaKoneksiUntukBuatRuteWhatsapp,
        cariWaMediaUntukBuatRuteWhatsapp: cariWaMediaUntukBuatRuteWhatsapp,
        daftarWaPesanUntukBuatRuteWhatsapp: daftarWaPesanUntukBuatRuteWhatsapp,
        cariWaPesanUntukBuatRuteWhatsapp: cariWaPesanUntukBuatRuteWhatsapp,
        tambahWaPesanUntukBuatRuteWhatsapp: tambahWaPesanUntukBuatRuteWhatsapp,
        tambahWaPesanUntukBuatRuteWhatsappHasil: jest.fn(async () => await tambahWaPesanUntukBuatRuteWhatsapp.mock.results.at(-1)?.value),
        simpanWaBacaUntukBuatRuteWhatsapp: simpanWaBacaUntukBuatRuteWhatsapp,
        ubahWaBacaUntukBuatRuteWhatsapp: ubahWaBacaUntukBuatRuteWhatsapp,
        cariPasienUntukBuatRuteWhatsapp: cariPasienUntukBuatRuteWhatsapp,
        cariPasienUntukBuatRuteWhatsapp2: cariPasienUntukBuatRuteWhatsapp,
        cariPasienUntukBuatRuteInstagram: cariPasienUntukBuatRuteWhatsapp,
        cariPasienUntukBuatRuteInstagram2: cariPasienUntukBuatRuteWhatsapp,
        cariPenggunaUntukCariAkunByUsername: cariPenggunaUntukBuatRuteInstagram,
        cariPenggunaUntukUsernameDipakai: cariPenggunaUntukBuatRuteInstagram,
        cariPenggunaUntukBuatRuteInstagram: cariPenggunaUntukBuatRuteInstagram,
        cariPenggunaUntukBuatRuteInstagram2: cariPenggunaUntukBuatRuteInstagram,
        transaksi: jest.fn(async (fn) => fn({})),
        kunciWaPercakapanFasyankes: kunci,
        kunciIgPercakapanFasyankes: kunci,
        kunciWaKoneksi: kunci,
        kunciIgKoneksi: kunci,
        hitungWaPercakapanBelumDibaca: kunci,
        kunciPercakapanWhatsapp: jest.fn(async () => { }),
        pangkasPesanWhatsapp: jest.fn(async () => { }),
        dekripsiRahasia: jest.fn((v) => v),
        enkripsiRahasia: jest.fn((v) => v) };
});
jest.unstable_mockModule('../../../middleware/audit.js', () => ({
    alamatDari: () => 'uji',
    buatFasilitasAudit: () => ({
        perbaikan: () => (_req, _res, next) => next(),
        lihat: () => (_req, _res, next) => next(),
    }),
}));
const db = await import("@klira/db");
const { putuskanDanBersihkan } = await import("../../pesan/domain/bersihkan.js");
const { default: express } = await import("express");
const { buatRuteWhatsapp } = await import("./rute.js");

let user;

const akses = { saya: jest.fn(async () => user) };

const izin = {
    catatPenolakan: jest.fn(async () => { }),
    catatTindakan: jest.fn(async () => { }),
};

const app = express();

app.use(express.json());

app.use('/api', buatRuteWhatsapp(akses, izin));

const server = app.listen(0, '127.0.0.1');

let port;

beforeAll(async () => {
    if (!server.listening)
        await new Promise((resolve, reject) => {
            server.once('listening', resolve);
            server.once('error', reject);
        });
    port = server.address().port;
});

const call = (jalur, body, headers = {}) => fetch(`http://127.0.0.1:${port}/api/whatsapp${jalur}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'content-type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
});

beforeEach(() => {
    jest.clearAllMocks();
    user = {
        id: 7,
        fasyankes_id: 2,
        izin: [{ fitur: 'whatsapp', aksi: 'lihat', cakupan: 'unit' }],
    };
});

afterAll(() => server.close());

it('menolak pengguna tanpa sesi dan tanpa izin', async () => {
    user = null;
    expect((await call('/ringkasan')).status).toBe(401);
    user = { id: 7, fasyankes_id: 2, izin: [] };
    expect((await call('/ringkasan')).status).toBe(403);
});

it('membatasi percakapan ke fasyankes pengguna', async () => {
    jest.mocked(db.cariWaPercakapanUntukBuatRuteWhatsapp).mockResolvedValue(null);
    expect((await call('/percakapan/99/pesan')).status).toBe(404);
    expect(jest.mocked(db.cariWaPercakapanUntukBuatRuteWhatsapp).mock.calls.map(args => ({ ...args }))).toEqual(expect.arrayContaining([expect.objectContaining({ 0: 99, 1: 2 })]));
});

it('satu izin WhatsApp memberi akses pengelolaan koneksi', async () => {
    jest.mocked(db.ambilWaKoneksi).mockResolvedValue({ fasyankes_id: 2 });
    expect((await call('/koneksi', { aksi: 'hubungkan' })).status).toBe(200);
    expect(db.simpanWaKoneksiUntukBuatRuteWhatsapp).toHaveBeenCalled();
});

it('satu izin WhatsApp dapat melihat QR', async () => {
    jest
        .mocked(db.ambilWaKoneksi)
        .mockResolvedValue({ fasyankes_id: 2, detak: new Date(), status: 'qr', aktif: true, qr: 'qr-uji', nomor: null });
    const response = await call('/koneksi');
    expect(response.status).toBe(200);
    expect((await response.json()).data.qr).toBe('qr-uji');
});

it('menolak pengiriman saat koneksi tidak aktif', async () => {
    jest
        .mocked(db.cariWaPercakapanUntukBuatRuteWhatsapp)
        .mockResolvedValue({ id: 3, fasyankes_id: 2, jid: '6281234567890@s.whatsapp.net' });
    jest.mocked(db.ambilWaKoneksi).mockResolvedValue(null);
    expect((await call('/percakapan/3/pesan', { teks: 'halo' })).status).toBe(409);
});

it('menolak penautan nomor yang sudah menjadi milik pasien lain', async () => {
    user.izin.push({ fitur: 'pasien', aksi: 'lihat', cakupan: 'unit' });
    jest.mocked(db.cariPasienUntukBuatRuteWhatsapp).mockResolvedValue({ id: 5, nama: 'Pasien' });
    jest.mocked(db.ambilWaPercakapanUntukBuatRuteWhatsapp).mockResolvedValue({ pasien_id: 9 });
    expect((await call('/percakapan', { nomor: '081234567890', pasien_id: 5 })).status).toBe(409);
    expect(db.simpanWaPercakapanUntukBuatRuteWhatsapp).not.toHaveBeenCalled();
});

it('mengantrekan balasan dalam transaksi, tanpa mengirim dari proses API', async () => {
    jest
        .mocked(db.cariWaPercakapanUntukBuatRuteWhatsapp)
        .mockResolvedValue({ id: 3, fasyankes_id: 2, jid: '6281234567890@s.whatsapp.net' });
    jest
        .mocked(db.ambilWaKoneksi)
        .mockResolvedValue({ fasyankes_id: 2, aktif: true, status: 'terhubung', detak: new Date() });
    jest.mocked(db.tambahWaPesanUntukBuatRuteWhatsapp).mockResolvedValue({ id: 40 });
    db.transaksi.mockImplementation((callback) => callback(db.pool));
    expect((await call('/percakapan/3/pesan', { teks: 'halo' })).status).toBe(201);
    expect(jest.mocked(db.tambahWaPesanUntukBuatRuteWhatsapp).mock.calls.map(args => ({ ...args }))).toEqual(expect.arrayContaining([expect.objectContaining({ 0: 3, 1: 'keluar', 5: 'antre', 6: 7 })]));
});

it('penanda baca hanya bergerak maju sampai pesan yang benar-benar dibuka', async () => {
    jest
        .mocked(db.cariWaPercakapanUntukBuatRuteWhatsapp)
        .mockResolvedValue({ id: 3, fasyankes_id: 2, jid: '6281234567890@s.whatsapp.net' });
    jest.mocked(db.cariWaPesanUntukBuatRuteWhatsapp).mockResolvedValue({ id: 40, percakapan_id: 3 });
    expect((await call('/percakapan/3/baca', { pesan_id: 40 })).status).toBe(200);
    expect(jest.mocked(db.ubahWaBacaUntukBuatRuteWhatsapp).mock.calls.map(args => ({ ...args }))).toEqual(expect.arrayContaining([expect.objectContaining({ 0: 40, 1: 3, 2: 7 })]));
});

it('memutuskan koneksi membersihkan pesan fasyankes peminta', async () => {
    jest.mocked(db.ambilWaKoneksi).mockResolvedValue({ fasyankes_id: 2 });
    expect((await call('/koneksi', { aksi: 'putuskan' })).status).toBe(200);
    expect(putuskanDanBersihkan).toHaveBeenCalledWith('whatsapp', expect.objectContaining({ fasyankes_id: 2 }), expect.any(String));
});

it('izin inbox saja tidak boleh mengambil identitas pasien melalui penautan', async () => {
    expect((await call('/percakapan', { nomor: '081234567890', pasien_id: 5 })).status).toBe(403);
    expect(db.cariPasienUntukBuatRuteWhatsapp).not.toHaveBeenCalled();
});

it('menolak akses langsung serta balasan pada percakapan grup', async () => {
    jest.mocked(db.cariWaPercakapanUntukBuatRuteWhatsapp).mockResolvedValue({ id: 3, fasyankes_id: 2, jid: '123456@g.us' });
    expect((await call('/percakapan/3/pesan')).status).toBe(404);
    expect((await call('/percakapan/3/pesan', { teks: 'halo' })).status).toBe(404);
    expect(db.tambahWaPesanUntukBuatRuteWhatsapp).not.toHaveBeenCalled();
});

describe('pratinjau lampiran terautentikasi', () => {
    beforeEach(() => {
        jest.mocked(db.cariWaMediaUntukBuatRuteWhatsapp).mockResolvedValue({
            id: 'media-uji',
            fasyankes_id: 2,
            mime: 'video/mp4',
            nama: 'video.mp4',
            isi: Buffer.from('abcdef').toString('base64'),
        });
    });
    it('tetap mengunduh secara bawaan dan hanya mengizinkan pratinjau media yang dikenal', async () => {
        const unduh = await call('/media/media-uji');
        expect(unduh.headers.get('content-disposition')).toContain('attachment');
        const preview = await call('/media/media-uji?pratinjau=1');
        expect(preview.headers.get('content-type')).toContain('video/mp4');
        expect(preview.headers.get('content-disposition')).toBe('inline');
        expect(await preview.text()).toBe('abcdef');
        expect(jest.mocked(db.cariWaMediaUntukBuatRuteWhatsapp).mock.calls.map(args => ({ ...args }))).toEqual(expect.arrayContaining([expect.objectContaining({ 0: 'media-uji', 1: 2 })]));
    });
    it('mendukung range agar video dapat diputar dan digeser', async () => {
        const response = await call('/media/media-uji?pratinjau=1', undefined, { range: 'bytes=1-3' });
        expect(response.status).toBe(206);
        expect(response.headers.get('content-range')).toBe('bytes 1-3/6');
        expect(await response.text()).toBe('bcd');
        const suffix = await call('/media/media-uji?pratinjau=1', undefined, { range: 'bytes=-2' });
        expect(await suffix.text()).toBe('ef');
        expect((await call('/media/media-uji?pratinjau=1', undefined, { range: 'bytes=99-' })).status).toBe(416);
    });
    it('HTML tetap menjadi unduhan dan sesi wajib tersedia', async () => {
        jest.mocked(db.cariWaMediaUntukBuatRuteWhatsapp).mockResolvedValue({
            id: 'media-uji',
            mime: 'text/html',
            nama: 'dokumen.html',
            isi: Buffer.from('abc').toString('base64'),
        });
        const response = await call('/media/media-uji?pratinjau=1');
        expect(response.headers.get('content-disposition')).toContain('attachment');
        user = null;
        expect((await call('/media/media-uji?pratinjau=1')).status).toBe(401);
    });
});

it('membatasi riwayat API menjadi sepuluh pesan terakhir', async () => {
    jest
        .mocked(db.cariWaPercakapanUntukBuatRuteWhatsapp)
        .mockResolvedValue({ id: 3, fasyankes_id: 2, jid: '6281234567890@s.whatsapp.net' });
    jest.mocked(db.daftarWaPesanUntukBuatRuteWhatsapp).mockResolvedValue([]);
    expect((await call('/percakapan/3/pesan?sebelum=999')).status).toBe(200);
    expect(jest.mocked(db.daftarWaPesanUntukBuatRuteWhatsapp).mock.calls.map(args => ({ ...args }))).toEqual(expect.arrayContaining([expect.objectContaining({ 0: 3, 1: 10 })]));
});

describe('informasi kontak dan penautan pasien', () => {
    beforeEach(() => {
        jest
            .mocked(db.cariWaPercakapanUntukBuatRuteWhatsapp)
            .mockResolvedValue({
            id: 3,
            fasyankes_id: 2,
            jid: '6281234567890@s.whatsapp.net',
            pasien_id: 5,
            penanggung_jawab: null,
        });
    });
    const patch = (body) => fetch(`http://127.0.0.1:${port}/api/whatsapp/percakapan/3`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
    });
    it('menyembunyikan identitas pasien jika hanya memiliki izin WhatsApp', async () => {
        const res = await call('/percakapan/3/info');
        expect(res.status).toBe(200);
        expect((await res.json()).data).toEqual({ pasien_tertaut: true, pasien: null, penanggung: null });
        expect(db.cariPasienUntukBuatRuteWhatsapp).not.toHaveBeenCalled();
        expect((await patch({ pasien_id: 5 })).status).toBe(403);
    });
    it('hanya membaca identitas pasien pada fasyankes yang sama', async () => {
        user.izin.push({ fitur: 'pasien', aksi: 'lihat', cakupan: 'unit' });
        jest.mocked(db.cariPasienUntukBuatRuteWhatsapp).mockResolvedValue({ id: 5, nama: 'Pasien uji', nomor_rm: 'RM005' });
        expect((await call('/percakapan/3/info')).status).toBe(200);
        expect(jest.mocked(db.cariPasienUntukBuatRuteWhatsapp).mock.calls.map(args => ({ ...args }))).toEqual(expect.arrayContaining([expect.objectContaining({ 0: 5, 1: 2 })]));
    });
    it('menautkan dengan pembatas agar tautan pasien lain tidak tertimpa', async () => {
        user.izin.push({ fitur: 'pasien', aksi: 'lihat', cakupan: 'unit' });
        jest.mocked(db.cariPasienUntukBuatRuteWhatsapp).mockResolvedValue({ id: 5 });
        jest.mocked(db.ubahWaPercakapanUntukBuatRuteWhatsapp).mockResolvedValue({ count: 1 });
        expect((await patch({ pasien_id: 5 })).status).toBe(200);
        expect(jest.mocked(db.ubahWaPercakapanUntukBuatRuteWhatsapp).mock.calls.map(args => ({ ...args }))).toEqual(expect.arrayContaining([expect.objectContaining({ 0: 5, 2: 3, 3: null, 4: 5 })]));
        jest.mocked(db.ubahWaPercakapanUntukBuatRuteWhatsapp).mockResolvedValue({ count: 0 });
        expect((await patch({ pasien_id: 5 })).status).toBe(409);
    });
});

describe('kontak WhatsApp dari data pasien', () => {
    it('menyediakan nomor pasien dan kontak wali secara terpisah', async () => {
        user.izin.push({ fitur: 'pasien', aksi: 'lihat', cakupan: 'unit' });
        const pasien = { id: 5, nama: 'Ayu', nomor_hp: '6281234567890', wali_keluarga: [{ nama: 'Budi', hubungan: 'Ayah', kontak: '089999999999' }] };
        jest.mocked(db.cariPasienUntukBuatRuteWhatsapp).mockResolvedValue(pasien);
        const res = await call('/pasien/5');
        expect(res.status).toBe(200);
        expect((await res.json()).data).toEqual(pasien);
        expect(jest.mocked(db.cariPasienUntukBuatRuteWhatsapp).mock.calls.map(args => ({ ...args }))).toEqual(expect.arrayContaining([expect.objectContaining({ 0: 5, 1: 2 })]));
    });
    it('tetap menyediakan kontak wali ketika nomor pasien kosong', async () => {
        user.izin.push({ fitur: 'pasien', aksi: 'lihat', cakupan: 'unit' });
        jest.mocked(db.cariPasienUntukBuatRuteWhatsapp).mockResolvedValue({ id: 5, nama: 'Ayu', nomor_hp: null, wali_keluarga: [] });
        expect((await (await call('/pasien/5')).json()).data.nomor_hp).toBeNull();
    });
    it('menolak tanpa izin pasien dan tidak membocorkan pasien lintas fasyankes', async () => {
        expect((await call('/pasien/5')).status).toBe(403);
        expect(db.cariPasienUntukBuatRuteWhatsapp).not.toHaveBeenCalled();
        user.izin.push({ fitur: 'pasien', aksi: 'lihat', cakupan: 'unit' });
        jest.mocked(db.cariPasienUntukBuatRuteWhatsapp).mockResolvedValue(null);
        expect((await call('/pasien/5')).status).toBe(404);
    });
});