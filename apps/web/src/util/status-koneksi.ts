import type { PesanLayarPanggilan } from '@klira/shared';
import type { SocketLayar } from './sambungan-layar-panggilan';
export type StatusServer = 'memeriksa' | 'terhubung' | 'terputus';
export type StatusLayar = { status: 'memeriksa' | 'terhubung' | 'tidak-ada' | 'tidak-diketahui' | 'tanpa-fasilitas'; jumlah: number | null };
type Opsi = {
  asal: string;
  server: (status: StatusServer) => void;
  layar: (status: StatusLayar) => void;
  ambil?: typeof fetch;
  buatSocket?: (url: string) => SocketLayar;
};

/** Pemantau tidak dihitung sebagai layar publik yang sedang tersambung. */
export function pantauStatusKoneksi(fasilitas: number | undefined, opsi: Opsi) {
  const ambil = opsi.ambil ?? fetch;
  const buatSocket = opsi.buatSocket ?? (url => new WebSocket(url));
  let aktif = true, memeriksa = false, jeda = 1000;
  let socket: SocketLayar | undefined;
  let pengontrol: AbortController | undefined;
  let timerServer: ReturnType<typeof setTimeout>;
  let timerSocket: ReturnType<typeof setTimeout>;
  let timerHidup: ReturnType<typeof setTimeout>;
  async function periksaServer() {
    if (!aktif || memeriksa) return;
    memeriksa = true;
    clearTimeout(timerServer);
    pengontrol = new AbortController();
    const batas = setTimeout(() => pengontrol?.abort(), 5000);
    try {
      const res = await ambil('/api/kesehatan', { cache: 'no-store', credentials: 'omit', signal: pengontrol.signal });
      const isi = await res.json();
      if (aktif) opsi.server(res.ok && isi.status === 'ok' ? 'terhubung' : 'terputus');
    } catch { if (aktif) opsi.server('terputus'); }
    finally {
      clearTimeout(batas); memeriksa = false;
      if (aktif) timerServer = setTimeout(() => void periksaServer(), 15000);
    }
  }
  function awasi(ms = 45000) {
    clearTimeout(timerHidup);
    timerHidup = setTimeout(() => { if (socket) putus(socket); }, ms);
  }
  function putus(lama: SocketLayar) {
    if (!aktif || socket !== lama) return;
    socket = undefined;
    lama.onmessage = null; lama.onclose = null; lama.onerror = null;
    lama.close(); clearTimeout(timerHidup);
    opsi.layar({ status: 'tidak-diketahui', jumlah: null });
    void periksaServer();
    clearTimeout(timerSocket);
    timerSocket = setTimeout(hubungkan, jeda);
    jeda = Math.min(jeda * 2, 15000);
  }
  function hubungkan() {
    if (!aktif || !fasilitas) return;
    try {
      const url = new URL(`/api/publik/layar-panggilan/${fasilitas}/ws?pemantau=1`, opsi.asal);
      url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      const baru = buatSocket(url.href); socket = baru; awasi(10000);
      baru.onmessage = event => {
        if (!aktif || socket !== baru) return;
        try {
          const pesan = JSON.parse(String(event.data)) as PesanLayarPanggilan;
          if (pesan.tipe === 'siap') { jeda = 1000; awasi(); }
          else if (pesan.tipe === 'hidup') awasi();
          else if (pesan.tipe === 'layar' && Number.isSafeInteger(pesan.jumlah) && pesan.jumlah >= 0) {
            awasi();
            opsi.layar({ status: pesan.jumlah ? 'terhubung' : 'tidak-ada', jumlah: pesan.jumlah });
          }
        } catch { putus(baru); }
      };
      baru.onclose = () => putus(baru); baru.onerror = () => putus(baru);
    } catch {
      opsi.layar({ status: 'tidak-diketahui', jumlah: null });
      timerSocket = setTimeout(hubungkan, jeda); jeda = Math.min(jeda * 2, 15000);
    }
  }
  opsi.server('memeriksa');
  opsi.layar({ status: fasilitas ? 'memeriksa' : 'tanpa-fasilitas', jumlah: null });
  void periksaServer(); hubungkan();
  return {
    periksaServer,
    tutup() {
      aktif = false;
      clearTimeout(timerServer); clearTimeout(timerSocket); clearTimeout(timerHidup);
      pengontrol?.abort();
      if (socket) { socket.onmessage = null; socket.onclose = null; socket.onerror = null; socket.close(); }
    },
  };
}
