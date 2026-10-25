import * as s from './status';
import { IZIN_AWAL, JENIS_AKUN_AWAL } from './izin';

const WARNA = ['hijau', 'kuning', 'merah', 'biru', 'ungu', 'abu'];

describe('status', () => {
  it('setiap status punya label dan token warna yang dikenal', () => {
    const semua = [s.STATUS_KUNJUNGAN, s.TAHAP_LAYANAN, s.STATUS_TAGIHAN, s.STATUS_PEMBAYARAN, s.STATUS_KLAIM,
      s.STATUS_KIRIM_SATUSEHAT, s.STATUS_ORDER_PENUNJANG, s.STATUS_RESEP, s.STATUS_ANTREAN];
    for (const g of semua) {
      expect(g.nilai.length).toBeGreaterThan(0);
      for (const n of g.nilai) {
        const info = (g.info as (x: string) => s.InfoStatus)(n);
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
    expect(IZIN_AWAL).toHaveLength(15 * 3 * 2);
    expect(JENIS_AKUN_AWAL).toHaveLength(12);
  });
});
