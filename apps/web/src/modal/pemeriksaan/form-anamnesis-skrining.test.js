import { awalAnamnesisSkrining, sisipkanBlokAnamnesis, susunRingkasanAnamnesis } from './form-anamnesis-skrining.js';

describe('form-anamnesis-skrining', () => {
    it('mengisi default RPD/RPK/RPO dan menyusun ringkasan anamnesis', () => {
        const s = awalAnamnesisSkrining({ keluhan_utama: 'Demam 3 hari' }, null);
        expect(s.riwayat_pribadi).toBe('Tidak ada');
        expect(s.nyeri_jenis).toBe('tidak');
        const teks = susunRingkasanAnamnesis(s);
        expect(teks).toContain('[ANAMNESIS] Keluhan: Demam 3 hari');
        expect(teks).toContain('RPD: Tidak ada');
        expect(teks).not.toContain('Nyeri:');
    });

    it('menyisipkan dan mengganti blok [ANAMNESIS] pada Subjek tanpa menghapus catatan lain', () => {
        const awal = 'Pasien tampak lemas';
        const ke1 = sisipkanBlokAnamnesis(awal, '[ANAMNESIS] Keluhan: Demam');
        expect(ke1).toBe('[ANAMNESIS] Keluhan: Demam\nPasien tampak lemas');
        const ke2 = sisipkanBlokAnamnesis(ke1, '[ANAMNESIS] Keluhan: Batuk');
        expect(ke2).toBe('[ANAMNESIS] Keluhan: Batuk\nPasien tampak lemas');
    });
});
