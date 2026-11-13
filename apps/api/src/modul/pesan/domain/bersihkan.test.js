import { jest } from '@jest/globals';

const kliraActual0 = await import("@klira/db");
jest.unstable_mockModule('@klira/db', () => ({ ...kliraActual0,
    pool: {},
    transaksi: jest.fn(async (fn) => fn({})),
    kunciWaPercakapanFasyankes: jest.fn(),
    kunciIgPercakapanFasyankes: jest.fn(),
    kunciWaKoneksi: jest.fn(),
    kunciIgKoneksi: jest.fn(),
    tambahLogAuditUntukTambah: jest.fn(),
    ambilWaKoneksi: jest.fn(),
    ambilIgKoneksi: jest.fn(),
    ubahWaKoneksiUntukPutuskanDanBersihkan: jest.fn(),
    ubahIgKoneksiUntukPutuskanDanBersihkan: jest.fn(),
    hapusWaAuthUntukPutuskanDanBersihkan: jest.fn(),
    hapusIgOauthStateUntukPutuskanDanBersihkan: jest.fn(),
    daftarIgMediaUntukBersihkanDalam: jest.fn(),
    hapusWaBacaUntukBersihkanDalam: jest.fn(),
    hapusWaPesanUntukBersihkanDalam: jest.fn(),
    hapusWaPercakapanUntukBersihkanDalam: jest.fn(),
    hapusWaMediaUntukBersihkanDalam: jest.fn(),
    hapusIgBacaUntukBersihkanDalam: jest.fn(),
    hapusIgPesanUntukBersihkanDalam: jest.fn(),
    hapusIgPercakapanUntukBersihkanDalam: jest.fn(),
    hapusIgMediaUntukBersihkanDalam: jest.fn(),
    hapusIgMediaPublikUntukBersihkanDalam: jest.fn(),
    hitungWaPesanUntukBersihkanDalam: jest.fn(),
    hitungIgPesanUntukBersihkanDalam: jest.fn() }));
const { default: express } = await import("express");
const db = await import("@klira/db");
const { buatRuteWhatsapp } = await import("../../whatsapp/entry-points/rute.js");
const { buatRuteInstagram } = await import("../../instagram/entry-points/rute.js");
const { dengarkanWhatsapp } = await import("../../whatsapp/domain/kanal.js");
const { dengarkanInstagram } = await import("../../instagram/domain/kanal.js");

let user;

const akses = { saya: async () => user };

const izin = { catatPenolakan: async () => { }, catatTindakan: async () => { } };

const app = express();

app.use(express.json());

app.use('/api', buatRuteWhatsapp(akses, izin), buatRuteInstagram(akses, izin));

app.use((_e, _req, res, _next) => { void _next; res.status(500).json({ galat: { pesan: 'Gagal' } }); });

let server;

let url;

beforeAll(async () => {
    await new Promise((r) => { server = app.listen(0, '127.0.0.1', () => r()); });
    url = `http://127.0.0.1:${server.address().port}/api`;
});

afterAll(async () => { await new Promise((r) => server.close(() => r())); });

beforeEach(() => {
    jest.clearAllMocks();
    user = { id: 7, fasyankes_id: 10, izin: [{ fitur: 'whatsapp', aksi: 'lihat', cakupan: 'unit' }, { fitur: 'instagram', aksi: 'lihat', cakupan: 'unit' }] };
    for (const hapus of [db.hapusWaBacaUntukBersihkanDalam, db.hapusWaPesanUntukBersihkanDalam, db.hapusWaPercakapanUntukBersihkanDalam, db.hapusWaMediaUntukBersihkanDalam, db.hapusIgBacaUntukBersihkanDalam, db.hapusIgPesanUntukBersihkanDalam, db.hapusIgPercakapanUntukBersihkanDalam, db.hapusIgMediaUntukBersihkanDalam, db.hapusIgMediaPublikUntukBersihkanDalam])
        jest.mocked(hapus).mockResolvedValue({ count: 2 });
    for (const ambil of [db.ambilWaKoneksi, db.ambilIgKoneksi, db.ambilWaKoneksi, db.ambilIgKoneksi])
        jest.mocked(ambil).mockResolvedValue({ id: 1, fasyankes_id: 10, aktif: true });
    jest.mocked(db.hitungWaPesanUntukBersihkanDalam).mockResolvedValue(0);
    jest.mocked(db.hitungIgPesanUntukBersihkanDalam).mockResolvedValue(0);
    jest.mocked(db.daftarIgMediaUntukBersihkanDalam).mockResolvedValue([{ id: 'media-fas-10' }]);
    jest.mocked(db.tambahLogAuditUntukTambah).mockResolvedValue({});
});

const clean = (kanal, body = { konfirmasi: kanal }) => fetch(`${url}/${kanal}/percakapan`, { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

it.each(['whatsapp', 'instagram'])('%s: perlu sesi, izin kanal, dan konfirmasi tepat', async (kanal) => {
    user = null;
    expect((await clean(kanal)).status).toBe(401);
    user = { id: 7, fasyankes_id: 10, izin: [] };
    expect((await clean(kanal)).status).toBe(403);
    user.izin = [{ fitur: kanal, aksi: 'lihat', cakupan: 'unit' }];
    expect((await clean(kanal, {})).status).toBe(400);
    expect((await clean(kanal, { konfirmasi: 'kanal-lain' })).status).toBe(400);
    expect(db.transaksi).not.toHaveBeenCalled();
});

it.each(['whatsapp', 'instagram'])('%s: hapus lokal hanya fasyankes peminta dan kabarkan setelah sukses', async (kanal) => {
    const events = [];
    const stop = kanal === 'whatsapp' ? dengarkanWhatsapp((e) => events.push(e)) : dengarkanInstagram((e) => events.push(e));
    try {
        const res = await clean(kanal);
        expect(res.status).toBe(200);
        expect((await res.json()).data).toEqual({ percakapan: 2, pesan: 2 });
        const hapusPesan = kanal === 'whatsapp' ? db.hapusWaPesanUntukBersihkanDalam : db.hapusIgPesanUntukBersihkanDalam;
        const hapusPercakapan = kanal === 'whatsapp' ? db.hapusWaPercakapanUntukBersihkanDalam : db.hapusIgPercakapanUntukBersihkanDalam;
        expect(hapusPesan).toHaveBeenCalledWith(10, expect.any(Object));
        expect(hapusPercakapan).toHaveBeenCalledWith(10, expect.any(Object));
        expect((kanal === 'whatsapp' ? db.hapusIgPesanUntukBersihkanDalam : db.hapusWaPesanUntukBersihkanDalam)).not.toHaveBeenCalled();
        expect(jest.mocked(db.tambahLogAuditUntukTambah).mock.calls[0].slice(0, 3)).toEqual([10, 7, 'perbaikan']);
        expect(events).toEqual([{ tipe: 'dibersihkan', fasyankes_id: 10 }]);
        if (kanal === 'instagram')
            expect(db.hapusIgMediaPublikUntukBersihkanDalam).toHaveBeenCalledWith(['media-fas-10'], expect.any(Object));
    }
    finally {
        stop();
    }
});

it.each(['whatsapp', 'instagram'])('%s: pengiriman berjalan menolak clean sebelum penghapusan', async (kanal) => {
    const hapusPesan = kanal === 'whatsapp' ? db.hapusWaPesanUntukBersihkanDalam : db.hapusIgPesanUntukBersihkanDalam;
    const hitungPesan = kanal === 'whatsapp' ? db.hitungWaPesanUntukBersihkanDalam : db.hitungIgPesanUntukBersihkanDalam;
    jest.mocked(hitungPesan).mockResolvedValue(1);
    expect((await clean(kanal)).status).toBe(409);
    expect(hapusPesan).not.toHaveBeenCalled();
    expect(db.tambahLogAuditUntukTambah).not.toHaveBeenCalled();
});

it('gagal audit membatalkan transaksi dan tidak menyiarkan keberhasilan', async () => {
    const events = [];
    const stop = dengarkanWhatsapp((e) => events.push(e));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
    try {
        jest.mocked(db.tambahLogAuditUntukTambah).mockRejectedValueOnce(new Error('audit unavailable'));
        expect((await clean('whatsapp')).status).toBe(500);
        expect(events).toEqual([]);
    }
    finally {
        stop();
        consoleSpy.mockRestore();
    }
});

it.each(['whatsapp', 'instagram'])('%s: Keluar menghapus seluruh pesan termasuk antrean dan identitas lama', async (kanal) => {
    jest.mocked(db.hitungWaPesanUntukBersihkanDalam).mockResolvedValue(1);
    jest.mocked(db.hitungIgPesanUntukBersihkanDalam).mockResolvedValue(1);
    const res = await fetch(`${url}/${kanal}/koneksi`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ aksi: 'putuskan' }) });
    expect(res.status).toBe(200);
    const koneksi = kanal === 'whatsapp' ? db.ubahWaKoneksiUntukPutuskanDanBersihkan : db.ubahIgKoneksiUntukPutuskanDanBersihkan;
    const hapusPercakapan = kanal === 'whatsapp' ? db.hapusWaPercakapanUntukBersihkanDalam : db.hapusIgPercakapanUntukBersihkanDalam;
    expect(jest.mocked(koneksi).mock.calls[0]).toEqual(kanal === 'whatsapp' ? [false, 1, 'terputus', null, 10, expect.any(Object)] : [false, 'terputus', '', null, null, 1, 10, expect.any(Object)]);
    expect(hapusPercakapan).toHaveBeenCalledWith(10, expect.any(Object));
    expect((kanal === 'whatsapp' ? db.hapusIgPercakapanUntukBersihkanDalam : db.hapusWaPercakapanUntukBersihkanDalam)).not.toHaveBeenCalled();
});

it.each(['whatsapp', 'instagram'])('%s: koneksi tidak aktif menyembunyikan identitas lama', async (kanal) => {
    const koneksi = kanal === 'whatsapp' ? db.ambilWaKoneksi : db.ambilIgKoneksi;
    jest.mocked(koneksi).mockResolvedValue({ id: 1, fasyankes_id: 10, aktif: false, nomor: '628111111111', username: 'akun-lama', detak: new Date(), status: 'terhubung', token_berakhir: new Date(Date.now() + 60000) });
    const res = await fetch(`${url}/${kanal}/koneksi`);
    expect((await res.json()).data).toMatchObject({ nomor: null, status: 'terputus', tersedia: false });
});