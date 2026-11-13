import { jest } from '@jest/globals';

const { opsiCookieSesi } = await import("./cookie.js");

describe('opsiCookieSesi', () => {
    it('secure untuk https', () => {
        expect(opsiCookieSesi('https://klira.nuscode.id')).toMatchObject({ secure: true, httpOnly: true, sameSite: 'lax' });
    });
    it('tidak secure untuk http', () => {
        expect(opsiCookieSesi('http://localhost:8074').secure).toBe(false);
    });
});