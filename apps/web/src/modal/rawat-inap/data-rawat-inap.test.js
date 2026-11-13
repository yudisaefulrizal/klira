import { bagianRawatInap } from './data-rawat-inap.js';

const detail = (lebih = {}) => ({
    kunjungan: { spri: 'SPRI/1', mulai: '2026-11-13T11:00:00.000Z' },
    penempatan: [
        { ruang_nama: 'Observasi', bed_nama: 'Bed 1', kelas: 'tiga', indikator: 'kelas_tetap', tarif_nama: 'Kamar', mulai: '2026-11-13T11:00:00.000Z', selesai: '2026-11-13T12:00:00.000Z' },
        { ruang_nama: 'Observasi', bed_nama: 'Bed 2', kelas: 'dua', indikator: 'naik_kelas', tarif_nama: null, mulai: '2026-11-13T12:00:00.000Z', selesai: null },
    ],
    dpjp: [],
    dpjp_riwayat: [{ nama: 'dr. A', tipe: 'ATND', mulai: '2026-11-13T11:00:00.000Z', selesai: '2026-11-13T12:00:00.000Z' }, { nama: 'Bd. B', tipe: 'SPRF', mulai: null, selesai: null }],
    pemulangan: null,
    ...lebih,
});
const cppt = [
    { waktu: '2026-11-13T12:30:00.000Z', subjektif: 's2', objektif: 'o2', asesmen: 'a2', rencana: 'p2', instruksi: null, tanda_vital: null, dibuat_oleh_nama: 'dr. A' },
    { waktu: '2026-11-13T11:30:00.000Z', subjektif: 's1', objektif: 'o1', asesmen: 'a1', rencana: 'p1', instruksi: 'ins', tanda_vital: { suhu: 38.1 }, dibuat_oleh_nama: 'dr. A' },
];

describe('bagianRawatInap', () => {
    it('merangkum admisi, DPJP (termasuk yang sudah selesai), penempatan, dan CPPT berurutan lama ke baru', () => {
        const [admisi, harian] = bagianRawatInap({ detail: detail(), cppt });
        expect(admisi.baris[0]).toEqual({ label: 'Surat perintah rawat inap (SPRI)', nilai: 'SPRI/1' });
        expect(admisi.baris.filter((b) => b.label.startsWith('DPJP')).map((b) => b.label)).toEqual(['DPJP utama', 'DPJP bersama']);
        expect(admisi.baris.some((b) => b.label === 'Observasi · Bed 2' && b.nilai.includes('Naik kelas') && b.nilai.includes('sekarang'))).toBe(true);
        expect(harian.baris).toHaveLength(2);
        expect(harian.baris[0].nilai).toContain('S: s1');
        expect(harian.baris[0].nilai).toContain('Instruksi: ins');
        expect(harian.baris[1].nilai).toContain('S: s2');
    });
    it('bagian Pemulangan hanya ada setelah pasien dipulangkan', () => {
        expect(bagianRawatInap({ detail: detail(), cppt: [] })).toHaveLength(2);
        const pulang = { disposisi: 'home', kondisi_pulang: 'baik', diagnosis_akhir: 'A09', ringkasan: 'r', tindak_lanjut: null, waktu: '2026-11-13T13:00:00.000Z', dibuat_oleh_nama: 'dr. A' };
        const bagian = bagianRawatInap({ detail: detail({ pemulangan: pulang }), cppt: [] });
        expect(bagian).toHaveLength(3);
        expect(bagian[2].baris.find((b) => b.label === 'Diagnosis akhir').nilai).toBe('A09');
        expect(bagian[2].baris.find((b) => b.label === 'Disposisi pulang').nilai).toBe('Pulang ke rumah');
    });
    it('tanpa CPPT menampilkan keterangan belum ada catatan', () => {
        expect(bagianRawatInap({ detail: detail(), cppt: [] })[1].baris[0].nilai).toBe('Belum ada catatan.');
    });
});
