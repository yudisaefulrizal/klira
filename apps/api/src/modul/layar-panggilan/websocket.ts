import type { IncomingMessage, Server } from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';
import { prisma } from '@klira/db';
import type { PesanLayarPanggilan } from '@klira/shared';
import { dengarkanLayarPanggilan } from './kanal';
import { bacaCookie } from '../../middleware/auth';
import { NAMA_COOKIE_SESI } from '../akses/skema';
import type { LayananAkses } from '../akses/layanan';

export const cocokSocketLayar = (path: string) => /^\/api\/publik\/layar-panggilan\/[^/]+\/ws$/.test(path);
export function pasangWebsocketLayarPanggilan(server: Server, baseUrl: string, heartbeatMs = 20000, akses?: Pick<LayananAkses, 'saya'>) {
  const wss = new WebSocketServer({ noServer: true, maxPayload: 1024, perMessageDeflate: false });
  const klien = new Map<WebSocket, { fasilitas: number; hidup: boolean; pemantau: boolean; sesi?: string }>();
  const kirim = (ws: WebSocket, pesan: PesanLayarPanggilan) => {
    if (ws.readyState !== WebSocket.OPEN) return;
    if (ws.bufferedAmount > 65536) { ws.close(1013, 'Sambungkan ulang'); return; }
    ws.send(JSON.stringify(pesan));
  };
  const kabarkanJumlah = (fasilitas: number) => {
    const jumlah = [...klien.values()].filter(k => k.fasilitas === fasilitas && !k.pemantau).length;
    for (const [ws, info] of klien) if (info.fasilitas === fasilitas && info.pemantau) kirim(ws, { tipe: 'layar', jumlah });
  };
  const lepas = dengarkanLayarPanggilan(fasilitas => {
    for (const [ws, info] of klien) if (info.fasilitas === fasilitas && !info.pemantau) kirim(ws, { tipe: 'perubahan' });
  });
  const upgrade = (req: IncomingMessage, socket: import('node:stream').Duplex, head: Buffer) => {
    const path = req.url?.split('?')[0] ?? '';
    if (!cocokSocketLayar(path)) return;
    socket.on('error', () => {});
    const asal = req.headers.origin;
    if (!asal || ![new URL(baseUrl).origin, `${req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http'}://${req.headers.host}`].includes(asal)) {
      socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n'); return;
    }
    const nilai = path.split('/')[4];
    const id = Number(nilai);
    if (!/^\d+$/.test(nilai) || !Number.isSafeInteger(id) || id < 1) {
      socket.end('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n'); return;
    }
    void (async () => {
      const pemantau = new URL(req.url!, baseUrl).searchParams.get('pemantau') === '1';
      const sesi = pemantau ? bacaCookie(req.headers.cookie, NAMA_COOKIE_SESI) : undefined;
      if (pemantau) {
        const pengguna = sesi && akses ? await akses.saya(sesi) : null;
        if (!pengguna || pengguna.wajib_ganti_kredensial || pengguna.fasyankes_id !== id) {
          socket.end('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n'); return;
        }
      }
      const fasilitas = await prisma.fasyankes.findUnique({ where: { id }, select: { id: true } });
      if (socket.destroyed) return;
      if (!fasilitas) { socket.end('HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n'); return; }
      wss.handleUpgrade(req, socket, head, ws => {
        klien.set(ws, { fasilitas: id, hidup: true, pemantau, sesi });
        ws.on('error', () => {});
        ws.on('pong', () => { const info = klien.get(ws); if (info) info.hidup = true; });
        ws.on('close', () => { klien.delete(ws); if (!pemantau) kabarkanJumlah(id); });
        ws.on('message', () => ws.close(1008, 'Kanal hanya menerima pembaruan'));
        kirim(ws, { tipe: 'siap' });
        kabarkanJumlah(id);
      });
    })().catch(() => socket.destroy());
  };
  server.on('upgrade', upgrade);
  const timer = setInterval(() => {
    for (const [ws, info] of klien) {
      if (!info.hidup) { ws.terminate(); continue; }
      info.hidup = false;
      if (ws.readyState === WebSocket.OPEN) { ws.ping(); kirim(ws, { tipe: 'hidup' }); }
      if (info.pemantau && akses) void akses.saya(info.sesi).then(p => {
        if (!p || p.wajib_ganti_kredensial || p.fasyankes_id !== info.fasilitas) ws.close(1008, 'Akses berakhir');
      }).catch(() => ws.close(1011));
    }
  }, heartbeatMs);
  timer.unref();
  let ditutup = false;
  const tutup = () => {
    if (ditutup) return;
    ditutup = true;
    clearInterval(timer); lepas(); server.off('upgrade', upgrade);
    for (const ws of wss.clients) ws.terminate();
    wss.close();
  };
  server.once('close', tutup);
  return tutup;
}
