import { pasangWebsocketLayarPanggilan } from './modul/layar-panggilan/websocket';
import { perbaruiTokenInstagram } from './modul/instagram/token';
import { pulihkanPengirimanInstagram } from './modul/instagram/pemulihan';
import { pasangWebsocketInstagram } from './modul/instagram/websocket';
import { createServer } from 'node:http';
import path from 'node:path';
import { pasangWebsocketWhatsapp } from './modul/whatsapp/websocket';
import { buatApp } from './app';
import { bacaKonfigurasi } from './config/lingkungan';

async function mulai() {
  const { port, baseUrl } = bacaKonfigurasi();
  const server = createServer();
  const vite = process.env.KLIRA_DEV === '1'
    ? await (await import('vite')).createServer({
        root: path.resolve(__dirname, '../../web'),
        server: { middlewareMode: true, allowedHosts: [new URL(baseUrl).hostname], ws: { server, path: '/__klira_hmr' } },
      })
    : undefined;
  const app = buatApp(undefined, { frontend: vite?.middlewares });
  server.on('request', app);
  server.once('close', () => { void vite?.close(); });
  pasangWebsocketWhatsapp(server, app.locals.layananAkses, baseUrl);
  pasangWebsocketInstagram(server, app.locals.layananAkses, baseUrl);
  pasangWebsocketLayarPanggilan(server, baseUrl, 20000, app.locals.layananAkses);
  let memulihkanInstagram = false;
  const pulihkanInstagram = async () => {
    if (memulihkanInstagram) return;
    memulihkanInstagram = true;
    try { await pulihkanPengirimanInstagram(); }
    catch { console.error('Pemulihan pengiriman Instagram gagal; periksa migrasi dan koneksi database.'); }
    finally { memulihkanInstagram = false; }
  };
  const timerInstagram = setInterval(() => void pulihkanInstagram(), 60000);
  timerInstagram.unref();
  const timerTokenInstagram = setInterval(() => void perbaruiTokenInstagram().catch(() => console.error('Pemeliharaan Instagram gagal.')), 3600000);
  timerTokenInstagram.unref();
  server.once('close', () => { clearInterval(timerInstagram); clearInterval(timerTokenInstagram); });
  void perbaruiTokenInstagram().catch(() => console.error('Pemeliharaan Instagram gagal; periksa migrasi.'));
  void pulihkanInstagram();
  server.listen(port, () => {
    console.log(`Klira berjalan di port ${port} (${baseUrl})`);
  });

}
void mulai().catch((galat) => { console.error(galat); process.exitCode = 1; });
