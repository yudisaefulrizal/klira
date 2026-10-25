import { adalahPertama, adalahTerakhir, batasi, langkahBermasalah, langkahBerikut, langkahSebelum, posisiLangkah, statusLangkah } from './langkah';

describe('navigasi langkah modal bertahap', () => {
  it('maju dan mundur dibatasi di ujung', () => {
    expect(langkahBerikut(0, 5)).toBe(1);
    expect(langkahBerikut(4, 5)).toBe(4);
    expect(langkahSebelum(0, 5)).toBe(0);
    expect(langkahSebelum(3, 5)).toBe(2);
    expect(batasi(99, 5)).toBe(4);
    expect(batasi(-3, 5)).toBe(0);
    expect(batasi(Number.NaN, 5)).toBe(0);
  });
  it('posisi "n dari m" dan penanda awal/akhir', () => {
    expect(posisiLangkah(1, 4)).toEqual({ nomor: 2, dari: 4 });
    expect(adalahPertama(0)).toBe(true);
    expect(adalahTerakhir(3, 4)).toBe(true);
    expect(adalahTerakhir(2, 4)).toBe(false);
  });
  it('status tiap langkah: aktif menang atas selesai, daftar tetap bisa diklik ke mana saja', () => {
    expect(statusLangkah(1, 4, [true, true, false, false])).toEqual(['selesai', 'aktif', 'belum', 'belum']);
  });
  it('langkah bermasalah pertama atau -1', () => {
    expect(langkahBermasalah([null, undefined, 'Nama wajib', 'x'])).toBe(2);
    expect(langkahBermasalah([null, ''])).toBe(-1);
  });
});
