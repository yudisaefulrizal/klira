import { jest } from '@jest/globals';

const kliraActual0 = await import("@klira/db");
jest.unstable_mockModule('@klira/db', () => {
    const cariWebsiteKlinikUntukBacaKlinikPublik = jest.fn();
    const daftarWebsiteKlinikUntukBacaKlinikPublik = jest.fn();
    const hitungWebsiteKlinikUntukBacaKlinikPublik = jest.fn();
    const ambilFasyankesUntukPengaturanWebsite = jest.fn();
    const daftarLokasiUntukBacaKlinikPublik = jest.fn();
    const daftarJadwalPraktikUntukBacaKlinikPublik = jest.fn();
    return { ...kliraActual0,
        pool: {},
        cariWebsiteKlinikUntukBacaKlinikPublik: cariWebsiteKlinikUntukBacaKlinikPublik,
        daftarWebsiteKlinikUntukBacaKlinikPublik: daftarWebsiteKlinikUntukBacaKlinikPublik,
        hitungWebsiteKlinikUntukBacaKlinikPublik: hitungWebsiteKlinikUntukBacaKlinikPublik,
        ambilFasyankesUntukPengaturanWebsite: ambilFasyankesUntukPengaturanWebsite,
        daftarLokasiUntukBacaKlinikPublik: daftarLokasiUntukBacaKlinikPublik,
        daftarJadwalPraktikUntukBacaKlinikPublik: daftarJadwalPraktikUntukBacaKlinikPublik,
        transaksi: jest.fn(async (fn) => fn({})) };
});
const db = await import("@klira/db");
const { WEBSITE_KLINIK_BAWAAN, tanggalWib } = await import("@klira/shared");
const { bacaKlinikPublik, pengaturanWebsite } = await import("./data.js");

const web = { ...WEBSITE_KLINIK_BAWAAN, aktif: true, slug: 'klinik-a', domain: 'klinik.example', fasyankes_id: 7, fasyankes: { nama: 'Klinik A' } };

beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(db.cariWebsiteKlinikUntukBacaKlinikPublik).mockResolvedValue(web);
    jest.mocked(db.daftarWebsiteKlinikUntukBacaKlinikPublik).mockResolvedValue([]);
    jest.mocked(db.hitungWebsiteKlinikUntukBacaKlinikPublik).mockResolvedValue(0);
    jest.mocked(db.daftarLokasiUntukBacaKlinikPublik).mockResolvedValue([{ id: 3, nama: 'Poli Umum' }]);
    jest.mocked(db.daftarJadwalPraktikUntukBacaKlinikPublik).mockResolvedValue([{ hari: 4, jam_mulai: '08:00', jam_selesai: '12:00', lokasi_id: 3, pengguna: { nama: 'Nama internal' } }]);
});

test('domain memilih website aktif, query layanan dan jadwal terisolasi, identitas internal tidak dikirim', async () => {
    const data = await bacaKlinikPublik('KLINIK.EXAMPLE');
    expect(data?.nama).toBe('Klinik A');
    expect(data?.jadwal[0].praktisi).toBeNull();
    expect(jest.mocked(db.cariWebsiteKlinikUntukBacaKlinikPublik).mock.calls.map(args => ({ ...args }))).toEqual(expect.arrayContaining([expect.objectContaining({ 0: true, 2: 'klinik.example' })]));
    expect(jest.mocked(db.daftarLokasiUntukBacaKlinikPublik).mock.calls.map(args => ({ ...args }))).toEqual(expect.arrayContaining([expect.objectContaining({ 0: 7, 1: 'poli', 2: 'O' })]));
    expect(jest.mocked(db.daftarJadwalPraktikUntukBacaKlinikPublik).mock.calls.map(args => ({ ...args }))).toEqual(expect.arrayContaining([expect.objectContaining({ 0: 7, 1: true, 2: new Date(`${tanggalWib(new Date())}T00:00:00Z`), 5: [3] })]));
    expect(JSON.stringify(data)).not.toMatch(/fasyankes_id|pengguna_id|nomor_sip|Nama internal|nomor_rm|tampilkan_nama/);
});

test('slug hanya membaca profil terpublikasi yang diminta; slug tidak ada tidak memakai fallback klinik lain', async () => {
    jest.mocked(db.cariWebsiteKlinikUntukBacaKlinikPublik).mockResolvedValue(null);
    expect(await bacaKlinikPublik('klinik.example', 'tidak-ada')).toBeNull();
    expect(db.daftarWebsiteKlinikUntukBacaKlinikPublik).not.toHaveBeenCalled();
    expect(jest.mocked(db.cariWebsiteKlinikUntukBacaKlinikPublik).mock.calls.map(args => ({ ...args }))).toEqual(expect.arrayContaining([expect.objectContaining({ 0: true, 1: 'tidak-ada' })]));
});

test('root otomatis hanya untuk satu profil tanpa domain; banyak profil tidak dipilih sembarang', async () => {
    jest.mocked(db.cariWebsiteKlinikUntukBacaKlinikPublik).mockResolvedValue(null);
    jest.mocked(db.daftarWebsiteKlinikUntukBacaKlinikPublik).mockResolvedValue([{ ...web, domain: null }]);
    jest.mocked(db.hitungWebsiteKlinikUntukBacaKlinikPublik).mockResolvedValue(1);
    expect((await bacaKlinikPublik('localhost'))?.nama).toBe('Klinik A');
    jest.mocked(db.hitungWebsiteKlinikUntukBacaKlinikPublik).mockResolvedValue(2);
    expect(await bacaKlinikPublik('localhost')).toBeNull();
});

test('jadwal dapat disembunyikan, nama praktisi memerlukan pengaturan publik eksplisit', async () => {
    jest.mocked(db.cariWebsiteKlinikUntukBacaKlinikPublik).mockResolvedValue({ ...web, tampilkan_jadwal: false });
    expect((await bacaKlinikPublik('klinik.example'))?.jadwal).toEqual([]);
    expect(db.daftarJadwalPraktikUntukBacaKlinikPublik).not.toHaveBeenCalled();
    jest.mocked(db.cariWebsiteKlinikUntukBacaKlinikPublik).mockResolvedValue({ ...web, tampilkan_nama_praktisi: true });
    expect((await bacaKlinikPublik('klinik.example'))?.jadwal[0].praktisi).toBe('Nama internal');
});

test('pengaturan pertama mengikuti nama fasilitas dan belum dipublikasikan', async () => {
    jest.mocked(db.ambilFasyankesUntukPengaturanWebsite).mockResolvedValue({ nama: 'Klinik B', website_klinik: null });
    expect(await pengaturanWebsite(8)).toMatchObject({ nama: 'Klinik B', slug: 'klinik-8', aktif: false });
});