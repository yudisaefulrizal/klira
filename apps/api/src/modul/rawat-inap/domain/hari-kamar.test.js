import { describe, expect, it } from '@jest/globals';
import { hitungHariKamar } from './hari-kamar.js';

const JAM = 3_600_000;
const t = (jam) => new Date(Date.UTC(2026, 10, 19) + jam * JAM);

describe('hitungHariKamar', () => {
    it('satu penempatan: pembulatan ke atas per 24 jam, minimal satu hari', () => {
        expect(hitungHariKamar([{ id: 1, mulai: t(0), selesai: null }], t(60))).toEqual([{ id: 1, hari: 3 }]);
        expect(hitungHariKamar([{ id: 1, mulai: t(0), selesai: null }], t(0))).toEqual([{ id: 1, hari: 1 }]);
        expect(hitungHariKamar([{ id: 1, mulai: t(0), selesai: t(24) }], t(100))).toEqual([{ id: 1, hari: 5 }]);
    });
    it('pindah bed pada hari yang sama tidak menambah hari kamar', () => {
        const hasil = hitungHariKamar([{ id: 1, mulai: t(0), selesai: t(0.04) }, { id: 2, mulai: t(0.04), selesai: null }], t(0.1));
        expect(hasil).toEqual([{ id: 1, hari: 1 }]);
    });
    it('hari ditagihkan ke penempatan yang aktif pada awal tiap blok 24 jam', () => {
        const hasil = hitungHariKamar([{ id: 1, mulai: t(0), selesai: t(30) }, { id: 2, mulai: t(30), selesai: null }], t(50));
        expect(hasil).toEqual([{ id: 1, hari: 2 }, { id: 2, hari: 1 }]);
    });
    it('urutan masukan tidak berpengaruh; tanpa penempatan tidak ada baris', () => {
        const a = { id: 1, mulai: t(0), selesai: t(30) }, b = { id: 2, mulai: t(30), selesai: null };
        expect(hitungHariKamar([b, a], t(50))).toEqual(hitungHariKamar([a, b], t(50)));
        expect(hitungHariKamar([], t(10))).toEqual([]);
    });
});
