import { jest } from '@jest/globals';

const kliraActual0 = await import("@klira/db");
jest.unstable_mockModule('@klira/db', () => {
    const daftarAntreanUntukPetakanAntrean = jest.fn().mockResolvedValue([]);
    const daftarPasienUntukPetakanAntrean = jest.fn().mockResolvedValue([]);
    const daftarLokasiUntukOpsi2 = jest.fn().mockResolvedValue([]);
    const ubahAntreanUntukUbahAntrean = jest.fn();
    const wajibAntreanUntukUbahAntrean = jest.fn();
    const wajibLokasiUntukUbahAntrean = jest.fn();
    const tambahEventPanggilanUntukUbahAntrean = jest.fn();
    const kunci = jest.fn();
    const cariAntreanSibukUntukPanggil = jest.fn();
    const daftarRuangPeriksaUntukPoli = jest.fn();
    const daftarAntreanSibukUntukPetakan = jest.fn();
    const cariAntreanDokterSibuk = jest.fn();
    const cariRuangTerakhirDokter = jest.fn();
    const tetapkanRuangAntrean = jest.fn();
    const wajibKunjunganUntukAmbilKunjungan = jest.fn();
    return { ...kliraActual0,
        cariAntreanSibukUntukPanggil: cariAntreanSibukUntukPanggil,
        daftarRuangPeriksaUntukPoli: daftarRuangPeriksaUntukPoli,
        daftarAntreanSibukUntukPetakan: daftarAntreanSibukUntukPetakan,
        cariAntreanDokterSibuk: cariAntreanDokterSibuk,
        cariRuangTerakhirDokter: cariRuangTerakhirDokter,
        tetapkanRuangAntrean: tetapkanRuangAntrean,
        wajibKunjunganUntukAmbilKunjungan: wajibKunjunganUntukAmbilKunjungan,
        pool: {},
        daftarAntreanUntukPetakanAntrean: daftarAntreanUntukPetakanAntrean,
        daftarPasienUntukPetakanAntrean: daftarPasienUntukPetakanAntrean,
        daftarLokasiUntukOpsi2: daftarLokasiUntukOpsi2,
        daftarLokasiUntukPetakanAntrean: daftarLokasiUntukOpsi2,
        ubahAntreanUntukMulaiAntreanDalam: ubahAntreanUntukUbahAntrean,
        ubahAntreanUntukMulaiAntreanDalam2: ubahAntreanUntukUbahAntrean,
        ubahAntreanUntukSelesaiAntreanDalam: ubahAntreanUntukUbahAntrean,
        ubahAntreanUntukUbahAntrean: ubahAntreanUntukUbahAntrean,
        wajibAntreanUntukUbahAntrean: wajibAntreanUntukUbahAntrean,
        wajibAntreanUntukUbahAntrean2: wajibAntreanUntukUbahAntrean,
        wajibLokasiUntukUbahAntrean: wajibLokasiUntukUbahAntrean,
        tambahEventPanggilanUntukUbahAntrean: tambahEventPanggilanUntukUbahAntrean,
        transaksi: jest.fn(async (fn) => fn({})),
        kunciPasien: kunci,
        kunciFasyankes: kunci };
});
const db = await import("@klira/db");
const { RepositoriKunjunganMysql } = await import("../data-access/repositori.js");

const waktu = new Date('2026-10-29T03:00:00Z'), tanggal = new Date('2026-10-29T00:00:00Z'), sesiId = 55;

function siapkan() {
    const tx = {};
    jest.mocked(db.cariAntreanSibukUntukPanggil).mockImplementation(jest.fn().mockResolvedValue(null));
    jest.mocked(db.ubahAntreanUntukUbahAntrean).mockImplementation(jest.fn().mockResolvedValue({ count: 1 }));
    // Antrean poli Umum (id 1) yang sudah memegang ruang periksa "Poli Umum 1" (id 9).
    jest.mocked(db.wajibAntreanUntukUbahAntrean).mockImplementation(jest.fn().mockResolvedValue({ sesi_id: sesiId, lokasi_id: 1, ruang_id: 9, nomor: 23, tanggal }));
    jest.mocked(db.wajibLokasiUntukUbahAntrean).mockImplementation(async (id) => (id === 1 ? { id: 1, nama: 'Umum', status_operasional: 'O' } : { id, nama: 'Poli Umum 1', status_operasional: 'O' }));
    jest.mocked(db.tambahEventPanggilanUntukUbahAntrean).mockImplementation(jest.fn().mockResolvedValue({ id: 43 }));
    jest.mocked(db.transaksi).mockImplementation(async (fn) => fn(tx));
    return { tx, repo: new RepositoriKunjunganMysql() };
}

beforeEach(() => jest.clearAllMocks());

test('panggil dan panggil ulang mencatat event masing-masing dalam transaksi status yang sama', async () => {
    const { repo } = siapkan();
    await repo.ubahAntrean(7, 11, 'panggil', ['menunggu', 'dipanggil'], 'dipanggil', waktu);
    await repo.ubahAntrean(7, 11, 'panggil', ['menunggu', 'dipanggil'], 'dipanggil', waktu);
    expect(db.tambahEventPanggilanUntukUbahAntrean).toHaveBeenCalledTimes(2);
    expect(jest.mocked(db.tambahEventPanggilanUntukUbahAntrean).mock.calls.map(args => ({ ...args }))).toEqual(expect.arrayContaining([expect.objectContaining({ 0: 7, 1: sesiId, 2: 9, 3: 'Poli Umum 1', 4: 'A-023', 5: tanggal, 6: waktu })]));
    expect(db.kunciPasien).toHaveBeenCalledTimes(2);
    expect(jest.mocked(db.kunciPasien).mock.invocationCallOrder[0]).toBeLessThan(jest.mocked(db.ubahAntreanUntukUbahAntrean).mock.invocationCallOrder[0]);
});

test('konflik perubahan status tidak menghasilkan event', async () => {
    const { repo } = siapkan();
    jest.mocked(db.ubahAntreanUntukUbahAntrean).mockResolvedValue({ count: 0 });
    expect(await repo.ubahAntrean(7, 11, 'panggil', ['menunggu'], 'dipanggil', waktu)).toBeNull();
    expect(db.tambahEventPanggilanUntukUbahAntrean).not.toHaveBeenCalled();
});

test('panggil ulang ditolak tanpa event bila ruangnya masih memegang pasien lain, atau ruang/poli tidak operasional', async () => {
    const { repo } = siapkan();
    jest.mocked(db.cariAntreanSibukUntukPanggil).mockResolvedValue({ id: 3, nomor: 6, status: 'dilayani' });
    expect(await repo.ubahAntrean(7, 11, 'panggil', ['menunggu'], 'dipanggil', waktu)).toEqual({ galat: 'poli_sibuk', poli: 'Poli Umum 1', kode: 'A-006' });
    expect(jest.mocked(db.cariAntreanSibukUntukPanggil).mock.calls[0].slice(0, 4)).toEqual([7, 9, sesiId, 11]);
    expect(db.ubahAntreanUntukUbahAntrean).not.toHaveBeenCalled();
    expect(db.tambahEventPanggilanUntukUbahAntrean).not.toHaveBeenCalled();
    jest.mocked(db.cariAntreanSibukUntukPanggil).mockResolvedValue(null);
    jest.mocked(db.wajibLokasiUntukUbahAntrean).mockImplementation(async (id) => ({ id, nama: id === 1 ? 'Umum' : 'Poli Umum 1', status_operasional: id === 1 ? 'O' : 'U' }));
    expect(await repo.ubahAntrean(7, 11, 'panggil', ['menunggu'], 'dipanggil', waktu)).toEqual({ galat: 'poli_tidak_operasional', poli: 'Poli Umum 1' });
    jest.mocked(db.wajibLokasiUntukUbahAntrean).mockImplementation(async (id) => ({ id, nama: 'Umum', status_operasional: 'U' }));
    expect(await repo.ubahAntrean(7, 11, 'panggil', ['menunggu'], 'dipanggil', waktu)).toEqual({ galat: 'poli_tidak_operasional', poli: 'Poli Umum' });
    expect(db.ubahAntreanUntukUbahAntrean).not.toHaveBeenCalled();
});

test('gagal menulis event menggagalkan transaksi dan tidak membaca DTO sukses', async () => {
    const { repo } = siapkan();
    jest.mocked(db.tambahEventPanggilanUntukUbahAntrean).mockRejectedValue(new Error('gagal simpan'));
    await expect(repo.ubahAntrean(7, 11, 'panggil', ['menunggu'], 'dipanggil', waktu)).rejects.toThrow('gagal simpan');
    expect(db.daftarAntreanUntukPetakanAntrean).not.toHaveBeenCalled();
});

test('aksi batal tidak membuat event suara', async () => {
    const { repo } = siapkan();
    await repo.ubahAntrean(7, 11, 'batal', ['menunggu'], 'batal', waktu);
    expect(db.tambahEventPanggilanUntukUbahAntrean).not.toHaveBeenCalled();
});

describe('ruang periksa ditetapkan saat pertama dipanggil (antrean per poli)', () => {
    const ruang = [
        { id: 9, nama: 'Ruang Periksa 1', status_operasional: 'O' },
        { id: 10, nama: 'Ruang Periksa 2', status_operasional: 'O' },
    ];
    function siapkanBelumDipanggil({ dpjp = null, semua = ruang, sibuk = [], dokterSibuk = null, terakhir = null } = {}) {
        const { repo } = siapkan();
        jest.mocked(db.wajibAntreanUntukUbahAntrean).mockImplementation(jest.fn().mockResolvedValue({ sesi_id: sesiId, lokasi_id: 1, ruang_id: null, nomor: 5, awalan: 'U', jenis_poli: 'Umum', kunjungan_id: 40, tanggal }));
        jest.mocked(db.wajibKunjunganUntukAmbilKunjungan).mockImplementation(jest.fn().mockResolvedValue({ peserta: dpjp ? [{ pengguna_id: dpjp }] : [] }));
        jest.mocked(db.daftarRuangPeriksaUntukPoli).mockImplementation(jest.fn().mockResolvedValue(semua));
        jest.mocked(db.daftarAntreanSibukUntukPetakan).mockImplementation(jest.fn().mockResolvedValue(sibuk.map((id, i) => ({ id: 100 + i, ruang_id: id }))));
        jest.mocked(db.cariAntreanDokterSibuk).mockImplementation(jest.fn().mockResolvedValue(dokterSibuk));
        jest.mocked(db.cariRuangTerakhirDokter).mockImplementation(jest.fn().mockResolvedValue(terakhir));
        return repo;
    }
    test('memilih ruang periksa bebas pertama, menetapkannya, dan menyuarakan nama ruang beserta poli', async () => {
        const repo = siapkanBelumDipanggil({ sibuk: [9] });
        await repo.ubahAntrean(7, 11, 'panggil', ['menunggu'], 'dipanggil', waktu);
        expect(db.tetapkanRuangAntrean).toHaveBeenCalledWith(11, 10, expect.anything());
        expect(jest.mocked(db.tambahEventPanggilanUntukUbahAntrean).mock.calls[0].slice(0, 5)).toEqual([7, sesiId, 10, 'Ruang Periksa 2 · Poli Umum', 'U-005']);
    });
    test('dokter pilihan yang sedang menangani pasien lain menahan panggilan tanpa mengubah antrean', async () => {
        const repo = siapkanBelumDipanggil({ dpjp: 2, dokterSibuk: { id: 3, nomor: 4, awalan: 'U' } });
        expect(await repo.ubahAntrean(7, 11, 'panggil', ['menunggu'], 'dipanggil', waktu)).toEqual({ galat: 'dokter_sibuk', jenis: 'Umum', kode: 'U-004' });
        expect(jest.mocked(db.cariAntreanDokterSibuk).mock.calls[0].slice(0, 4)).toEqual([7, 2, sesiId, 11]);
        expect(db.tetapkanRuangAntrean).not.toHaveBeenCalled();
        expect(db.ubahAntreanUntukUbahAntrean).not.toHaveBeenCalled();
    });
    test('dokter pilihan yang bebas diarahkan ke ruang terakhirnya bila ruang itu bebas', async () => {
        const repo = siapkanBelumDipanggil({ dpjp: 2, terakhir: 10 });
        await repo.ubahAntrean(7, 11, 'panggil', ['menunggu'], 'dipanggil', waktu);
        expect(db.tetapkanRuangAntrean).toHaveBeenCalledWith(11, 10, expect.anything());
    });
    test('semua ruang sibuk atau tidak operasional ditolak dengan galat berbeda', async () => {
        expect(await siapkanBelumDipanggil({ sibuk: [9, 10] }).ubahAntrean(7, 11, 'panggil', ['menunggu'], 'dipanggil', waktu)).toEqual({ galat: 'ruang_sibuk', jenis: 'Umum' });
        const tutup = siapkanBelumDipanggil({ semua: [{ ...ruang[0], status_operasional: 'U' }] });
        expect(await tutup.ubahAntrean(7, 11, 'panggil', ['menunggu'], 'dipanggil', waktu)).toEqual({ galat: 'ruang_tidak_operasional', jenis: 'Umum' });
    });
    test('poli tanpa ruang periksa dipanggil tanpa ruang atas nama poli', async () => {
        const repo = siapkanBelumDipanggil({ semua: [] });
        await repo.ubahAntrean(7, 11, 'panggil', ['menunggu'], 'dipanggil', waktu);
        expect(db.tetapkanRuangAntrean).not.toHaveBeenCalled();
        expect(jest.mocked(db.tambahEventPanggilanUntukUbahAntrean).mock.calls[0].slice(0, 5)).toEqual([7, sesiId, 1, 'Poli Umum', 'U-005']);
    });
    test('ruang pilihan harus ruang bebas poli itu; ruang yang tidak bebas ditolak', async () => {
        const repo = siapkanBelumDipanggil({ sibuk: [9] });
        expect(await repo.ubahAntrean(7, 11, 'panggil', ['menunggu'], 'dipanggil', waktu, 9)).toEqual({ galat: 'ruang_pilihan_tidak_tersedia', jenis: 'Umum' });
        await repo.ubahAntrean(7, 11, 'panggil', ['menunggu'], 'dipanggil', waktu, 10);
        expect(db.tetapkanRuangAntrean).toHaveBeenCalledWith(11, 10, expect.anything());
    });
});


test('antrean penunjang saja dipanggil tanpa memilih poli dan tanpa aturan satu pasien per poli', async () => {
    const { repo } = siapkan();
    jest.mocked(db.wajibAntreanUntukUbahAntrean).mockImplementation(jest.fn().mockResolvedValue({ sesi_id: sesiId, lokasi_id: null, nomor: 3, awalan: 'L', jenis_poli: 'Laboratorium', kunjungan_id: 40, tanggal }));
    await repo.ubahAntrean(7, 11, 'panggil', ['menunggu'], 'dipanggil', waktu);
    expect(db.daftarRuangPeriksaUntukPoli).not.toHaveBeenCalled();
    expect(db.cariAntreanSibukUntukPanggil).not.toHaveBeenCalled();
    expect(db.tetapkanRuangAntrean).not.toHaveBeenCalled();
    expect(jest.mocked(db.tambahEventPanggilanUntukUbahAntrean).mock.calls[0].slice(0, 5)).toEqual([7, sesiId, null, 'Laboratorium', 'L-003']);
});
