import { adaPerubahan, bacaDraf, hapusDraf, kunciDraf, simpanDraf } from './draf';
import type { PenyimpananDraf } from './draf';
import { saringTeks } from './saring-teks';

function memori(): PenyimpananDraf & { isi: Map<string, string> } {
  const isi = new Map<string, string>();
  return { isi, getItem: (k) => isi.get(k) ?? null, setItem: (k, v) => void isi.set(k, v), removeItem: (k) => void isi.delete(k) };
}

describe('draf lokal', () => {
  it('kunci per alur dan per pemilik', () => {
    expect(kunciDraf('pembuatan-akun', 12)).toBe('klira.draf.pembuatan-akun.12');
    expect(kunciDraf('pembuatan-akun')).toBe('klira.draf.pembuatan-akun');
  });
  it('simpan lalu baca mengembalikan nilai dan langkah; hapus menghilangkan', () => {
    const m = memori();
    expect(simpanDraf('k', { nama: 'A' }, 2, m, () => new Date('2026-10-25T01:00:00Z'))).toBe(true);
    expect(bacaDraf<{ nama: string }>('k', m)).toEqual({ versi: 1, disimpan: '2026-10-25T01:00:00.000Z', langkah: 2, nilai: { nama: 'A' } });
    hapusDraf('k', m);
    expect(bacaDraf('k', m)).toBeNull();
  });
  it('draf rusak, beda versi, atau penyimpanan tak ada menghasilkan null tanpa galat', () => {
    const m = memori();
    m.setItem('a', '{bukan json');
    m.setItem('b', JSON.stringify({ versi: 99, langkah: 0, nilai: {} }));
    expect(bacaDraf('a', m)).toBeNull();
    expect(bacaDraf('b', m)).toBeNull();
    expect(bacaDraf('a', null)).toBeNull();
    expect(simpanDraf('a', {}, 0, null)).toBe(false);
  });
  it('penyimpanan yang menolak tulis tidak melempar', () => {
    const penuh: PenyimpananDraf = { getItem: () => null, setItem: () => { throw new Error('penuh'); }, removeItem: () => { throw new Error('x'); } };
    expect(simpanDraf('k', {}, 0, penuh)).toBe(false);
    expect(() => hapusDraf('k', penuh)).not.toThrow();
  });
  it('deteksi perubahan isian', () => {
    expect(adaPerubahan({ a: 1 }, { a: 1 })).toBe(false);
    expect(adaPerubahan({ a: 1 }, { a: 2 })).toBe(true);
  });
});

describe('saring teks', () => {
  const daftar = ['Resep input unit', 'Rekam medis lihat layanan', 'Kasir input unit'];
  it('semua kata harus cocok, tanpa beda huruf besar/kecil; kosong mengembalikan semua', () => {
    expect(saringTeks(daftar, 'REKAM lihat', (x) => x)).toEqual(['Rekam medis lihat layanan']);
    expect(saringTeks(daftar, 'input', (x) => x)).toHaveLength(2);
    expect(saringTeks(daftar, '  ', (x) => x)).toHaveLength(3);
    expect(saringTeks(daftar, 'zzz', (x) => x)).toEqual([]);
  });
});

import { alasanSiap } from './alasan';
describe('alasan', () => {
  it('wajib tidak boleh kosong atau spasi saja', () => {
    expect(alasanSiap('  ', true)).toBe(false);
    expect(alasanSiap('karena', true)).toBe(true);
    expect(alasanSiap('', false)).toBe(true);
  });
});
