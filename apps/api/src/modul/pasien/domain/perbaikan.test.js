import { jest } from '@jest/globals';

const kliraActual0 = await import("@klira/db");
jest.unstable_mockModule('@klira/db', () => {
    const ubahPasienUntukPerbaiki = jest.fn();
    const daftarWaliKeluargaUntukPerbaiki = jest.fn();
    const ubahWaliKeluargaUntukPerbaiki = jest.fn();
    const tambahWaliKeluargaUntukPerbaiki = jest.fn();
    const kunci = jest.fn();
    return { ...kliraActual0,
        pool: {},
        ubahPasienUntukPerbaiki: ubahPasienUntukPerbaiki,
        daftarWaliKeluargaUntukPerbaiki: daftarWaliKeluargaUntukPerbaiki,
        ubahWaliKeluargaUntukPerbaiki: ubahWaliKeluargaUntukPerbaiki,
        tambahWaliKeluargaUntukPerbaiki: tambahWaliKeluargaUntukPerbaiki,
        tambahWaliKeluargaUntukDaftarkanHasil: jest.fn(async () => await tambahWaliKeluargaUntukPerbaiki.mock.results.at(-1)?.value),
        transaksi: jest.fn(async (fn) => fn({})),
        kunciPasien: kunci };
});
const db = await import("@klira/db");
const { perbaikanPasienMasukan } = await import("@klira/shared");
const { buatLayananPasien } = await import("./layanan.js");
const { NikKembarError, RepositoriPasienMysql, WaliTidakSahError } = await import("../data-access/repositori.js");

const dasar = { nama: ' Ayu ', jalur_identitas: 'nik', nik: '3201010101900001', tanggal_lahir: '1990-05-01', jenis_kelamin: 'perempuan', wali: [{ id: 4, nama: ' Budi ', hubungan: 'Ayah', kontak: '081234567890' }] };

const masukan = () => perbaikanPasienMasukan.parse(dasar);

const saya = { id: 3, fasyankes_id: 1 };

function layanan(lebih = {}) {
    const perbaiki = jest.fn(async () => true);
    const audit = { catat: jest.fn(async () => { }) };
    const repo = { perbaiki, detail: jest.fn(async () => ({ id: 9, nama: 'Ayu' })), ...lebih };
    return { perbaiki, audit, layanan: buatLayananPasien({ repo, audit }) };
}

beforeEach(() => jest.clearAllMocks());

it('memvalidasi identitas dan wali tanpa memerlukan consent baru atau menerima nomor RM dari klien', () => {
    expect(masukan()).toMatchObject({ nama: 'Ayu', wali: [{ id: 4, nama: 'Budi' }] });
    const hasil = perbaikanPasienMasukan.parse({ ...dasar, nomor_rm: 'ubah', fasyankes_id: 99 });
    expect(hasil).not.toHaveProperty('nomor_rm');
    expect(hasil).not.toHaveProperty('fasyankes_id');
    for (const perubahan of [{ nik: '' }, { tanggal_lahir: '2025-02-30' }, { jalur_identitas: 'paspor' }, { wali: [dasar.wali[0], dasar.wali[0]] }])
        expect(perbaikanPasienMasukan.safeParse({ ...dasar, ...perubahan }).success).toBe(false);
});

it('menyimpan pada fasyankes pelaku, menormalkan kontak, dan mencatat audit tanpa isi data', async () => {
    const uji = layanan();
    expect(await uji.layanan.perbaiki(saya, 9, masukan())).toMatchObject({ ok: true });
    expect(uji.perbaiki).toHaveBeenCalledWith(1, 9, 3, expect.objectContaining({ nama: 'Ayu', alamat: null, wali: [{ id: 4, nama: 'Budi', hubungan: 'Ayah', kontak: '081234567890' }] }));
    expect(uji.audit.catat).toHaveBeenCalledWith(expect.objectContaining({ aksi: 'perbaikan', entitas: 'pasien', entitas_id: 9 }));
    expect(JSON.stringify(uji.audit.catat.mock.calls)).not.toContain(dasar.nik);
});

it('menyimpan, mengosongkan, dan mempertahankan nomor HP dari klien lama', async () => {
    for (const [input, expected] of [['081234567890', '6281234567890'], ['', null]]) {
        const uji = layanan();
        await uji.layanan.perbaiki(saya, 9, perbaikanPasienMasukan.parse({ ...dasar, nomor_hp: input }));
        expect(uji.perbaiki).toHaveBeenCalledWith(1, 9, 3, expect.objectContaining({ nomor_hp: expected }));
    }
    const uji = layanan();
    await uji.layanan.perbaiki(saya, 9, masukan());
    expect(uji.perbaiki.mock.calls[0][3]).not.toHaveProperty('nomor_hp');
});

it('pasien tidak ditemukan atau lintas fasyankes tidak dicatat sebagai perbaikan', async () => {
    const uji = layanan({ perbaiki: async () => false });
    expect(await uji.layanan.perbaiki(saya, 99, masukan())).toMatchObject({ ok: false, kode: 'tidak_ditemukan' });
    expect(uji.audit.catat).not.toHaveBeenCalled();
});

it.each([new NikKembarError(), new WaliTidakSahError()])('menangani NIK ganda dan perubahan wali yang tidak sah', async (error) => {
    const uji = layanan({ perbaiki: async () => { throw error; } });
    expect(await uji.layanan.perbaiki(saya, 9, masukan())).toMatchObject({ ok: false, kode: 'konflik' });
    expect(uji.audit.catat).not.toHaveBeenCalled();
});

describe('transaksi perbaikan', () => {
    let data;
    beforeEach(async () => {
        const uji = layanan();
        await uji.layanan.perbaiki(saya, 9, masukan());
        data = uji.perbaiki.mock.calls[0][3];
        jest.mocked(db.transaksi).mockImplementation(async (fn) => fn(db.pool));
        jest.mocked(db.kunciPasien).mockResolvedValue([{ id: 9 }]);
        jest.mocked(db.daftarWaliKeluargaUntukPerbaiki).mockResolvedValue([{ id: 4 }]);
    });
    it('memperbarui wali dengan ID tetap dan menambahkan wali baru', async () => {
        data.wali.push({ nama: 'Ibu', hubungan: 'Ibu', kontak: null });
        expect(await new RepositoriPasienMysql().perbaiki(1, 9, 3, data)).toBe(true);
        expect(jest.mocked(db.ubahPasienUntukPerbaiki).mock.calls.map(args => ({ ...args }))).toEqual(expect.arrayContaining([expect.objectContaining({ 23: 9, 24: 1 })]));
        expect(jest.mocked(db.ubahWaliKeluargaUntukPerbaiki).mock.calls.map(args => ({ ...args }))).toEqual(expect.arrayContaining([expect.objectContaining({ 0: 'Ayah', 1: 'Budi', 2: '081234567890', 3: 4, 4: 9, 5: 1 })]));
        expect(db.tambahWaliKeluargaUntukPerbaiki).toHaveBeenCalledTimes(1);
    });
    it.each([{ wali: [] }, { wali: [{ id: 55, nama: 'Wali lain', hubungan: 'Ayah', kontak: null }] }])('menolak penghapusan atau wali milik pasien lain', async ({ wali }) => {
        data.wali = wali;
        await expect(new RepositoriPasienMysql().perbaiki(1, 9, 3, data)).rejects.toBeInstanceOf(WaliTidakSahError);
        expect(db.ubahPasienUntukPerbaiki).not.toHaveBeenCalled();
    });
    it('pasien lintas fasyankes tidak ditulis', async () => {
        jest.mocked(db.kunciPasien).mockResolvedValue([]);
        expect(await new RepositoriPasienMysql().perbaiki(2, 9, 3, data)).toBe(false);
        expect(db.ubahPasienUntukPerbaiki).not.toHaveBeenCalled();
    });
});