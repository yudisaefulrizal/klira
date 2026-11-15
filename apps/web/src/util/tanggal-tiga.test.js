import { bersihkanAngka, gabungTanggal, kolomSelesai, lengkapiNol, pecahTanggal, tanggalDariTeks, tanggalKalender, tanggalLengkapSah } from './tanggal-tiga.js';

describe('isian tanggal tiga kolom', () => {
    it('tanggal kalender: kabisat dan batas bulan', () => {
        expect(tanggalKalender(2024, 2, 29)).toBe(true);
        expect(tanggalKalender(2026, 2, 29)).toBe(false);
        expect(tanggalKalender(2026, 4, 31)).toBe(false);
        expect(tanggalKalender(2026, 12, 31)).toBe(true);
        expect(tanggalKalender(2026, 13, 1)).toBe(false);
        expect(tanggalKalender(2026, 1, 0)).toBe(false);
        expect(tanggalKalender(999, 1, 1)).toBe(false);
        expect(tanggalLengkapSah('1990-11-15')).toBe(true);
        expect(tanggalLengkapSah('1990-02-30')).toBe(false);
        expect(tanggalLengkapSah('15//1990')).toBe(false);
        expect(tanggalLengkapSah('')).toBe(false);
    });
    it('gabung dan pecah bolak-balik, termasuk yang belum lengkap', () => {
        expect(gabungTanggal({ hari: '15', bulan: '11', tahun: '1990' })).toBe('1990-11-15');
        expect(gabungTanggal({ hari: '5', bulan: '1', tahun: '2026' })).toBe('2026-01-05');
        expect(gabungTanggal({ hari: '', bulan: '', tahun: '' })).toBe('');
        expect(gabungTanggal({ hari: '15', bulan: '', tahun: '1990' })).toBe('15//1990');
        expect(gabungTanggal({ hari: '31', bulan: '02', tahun: '2026' })).toBe('31/02/2026');
        expect(gabungTanggal({ hari: '15', bulan: '11', tahun: '199' })).toBe('15/11/199');
        expect(pecahTanggal('1990-11-15')).toEqual({ hari: '15', bulan: '11', tahun: '1990' });
        expect(pecahTanggal('15//1990')).toEqual({ hari: '15', bulan: '', tahun: '1990' });
        expect(pecahTanggal('31/02/2026')).toEqual({ hari: '31', bulan: '02', tahun: '2026' });
        expect(pecahTanggal('')).toEqual({ hari: '', bulan: '', tahun: '' });
        expect(pecahTanggal(null)).toEqual({ hari: '', bulan: '', tahun: '' });
        for (const nilai of ['1990-11-15', '15//1990', '31/02/2026', '5/1/', ''])
            expect(gabungTanggal(pecahTanggal(nilai))).toBe(nilai);
    });
    it('tempelan dikenali dalam beberapa bentuk', () => {
        expect(tanggalDariTeks('15/11/1990')).toEqual({ hari: '15', bulan: '11', tahun: '1990' });
        expect(tanggalDariTeks('5-1-2026')).toEqual({ hari: '5', bulan: '1', tahun: '2026' });
        expect(tanggalDariTeks('1990-11-15')).toEqual({ hari: '15', bulan: '11', tahun: '1990' });
        expect(tanggalDariTeks('15.11.1990')).toEqual({ hari: '15', bulan: '11', tahun: '1990' });
        expect(tanggalDariTeks('besok')).toBeNull();
        expect(tanggalDariTeks('15/11/90')).toBeNull();
    });
    it('ketikan: hanya angka dan fokus pindah bila kolom sudah selesai', () => {
        expect(bersihkanAngka('1a5-', 2)).toBe('15');
        expect(bersihkanAngka('199012', 4)).toBe('1990');
        expect(kolomSelesai('hari', '15')).toBe(true);
        expect(kolomSelesai('hari', '1')).toBe(false);
        expect(kolomSelesai('hari', '4')).toBe(true);
        expect(kolomSelesai('hari', '3')).toBe(false);
        expect(kolomSelesai('bulan', '1')).toBe(false);
        expect(kolomSelesai('bulan', '2')).toBe(true);
        expect(kolomSelesai('tahun', '199')).toBe(false);
        expect(kolomSelesai('tahun', '1990')).toBe(true);
        expect(lengkapiNol('5')).toBe('05');
        expect(lengkapiNol('15')).toBe('15');
        expect(lengkapiNol('')).toBe('');
    });
});
