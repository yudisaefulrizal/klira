import { aksiPcare, bentukPcare, formDariPcare, galatPcare, pcareBerubah } from './keadaan-pcare.js';

const kosong = { environment: 'sandbox', cons_id: '', username: '', app_code: '', service_name: 'pcare-rest', base_url: null, secret_key_terisi: false, user_key_terisi: false, password_terisi: false, aktif: false };
const tersimpan = { ...kosong, cons_id: '2112121', username: 'u', app_code: '012', secret_key_terisi: true, user_key_terisi: true, password_terisi: true, base_url: 'http://localhost:8075' };
const isi = { ...formDariPcare(kosong), cons_id: '2112121', username: 'u', app_code: '012', secret_key: 'sk', user_key: 'uk', password: 'pw' };

describe('form dan bentuk', () => {
    it('form dari DTO: rahasia selalu kosong, service_name bawaan', () => {
        expect(formDariPcare(kosong)).toMatchObject({ cons_id: '', secret_key: '', user_key: '', password: '', service_name: 'pcare-rest', base_url: '' });
        expect(formDariPcare(tersimpan)).toMatchObject({ cons_id: '2112121', base_url: 'http://localhost:8075', secret_key: '' });
    });
    it('bentuk: dipangkas dan rahasia/alamat kosong dihilangkan', () => {
        expect(bentukPcare({ ...isi, cons_id: ' 1 ', secret_key: ' ', base_url: '' })).toMatchObject({ cons_id: '1', secret_key: undefined, user_key: 'uk', base_url: undefined });
    });
});

describe('validasi', () => {
    it('lingkungan baru wajib ketiga rahasia dengan pesan menyebut nama rahasia', () => {
        const g = galatPcare({ ...isi, secret_key: '', user_key: '', password: '' }, kosong);
        expect(g.secret_key).toMatch(/Secret key/);
        expect(g.user_key).toMatch(/User key/);
        expect(g.password).toMatch(/Password/);
    });
    it('yang sudah tersimpan boleh kosong; bidang biasa tetap wajib', () => {
        expect(galatPcare({ ...isi, secret_key: '', user_key: '', password: '' }, tersimpan)).toEqual({});
        expect(galatPcare({ ...isi, cons_id: '' }, tersimpan).cons_id).toBeDefined();
        expect(galatPcare({ ...isi, service_name: '../x' }, tersimpan).service_name).toBeDefined();
        expect(galatPcare({ ...isi, base_url: 'bukan url' }, tersimpan).base_url).toBeDefined();
    });
});

describe('perubahan dan aksi', () => {
    it('pcareBerubah mengabaikan spasi', () => {
        const f = formDariPcare(tersimpan);
        expect(pcareBerubah(f, { ...f, cons_id: '2112121 ' })).toBe(false);
        expect(pcareBerubah(f, { ...f, password: 'baru' })).toBe(true);
    });
    it('aksi: belum tersimpan hanya simpan; tersimpan uji dan aktifkan; aktif tidak diaktifkan lagi; lihat saja tanpa tombol', () => {
        expect(aksiPcare(kosong, { bolehUbah: true })).toEqual({ simpan: true, uji: false, aktifkan: false });
        expect(aksiPcare(tersimpan, { bolehUbah: true })).toEqual({ simpan: true, uji: true, aktifkan: true });
        expect(aksiPcare({ ...tersimpan, aktif: true }, { bolehUbah: true }).aktifkan).toBe(false);
        expect(aksiPcare(tersimpan, { bolehUbah: false })).toEqual({ simpan: false, uji: false, aktifkan: false });
        expect(aksiPcare({ ...tersimpan, password_terisi: false }, { bolehUbah: true }).uji).toBe(false);
    });
});
