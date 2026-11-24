import { jest } from '@jest/globals';

const { REGISTRASI } = await import("@klira/shared");
const { buatLayananKunjungan } = await import("./layanan.js");
const { AntreanDitutupError, bisaDiulang } = await import("../data-access/repositori.js");

describe('layanan kunjungan dengan repositori tiruan', () => {
    const catatan = [];
    const saya = { id: 3 };
    const kunjungan = { id: 5, antrean: { id: 8, nomor: 1, kode: 'A-001', status: 'menunggu' } };
    const dasarRepo = {
        pasienAda: async (f, id) => f === 1 && id === 10,
        jenisPoliOperasional: async (f, jenis) => (f === 1 && String(jenis).toLowerCase() === 'umum' ? { jenis_poli: 'Umum', awalan: 'U' } : null),
        dpjpSah: async (f, id) => f === 1 && (id === 30 || id === 32),
        dokterDiJenis: async (f, id, jenis) => f === 1 && id === 30 && jenis === 'Umum',
        kunjunganBerjalan: async () => false,
        pemeriksaanLabAktif: async (f, ids) => ids.filter((id) => id < 100).length,
        daftarkan: jest.fn(async () => kunjungan),
        tahapSekarang: async (f, id) => (f === 1 && id === 5 ? 'pemeriksaan' : null),
        ubahTahap: jest.fn(async () => kunjungan),
        statusAntrean: async (f, id) => (f === 1 && id === 8 ? 'menunggu' : null),
        tahapAntrean: async (f, id) => (f === 1 && id === 8 ? 'pemeriksaan' : null),
        ubahAntrean: jest.fn(async () => ({ id: 8, kode: 'A-001' })),
    };
    const orderLab = jest.fn(async () => ({ ok: true, data: {} }));
    const buat = (sisa = {}) => buatLayananKunjungan({ repo: { ...dasarRepo, ...sisa }, orderLab, audit: { catat: async (e) => void catatan.push(e) }, sekarang: () => new Date('2026-10-25T01:00:00Z') });
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
    it('mencari IHS Number pasien saat pendaftaran dan melampirkan hasilnya; kunjungan tetap tersimpan walau hasilnya gagal', async () => {
        const sinkronIhs = jest.fn(async () => ({ status: 'gagal', pesan: 'x' }));
        const h = await buatLayananKunjungan({ repo: dasarRepo, orderLab, sinkronIhs, audit: { catat: async () => { } }, sekarang: () => new Date('2026-10-25T01:00:00Z') }).daftarkan(saya, masukan, '::1');
        expect(h).toMatchObject({ ok: true, data: { id: 5, satusehat: { status: 'gagal' } } });
        expect(sinkronIhs).toHaveBeenCalledWith(saya, 10, { alamat: '::1' });
    });
    it('pendaftaran yang ditolak tidak mencari IHS Number', async () => {
        const sinkronIhs = jest.fn();
        const l = buatLayananKunjungan({ repo: { ...dasarRepo, pasienAda: async () => false }, orderLab, sinkronIhs, audit: { catat: async () => { } } });
        expect((await l.daftarkan(saya, masukan)).ok).toBe(false);
        expect(sinkronIhs).not.toHaveBeenCalled();
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
        expect(await l.daftarkan({ id: 3 }, masukan)).toMatchObject({ ok: false, kode: 'tidak_ditemukan' });
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
        expect(dasarRepo.ubahAntrean).toHaveBeenCalledWith(1, 8, 'panggil', ['menunggu', 'dipanggil', 'dilewati'], 'dipanggil', expect.any(Date), undefined);
        expect(await l.aksiAntrean(saya, 8, 'mulai')).toMatchObject({ ok: false, kode: 'konflik' });
        expect(await l.aksiAntrean({ id: 3 }, 8, 'panggil')).toMatchObject({ ok: false, kode: 'tidak_ditemukan' });
    });
    it('lewati hanya dari dipanggil; pasien yang dilewati dapat dipanggil lagi', async () => {
        expect(await buat().aksiAntrean(saya, 8, 'lewati')).toMatchObject({ ok: false, kode: 'konflik' });
        const l = buat({ statusAntrean: async () => 'dipanggil' });
        expect(await l.aksiAntrean(saya, 8, 'lewati')).toMatchObject({ ok: true });
        expect(dasarRepo.ubahAntrean).toHaveBeenCalledWith(1, 8, 'lewati', ['dipanggil'], 'dilewati', expect.any(Date), undefined);
        dasarRepo.ubahAntrean.mockClear();
        const lagi = buat({ statusAntrean: async () => 'dilewati' });
        expect(await lagi.aksiAntrean(saya, 8, 'panggil')).toMatchObject({ ok: true });
        expect(dasarRepo.ubahAntrean).toHaveBeenCalledWith(1, 8, 'panggil', ['menunggu', 'dipanggil', 'dilewati'], 'dipanggil', expect.any(Date), undefined);
        expect(await lagi.aksiAntrean(saya, 8, 'mulai')).toMatchObject({ ok: false, kode: 'konflik' });
    });
    it('panggil ditolak selama pasien masih di skrining; dokter memanggil setelah skrining selesai', async () => {
        const l = buat({ tahapAntrean: async () => 'menunggu_skrining' });
        expect(await l.aksiAntrean(saya, 8, 'panggil')).toMatchObject({ ok: false, kode: 'konflik', pesan: expect.stringContaining('belum selesai skrining') });
        expect(dasarRepo.ubahAntrean).not.toHaveBeenCalled();
    });
    it('panggil ditolak bila poli masih melayani pasien lain atau tidak operasional', async () => {
        const sibuk = jest.fn(async () => ({ galat: 'poli_sibuk', poli: 'Poli Umum 1', kode: 'A-006' }));
        expect(await buat({ ubahAntrean: sibuk }).aksiAntrean(saya, 8, 'panggil')).toMatchObject({ ok: false, kode: 'konflik', pesan: expect.stringContaining('Poli Umum 1 sedang melayani A-006') });
        const tutup = jest.fn(async () => ({ galat: 'poli_tidak_operasional', poli: 'Poli Gigi' }));
        expect(await buat({ ubahAntrean: tutup }).aksiAntrean(saya, 8, 'panggil')).toMatchObject({ ok: false, kode: 'konflik', pesan: expect.stringContaining('Poli Gigi sedang tidak operasional') });
    });
    it('penunjang saja: antrean Laboratorium berawalan L tanpa dokter, order lab dibuat dari pemeriksaan yang sah', async () => {
        const l = buat();
        const h = await l.daftarkan(saya, { pasien_id: 10, jenis: 'LAB', pemeriksaan_ids: [1, 2, 2], dpjp_id: 30, perujuk: 'dr. Sinta', cara_pembayaran: 'umum' });
        expect(h).toMatchObject({ ok: true });
        expect(dasarRepo.daftarkan).toHaveBeenCalledWith(1, 3, expect.objectContaining({ jenis_poli: 'Laboratorium', awalan: 'L', pemeriksaan_ids: [1, 2], dpjp_id: undefined, perujuk: 'dr. Sinta' }), expect.any(Date));
        expect(orderLab).toHaveBeenCalledWith(saya, 5, { pemeriksaan_ids: [1, 2], prioritas: 'rutin', catatan: null }, undefined);
    });
    it('penunjang saja ditolak tanpa menyimpan bila pemeriksaan kosong atau ada yang tidak sah', async () => {
        const l = buat();
        expect(await l.daftarkan(saya, { pasien_id: 10, jenis: 'LAB', pemeriksaan_ids: [], cara_pembayaran: 'umum' })).toMatchObject({ ok: false, kode: 'tidak_valid' });
        expect(await l.daftarkan(saya, { pasien_id: 10, jenis: 'LAB', pemeriksaan_ids: [1, 500], cara_pembayaran: 'umum' })).toMatchObject({ ok: false, kode: 'tidak_valid' });
        expect(dasarRepo.daftarkan).not.toHaveBeenCalled();
        expect(orderLab).not.toHaveBeenCalled();
    });
    it('daftar antrean memakai hari ini menurut Asia/Jakarta bila tanggal kosong', async () => {
        const daftarAntrean = jest.fn(async () => ({ total: 0, baris: [] }));
        await buat({ daftarAntrean }).daftarAntrean(saya, { halaman: 1, ukuran: 50 });
        expect(daftarAntrean).toHaveBeenCalledWith(1, expect.objectContaining({ tanggal: '2026-10-25' }));
    });
    it('ubahDpjp berhasil sebelum pasien diperiksa dokter dan ditolak jika sudah dilayani atau tidak sesuai poli', async () => {
        const ubahDpjp = jest.fn(async (_f, id, dpjpId) => ({ id, dpjp_id: dpjpId }));
        const l = buat({
            detailUntukUbahDpjp: async () => ({ id: 5, jenis: 'AMB', tahap_layanan: 'menunggu_skrining', dpjp_id: null, antrean: { id: 8, kode: 'A-001', jenis_poli: 'Umum', status: 'menunggu' } }),
            ubahDpjp,
        });
        expect(await l.ubahDpjp(saya, 5, 30)).toMatchObject({ ok: true, data: { id: 5, dpjp_id: 30 } });
        expect(ubahDpjp).toHaveBeenCalledWith(1, 5, 30, 3, expect.any(Date));
        expect(await l.ubahDpjp(saya, 5, 32)).toMatchObject({ ok: false, kode: 'tidak_valid', pesan: REGISTRASI.galat.dokterBukanPoli });

        const sudahDilayani = buat({
            detailUntukUbahDpjp: async () => ({ id: 5, jenis: 'AMB', tahap_layanan: 'pemeriksaan', dpjp_id: 30, antrean: { id: 8, kode: 'A-001', jenis_poli: 'Umum', status: 'dilayani' } }),
            ubahDpjp,
        });
        expect(await sudahDilayani.ubahDpjp(saya, 5, 30)).toMatchObject({ ok: false, kode: 'konflik' });
    });
    it('daftarkan menolak AMB/LAB saat antrean ditutup, tetapi tetap mengizinkan rawat inap langsung (IMP)', async () => {
        const l = buat({ daftarkan: async (_f, _o, d) => (d.jenis === 'IMP' ? { id: 9, id_layanan: 'LY-261025-0001', antrean: null } : Promise.reject(new AntreanDitutupError())) });
        expect(await l.daftarkan(saya, masukan)).toMatchObject({ ok: false, kode: 'konflik', pesan: expect.stringContaining('ditutup') });
        expect(await l.daftarkan(saya, { pasien_id: 10, jenis: 'IMP', cara_pembayaran: 'umum' })).toMatchObject({ ok: true, data: { id: 9, id_layanan: 'LY-261025-0001' } });
    });
    it('tutupAntrean menolak jika masih ada antrean belum selesai dan menutup jika semua selesai', async () => {
        const ditolak = buat({
            tutupSesiAntrean: async () => ({
                galat: 'belum_selesai',
                belum_selesai: [{ id: 1, nomor: 1, awalan: 'A', pasien_nama: 'Budi', tahap_layanan: 'pemeriksaan' }],
            }),
        });
        expect(await ditolak.tutupAntrean(saya)).toMatchObject({ ok: false, kode: 'konflik', pesan: expect.stringContaining('A-001 Budi') });

        const diterima = buat({ tutupSesiAntrean: async () => ({ ok: true, sesi_id: 7 }) });
        expect(await diterima.tutupAntrean(saya)).toMatchObject({ ok: true, data: { status: 'tutup' } });
    });
    it('bukaAntrean membuka sesi baru dan memindahkan antrean sementara Mobile JKN ke antrean aktif', async () => {
        const tandaiSementaraJknDipindahkan = jest.fn(async () => ({ count: 1 }));
        const l = buat({
            bukaSesiAntrean: async () => ({
                sesi: { id: 10, status: 'buka', dibuka_pada: new Date('2026-10-25T01:00:00Z') },
                sementara: [{ id: 3, pasien_id: 10, jenis_poli: 'umum', pcare_no_urut: '001', keluhan_singkat: 'Demam' }],
            }),
            tandaiSementaraJknDipindahkan,
        });
        expect(await l.bukaAntrean(saya)).toMatchObject({ ok: true, data: { sesi: { id: 10, status: 'buka' }, dipindahkan: 1 } });
        expect(tandaiSementaraJknDipindahkan).toHaveBeenCalledWith(3, 1, 5, expect.any(Date));
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