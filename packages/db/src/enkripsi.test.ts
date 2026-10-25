import { randomBytes } from 'node:crypto';
import { dekripsiRahasia, enkripsiRahasia } from './enkripsi';

const kunci = randomBytes(32).toString('base64');

describe('enkripsi rahasia', () => {
  it('bolak-balik dan tidak menyimpan teks asli', () => {
    const t = enkripsiRahasia('rahasia-uji', kunci);
    expect(t).not.toContain('rahasia-uji');
    expect(dekripsiRahasia(t, kunci)).toBe('rahasia-uji');
  });
  it('IV acak membuat hasil berbeda', () => {
    expect(enkripsiRahasia('a', kunci)).not.toBe(enkripsiRahasia('a', kunci));
  });
  it('kunci salah gagal', () => {
    const t = enkripsiRahasia('a', kunci);
    expect(() => dekripsiRahasia(t, randomBytes(32).toString('base64'))).toThrow();
  });
  it('tanpa kunci gagal', () => {
    expect(() => enkripsiRahasia('a', '')).toThrow('KUNCI_ENKRIPSI');
  });
  it('kunci panjang salah ditolak', () => {
    expect(() => enkripsiRahasia('a', 'abc')).toThrow('32 byte');
  });
});
