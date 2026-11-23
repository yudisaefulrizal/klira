import { sisipkanBlokUgd, susunRingkasanUgd } from './form-ugd.js';

describe('form triase UGD', () => {
    it('menyusun ringkasan triase merah + trauma dengan rapi', () => {
        expect(susunRingkasanUgd({
            triase: 'merah',
            zona: 'Ruang Resusitasi',
            cara_datang: 'Ambulans',
            jenis_kasus: 'Trauma / Kecelakaan',
            airway: 'Bebas',
            breathing: 'Sesak / Takipnea',
            circulation: 'Perdarahan aktif / Syok',
            disability: 'Alert',
            temuan_trauma: 'Fraktur terbuka kruris kanan',
            catatan: '',
        })).toBe('[UGD - TRIASE MERAH] Ruang Resusitasi · Ambulans · Trauma / Kecelakaan · Airway Bebas · Breathing Sesak / Takipnea · Circulation Perdarahan aktif / Syok · Disability Alert · Trauma: Fraktur terbuka kruris kanan');
    });

    it('menyisipkan dan memperbarui blok [UGD - TRIASE ...] tanpa menghapus catatan lain di Objek', () => {
        const awal = 'Pasien tampak kesakitan';
        const ke1 = sisipkanBlokUgd(awal, '[UGD - TRIASE KUNING] Zona Kuning · Non-Trauma');
        expect(ke1).toBe('[UGD - TRIASE KUNING] Zona Kuning · Non-Trauma\nPasien tampak kesakitan');
        const ke2 = sisipkanBlokUgd(ke1, '[UGD - TRIASE MERAH] Ruang Resusitasi · Non-Trauma');
        expect(ke2).toBe('[UGD - TRIASE MERAH] Ruang Resusitasi · Non-Trauma\nPasien tampak kesakitan');
    });
});
