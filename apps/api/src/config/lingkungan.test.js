import { jest } from '@jest/globals';

const { bacaKonfigurasi, bacaTrustProxy } = await import("./lingkungan.js");

describe('bacaKonfigurasi', () => {
    const dasar = { PORT: '8074', BASE_URL: 'https://klira.nuscode.id' };
    it('membaca PORT, BASE_URL, dan NODE_ENV', () => {
        expect(bacaKonfigurasi({ ...dasar, NODE_ENV: 'production' })).toEqual({
            port: 8074,
            baseUrl: 'https://klira.nuscode.id',
            nodeEnv: 'production',
            trustProxy: 'loopback',
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
describe('bacaTrustProxy', () => {
    it('bawaan hanya mempercayai proxy di host yang sama', () => {
        expect(bacaTrustProxy(undefined)).toBe('loopback');
        expect(bacaTrustProxy('  ')).toBe('loopback');
    });
    it('menerima jumlah hop, daftar alamat, dan false', () => {
        expect(bacaTrustProxy('1')).toBe(1);
        expect(bacaTrustProxy('loopback, 10.0.0.0/8')).toEqual(['loopback', '10.0.0.0/8']);
        expect(bacaTrustProxy('false')).toBe(false);
    });
    it('menolak mempercayai semua proxy', () => {
        expect(() => bacaTrustProxy('true')).toThrow('TRUST_PROXY');
        expect(() => bacaKonfigurasi({ PORT: '8074', BASE_URL: 'https://klira.nuscode.id', TRUST_PROXY: 'TRUE' })).toThrow('TRUST_PROXY');
    });
});
