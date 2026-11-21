import { describe, expect, it } from '@jest/globals';
import { barisHistori, ringkasTandaVital } from './keadaan-histori-rawat-jalan.js';

describe('ringkasTandaVital', () => {
    it('merangkum tanda vital satu baris dan "-" bila kosong', () => {
        expect(ringkasTandaVital(null)).toBe('-');
        expect(ringkasTandaVital({ sistolik: 120, diastolik: 80, nadi: 88, suhu: 37.5, respirasi: 20, tinggi_badan: 160, berat_badan: 55 })).toBe('TD 120/80 · N 88 · R 20 · S 37.5°C · TB/BB 160/55');
        expect(ringkasTandaVital({})).toBe('-');
    });
});

describe('barisHistori', () => {
    const dasar = { id: 7, mulai: '2026-11-19T08:00:00.000Z', dpjp_nama: 'dr. Ahmad', poli_nama: 'Poli Umum 1', keluhan_utama: 'Demam', diagnosis: [{ kode: 'J06.9', nama: 'ISPA', peran: 'utama' }, { kode: 'R50.9', nama: 'Demam', peran: 'penyerta' }], tindak_lanjut: 'pulang', tanda_vital: { sistolik: 120, diastolik: 80 }, subjek: 'Demam 3 hari', objek: 'Faring hiperemis', asesmen: 'ISPA', plan: 'Simptomatik' };
    it('mengisi sel dari catatan SOAP, diagnosis, dan label tindak lanjut', () => {
        const b = barisHistori(dasar);
        expect(b).toMatchObject({ id: 7, pemeriksa: 'dr. Ahmad · Poli Umum 1', tandaVital: 'TD 120/80', subjektif: 'Demam 3 hari', objektif: 'Faring hiperemis', asesmen: 'ISPA', plan: 'Simptomatik', tindakLanjut: 'Pulang' });
        expect(b.diagnosis).toBe('J06.9 ISPA (utama)\nR50.9 Demam');
    });
    it('subjek memakai keluhan utama bila SOAP kosong; bagian kosong menjadi "-"', () => {
        const b = barisHistori({ ...dasar, subjek: null, objek: ' ', asesmen: null, plan: null, diagnosis: [], tindak_lanjut: null, tanda_vital: null, dpjp_nama: null, poli_nama: null });
        expect(b).toMatchObject({ subjektif: 'Demam', objektif: '-', asesmen: '-', plan: '-', diagnosis: '-', tindakLanjut: '-', tandaVital: '-', pemeriksa: '-' });
        expect(barisHistori({ ...dasar, subjek: null, keluhan_utama: null }).subjektif).toBe('-');
    });
});
