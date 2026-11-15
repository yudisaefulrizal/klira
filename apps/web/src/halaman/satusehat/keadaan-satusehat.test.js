import { aksiTersedia, bentukKonfigurasi, formDariLingkungan, galatKonfigurasi, konfigurasiBerubah, ringkasStatusIhs, ujiBerhasil } from './keadaan-satusehat.js';

const kosong = { environment: 'sandbox', client_id: '', client_secret_terisi: false, base_url: null, base_url_efektif: 'https://stg', aktif: false, diuji_pada: null, hasil_uji: null };
const tersimpan = { ...kosong, client_id: 'cid', client_secret_terisi: true, base_url: 'http://localhost:8076' };

describe('form dan bentuk permintaan', () => {
    it('form dari DTO: null menjadi kosong dan rahasia selalu kosong', () => {
        expect(formDariLingkungan(kosong)).toEqual({ environment: 'sandbox', client_id: '', client_secret: '', base_url: '' });
        expect(formDariLingkungan(tersimpan)).toEqual({ environment: 'sandbox', client_id: 'cid', client_secret: '', base_url: 'http://localhost:8076' });
    });
    it('bentuk: dipangkas, rahasia dan alamat kosong dihilangkan', () => {
        expect(bentukKonfigurasi({ environment: 'produksi', client_id: ' cid ', client_secret: '  ', base_url: '' }))
            .toEqual({ environment: 'produksi', client_id: 'cid', client_secret: undefined, base_url: undefined });
        expect(bentukKonfigurasi({ environment: 'sandbox', client_id: 'c', client_secret: ' s ', base_url: ' http://x.test ' }))
            .toMatchObject({ client_secret: 's', base_url: 'http://x.test' });
    });
});

describe('validasi', () => {
    it('client ID wajib', () => {
        expect(galatKonfigurasi({ environment: 'sandbox', client_id: '', client_secret: 's', base_url: '' }, true).client_id).toBeDefined();
    });
    it('lingkungan baru wajib rahasia; yang sudah tersimpan boleh kosong', () => {
        const f = { environment: 'sandbox', client_id: 'cid', client_secret: '', base_url: '' };
        expect(galatKonfigurasi(f, false).client_secret).toMatch(/wajib/i);
        expect(galatKonfigurasi(f, true)).toEqual({});
        expect(galatKonfigurasi({ ...f, client_secret: 'rahasia' }, false)).toEqual({});
    });
    it('alamat harus URL', () => {
        expect(galatKonfigurasi({ environment: 'sandbox', client_id: 'c', client_secret: 's', base_url: 'bukan url' }, true).base_url).toBeDefined();
        expect(galatKonfigurasi({ environment: 'sandbox', client_id: 'c', client_secret: 's', base_url: 'http://localhost:8076' }, true)).toEqual({});
    });
});

describe('perubahan dan hasil uji', () => {
    it('konfigurasiBerubah mengabaikan spasi', () => {
        const f = formDariLingkungan(tersimpan);
        expect(konfigurasiBerubah(f, { ...f, client_id: 'cid ' })).toBe(false);
        expect(konfigurasiBerubah(f, { ...f, client_secret: 'baru' })).toBe(true);
        expect(konfigurasiBerubah(f, { ...f, base_url: '' })).toBe(true);
    });
    it('ujiBerhasil menurut awalan teks', () => {
        expect(ujiBerhasil('Terhubung ke Klinik X.')).toBe(true);
        expect(ujiBerhasil('Uji koneksi gagal: Invalid client id or secret')).toBe(false);
        expect(ujiBerhasil(null)).toBe(false);
    });
});

describe('aksiTersedia', () => {
    const ada = { bolehUbah: true, organisasiAda: true };
    it('belum tersimpan: hanya simpan', () => {
        expect(aksiTersedia(kosong, ada)).toEqual({ simpan: true, uji: false, aktifkan: false });
    });
    it('tersimpan: simpan, uji, dan aktifkan; yang sudah aktif tidak bisa diaktifkan lagi', () => {
        expect(aksiTersedia(tersimpan, ada)).toEqual({ simpan: true, uji: true, aktifkan: true });
        expect(aksiTersedia({ ...tersimpan, aktif: true }, ada)).toEqual({ simpan: true, uji: true, aktifkan: false });
    });
    it('Organization ID kosong: uji dan aktifkan tidak tersedia', () => {
        expect(aksiTersedia(tersimpan, { bolehUbah: true, organisasiAda: false })).toEqual({ simpan: true, uji: false, aktifkan: false });
    });
    it('hanya lihat: tidak ada tombol', () => {
        expect(aksiTersedia(tersimpan, { bolehUbah: false, organisasiAda: true })).toEqual({ simpan: false, uji: false, aktifkan: false });
    });
});

describe('ringkasStatusIhs', () => {
    it('hanya yang butuh perhatian yang ditampilkan', () => {
        expect(ringkasStatusIhs(undefined)).toBeNull();
        expect(ringkasStatusIhs({ status: 'sudah' })).toBeNull();
        expect(ringkasStatusIhs({ status: 'dilewati', alasan: 'belum_dikonfigurasi', pesan: 'x' })).toBeNull();
    });
    it('terhubung hijau; tidak ditemukan kuning; gagal merah; tanpa NIK kuning', () => {
        expect(ringkasStatusIhs({ status: 'terhubung', ihs_number: 'P1' })).toMatchObject({ nada: 'hijau' });
        expect(ringkasStatusIhs({ status: 'tidak_ditemukan', pesan: 'NIK pasien tidak ditemukan di SATUSEHAT.' })).toEqual({ nada: 'kuning', teks: 'NIK pasien tidak ditemukan di SATUSEHAT.' });
        expect(ringkasStatusIhs({ status: 'gagal', pesan: 'Pencarian di SATUSEHAT gagal: x' })).toEqual({ nada: 'merah', teks: 'Pencarian di SATUSEHAT gagal: x' });
        expect(ringkasStatusIhs({ status: 'dilewati', alasan: 'tanpa_nik', pesan: 'Pasien tanpa NIK tidak dapat dicari di SATUSEHAT.' })).toMatchObject({ nada: 'kuning' });
    });
});
