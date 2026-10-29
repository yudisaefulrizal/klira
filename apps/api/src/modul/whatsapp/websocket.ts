import { cocokSocketLayar } from '../layar-panggilan/websocket';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Server, IncomingMessage } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { punyaIzin } from '@klira/shared';
import { bacaCookie } from '../../middleware/auth';
import { NAMA_COOKIE_SESI } from '../akses/skema';
import type { LayananAkses } from '../akses/layanan';
import { dengarkanWhatsapp, kabarkanWhatsapp, type PerubahanWhatsapp } from './kanal';
const URL_HALAMAN = '/api/whatsapp/ws';
const URL_ENGINE = '/api/whatsapp/engine-ws';
export function pasangWebsocketWhatsapp(
  server: Server,
  akses: Pick<LayananAkses, 'saya'>,
  baseUrl: string,
  heartbeatMs = 30000,
) {
  const wss = new WebSocketServer({ noServer: true, maxPayload: 1024, perMessageDeflate: false });
  const klien = new Map<WebSocket, { idSesi: string; fasyankes: number; hidup: boolean }>();
  const mesin = new Map<WebSocket, boolean>();
  const tokenEngine = () =>
    process.env.KUNCI_ENKRIPSI
      ? createHmac('sha256', process.env.KUNCI_ENKRIPSI).update('klira-whatsapp-events-v1').digest('hex')
      : '';
  const kirim = (ws: WebSocket, event: PerubahanWhatsapp) => {
    if (ws.readyState !== WebSocket.OPEN) return;
    if (ws.bufferedAmount > 65536) {
      ws.close(1013, 'Sambungkan ulang');
      return;
    }
    ws.send(JSON.stringify({ tipe: event.tipe, baru: event.baru ?? false }));
  };
  const lepas = dengarkanWhatsapp((event) => {
    for (const [ws, info] of klien) if (info.fasyankes === event.fasyankes_id) kirim(ws, event);
  });
  const sah = async (id: string) => {
    const p = await akses.saya(id);
    return p && !p.wajib_ganti_kredensial && punyaIzin(p, 'whatsapp', 'lihat') ? p : null;
  };
  const upgrade = (req: IncomingMessage, socket: import('node:stream').Duplex, head: Buffer) => {
    const path = req.url?.split('?')[0];
    if (path !== URL_HALAMAN && path !== URL_ENGINE) {
      if (cocokSocketLayar(path ?? '') || path === '/api/instagram/ws' || (process.env.KLIRA_DEV === '1' && path === '/__klira_hmr')) return;
      socket.destroy();
      return;
    }
    socket.on('error', () => {});
    void (async () => {
      if (path === URL_ENGINE) {
        const token = req.headers.authorization?.replace(/^Bearer /, '') ?? '';
        const diharapkan = tokenEngine();
        if (
          !diharapkan ||
          token.length !== diharapkan.length ||
          !timingSafeEqual(Buffer.from(token), Buffer.from(diharapkan))
        ) {
          socket.end('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n');
          return;
        }
        wss.handleUpgrade(req, socket, head, (ws) => {
          mesin.set(ws, true);
          ws.on('pong', () => mesin.set(ws, true));
          ws.on('error', () => {});
          ws.on('close', () => mesin.delete(ws));
          ws.on('message', (data) => {
            try {
              const e = JSON.parse(data.toString()) as PerubahanWhatsapp;
              if (
                !Number.isSafeInteger(e.fasyankes_id) ||
                e.fasyankes_id <= 0 ||
                !['pesan', 'koneksi', 'siap'].includes(e.tipe)
              )
                return;
              kabarkanWhatsapp({ tipe: e.tipe, fasyankes_id: e.fasyankes_id, baru: e.baru === true });
            } catch {
              ws.close(1008);
            }
          });
        });
        return;
      }
      const origin = req.headers.origin;
      if (
        !origin ||
        ![
          new URL(baseUrl).origin,
          `${req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http'}://${req.headers.host}`,
        ].includes(origin)
      ) {
        socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
        return;
      }
      const idSesi = bacaCookie(req.headers.cookie, NAMA_COOKIE_SESI);
      const user = idSesi ? await sah(idSesi) : null;
      if (!idSesi || !user) {
        socket.end('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n');
        return;
      }
      wss.handleUpgrade(req, socket, head, (ws) => {
        klien.set(ws, { idSesi, fasyankes: user.fasyankes_id, hidup: true });
        ws.on('error', () => {});
        ws.on('close', () => klien.delete(ws));
        ws.on('pong', () => {
          const info = klien.get(ws);
          if (info) info.hidup = true;
        });
        // Browser hanya menerima notifikasi. Semua pembacaan/penulisan tetap melalui API berizin.
        ws.on('message', () => ws.close(1008, 'Kanal hanya menerima pembaruan'));
        kirim(ws, { tipe: 'siap', fasyankes_id: user.fasyankes_id });
      });
    })().catch(() => {
      socket.destroy();
    });
  };
  server.on('upgrade', upgrade);
  const timer = setInterval(() => {
    for (const [ws, info] of klien) {
      if (!info.hidup) {
        ws.terminate();
        continue;
      }
      info.hidup = false;
      ws.ping();
      void sah(info.idSesi)
        .then((p) => {
          if (!p || p.fasyankes_id !== info.fasyankes) ws.close(1008, 'Akses berakhir');
        })
        .catch(() => ws.close(1011));
    }
    for (const [ws, hidup] of mesin) { if (!hidup) ws.terminate(); else if (ws.readyState === WebSocket.OPEN) { mesin.set(ws, false); ws.ping(); } }
  }, heartbeatMs);
  timer.unref();
  const tutup = () => {
    clearInterval(timer);
    lepas();
    server.off('upgrade', upgrade);
    for (const ws of wss.clients) ws.terminate();
    wss.close();
  };
  server.once('close', tutup);
  return tutup;
}
