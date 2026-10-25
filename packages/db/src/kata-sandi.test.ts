import { cocokKataSandi, hashKataSandi } from './kata-sandi';

describe('kata sandi', () => {
  it('hash berbeda per garam dan cocok hanya dengan kata sandi benar', async () => {
    const a = await hashKataSandi('rahasia-uji');
    const b = await hashKataSandi('rahasia-uji');
    expect(a).not.toBe(b);
    expect(a).not.toContain('rahasia-uji');
    expect(await cocokKataSandi('rahasia-uji', a)).toBe(true);
    expect(await cocokKataSandi('salah', a)).toBe(false);
    expect(await cocokKataSandi('x', 'bukan-hash')).toBe(false);
  });
});
