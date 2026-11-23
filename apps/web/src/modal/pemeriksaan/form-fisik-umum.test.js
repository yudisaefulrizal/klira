import { sisipkanBlokFisik, stateFisikDefault, susunRingkasanFisik } from './form-fisik-umum.js';

describe('form-fisik-umum', () => {
    it('state default mengisi urutan head-to-toe dalam batas normal dan melewati Tidak Diperiksa', () => {
        const s = stateFisikDefault();
        const teks = susunRingkasanFisik(s);
        expect(teks).toContain('[PF] KU Sehat');
        expect(teks).toContain('Kepala: Normal');
        expect(teks).toContain('Thoraks (Paru & Jantung): Normal');
        expect(teks).toContain('Kulit: Normal');
        expect(teks).not.toContain('Genital & Anus');
    });

    it('menyertakan keterangan abnormal dan menyisipkan blok [PF] tanpa menghapus catatan lain', () => {
        const s = stateFisikDefault();
        s.bagian.tht = { status: 'Abnormal', ket: 'faring hiperemis' };
        const pf = susunRingkasanFisik(s);
        expect(pf).toContain('Gigi, Mulut & THT: Abnormal (faring hiperemis)');

        const ke1 = sisipkanBlokFisik('Catatan tambahan', pf);
        expect(ke1.startsWith('[PF]')).toBe(true);
        expect(ke1.endsWith('Catatan tambahan')).toBe(true);
        const ke2 = sisipkanBlokFisik(ke1, '[PF] KU Sakit Ringan');
        expect(ke2).toBe('[PF] KU Sakit Ringan\nCatatan tambahan');
    });
});
