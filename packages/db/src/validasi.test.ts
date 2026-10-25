import { nikValid, pastikanNik, tanggalValid } from './validasi';

describe('validasi', () => {
  it('NIK 16 digit', () => {
    expect(nikValid('3201010101010001')).toBe(true);
    expect(nikValid('320101010101000')).toBe(false);
    expect(nikValid('32010101010100AB')).toBe(false);
    expect(() => pastikanNik('1')).toThrow();
  });
  it('tanggal tidak sebelum 2014-06-03', () => {
    expect(tanggalValid(new Date('2014-06-02T00:00:00Z'))).toBe(false);
    expect(tanggalValid(new Date('2014-06-03T00:00:00Z'))).toBe(true);
  });
});
