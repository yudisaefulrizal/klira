import { bacaKonfigurasi } from './lingkungan';

describe('bacaKonfigurasi', () => {
  const dasar = { PORT: '8074', BASE_URL: 'https://klira.nuscode.id' };

  it('membaca PORT, BASE_URL, dan NODE_ENV', () => {
    expect(bacaKonfigurasi({ ...dasar, NODE_ENV: 'production' })).toEqual({
      port: 8074,
      baseUrl: 'https://klira.nuscode.id',
      nodeEnv: 'production',
    });
  });
  it('NODE_ENV bawaan development', () => {
    expect(bacaKonfigurasi(dasar).nodeEnv).toBe('development');
  });
  it('galat bila PORT tidak ada', () => {
    expect(() => bacaKonfigurasi({ BASE_URL: dasar.BASE_URL })).toThrow('PORT');
  });
  it('galat bila BASE_URL tidak ada atau tidak valid', () => {
    expect(() => bacaKonfigurasi({ PORT: '8074' })).toThrow('BASE_URL');
    expect(() => bacaKonfigurasi({ PORT: '8074', BASE_URL: 'bukan url' })).toThrow('BASE_URL');
  });
});
