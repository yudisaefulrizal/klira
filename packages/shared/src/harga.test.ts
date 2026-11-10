import { ringkasPerubahanHarga, rupiahTeks } from './harga';

describe('catatan perubahan harga', () => {
  it('memformat rupiah dengan titik ribuan dan tanda hubung bila kosong', () => {
    expect(rupiahTeks(25000)).toBe('Rp 25.000');
    expect(rupiahTeks(1234567)).toBe('Rp 1.234.567');
    expect(rupiahTeks(0)).toBe('Rp 0');
    expect(rupiahTeks(null)).toBe('-');
    expect(rupiahTeks(undefined)).toBe('-');
  });

  it('hanya memuat bidang yang berubah dan null bila tidak ada', () => {
    expect(ringkasPerubahanHarga([['harga umum', 25000, 30000], ['harga JKN', null, 20000]])).toBe('harga umum Rp 25.000 → Rp 30.000; harga JKN - → Rp 20.000');
    expect(ringkasPerubahanHarga([['harga umum', 25000, 30000], ['harga JKN', 20000, 20000]])).toBe('harga umum Rp 25.000 → Rp 30.000');
    expect(ringkasPerubahanHarga([['harga umum', 25000, 25000], ['harga JKN', null, undefined]])).toBeNull();
  });
});
