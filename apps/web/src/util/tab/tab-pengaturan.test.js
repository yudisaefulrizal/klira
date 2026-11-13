import { jest } from '@jest/globals';
import { HALAMAN_PENGATURAN, tabDiizinkan } from './tab-pengaturan.js';
const izin = (...f) => f.map((fitur) => ({ fitur, aksi: 'lihat', cakupan: 'unit' }));
const ids = (halaman, ...f) => tabDiizinkan(HALAMAN_PENGATURAN[halaman].tab, { izin: izin(...f) }).map((t) => t.id);
describe('tab Pengaturan menurut izin', () => {
    it('akses lihat membuka tab akses; audit lihat hanya mendapat peringatan', () => {
        expect(ids('akses', 'akses')).toEqual(['pengguna', 'jenis-akun', 'peringatan', 'keamanan']);
        expect(ids('akses', 'audit')).toEqual(['peringatan']);
        expect(ids('akses', 'master')).toEqual([]);
    });
    it('profil klinik dan backup dipisah menurut izin', () => {
        expect(ids('klinik', 'profil-klinik')).toEqual(['profil']);
        expect(ids('klinik', 'akses')).toEqual(['backup']);
        expect(ids('klinik', 'profil-klinik', 'akses')).toEqual(['profil', 'backup']);
        expect(ids('klinik')).toEqual([]);
    });
});
