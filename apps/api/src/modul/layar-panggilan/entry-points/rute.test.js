import { jest } from '@jest/globals';

const kliraActual0 = await import("@klira/db");
jest.unstable_mockModule('@klira/db', () => {
    const ambilFasyankesUntukBuatRuteLayarPanggilan = jest.fn();
    const daftarPoliUntukJenis = jest.fn();
    const daftarAntreanUntukBuatRuteLayarPanggilan = jest.fn();
    const daftarEventPanggilanUntukBuatRuteLayarPanggilan = jest.fn();
    const cariEventPanggilanUntukBuatRuteLayarPanggilan = jest.fn();
    return { ...kliraActual0,
        pool: {},
        ambilFasyankesUntukBuatRuteLayarPanggilan: ambilFasyankesUntukBuatRuteLayarPanggilan,
        daftarPoliUntukJenis: daftarPoliUntukJenis,
        daftarAntreanUntukBuatRuteLayarPanggilan: daftarAntreanUntukBuatRuteLayarPanggilan,
        daftarEventPanggilanUntukBuatRuteLayarPanggilan: daftarEventPanggilanUntukBuatRuteLayarPanggilan,
        cariEventPanggilanUntukBuatRuteLayarPanggilan: cariEventPanggilanUntukBuatRuteLayarPanggilan,
        transaksi: jest.fn(async (fn) => fn({})) };
});
const db = await import("@klira/db");
const { default: express } = await import("express");
const { tanggalWib } = await import("@klira/shared");
const { buatRuteLayarPanggilan } = await import("./rute.js");

let server;

beforeAll(() => new Promise((resolve, reject) => {
    const app = express();
    app.use(buatRuteLayarPanggilan());
    server = app.listen(0, '127.0.0.1', (error) => {
        if (error)
            reject(error);
        else
            resolve();
    });
}));

afterAll(() => new Promise(resolve => server.close(() => resolve())));

beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(db.daftarEventPanggilanUntukBuatRuteLayarPanggilan).mockResolvedValue([]);
    jest.mocked(db.cariEventPanggilanUntukBuatRuteLayarPanggilan).mockResolvedValue(null);
});

const ambil = (id) => fetch(`http://127.0.0.1:${server.address().port}/publik/layar-panggilan/${id}`);

test('alamat tidak sah ditolak sebelum membaca database', async () => {
    for (const id of ['abc', '0', '-1', '9007199254740992'])
        expect((await ambil(id)).status).toBe(400);
    expect(db.ambilFasyankesUntukBuatRuteLayarPanggilan).not.toHaveBeenCalled();
});

test('fasilitas tidak ada menghasilkan 404', async () => {
    jest.mocked(db.ambilFasyankesUntukBuatRuteLayarPanggilan).mockResolvedValue(null);
    expect((await ambil('7')).status).toBe(404);
    expect(db.daftarAntreanUntukBuatRuteLayarPanggilan).not.toHaveBeenCalled();
});

test('publik tanpa sesi, terisolasi per fasilitas dan tanggal Jakarta, tanpa identitas pasien', async () => {
    jest.mocked(db.ambilFasyankesUntukBuatRuteLayarPanggilan).mockResolvedValue({ nama: 'Klinik Uji', website_klinik: { logo_url: '/asset/brand/bhakti-rahayu.png' } });
    jest.mocked(db.daftarPoliUntukJenis).mockResolvedValue([
        { id: 9, nama: 'Poli Umum 1', jenis_poli: 'Umum', awalan_antrean: 'U', status_operasional: 'O' },
        { id: 10, nama: 'Poli Umum 2', jenis_poli: 'Umum', awalan_antrean: 'U', status_operasional: 'O' },
        { id: 11, nama: 'Poli Gigi', jenis_poli: 'Gigi', awalan_antrean: 'G', status_operasional: 'O' },
        { id: 12, nama: 'Poli Tutup', jenis_poli: 'Mata', awalan_antrean: 'M', status_operasional: 'U' },
    ]);
    jest.mocked(db.daftarAntreanUntukBuatRuteLayarPanggilan).mockResolvedValue([
        { id: 4, lokasi_id: 9, jenis_poli: 'Umum', awalan: 'U', nomor: 23, status: 'dipanggil', waktu_panggil: new Date('2026-10-29T03:00:00Z') },
        { id: 5, lokasi_id: null, jenis_poli: 'Umum', awalan: 'U', nomor: 25, status: 'menunggu', waktu_panggil: null },
        { id: 3, lokasi_id: null, jenis_poli: 'Umum', awalan: 'U', nomor: 24, status: 'menunggu', waktu_panggil: null },
        { id: 2, lokasi_id: 11, jenis_poli: 'Gigi', awalan: 'G', nomor: 12, status: 'dilayani', waktu_panggil: new Date('2026-10-29T02:00:00Z') },
    ]);
    const res = await ambil('7');
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    const { data } = await res.json();
    expect(data.fasyankes_logo_url).toBe('/asset/brand/bhakti-rahayu.png');
    expect(jest.mocked(db.ambilFasyankesUntukBuatRuteLayarPanggilan).mock.calls.map(args => ({ ...args }))).toEqual(expect.arrayContaining([expect.objectContaining({ 0: 7 })]));
    expect(data.panggilan).toEqual({ kode: 'U-023', poli_id: 9, poli_nama: 'Poli Umum 1', waktu_panggil: '2026-10-29T03:00:00.000Z' });
    expect(data.panggilan_aktif).toEqual([data.panggilan]);
    // Poli tidak operasional tidak tampil; antrean menunggu dibagi per jenis poli (satu nomor berikutnya untuk poli sejenis).
    expect(data.poli.map((p) => p.nama)).toEqual(['Poli Umum 1', 'Poli Umum 2', 'Poli Gigi']);
    expect(data.poli[0].sekarang).toEqual({ kode: 'U-023', status: 'dipanggil' });
    expect(data.poli[1].sekarang).toBeNull();
    expect(data.poli[2].sekarang).toEqual({ kode: 'G-012', status: 'dilayani' });
    expect(data.jenis).toEqual([{ nama: 'Gigi', berikutnya: null, menunggu: 0 }, { nama: 'Umum', berikutnya: 'U-024', menunggu: 2 }]);
    expect(jest.mocked(db.daftarAntreanUntukBuatRuteLayarPanggilan).mock.calls.map(args => ({ ...args }))).toEqual(expect.arrayContaining([expect.objectContaining({ 0: 7, 1: new Date(`${tanggalWib(new Date())}T00:00:00Z`), 2: [9, 10, 11] })]));
    expect(JSON.stringify(data)).not.toMatch(/pasien|nomor_rm|kunjungan_id/);
});

test('antrean kosong tetap mengembalikan poli dan status kosong', async () => {
    jest.mocked(db.ambilFasyankesUntukBuatRuteLayarPanggilan).mockResolvedValue({ nama: 'Klinik Uji' });
    jest.mocked(db.daftarPoliUntukJenis).mockResolvedValue([{ id: 9, nama: 'Poli Umum', jenis_poli: 'Umum', awalan_antrean: 'U', status_operasional: 'O' }]);
    jest.mocked(db.daftarAntreanUntukBuatRuteLayarPanggilan).mockResolvedValue([]);
    const { data } = await (await ambil('7')).json();
    expect(data.fasyankes_logo_url).toBeNull();
    expect(data.panggilan).toBeNull();
    expect(data.panggilan_aktif).toEqual([]);
    expect(data.poli).toEqual([{ id: 9, nama: 'Poli Umum', jenis_poli: 'Umum', sekarang: null }]);
    expect(data.jenis).toEqual([{ nama: 'Umum', berikutnya: null, menunggu: 0 }]);
});

test('kursor tidak sah ditolak sebelum database dibaca', async () => {
    for (const query of ['abc', '-1', '1.5', '9007199254740992', '1&setelah=2'])
        expect((await ambil(`7?setelah=${query}`)).status).toBe(400);
    expect(db.ambilFasyankesUntukBuatRuteLayarPanggilan).not.toHaveBeenCalled();
});

test('kunjungan pertama mendapat posisi terbaru tanpa membacakan histori lama', async () => {
    jest.mocked(db.cariEventPanggilanUntukBuatRuteLayarPanggilan).mockResolvedValue({ id: 42 });
    const { data } = await (await ambil('7')).json();
    expect(data.kursor).toBe(42);
    expect(data.event_panggilan).toEqual([]);
    expect(db.daftarEventPanggilanUntukBuatRuteLayarPanggilan).not.toHaveBeenCalled();
});

test('event dipulihkan per fasilitas dan hari, termasuk panggil ulang dengan waktu identik', async () => {
    const waktu = new Date('2026-10-29T03:00:00Z');
    jest.mocked(db.daftarEventPanggilanUntukBuatRuteLayarPanggilan).mockResolvedValue([43, 44].map(id => ({ id, kode: 'A-023', poli_id: 9, poli_nama: 'Poli Umum', waktu_panggil: waktu })));
    const { data } = await (await ambil('7?setelah=42')).json();
    expect(data.kursor).toBe(44);
    expect(data.event_panggilan.map((e) => e.event_id)).toEqual([43, 44]);
    expect(data.ada_lanjutan).toBe(false);
    expect(jest.mocked(db.daftarEventPanggilanUntukBuatRuteLayarPanggilan).mock.calls.map(args => ({ ...args }))).toEqual(expect.arrayContaining([expect.objectContaining({ 0: 7, 1: new Date(`${tanggalWib(new Date())}T00:00:00Z`), 2: 42 })]));
    expect(JSON.stringify(data.event_panggilan)).not.toMatch(/pasien|nomor_rm|kunjungan/);
});

test('pemulihan bertahap mempertahankan cursor terakhir yang benar-benar dikirim', async () => {
    jest.mocked(db.daftarEventPanggilanUntukBuatRuteLayarPanggilan).mockResolvedValue(Array.from({ length: 101 }, (_, i) => ({ id: i + 43, kode: 'A-023', poli_id: 9, poli_nama: 'Poli Umum', waktu_panggil: new Date() })));
    const { data } = await (await ambil('7?setelah=42')).json();
    expect(data.event_panggilan).toHaveLength(100);
    expect(data.kursor).toBe(142);
    expect(data.ada_lanjutan).toBe(true);
});