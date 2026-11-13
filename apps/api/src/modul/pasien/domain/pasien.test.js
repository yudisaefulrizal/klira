import { jest } from '@jest/globals';

const { registrasiPasienMasukan } = await import("@klira/shared");
const { buatLayananPasien, normalkanRegistrasi } = await import("./layanan.js");
const { NikKembarError } = await import("../data-access/repositori.js");

const teks = { id: 7, jenis: 'general', versi: 2, judul: 'GC', tujuan: 'Tujuan', isi: 'Isi' };

const dasar = {
    nama: '  Siti Rahma ', tanggal_lahir: '1990-05-01', jenis_kelamin: 'perempuan', nik: '3201010101900001', ibu_kandung: 'Rina', alamat: '  ', agama: ' Islam ',
    persetujuan: { teks_persetujuan_id: 7, bentuk: 'tertulis', penandatangan: 'pasien', setuju: true },
};

const urai = (o = {}) => registrasiPasienMasukan.parse({ ...dasar, ...o });

describe('normalkanRegistrasi', () => {
    it('memangkas, mengosongkan string kosong, dan menetapkan status identitas', () => {
        const d = normalkanRegistrasi(urai(), teks);
        expect(d).toMatchObject({ nama: 'Siti Rahma', alamat: null, agama: 'Islam', status_identitas: 'lengkap', nik: '3201010101900001' });
        expect(d.persetujuan).toMatchObject({ penandatangan: 'pasien', penandatangan_nama: 'Siti Rahma', wali_ke: null });
    });
    it('pasien tanpa identitas: NIK kosong dan status sementara', () => {
        const d = normalkanRegistrasi(urai({ jalur_identitas: 'tanpa_identitas', nik: undefined, nomor_paspor: 'X' }), teks);
        expect(d).toMatchObject({ nik: null, status_identitas: 'sementara', nomor_paspor: null });
    });
    it('menyimpan nomor pasien terpisah dari kontak wali dan tetap opsional', () => {
        expect(normalkanRegistrasi(urai({ nomor_hp: '081234567890' }), teks).nomor_hp).toBe('6281234567890');
        expect(normalkanRegistrasi(urai(), teks).nomor_hp).toBeNull();
    });
    it('paspor hanya menyimpan nomor paspor; wali penandatangan membawa namanya', () => {
        const d = normalkanRegistrasi(urai({
            jalur_identitas: 'paspor', nik: undefined, nomor_paspor: ' P1 ', nomor_kitas: 'K', tidak_cakap: true,
            wali: [{ hubungan: 'Ayah', nama: ' Budi ', kontak: '' }], persetujuan: { ...dasar.persetujuan, penandatangan: 'wali', wali_ke: 0 },
        }), teks);
        expect(d).toMatchObject({ nomor_paspor: 'P1', nomor_kitas: null, tidak_cakap: true });
        expect(d.wali).toEqual([{ hubungan: 'Ayah', nama: 'Budi', kontak: null }]);
        expect(d.persetujuan).toMatchObject({ penandatangan: 'wali', penandatangan_nama: 'Budi', wali_ke: 0 });
    });
});

describe('layanan pasien dengan repositori tiruan', () => {
    const catatan = [];
    const audit = { catat: async (e) => void catatan.push(e) };
    const saya = { id: 3, fasyankes_id: 1 };
    const buat = (sisa) => buatLayananPasien({
        repo: {
            perbaiki: async () => true,
            teksUntukPakai: async (_f, id) => (id === 7 ? teks : null),
            duplikat: async () => [],
            daftarkan: async () => ({ id: 9, nomor_rm: '00-00-001', nama: 'Siti Rahma', status_identitas: 'lengkap', persetujuan_id: 4 }),
            detail: async (f, id) => (f === 1 && id === 9 ? { id: 9 } : null),
            ...sisa,
        },
        audit,
    });
    beforeEach(() => void (catatan.length = 0));
    it('berhasil: mencatat audit input untuk pasien dan persetujuan', async () => {
        const h = await buat({}).daftarkan(saya, urai());
        expect(h).toMatchObject({ ok: true, data: { id: 9, nomor_rm: '00-00-001' } });
        expect(catatan.map((c) => `${c.aksi}:${c.entitas}`)).toEqual(['input:pasien', 'input:persetujuan']);
        expect(JSON.stringify(catatan)).not.toContain('3201010101900001');
    });
    it('teks persetujuan tidak sah ditolak sebelum menyimpan', async () => {
        const daftarkan = jest.fn();
        const h = await buat({ daftarkan }).daftarkan(saya, urai({ persetujuan: { ...dasar.persetujuan, teks_persetujuan_id: 99 } }));
        expect(h).toMatchObject({ ok: false, kode: 'tidak_valid' });
        expect(daftarkan).not.toHaveBeenCalled();
        expect(catatan).toHaveLength(0);
    });
    it('NIK kembar selalu ditolak; nama-lahir-ibu kembar butuh konfirmasi', async () => {
        const kandidat = (alasan) => async () => [{ id: 1, nomor_rm: 'X', nama: 'Siti', tanggal_lahir: '1990-05-01', alasan }];
        const nik = await buat({ duplikat: kandidat('nik') }).daftarkan(saya, urai({ konfirmasi_duplikat: true }));
        expect(nik).toMatchObject({ ok: false, kode: 'konflik' });
        const l = buat({ duplikat: kandidat('nama_lahir_ibu') });
        expect(await l.daftarkan(saya, urai())).toMatchObject({ ok: false, kode: 'konflik', rincian: [{ jalur: 'konfirmasi_duplikat' }] });
        expect(await l.daftarkan(saya, urai({ konfirmasi_duplikat: true }))).toMatchObject({ ok: true });
    });
    it('pelanggaran keunikan NIK saat menyimpan menjadi konflik', async () => {
        const h = await buat({ daftarkan: async () => { throw new NikKembarError(); } }).daftarkan(saya, urai());
        expect(h).toMatchObject({ ok: false, kode: 'konflik' });
        expect(catatan).toHaveLength(0);
    });
    it('detail dicatat lihat; lintas fasyankes tidak ditemukan dan tidak dicatat', async () => {
        const l = buat({});
        expect(await l.detail(saya, 9)).toMatchObject({ ok: true });
        expect(catatan).toEqual([expect.objectContaining({ aksi: 'lihat', entitas: 'pasien', keterangan: 'Membuka data pasien' })]);
        expect(await l.detail({ id: 3, fasyankes_id: 2 }, 9)).toMatchObject({ ok: false, kode: 'tidak_ditemukan' });
        expect(catatan).toHaveLength(1);
    });
    it('cek duplikat tanpa kriteria cukup tidak mencari', async () => {
        const duplikat = jest.fn(async () => []);
        await buat({ duplikat }).cekDuplikat(saya, { nama: 'Siti' });
        expect(duplikat).not.toHaveBeenCalled();
        await buat({ duplikat }).cekDuplikat(saya, { nik: '3201010101900001' });
        expect(duplikat).toHaveBeenCalledTimes(1);
    });
});