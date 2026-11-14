import { jest } from '@jest/globals';

const s = await import("./status.js");
const { IZIN_AWAL, JENIS_AKUN_AWAL } = await import("../administrasi/izin.js");

const WARNA = ['hijau', 'kuning', 'merah', 'biru', 'ungu', 'abu'];

describe('status', () => {
    it('setiap status punya label dan token warna yang dikenal', () => {
        const semua = [s.STATUS_KUNJUNGAN, s.TAHAP_LAYANAN, s.STATUS_TAGIHAN, s.STATUS_PEMBAYARAN, s.STATUS_KLAIM,
            s.STATUS_KIRIM_SATUSEHAT, s.STATUS_ORDER_PENUNJANG, s.STATUS_RESEP, s.STATUS_ANTREAN];
        for (const g of semua) {
            expect(g.nilai.length).toBeGreaterThan(0);
            for (const n of g.nilai) {
                const info = g.info(n);
                expect(info.label.length).toBeGreaterThan(0);
                expect(WARNA).toContain(info.warna);
                expect(info.warna).not.toMatch(/#/);
            }
        }
    });
    it('contoh pemetaan', () => {
        expect(s.STATUS_PEMBAYARAN.label('lunas')).toBe('Lunas');
        expect(s.STATUS_KLAIM.warna('ditolak')).toBe('merah');
        expect(s.STATUS_KLAIM.nilai).toHaveLength(8);
    });
});

describe('izin', () => {
    it('katalog dan 12 jenis akun', () => {
        expect(IZIN_AWAL).toHaveLength(17 * 3 * 2 + 2);
        expect(JENIS_AKUN_AWAL).toHaveLength(12);
    });
});

describe('status layanan gabungan kunjungan', () => {
    const k = (tahap_layanan, antrean) => ({ tahap_layanan, antrean: antrean ? { status: antrean } : null });
    it('mencakup semua kondisi dari antrean dan tahap', () => {
        const kasus = [
            [k('menunggu_skrining', 'menunggu'), 'menunggu'], [k('menunggu_skrining', 'dipanggil'), 'dipanggil'], [k('menunggu_skrining', 'dilayani'), 'skrining'],
            [k('pemeriksaan', 'menunggu'), 'menunggu'], [k('pemeriksaan', 'dipanggil'), 'dipanggil'], [k('pemeriksaan', 'dilayani'), 'diperiksa'],
            [k('resep', 'selesai'), 'menunggu_obat'], [k('kasir', 'selesai'), 'pembayaran'], [k('ditutup', 'selesai'), 'selesai'],
            [k('menunggu_skrining', 'batal'), 'batal'], [k('ditutup', null), 'selesai'], [k('pemeriksaan', null), 'diperiksa'],
        ];
        for (const [kunjungan, harapan] of kasus)
            expect(s.statusLayananDari(kunjungan)).toBe(harapan);
        for (const [, harapan] of kasus)
            expect(s.STATUS_LAYANAN.nilai).toContain(harapan);
    });
});


describe('penunjang saja: status hasil lab dan status layanan', () => {
    it('status hasil lab dari ringkasan order: menunggu, belum diserahkan, sudah diserahkan, null tanpa order', () => {
        expect(s.statusHasilLabDari({ total: 0, divalidasi: 0 })).toBeNull();
        expect(s.statusHasilLabDari({ total: 2, divalidasi: 1, diserahkan_pada: null })).toBe('menunggu');
        expect(s.statusHasilLabDari({ total: '2', divalidasi: '2', diserahkan_pada: null })).toBe('belum_diserahkan');
        expect(s.statusHasilLabDari({ total: 2, divalidasi: 2, diserahkan_pada: new Date() })).toBe('diserahkan');
        expect(s.STATUS_HASIL_LAB.nilai).toEqual(['menunggu', 'belum_diserahkan', 'diserahkan']);
    });
    it('kunjungan LAB di tahap pemeriksaan berstatus spesimen, bukan diperiksa', () => {
        expect(s.statusLayananDari({ jenis: 'LAB', tahap_layanan: 'pemeriksaan', antrean: { status: 'dilayani' } })).toBe('spesimen');
        expect(s.statusLayananDari({ jenis: 'AMB', tahap_layanan: 'pemeriksaan', antrean: { status: 'dilayani' } })).toBe('diperiksa');
        expect(s.statusLayananDari({ jenis: 'LAB', tahap_layanan: 'kasir', antrean: { status: 'selesai' } })).toBe('pembayaran');
    });
});
