import { jest } from '@jest/globals';

const { REGISTRASI } = await import("@klira/shared");
const { buatLayananKunjungan } = await import("./layanan.js");
const { bisaDiulang } = await import("../data-access/repositori.js");

describe('layanan kunjungan dengan repositori tiruan', () => {
    const catatan = [];
    const saya = { id: 3, fasyankes_id: 1 };
    const kunjungan = { id: 5, antrean: { id: 8, nomor: 1, kode: 'A-001', status: 'menunggu' } };
    const dasarRepo = {
        pasienAda: async (f, id) => f === 1 && id === 10,
        jenisPoliOperasional: async (f, jenis) => (f === 1 && String(jenis).toLowerCase() === 'umum' ? { jenis_poli: 'Umum', awalan: 'U' } : null),
        dpjpSah: async (f, id) => f === 1 && (id === 30 || id === 32),
        dokterDiJenis: async (f, id, jenis) => f === 1 && id === 30 && jenis === 'Umum',
        kunjunganBerjalan: async () => false,
        daftarkan: jest.fn(async () => kunjungan),
        tahapSekarang: async (f, id) => (f === 1 && id === 5 ? 'pemeriksaan' : null),
        ubahTahap: jest.fn(async () => kunjungan),
        statusAntrean: async (f, id) => (f === 1 && id === 8 ? 'menunggu' : null),
        ubahAntrean: jest.fn(async () => ({ id: 8, kode: 'A-001' })),
    };
    const buat = (sisa = {}) => buatLayananKunjungan({ repo: { ...dasarRepo, ...sisa }, audit: { catat: async (e) => void catatan.push(e) }, sekarang: () => new Date('2026-10-25T01:00:00Z') });
    beforeEach(() => {
        catatan.length = 0;
        jest.clearAllMocks();
    });
    const masukan = { pasien_id: 10, jenis: 'AMB', jenis_poli: 'umum', dpjp_id: 30, cara_pembayaran: 'jkn', nomor_sep: ' ', keluhan_singkat: ' batuk ' };
    it('mendaftarkan dengan nilai dinormalkan dan mencatat audit input', async () => {
        const h = await buat().daftarkan(saya, masukan);
        expect(h).toMatchObject({ ok: true });
        expect(dasarRepo.daftarkan).toHaveBeenCalledWith(1, 3, expect.objectContaining({ nomor_sep: null, keluhan_singkat: 'batuk', jenis_poli: 'Umum', awalan: 'U' }), new Date('2026-10-25T01:00:00Z'));
        expect(catatan).toEqual([expect.objectContaining({ aksi: 'input', entitas: 'kunjungan' })]);
    });
    it('menolak dokter yang tidak bertugas di poli jenis terpilih; dokter boleh kosong', async () => {
        const l = buat();
        expect(await l.daftarkan(saya, { ...masukan, dpjp_id: 32 })).toMatchObject({ ok: false, kode: 'tidak_valid', pesan: REGISTRASI.galat.dokterBukanPoli });
        expect(dasarRepo.daftarkan).not.toHaveBeenCalled();
        expect(await l.daftarkan(saya, { ...masukan, dpjp_id: undefined })).toMatchObject({ ok: true });
        // Rawat inap langsung tanpa poli: tidak ada pemeriksaan poli dokter.
        expect(await l.daftarkan(saya, { ...masukan, jenis: 'IMP', jenis_poli: undefined, dpjp_id: 32 })).toMatchObject({ ok: true });
    });
    it('menolak pasien, poli, atau DPJP di luar fasyankes dan kunjungan berjalan tanpa menyimpan', async () => {
        const l = buat();
        expect(await l.daftarkan({ id: 3, fasyankes_id: 2 }, masukan)).toMatchObject({ ok: false, kode: 'tidak_ditemukan' });
        expect(await l.daftarkan(saya, { ...masukan, jenis_poli: 'Bedah' })).toMatchObject({ ok: false, kode: 'tidak_valid' });
        expect(await l.daftarkan(saya, { ...masukan, dpjp_id: 31 })).toMatchObject({ ok: false, kode: 'tidak_valid' });
        expect(await buat({ kunjunganBerjalan: async () => true }).daftarkan(saya, masukan)).toMatchObject({ ok: false, kode: 'konflik' });
        expect(dasarRepo.daftarkan).not.toHaveBeenCalled();
        expect(catatan).toHaveLength(0);
    });
    it('tahap: hanya maju; kasir ke ditutup dan mundur ditolak', async () => {
        const l = buat();
        expect(await l.ubahTahap(saya, 5, 'resep')).toMatchObject({ ok: true });
        expect(await l.ubahTahap(saya, 5, 'menunggu_skrining')).toMatchObject({ ok: false, kode: 'konflik' });
        expect(await l.ubahTahap(saya, 5, 'ditutup')).toMatchObject({ ok: false, kode: 'konflik' });
        expect(await l.ubahTahap(saya, 6, 'resep')).toMatchObject({ ok: false, kode: 'tidak_ditemukan' });
        expect(dasarRepo.ubahTahap).toHaveBeenCalledTimes(1);
    });
    it('tahap: balapan (sudah berubah) menjadi konflik', async () => {
        expect(await buat({ ubahTahap: async () => null }).ubahTahap(saya, 5, 'resep')).toMatchObject({ ok: false, kode: 'konflik' });
    });
    it('antrean: aksi sesuai status; mulai dari menunggu ditolak', async () => {
        const l = buat();
        expect(await l.aksiAntrean(saya, 8, 'panggil')).toMatchObject({ ok: true });
        expect(dasarRepo.ubahAntrean).toHaveBeenCalledWith(1, 8, 'panggil', ['menunggu', 'dipanggil'], 'dipanggil', expect.any(Date), undefined);
        expect(await l.aksiAntrean(saya, 8, 'mulai')).toMatchObject({ ok: false, kode: 'konflik' });
        expect(await l.aksiAntrean({ id: 3, fasyankes_id: 2 }, 8, 'panggil')).toMatchObject({ ok: false, kode: 'tidak_ditemukan' });
    });
    it('panggil ditolak bila poli masih melayani pasien lain atau tidak operasional', async () => {
        const sibuk = jest.fn(async () => ({ galat: 'poli_sibuk', poli: 'Poli Umum 1', kode: 'A-006' }));
        expect(await buat({ ubahAntrean: sibuk }).aksiAntrean(saya, 8, 'panggil')).toMatchObject({ ok: false, kode: 'konflik', pesan: expect.stringContaining('Poli Umum 1 sedang melayani A-006') });
        const tutup = jest.fn(async () => ({ galat: 'poli_tidak_operasional', poli: 'Poli Gigi' }));
        expect(await buat({ ubahAntrean: tutup }).aksiAntrean(saya, 8, 'panggil')).toMatchObject({ ok: false, kode: 'konflik', pesan: expect.stringContaining('Poli Gigi sedang tidak operasional') });
    });
    it('daftar antrean memakai hari ini menurut Asia/Jakarta bila tanggal kosong', async () => {
        const daftarAntrean = jest.fn(async () => ({ total: 0, baris: [] }));
        await buat({ daftarAntrean }).daftarAntrean(saya, { halaman: 1, ukuran: 50 });
        expect(daftarAntrean).toHaveBeenCalledWith(1, expect.objectContaining({ tanggal: '2026-10-25' }));
    });
});

describe('bisaDiulang', () => {
    const galat = (code) => Object.assign(new Error('x'), { code });
    it('mengulang ER_DUP_ENTRY dan ER_LOCK_DEADLOCK (deadlock/serialisasi), bukan galat lain', () => {
        expect(bisaDiulang(galat('ER_DUP_ENTRY'))).toBe(true);
        expect(bisaDiulang(galat('ER_LOCK_DEADLOCK'))).toBe(true);
        expect(bisaDiulang(galat('ER_NO_REFERENCED_ROW_2'))).toBe(false);
        expect(bisaDiulang(new Error('x'))).toBe(false);
    });
});