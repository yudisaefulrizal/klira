import { hashSkripInline, susunCsp } from './csp.js';

describe('CSP', () => {
    it('menghash skrip inline dan mengabaikan skrip bersumber berkas', () => {
        const html = '<script type="importmap">{"imports":{}}</script><script type="module" src="/src/main.js"></script>';
        const h = hashSkripInline(html);
        expect(h).toHaveLength(1);
        expect(h[0]).toMatch(/^'sha256-[A-Za-z0-9+/]+=*'$/);
    });
    it('hanya mengizinkan sumber luar yang dipakai aplikasi', () => {
        const csp = susunCsp({ host: 'klira.test', hashSkrip: ["'sha256-abc='"] });
        expect(csp).toContain("script-src 'self' 'sha256-abc='");
        expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
        expect(csp).toContain('https://fonts.googleapis.com');
        expect(csp).toContain('frame-src https://www.google.com https://maps.google.com');
        expect(csp).toContain('connect-src \'self\' ws://klira.test wss://klira.test');
        expect(csp).toContain("object-src 'none'");
    });
});
