import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import WebSocket from 'ws';
import type { PenggunaSaya } from '@klira/shared';
import { prisma } from '@klira/db';
import { pasangWebsocketLayarPanggilan } from './websocket';
import { kabarkanLayarPanggilan } from './kanal';
import { pasangWebsocketWhatsapp } from '../whatsapp/websocket';
jest.mock('@klira/db', () => ({ prisma: { fasyankes: { findUnique: jest.fn() } } }));
let server: Server, url: string, tutup: () => void, tutupWhatsapp: () => void;
const sockets: WebSocket[] = [];
let sesiBerlaku = true;
const akses = { saya: async (sesi: string | undefined) => sesiBerlaku && sesi === 'sah' ? { fasyankes_id: 7, wajib_ganti_kredensial: false } as PenggunaSaya : null };
beforeEach(async () => {
  sesiBerlaku = true;
  jest.mocked(prisma.fasyankes.findUnique).mockImplementation(args => Promise.resolve(args.where.id === 404 ? null : { id: args.where.id }) as never);
  server = createServer((_req, res) => res.end());
  // Verifikasi upgrade WhatsApp tidak menghancurkan koneksi kanal publik.
  tutupWhatsapp = pasangWebsocketWhatsapp(server, { saya: async () => null }, 'http://klira.test');
  tutup = pasangWebsocketLayarPanggilan(server, 'http://klira.test', 100, akses);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', () => resolve()));
  url = `ws://127.0.0.1:${(server.address() as AddressInfo).port}/api/publik/layar-panggilan`;
});
afterEach(async () => {
  for (const ws of sockets.splice(0)) ws.terminate();
  tutup(); tutupWhatsapp();
  await new Promise<void>(resolve => server.close(() => resolve()));
});
async function buka(id = 7) {
  const ws = new WebSocket(`${url}/${id}/ws`, { origin: 'http://klira.test' });
  sockets.push(ws);
  const pesan = await new Promise<string>((resolve, reject) => {
    ws.once('message', d => resolve(d.toString())); ws.once('error', reject);
  });
  expect(JSON.parse(pesan)).toEqual({ tipe: 'siap' });
  return ws;
}
test('publik tanpa sesi dan perubahan hanya dikirim kepada fasilitas yang sesuai', async () => {
  const satu = await buka(), dua = await buka(8);
  const pesanLain: string[] = [];
  dua.on('message', d => pesanLain.push(d.toString()));
  const pesan = new Promise<string>(resolve => satu.once('message', d => resolve(d.toString())));
  kabarkanLayarPanggilan(7);
  expect(JSON.parse(await pesan)).toEqual({ tipe: 'perubahan' });
  await new Promise(resolve => setTimeout(resolve, 20));
  expect(pesanLain.filter(p => JSON.parse(p).tipe === 'perubahan')).toEqual([]);
});
test('origin asing, ID tidak sah, dan fasilitas tidak ditemukan ditolak', async () => {
  for (const [id, origin, kode] of [['7', 'http://asing.test', 403], ['abc', 'http://klira.test', 400], ['404', 'http://klira.test', 404]] as const) {
    const ws = new WebSocket(`${url}/${id}/ws`, { origin }); sockets.push(ws); ws.on('error', () => {});
    expect(await new Promise<number>(resolve => ws.on('unexpected-response', (_req, res) => { resolve(res.statusCode!); ws.terminate(); }))).toBe(kode);
  }
});
test('kanal menolak pesan klien sehingga layar tidak dapat membuat panggilan', async () => {
  const ws = await buka();
  const tutup = new Promise<number>(resolve => ws.once('close', resolve));
  ws.send(JSON.stringify({ tipe: 'panggil', kode: 'A-999' }));
  expect(await tutup).toBe(1008);
});
test('heartbeat dikirim agar layar dapat mendeteksi koneksi yang macet', async () => {
  const ws = await buka();
  const pesan = await new Promise<string>(resolve => ws.once('message', d => resolve(d.toString())));
  expect(JSON.parse(pesan)).toEqual({ tipe: 'hidup' });
});

function tungguJumlah(ws: WebSocket) {
  return new Promise<number>(resolve => {
    const dengar = (d: WebSocket.RawData) => {
      const pesan = JSON.parse(d.toString());
      if (pesan.tipe === 'layar') { ws.off('message', dengar); resolve(pesan.jumlah); }
    };
    ws.on('message', dengar);
  });
}
function pemantau() {
  const ws = new WebSocket(`${url}/7/ws?pemantau=1`, { origin: 'http://klira.test', headers: { cookie: 'klira_sesi=sah' } });
  sockets.push(ws); return ws;
}
test('pemantau mendapat jumlah layar aktual, tidak menghitung dirinya atau fasilitas lain', async () => {
  const monitor = pemantau();
  expect(await tungguJumlah(monitor)).toBe(0);
  const monitorDua = pemantau();
  expect(await tungguJumlah(monitorDua)).toBe(0);
  await buka(8);
  const tersambung = tungguJumlah(monitor);
  const layar = await buka(7);
  expect(await tersambung).toBe(1);
  const terputus = tungguJumlah(monitor);
  layar.close();
  expect(await terputus).toBe(0);
});
test('pemantauan memerlukan sesi sah milik fasilitas yang dipantau', async () => {
  for (const [id, sesi] of [['7', ''], ['8', 'sah']] as const) {
    const ws = new WebSocket(`${url}/${id}/ws?pemantau=1`, { origin: 'http://klira.test', headers: { cookie: `klira_sesi=${sesi}` } });
    sockets.push(ws); ws.on('error', () => {});
    const kode = await new Promise<number>(resolve => ws.on('unexpected-response', (_req, res) => { resolve(res.statusCode!); ws.terminate(); }));
    expect(kode).toBe(401);
  }
});
test('pemantauan ditutup setelah sesi berakhir', async () => {
  const monitor = pemantau(); await tungguJumlah(monitor);
  const ditutup = new Promise<number>(resolve => monitor.once('close', resolve));
  sesiBerlaku = false;
  expect(await ditutup).toBe(1008);
});
