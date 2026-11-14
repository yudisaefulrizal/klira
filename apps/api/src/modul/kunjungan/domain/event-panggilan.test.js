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
    const daftarPoliUntukJenis = jest.fn();
    const daftarPoliBebasUntukPanggil = jest.fn();
    const ubahAntreanUntukTetapkanPoli = jest.fn();
    const wajibKunjunganUntukAmbilKunjungan = jest.fn();
    return { ...kliraActual0,
        cariAntreanSibukUntukPanggil: cariAntreanSibukUntukPanggil,
        daftarPoliUntukJenis: daftarPoliUntukJenis,
        daftarPoliBebasUntukPanggil: daftarPoliBebasUntukPanggil,
        ubahAntreanUntukTetapkanPoli: ubahAntreanUntukTetapkanPoli,
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

const waktu = new Date('2026-10-29T03:00:00Z'), tanggal = new Date('2026-10-29T00:00:00Z');

function siapkan() {
    const tx = {};
    jest.mocked(db.cariAntreanSibukUntukPanggil).mockImplementation(jest.fn().mockResolvedValue(null));
    jest.mocked(db.ubahAntreanUntukUbahAntrean).mockImplementation(jest.fn().mockResolvedValue({ count: 1 }));
    jest.mocked(db.wajibAntreanUntukUbahAntrean).mockImplementation(jest.fn().mockResolvedValue({ lokasi_id: 9, nomor: 23, tanggal }));
    jest.mocked(db.wajibLokasiUntukUbahAntrean).mockImplementation(jest.fn().mockResolvedValue({ nama: 'Poli Umum', status_operasional: 'O' }));
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
    expect(jest.mocked(db.tambahEventPanggilanUntukUbahAntrean).mock.calls.map(args => ({ ...args }))).toEqual(expect.arrayContaining([expect.objectContaining({ 0: 7, 1: 9, 2: 'Poli Umum', 3: 'A-023', 4: tanggal, 5: waktu })]));
    expect(db.kunciPasien).toHaveBeenCalledTimes(2);
    expect(jest.mocked(db.kunciPasien).mock.invocationCallOrder[0]).toBeLessThan(jest.mocked(db.ubahAntreanUntukUbahAntrean).mock.invocationCallOrder[0]);
});

test('konflik perubahan status tidak menghasilkan event', async () => {
    const { repo } = siapkan();
    jest.mocked(db.ubahAntreanUntukUbahAntrean).mockResolvedValue({ count: 0 });
    expect(await repo.ubahAntrean(7, 11, 'panggil', ['menunggu'], 'dipanggil', waktu)).toBeNull();
    expect(db.tambahEventPanggilanUntukUbahAntrean).not.toHaveBeenCalled();
});

test('panggil ditolak tanpa event bila poli masih memegang pasien lain atau tidak operasional', async () => {
    const { repo } = siapkan();
    jest.mocked(db.cariAntreanSibukUntukPanggil).mockResolvedValue({ id: 3, nomor: 6, status: 'dilayani' });
    expect(await repo.ubahAntrean(7, 11, 'panggil', ['menunggu'], 'dipanggil', waktu)).toEqual({ galat: 'poli_sibuk', poli: 'Poli Umum', kode: 'A-006' });
    expect(db.ubahAntreanUntukUbahAntrean).not.toHaveBeenCalled();
    expect(db.tambahEventPanggilanUntukUbahAntrean).not.toHaveBeenCalled();
    jest.mocked(db.cariAntreanSibukUntukPanggil).mockResolvedValue(null);
    jest.mocked(db.wajibLokasiUntukUbahAntrean).mockResolvedValue({ nama: 'Poli Umum', status_operasional: 'U' });
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

describe('poli ditetapkan saat pertama dipanggil (antrean per jenis poli)', () => {
    const poliUmum = [
        { id: 9, nama: 'Poli Umum 1', jenis_poli: 'Umum', awalan_antrean: 'U', status_operasional: 'O' },
        { id: 10, nama: 'Poli Umum 2', jenis_poli: 'Umum', awalan_antrean: 'U', status_operasional: 'O' },
    ];
    function siapkanBelumDipanggil({ dpjp = null, semua = poliUmum, bebas = poliUmum } = {}) {
        const { repo } = siapkan();
        jest.mocked(db.wajibAntreanUntukUbahAntrean).mockImplementation(jest.fn().mockResolvedValue({ lokasi_id: null, nomor: 5, awalan: 'U', jenis_poli: 'Umum', kunjungan_id: 40, tanggal }));
        jest.mocked(db.wajibKunjunganUntukAmbilKunjungan).mockImplementation(jest.fn().mockResolvedValue({ peserta: dpjp ? [{ pengguna_id: dpjp }] : [] }));
        jest.mocked(db.daftarPoliUntukJenis).mockImplementation(jest.fn().mockResolvedValue(semua));
        jest.mocked(db.daftarPoliBebasUntukPanggil).mockImplementation(jest.fn().mockResolvedValue(bebas));
        return repo;
    }
    test('memilih poli sejenis pertama yang bebas, menetapkannya, dan menyuarakan nama poli beserta kode berawalan jenis', async () => {
        const repo = siapkanBelumDipanggil({ bebas: [poliUmum[1]] });
        await repo.ubahAntrean(7, 11, 'panggil', ['menunggu'], 'dipanggil', waktu);
        expect(db.ubahAntreanUntukTetapkanPoli).toHaveBeenCalledWith(11, 10, expect.anything());
        expect(jest.mocked(db.tambahEventPanggilanUntukUbahAntrean).mock.calls[0].slice(0, 4)).toEqual([7, 10, 'Poli Umum 2', 'U-005']);
    });
    test('dokter pilihan membatasi poli: dikirim ke pencarian poli bebas; tidak ada poli bebas menolak tanpa mengubah antrean', async () => {
        const repo = siapkanBelumDipanggil({ dpjp: 2, bebas: [] });
        expect(await repo.ubahAntrean(7, 11, 'panggil', ['menunggu'], 'dipanggil', waktu)).toEqual({ galat: 'dokter_poli_sibuk', jenis: 'Umum' });
        expect(jest.mocked(db.daftarPoliBebasUntukPanggil).mock.calls[0].slice(0, 4)).toEqual([7, 'Umum', tanggal, 2]);
        expect(db.ubahAntreanUntukTetapkanPoli).not.toHaveBeenCalled();
        expect(db.ubahAntreanUntukUbahAntrean).not.toHaveBeenCalled();
    });
    test('semua poli sejenis sibuk atau tidak operasional ditolak dengan galat berbeda', async () => {
        expect(await siapkanBelumDipanggil({ bebas: [] }).ubahAntrean(7, 11, 'panggil', ['menunggu'], 'dipanggil', waktu)).toEqual({ galat: 'jenis_sibuk', jenis: 'Umum' });
        const tutup = siapkanBelumDipanggil({ semua: [{ ...poliUmum[0], status_operasional: 'U' }], bebas: [] });
        expect(await tutup.ubahAntrean(7, 11, 'panggil', ['menunggu'], 'dipanggil', waktu)).toMatchObject({ galat: 'poli_tidak_operasional' });
    });
    test('poli pilihan harus termasuk poli bebas; poli yang tidak bebas ditolak', async () => {
        const repo = siapkanBelumDipanggil({ bebas: [poliUmum[1]] });
        expect(await repo.ubahAntrean(7, 11, 'panggil', ['menunggu'], 'dipanggil', waktu, 9)).toEqual({ galat: 'poli_pilihan_tidak_tersedia', jenis: 'Umum' });
        await repo.ubahAntrean(7, 11, 'panggil', ['menunggu'], 'dipanggil', waktu, 10);
        expect(db.ubahAntreanUntukTetapkanPoli).toHaveBeenCalledWith(11, 10, expect.anything());
    });
});


test('antrean penunjang saja dipanggil tanpa memilih poli dan tanpa aturan satu pasien per poli', async () => {
    const { repo } = siapkan();
    jest.mocked(db.wajibAntreanUntukUbahAntrean).mockImplementation(jest.fn().mockResolvedValue({ lokasi_id: null, nomor: 3, awalan: 'L', jenis_poli: 'Laboratorium', kunjungan_id: 40, tanggal }));
    await repo.ubahAntrean(7, 11, 'panggil', ['menunggu'], 'dipanggil', waktu);
    expect(db.daftarPoliBebasUntukPanggil).not.toHaveBeenCalled();
    expect(db.cariAntreanSibukUntukPanggil).not.toHaveBeenCalled();
    expect(db.ubahAntreanUntukTetapkanPoli).not.toHaveBeenCalled();
    expect(jest.mocked(db.tambahEventPanggilanUntukUbahAntrean).mock.calls[0].slice(0, 4)).toEqual([7, null, 'Laboratorium', 'L-003']);
});
