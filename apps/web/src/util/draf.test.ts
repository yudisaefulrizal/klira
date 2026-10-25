import { adaPerubahan, adaptorLokal, bacaDraf, hapusDrafKlinisLama, hapusDraf, hapusSemuaDraf, kunciDraf, saringSensitif, simpanDraf } from './draf';
import type { PenyimpananDraf } from './draf';
import { saringTeks } from './saring-teks';

function memori(): PenyimpananDraf & { isi: Map<string, string> } {
  const isi = new Map<string, string>();
  return {
    isi, getItem: (k) => isi.get(k) ?? null, setItem: (k, v) => void isi.set(k, v), removeItem: (k) => void isi.delete(k),
    key: (i) => [...isi.keys()][i] ?? null,
    get length() { return isi.size; },
  };
}

describe('draf lokal', () => {
  it('kunci per alur dan per pemilik', () => {
    expect(kunciDraf('pembuatan-akun', 12)).toBe('klira.draf.pembuatan-akun.12');
    expect(kunciDraf('pembuatan-akun')).toBe('klira.draf.pembuatan-akun');
  });
  it('simpan lalu baca mengembalikan nilai dan langkah; hapus menghilangkan', () => {
    const m = memori();
    expect(simpanDraf('k', { nama: 'A' }, 2, m, () => new Date('2026-10-25T01:00:00Z'))).toBe(true);
    expect(bacaDraf<{ nama: string }>('k', m, { sekarang: () => new Date('2026-10-25T01:05:00Z') })).toEqual({ versi: 1, disimpan: '2026-10-25T01:00:00.000Z', langkah: 2, nilai: { nama: 'A' } });
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

describe('draf: sensitif, kedaluwarsa, hapus semua', () => {
  it('saringSensitif membuang bidang tingkat atas', () => {
    expect(saringSensitif({ nik: '1', agama: 'x' }, ['nik'])).toEqual({ agama: 'x' });
    expect(saringSensitif({ nik: '1' })).toEqual({ nik: '1' });
  });
  it('draf lewat masa berlaku dibuang saat dibaca', () => {
    const m = memori();
    simpanDraf('k', { a: 1 }, 0, m, () => new Date('2026-10-25T01:00:00Z'));
    expect(bacaDraf('k', m, { kedaluwarsaMs: 30 * 60_000, sekarang: () => new Date('2026-10-25T01:29:00Z') })).not.toBeNull();
    expect(bacaDraf('k', m, { kedaluwarsaMs: 30 * 60_000, sekarang: () => new Date('2026-10-25T01:31:00Z') })).toBeNull();
    expect(m.isi.has('k')).toBe(false);
  });
  it('hapusSemuaDraf hanya menghapus kunci klira.draf.*', () => {
    const m = memori();
    m.setItem('klira.draf.a.1', 'x');
    m.setItem('klira.draf.b', 'x');
    m.setItem('lain', 'x');
    hapusSemuaDraf(m);
    expect([...m.isi.keys()]).toEqual(['lain']);
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

describe('adaptor lokal dan sisa draf klinis lama', () => {
  it('adaptor lokal membuang bidang sensitif saat menyimpan', () => {
    const m = memori();
    const a = adaptorLokal<{ nama: string; nik: string }>('k', { simpanan: m, sensitif: ['nik'] });
    a.simpan({ nama: 'A', nik: '123' }, 1);
    expect(m.isi.get('k')).not.toContain('123');
    expect(a.baca()).toMatchObject({ langkah: 1, nilai: { nama: 'A' } });
    a.hapus();
    expect(a.baca()).toBeNull();
  });
  it('hapusDrafKlinisLama membuang hanya kunci pemeriksaan dan skrining', () => {
    const m = memori();
    m.setItem('klira.draf.pemeriksaan-klinis-3.7', '{}');
    m.setItem('klira.draf.skrining-3.7', '{}');
    m.setItem('klira.draf.pembuatan-akun.7', '{}');
    hapusDrafKlinisLama(m);
    expect([...m.isi.keys()]).toEqual(['klira.draf.pembuatan-akun.7']);
  });
});
