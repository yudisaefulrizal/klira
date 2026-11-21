import { jest } from '@jest/globals';
import { buatBatasLaju } from './batas-laju.js';

function panggil(mw, ip) {
    const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, status: jest.fn(function () { return this; }), json: jest.fn() };
    const next = jest.fn();
    mw({ ip }, res, next);
    return { res, next };
}

describe('buatBatasLaju', () => {
    it('meloloskan sampai batas lalu menjawab 429 dengan Retry-After', () => {
        let t = 0;
        const mw = buatBatasLaju({ jendelaMs: 60_000, maks: 2, sekarang: () => t });
        expect(panggil(mw, '1.1.1.1').next).toHaveBeenCalled();
        expect(panggil(mw, '1.1.1.1').next).toHaveBeenCalled();
        const { res, next } = panggil(mw, '1.1.1.1');
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(429);
        expect(res.headers['Retry-After']).toBe('60');
    });
    it('menghitung per alamat dan memulai jendela baru setelah lewat', () => {
        let t = 0;
        const mw = buatBatasLaju({ jendelaMs: 1000, maks: 1, sekarang: () => t });
        panggil(mw, 'a');
        expect(panggil(mw, 'b').next).toHaveBeenCalled();
        expect(panggil(mw, 'a').next).not.toHaveBeenCalled();
        t = 1000;
        expect(panggil(mw, 'a').next).toHaveBeenCalled();
    });
});
