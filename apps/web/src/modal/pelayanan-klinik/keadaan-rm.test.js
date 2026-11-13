import { jest } from '@jest/globals';
import { alasanPerbaikanSah, ringkasIsi, selisihBaris } from './keadaan-rm.js';
describe('tinjau perbaikan', () => {
    it('meringkas isi menjadi baris dan menandai yang berbeda', () => {
        const lama = ringkasIsi({ item: [{ kode: 'I10', nama: 'Hipertensi', peran: 'utama', snomed: null }] });
        const baru = ringkasIsi({ item: [{ kode: 'J06.9', nama: 'ISPA', peran: 'utama', snomed: null }] });
        expect(lama).toEqual(['item:', '  1. I10 · Hipertensi · utama']);
        const s = selisihBaris(lama, baru);
        expect(s.sekarang.map((x) => x.beda)).toEqual([false, true]);
        expect(s.usulan.map((x) => x.beda)).toEqual([false, true]);
        expect(ringkasIsi({ keluhan_utama: 'Pusing', penyerta: '' })).toEqual(['keluhan_utama: Pusing']);
        expect(ringkasIsi(null)).toEqual([]);
    });
    it('alasan perbaikan wajib', () => {
        expect(alasanPerbaikanSah('  ')).toBe(false);
        expect(alasanPerbaikanSah('salah ketik')).toBe(true);
    });
});
