import { jest } from '@jest/globals';

jest.unstable_mockModule('./modul/website-klinik/data-access/data.js', () => ({ bacaKlinikPublik: jest.fn().mockResolvedValue(null), pengaturanWebsite: jest.fn() }));
const { default: fs } = await import("fs");
const { default: os } = await import("os");
const { default: path } = await import("path");
const { buatApp } = await import("./app.js");
const { bacaKlinikPublik } = await import("./modul/website-klinik/data-access/data.js");

describe('app', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'klira-web-'));
    fs.writeFileSync(path.join(dir, 'index.html'), '<html>Klira SPA</html>');
    const server = buatApp(dir).listen(0);
    const { port } = server.address();
    const url = (p) => `http://127.0.0.1:${port}${p}`;
    afterAll(() => {
        server.close();
        fs.rmSync(dir, { recursive: true, force: true });
    });
    it('GET /api/kesehatan mengembalikan ok', async () => {
        const res = await fetch(url('/api/kesehatan'));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ status: 'ok' });
    });
    it('melayani index.html dan fallback SPA', async () => {
        expect(await (await fetch(url('/'))).text()).toContain('Klira SPA');
        expect(await (await fetch(url('/pasien/12'))).text()).toContain('Klira SPA');
    });
    it('galat pembacaan website publik memakai penanganan galat umum tanpa membocorkan stack', async () => {
        const log = jest.spyOn(console, 'error').mockImplementation(() => { });
        jest.mocked(bacaKlinikPublik).mockRejectedValueOnce(new Error('detail-internal-database'));
        try {
            const res = await fetch(url('/'));
            expect(res.status).toBe(500);
            const isi = await res.text();
            expect(isi).not.toContain('detail-internal-database');
            expect(JSON.parse(isi)).toHaveProperty('galat.kode', 'galat_server');
        }
        finally {
            log.mockRestore();
        }
    });
    it('rute masuk dan modul native tersedia langsung dari source', async () => {
        const halaman = await fetch(url('/masuk'));
        expect(halaman.status).toBe(200);
        expect(await halaman.text()).toContain('src="/src/main.js"');
        const modul = await fetch(url('/src/main.js'));
        expect(modul.status).toBe(200);
        expect(modul.headers.get('content-type')).toMatch(/javascript/);
        expect(await modul.text()).toContain('pasangKlinikPublik');
    });
    it('kanonisasi rute autentikasi mempertahankan query', async () => {
        const res = await fetch(url('/masuk/?asal=uji'), { redirect: 'manual' });
        expect(res.status).toBe(308);
        expect(res.headers.get('location')).toBe('/masuk?asal=uji');
    });
    it('rute /api tak dikenal tidak jatuh ke SPA', async () => {
        const res = await fetch(url('/api/tidak-ada'));
        expect(res.status).toBe(404);
        expect(await res.json()).toHaveProperty('galat');
    });
});