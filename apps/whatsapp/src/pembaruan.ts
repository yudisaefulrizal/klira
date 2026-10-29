import { createHmac } from 'node:crypto';
import WebSocket from 'ws';
type Event = { tipe: 'pesan' | 'koneksi' | 'siap'; fasyankes_id: number; baru?: boolean };
/** Hanya metadata perubahan; isi pesan terenkripsi tetap di database dan API berizin. */
export function buatPemberitahuEngine() {
  let ws: WebSocket | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let berhenti = false;
  let percobaan = 0;
  const tertunda = new Map<number, boolean>();
  const dikenal = new Set<number>();
  const hubungkan = () => {
    if (berhenti || !process.env.KUNCI_ENKRIPSI) return;
    const token = createHmac('sha256', process.env.KUNCI_ENKRIPSI).update('klira-whatsapp-events-v1').digest('hex');
    ws = new WebSocket(
      process.env.WHATSAPP_WEBSOCKET_URL ?? `ws://127.0.0.1:${process.env.PORT || '8074'}/api/whatsapp/engine-ws`,
      { headers: { authorization: `Bearer ${token}` }, handshakeTimeout: 10000 },
    );
    let detak: ReturnType<typeof setTimeout> | undefined;
    const awasi = () => { clearTimeout(detak); detak = setTimeout(() => ws?.terminate(), 45000); detak.unref(); };
    ws.on('ping', awasi);
    ws.on('open', () => {
      percobaan = 0; awasi();
      for (const fas of dikenal) ws!.send(JSON.stringify({ tipe: 'siap', fasyankes_id: fas, baru: tertunda.get(fas) ?? false }));
      tertunda.clear();
    });
    ws.on('error', () => {});
    ws.on('close', () => {
      clearTimeout(detak);
      if (!berhenti) {
        timer = setTimeout(hubungkan, Math.min(30000, 1000 * 2 ** Math.min(percobaan++, 5)));
        timer.unref();
      }
    });
  };
  hubungkan();
  return {
    kabarkan(event: Event) {
      dikenal.add(event.fasyankes_id);
      if (ws?.readyState === WebSocket.OPEN && ws.bufferedAmount < 65536) ws.send(JSON.stringify(event));
      else {
        tertunda.set(event.fasyankes_id, (tertunda.get(event.fasyankes_id) ?? false) || !!event.baru);
        if (ws?.readyState === WebSocket.OPEN) ws.close();
      }
    },
    tutup() {
      berhenti = true;
      clearTimeout(timer);
      ws?.close();
    },
  };
}
