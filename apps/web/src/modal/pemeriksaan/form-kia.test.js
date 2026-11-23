import { hitungHplDanUsia, sisipkanBlokKia, susunRingkasanKia, uraiBlokKia } from './form-kia.js';

describe('form ringkas KIA', () => {
    it('menghitung HPL (+280 hari) dan usia kehamilan dari HPHT', () => {
        const acuan = new Date('2026-11-23T00:00:00Z');
        const h = hitungHplDanUsia('2026-06-01', acuan);
        expect(h.hpl).toBe('2027-03-08');
        expect(h.usia).toBe('25 mgg 0 hr');
        expect(hitungHplDanUsia('', acuan)).toEqual({ hpl: null, usia: null });
    });

    it('menyusun ringkasan ANC, KB, dan Anak secara rapi dan mengabaikan state kosong', () => {
        const acuan = new Date('2026-11-23T00:00:00Z');
        expect(susunRingkasanKia({
            layanan: 'anc', g: '2', p: '1', a: '0', hpht: '2026-06-01', tfu: '24', djj: '144', letak: 'Kepala', lila: '25', tt: 'T2',
        }, acuan)).toBe('[KIA - ANC] G2P1A0 · HPHT 2026-06-01 · UK 25 mgg 0 hr · HPL 2027-03-08 · TFU 24 cm · DJJ 144 x/mnt · Letak Kepala · LILA 25 cm · Imunisasi T2');

        expect(susunRingkasanKia({ layanan: 'kb', metode_kb: '', status_kb: '', kontrol_kb: '' })).toBe('');
        expect(susunRingkasanKia({ layanan: 'kb', metode_kb: 'Suntik 3 bulan', status_kb: 'Ulang', kontrol_kb: '2027-02-20' }))
            .toBe('[KIA - KB] Metode Suntik 3 bulan · Status Ulang · Kontrol 2027-02-20');

        expect(susunRingkasanKia({ layanan: 'anak', lk: '42', vaksin: 'DPT-HB-Hib 1', dosis_vaksin: '0.5 ml IM', jadwal_vaksin: '2026-12-23' }))
            .toBe('[KIA - Anak] LK 42 cm · Imunisasi DPT-HB-Hib 1 · 0.5 ml IM · Jadwal berikutnya 2026-12-23');
    });

    it('mengurai kembali blok KIA dari teks Objek untuk ANC, KB, dan Anak', () => {
        expect(uraiBlokKia('[KIA - ANC] G2P1A0 · HPHT 2026-06-01 · UK 25 mgg 0 hr · HPL 2027-03-08 · TFU 24 cm · DJJ 144 x/mnt · Letak Kepala · LILA 25 cm · Imunisasi T2'))
            .toMatchObject({ layanan: 'anc', g: '2', p: '1', a: '0', hpht: '2026-06-01', tfu: '24', djj: '144', letak: 'Kepala', lila: '25', tt: 'T2' });

        expect(uraiBlokKia('[KIA - KB] Metode Suntik 3 bulan · Status Ulang · Kontrol 2027-02-20'))
            .toMatchObject({ layanan: 'kb', metode_kb: 'Suntik 3 bulan', status_kb: 'Ulang', kontrol_kb: '2027-02-20' });

        expect(uraiBlokKia('[KIA - Anak] LK 42 cm · Imunisasi DPT-HB-Hib 1 · 0.5 ml IM · Jadwal berikutnya 2026-12-23'))
            .toMatchObject({ layanan: 'anak', lk: '42', vaksin: 'DPT-HB-Hib 1', dosis_vaksin: '0.5 ml IM', jadwal_vaksin: '2026-12-23' });
    });

    it('menyisipkan dan memperbarui blok KIA di teks Objek tanpa menghapus catatan lain', () => {
        const awal = 'Konjungtiva tidak anemis';
        const ke1 = sisipkanBlokKia(awal, '[KIA - ANC] G2P1A0 · TFU 24 cm');
        expect(ke1).toBe('[KIA - ANC] G2P1A0 · TFU 24 cm\nKonjungtiva tidak anemis');
        const ke2 = sisipkanBlokKia(ke1, '[KIA - ANC] G2P1A0 · TFU 26 cm');
        expect(ke2).toBe('[KIA - ANC] G2P1A0 · TFU 26 cm\nKonjungtiva tidak anemis');
    });
});
