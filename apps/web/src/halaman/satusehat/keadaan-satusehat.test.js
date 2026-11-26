import { barisKoneksi, ringkasStatusIhs, ujiBerhasil } from './keadaan-satusehat.js';

const dto = { environment: 'sandbox', base_url: 'https://stg', organization_id: 'org-1', client_id: 'cid', client_secret_terisi: true };

describe('barisKoneksi', () => {
    it('menampilkan penanda rahasia, bukan nilainya', () => {
        expect(barisKoneksi(dto).map(([, v]) => v)).toEqual(['Sandbox (uji coba)', 'https://stg', 'org-1', 'cid', 'Terisi']);
    });
    it('isian kosong ditandai belum diisi', () => {
        const kosong = { ...dto, organization_id: null, client_id: '', client_secret_terisi: false };
        expect(barisKoneksi(kosong).slice(2).map(([, v]) => v)).toEqual(['Belum diisi', 'Belum diisi', 'Belum diisi']);
    });
});

describe('ujiBerhasil', () => {
    it('menurut awalan teks', () => {
        expect(ujiBerhasil('Terhubung ke Klinik X.')).toBe(true);
        expect(ujiBerhasil('Uji koneksi gagal: Invalid client id or secret')).toBe(false);
        expect(ujiBerhasil(null)).toBe(false);
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
