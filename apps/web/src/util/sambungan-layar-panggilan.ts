import type { LayarPanggilanDto, PesanLayarPanggilan } from '@klira/shared';

export type ModeSambunganLayar = 'menghubungkan' | 'websocket' | 'polling';
export type SocketLayar = Pick<WebSocket, 'onmessage' | 'onclose' | 'onerror' | 'close'>;
type Opsi = {
  asal: string;
  data: (data: LayarPanggilanDto) => void;
  mode: (mode: ModeSambunganLayar) => void;
  galat: (pesan: string) => void;
  ambil?: typeof fetch;
  buatSocket?: (url: string) => SocketLayar;
};

/** WebSocket memberi sinyal; HTTP berkursor memulihkan event yang tertinggal secara berurutan. */
export function sambungkanLayarPanggilan(id: string, opsi: Opsi): () => void {
  const ambil = opsi.ambil ?? fetch;
  const buatSocket = opsi.buatSocket ?? (url => new WebSocket(url));
  let aktif = true, siap = false, memuat = false, ulang = false;
  let kursor: number | undefined;
  let gagalMuat = false;
  let socket: SocketLayar | undefined;
  let pengontrol: AbortController | undefined;
  let timerMuat: ReturnType<typeof setTimeout>;
  let timerSocket: ReturnType<typeof setTimeout>;
  let timerHidup: ReturnType<typeof setTimeout>;
  let jeda = 1000;

  function jadwalkanMuat() {
    clearTimeout(timerMuat);
    if (aktif) timerMuat = setTimeout(() => void muat(), siap && !gagalMuat ? 60000 : 3000);
  }
  async function muat() {
    if (!aktif) return;
    if (memuat) { ulang = true; return; }
    memuat = true;
    clearTimeout(timerMuat);
    pengontrol = new AbortController();
    const batas = setTimeout(() => pengontrol?.abort(), 10000);
    try {
      const respons = await ambil(`/api/publik/layar-panggilan/${id}${kursor === undefined ? '' : `?setelah=${kursor}`}`, { signal: pengontrol.signal, credentials: 'omit', cache: 'no-store' });
      const isi = await respons.json();
      if (!respons.ok) throw new Error(isi.galat?.pesan ?? 'Tidak dapat memuat antrean.');
      const data = isi.data as LayarPanggilanDto;
      if (!Number.isSafeInteger(data.kursor) || data.kursor < (kursor ?? 0) || !Array.isArray(data.event_panggilan) || (data.ada_lanjutan && data.kursor <= (kursor ?? 0))) throw new Error('Data panggilan tidak valid. Muat ulang layar.');
      if (aktif) {
        opsi.data(data);
        kursor = data.kursor;
        gagalMuat = false;
        opsi.galat('');
        if (data.ada_lanjutan) ulang = true;
      }
    } catch (e) {
      gagalMuat = true;
      if (aktif) opsi.galat(e instanceof Error && e.name !== 'AbortError' ? e.message : 'Koneksi terputus. Mencoba menghubungkan kembali…');
    } finally {
      clearTimeout(batas);
      memuat = false;
      if (aktif) {
        if (ulang) { ulang = false; void muat(); }
        else jadwalkanMuat();
      }
    }
  }
  function awasiHidup() {
    clearTimeout(timerHidup);
    timerHidup = setTimeout(() => putus(socket), siap ? 45000 : 10000);
  }
  function putus(lama: SocketLayar | undefined) {
    if (!aktif || !lama || socket !== lama) return;
    socket = undefined;
    lama.onclose = null; lama.onerror = null; lama.onmessage = null;
    lama.close();
    clearTimeout(timerHidup);
    siap = false;
    opsi.mode('polling');
    void muat();
    clearTimeout(timerSocket);
    timerSocket = setTimeout(hubungkan, jeda);
    jeda = Math.min(jeda * 2, 15000);
  }
  function hubungkan() {
    if (!aktif) return;
    try {
      const url = new URL(`/api/publik/layar-panggilan/${id}/ws`, opsi.asal);
      url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      const baru = buatSocket(url.href);
      socket = baru;
      awasiHidup();
      baru.onmessage = event => {
        if (!aktif || socket !== baru) return;
        try {
          const pesan = JSON.parse(String(event.data)) as PesanLayarPanggilan;
          if (!['siap', 'perubahan', 'hidup'].includes(pesan.tipe)) return;
          if (pesan.tipe === 'siap') {
            siap = true; jeda = 1000; opsi.mode('websocket');
          }
          awasiHidup();
          if (pesan.tipe !== 'hidup') void muat();
        } catch { putus(baru); }
      };
      baru.onclose = () => putus(baru);
      baru.onerror = () => putus(baru);
    } catch {
      siap = false;
      opsi.mode('polling');
      timerSocket = setTimeout(hubungkan, jeda);
      jeda = Math.min(jeda * 2, 15000);
    }
  }
  opsi.mode('menghubungkan');
  hubungkan();
  void muat();
  return () => {
    aktif = false;
    clearTimeout(timerMuat); clearTimeout(timerSocket); clearTimeout(timerHidup);
    pengontrol?.abort();
    if (socket) { socket.onclose = null; socket.onerror = null; socket.onmessage = null; socket.close(); }
  };
}
