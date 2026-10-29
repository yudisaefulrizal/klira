import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createHmac } from 'node:crypto';
import WebSocket from 'ws';
import type { PenggunaSaya } from '@klira/shared';
import { pasangWebsocketWhatsapp } from './websocket';
import { kabarkanWhatsapp } from './kanal';
let server: Server;
let url: string;
let tutup: () => void;
let pengguna: Record<string, PenggunaSaya | null>;
const sockets: WebSocket[] = [];
const keyLama = process.env.KUNCI_ENKRIPSI;
beforeEach(async () => {
  process.env.KUNCI_ENKRIPSI = 'kunci-unit-test-bukan-kredensial';
  const akun = (id: number, fas: number) =>
    ({
      id,
      fasyankes_id: fas,
      wajib_ganti_kredensial: false,
      izin: [{ fitur: 'whatsapp', aksi: 'lihat', cakupan: 'unit' }],
    }) as PenggunaSaya;
  pengguna = { satu: akun(1, 10), dua: akun(2, 20), tanpa: { ...akun(3, 10), izin: [] } };
  server = createServer((_req, res) => res.end());
  tutup = pasangWebsocketWhatsapp(server, { saya: async (id) => (id ? pengguna[id] : null) }, 'http://klira.test', 100);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  url = `ws://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterEach(async () => {
  for (const ws of sockets.splice(0)) ws.terminate();
  tutup();
  await new Promise<void>((resolve) => server.close(() => resolve()));
  if (keyLama === undefined) delete process.env.KUNCI_ENKRIPSI;
  else process.env.KUNCI_ENKRIPSI = keyLama;
});
async function browser(sesi = 'satu') {
  const ws = new WebSocket(`${url}/api/whatsapp/ws`, {
    origin: 'http://klira.test',
    headers: { cookie: `klira_sesi=${sesi}` },
  });
  sockets.push(ws);
  await new Promise<void>((resolve, reject) => {
    ws.once('message', () => resolve());
    ws.once('error', reject);
  });
  return ws;
}
async function ditolak(path: string, origin: string, sesi?: string) {
  const ws = new WebSocket(`${url}${path}`, { origin, headers: sesi ? { cookie: `klira_sesi=${sesi}` } : {} });
  sockets.push(ws);
  ws.on('error', () => {});
  return new Promise<number>((resolve) =>
    ws.on('unexpected-response', (_req, res) => {
      resolve(res.statusCode!);
      ws.terminate();
    }),
  );
}
it('menolak tanpa sesi, tanpa izin, dan origin asing', async () => {
  expect(await ditolak('/api/whatsapp/ws', 'http://klira.test')).toBe(401);
  expect(await ditolak('/api/whatsapp/ws', 'http://klira.test', 'tanpa')).toBe(401);
  expect(await ditolak('/api/whatsapp/ws', 'http://asing.test', 'satu')).toBe(403);
});
it('hanya mengirim metadata perubahan ke fasyankes yang sesuai', async () => {
  const satu = await browser();
  const dua = await browser('dua');
  const lain: string[] = [];
  dua.on('message', (d) => lain.push(d.toString()));
  const event = new Promise<string>((resolve) => satu.once('message', (d) => resolve(d.toString())));
  kabarkanWhatsapp({ tipe: 'pesan', fasyankes_id: 10, baru: true });
  expect(JSON.parse(await event)).toEqual({ tipe: 'pesan', baru: true });
  await new Promise((resolve) => setTimeout(resolve, 30));
  expect(lain).toEqual([]);
});
it('menerima notifikasi engine hanya dengan token yang benar', async () => {
  expect(await ditolak('/api/whatsapp/engine-ws', 'http://klira.test')).toBe(401);
  const satu = await browser();
  const token = createHmac('sha256', process.env.KUNCI_ENKRIPSI!).update('klira-whatsapp-events-v1').digest('hex');
  const engine = new WebSocket(`${url}/api/whatsapp/engine-ws`, { headers: { authorization: `Bearer ${token}` } });
  sockets.push(engine);
  await new Promise<void>((resolve, reject) => {
    engine.once('open', resolve);
    engine.once('error', reject);
  });
  const event = new Promise<string>((resolve) => satu.once('message', (d) => resolve(d.toString())));
  engine.send(JSON.stringify({ tipe: 'pesan', fasyankes_id: 10, baru: true }));
  expect(JSON.parse(await event).tipe).toBe('pesan');
});
it('menutup koneksi saat hak akun dicabut', async () => {
  const ws = await browser();
  pengguna.satu = null;
  const code = await new Promise<number>((resolve) => ws.once('close', resolve));
  expect(code).toBe(1008);
});
