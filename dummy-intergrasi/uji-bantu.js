// Pembantu uji: menjalankan service-dummy pada port tetap (PCare 8075, SATUSEHAT 8076), bukan port acak.
import { createServer } from 'node:http';

export const PORT_PCARE = 8075;
export const PORT_SATUSEHAT = 8076;
export const URL_PCARE = `http://127.0.0.1:${PORT_PCARE}`;
export const URL_SATUSEHAT = `http://127.0.0.1:${PORT_SATUSEHAT}`;

/** Jalankan aplikasi dummy pada port tetap. Bila port terpakai (mis. `npm run service-dummy` masih hidup), uji berhenti dengan petunjuk jelas. */
export function mulaiDummy(app, port) {
  return new Promise((selesai, gagal) => {
    const server = createServer(app);
    server.once('error', (galat) => gagal(galat.code === 'EADDRINUSE'
      ? new Error(`Port ${port} sudah dipakai. Hentikan service-dummy yang sedang berjalan sebelum menjalankan uji.`)
      : galat));
    server.listen(port, '127.0.0.1', () => selesai(server));
  });
}

export const tutupDummy = (server) => new Promise((selesai) => server.close(selesai));
