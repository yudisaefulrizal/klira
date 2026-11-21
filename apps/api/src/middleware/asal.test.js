import { jest } from '@jest/globals';
import { tolakAsalLintasSitus } from './asal.js';

function panggil({ metode = 'POST', asal, cookie, hostname = 'klinik.example' }) {
    const res = { status: jest.fn(function () { return this; }), json: jest.fn() };
    const next = jest.fn();
    const headers = {};
    if (asal) headers.origin = asal;
    if (cookie) headers.cookie = cookie;
    tolakAsalLintasSitus()({ method: metode, headers, hostname }, res, next);
    return { res, next };
}

describe('tolakAsalLintasSitus', () => {
    it('menolak POST bersesi dari asal lain dengan 403', () => {
        const { res, next } = panggil({ asal: 'http://evil.example', cookie: 'klira_sesi=abc' });
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });
    it('meloloskan asal yang sama, termasuk beda port', () => {
        expect(panggil({ asal: 'https://klinik.example', cookie: 'x=1; klira_sesi=abc' }).next).toHaveBeenCalled();
        expect(panggil({ asal: 'http://klinik.example:8074', cookie: 'klira_sesi=abc' }).next).toHaveBeenCalled();
    });
    it('tidak menyentuh GET, permintaan tanpa Origin, atau tanpa cookie sesi', () => {
        expect(panggil({ metode: 'GET', asal: 'http://evil.example', cookie: 'klira_sesi=abc' }).next).toHaveBeenCalled();
        expect(panggil({ cookie: 'klira_sesi=abc' }).next).toHaveBeenCalled();
        expect(panggil({ asal: 'http://evil.example' }).next).toHaveBeenCalled();
    });
    it('menolak Origin yang tidak bisa diurai', () => {
        expect(panggil({ asal: 'null', cookie: 'klira_sesi=abc' }).next).not.toHaveBeenCalled();
    });
});
