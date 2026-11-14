import { jest } from '@jest/globals';
import { tabKasirKlaimDiizinkan } from './tab-kasir-klaim.js';
const ids = (izin) => tabKasirKlaimDiizinkan({ izin }).map((t) => t.id);
describe('tab Kasir dan klaim menurut izin', () => {
    it('kasir shift dan hasil lab, klaim hanya klaim, keduanya semua, tanpa izin kosong', () => {
        expect(ids([{ fitur: 'kasir', aksi: 'lihat', cakupan: 'unit' }])).toEqual(['shift', 'hasil']);
        expect(ids([{ fitur: 'klaim', aksi: 'lihat', cakupan: 'unit' }])).toEqual(['klaim']);
        expect(ids([{ fitur: 'kasir', aksi: 'lihat', cakupan: 'unit' }, { fitur: 'klaim', aksi: 'lihat', cakupan: 'unit' }])).toEqual(['shift', 'hasil', 'klaim']);
        expect(ids([{ fitur: 'master', aksi: 'lihat', cakupan: 'unit' }])).toEqual(['tarif']);
        expect(ids([{ fitur: 'pasien', aksi: 'lihat', cakupan: 'unit' }])).toEqual([]);
    });
});
