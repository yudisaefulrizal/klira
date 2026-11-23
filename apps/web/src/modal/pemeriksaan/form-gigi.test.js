import { sisipkanBlokGigi, susunRingkasanGigi } from './form-gigi.js';

describe('form odontogram poli gigi', () => {
    it('menyusun ringkasan gigi FDI dan intraoral serta mengabaikan gigi normal (sou)', () => {
        expect(susunRingkasanGigi({
            gigi: {
                16: { kondisi: 'car', catatan: 'MO' },
                36: { kondisi: 'rrx', catatan: '' },
                11: { kondisi: 'sou', catatan: '' },
            },
            intraoral: {
                oklusi: 'Normal',
                gingiva: 'Hiperemis',
                kalkulus: '',
            },
        })).toBe('[GIGI] 16: Karies (MO); 36: Sisa Akar · Oklusi Normal · Gingiva Hiperemis');

        expect(susunRingkasanGigi({ gigi: {}, intraoral: {} })).toBe('');
    });

    it('menyisipkan dan memperbarui blok [GIGI] di teks Objek tanpa menghapus catatan lain', () => {
        const awal = 'Pasien mengeluh ngilu saat minum dingin';
        const ke1 = sisipkanBlokGigi(awal, '[GIGI] 16: Karies (MO)');
        expect(ke1).toBe('[GIGI] 16: Karies (MO)\nPasien mengeluh ngilu saat minum dingin');

        const ke2 = sisipkanBlokGigi(ke1, '[GIGI] 16: Tambalan Komposit/GIC (MO)');
        expect(ke2).toBe('[GIGI] 16: Tambalan Komposit/GIC (MO)\nPasien mengeluh ngilu saat minum dingin');

        expect(sisipkanBlokGigi(ke2, '')).toBe('Pasien mengeluh ngilu saat minum dingin');
    });
});
