import { jest } from '@jest/globals';

const { createServer } = await import("node:http");
const { default: WebSocket } = await import("ws");
const { pasangWebsocketInstagram } = await import("./websocket.js");
const { kabarkanInstagram } = await import("../domain/kanal.js");

let server;

let url;

let tutup;

let pengguna;

const sockets = [];

const keyLama = process.env.KUNCI_ENKRIPSI;

beforeEach(async () => {
    process.env.KUNCI_ENKRIPSI = 'kunci-unit-test-bukan-kredensial';
    const akun = (id, fas) => ({
        id,
        fasyankes_id: fas,
        wajib_ganti_kredensial: false,
        izin: [{ fitur: 'instagram', aksi: 'lihat', cakupan: 'unit' }],
    });
    pengguna = { satu: akun(1, 10), dua: akun(2, 20), tanpa: { ...akun(3, 10), izin: [] } };
    server = createServer((_req, res) => res.end());
    tutup = pasangWebsocketInstagram(server, { saya: async (id) => (id ? pengguna[id] : null) }, 'http://klira.test', 100);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    url = `ws://127.0.0.1:${server.address().port}`;
});

afterEach(async () => {
    for (const ws of sockets.splice(0))
        ws.terminate();
    tutup();
    await new Promise((resolve) => server.close(() => resolve()));
    if (keyLama === undefined)
        delete process.env.KUNCI_ENKRIPSI;
    else
        process.env.KUNCI_ENKRIPSI = keyLama;
});

async function browser(sesi = 'satu') {
    const ws = new WebSocket(`${url}/api/instagram/ws`, {
        origin: 'http://klira.test',
        headers: { cookie: `klira_sesi=${sesi}` },
    });
    sockets.push(ws);
    await new Promise((resolve, reject) => {
        ws.once('message', () => resolve());
        ws.once('error', reject);
    });
    return ws;
}

async function ditolak(path, origin, sesi) {
    const ws = new WebSocket(`${url}${path}`, { origin, headers: sesi ? { cookie: `klira_sesi=${sesi}` } : {} });
    sockets.push(ws);
    ws.on('error', () => { });
    return new Promise((resolve) => ws.on('unexpected-response', (_req, res) => {
        resolve(res.statusCode);
        ws.terminate();
    }));
}

it('menolak tanpa sesi, tanpa izin, dan origin asing', async () => {
    expect(await ditolak('/api/instagram/ws', 'http://klira.test')).toBe(401);
    expect(await ditolak('/api/instagram/ws', 'http://klira.test', 'tanpa')).toBe(401);
    expect(await ditolak('/api/instagram/ws', 'http://asing.test', 'satu')).toBe(403);
});

it('hanya mengirim metadata perubahan ke fasyankes yang sesuai', async () => {
    const satu = await browser();
    const dua = await browser('dua');
    const lain = [];
    dua.on('message', (d) => lain.push(d.toString()));
    const event = new Promise((resolve) => satu.once('message', (d) => resolve(d.toString())));
    kabarkanInstagram({ tipe: 'pesan', fasyankes_id: 10, baru: true });
    expect(JSON.parse(await event)).toEqual({ tipe: 'pesan', baru: true });
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(lain).toEqual([]);
});

it('menutup koneksi saat hak akun dicabut', async () => {
    const ws = await browser();
    pengguna.satu = null;
    const code = await new Promise((resolve) => ws.once('close', resolve));
    expect(code).toBe(1008);
});