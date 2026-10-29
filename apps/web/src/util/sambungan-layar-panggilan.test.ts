import type { LayarPanggilanDto } from '@klira/shared';
import { sambungkanLayarPanggilan, type SocketLayar } from './sambungan-layar-panggilan';
const data = (kursor = 0, ada_lanjutan = false): LayarPanggilanDto => ({ fasyankes_nama: 'Klinik', tanggal: '2026-10-29', panggilan: null, poli: [], kursor, ada_lanjutan, event_panggilan: [] });
function siapkan() {
  const sockets: SocketLayar[] = [];
  const ambil = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ data: data() }) });
  const terima = jest.fn(), mode = jest.fn(), galat = jest.fn();
  const buatSocket = jest.fn(() => {
    const socket: SocketLayar = { onmessage: null, onclose: null, onerror: null, close: jest.fn() };
    sockets.push(socket); return socket;
  });
  const tutup = sambungkanLayarPanggilan('7', { asal: 'https://klira.test', ambil, data: terima, mode, galat, buatSocket });
  return { ambil, sockets, buatSocket, terima, mode, galat, tutup };
}
function pesan(socket: SocketLayar, tipe: string) { socket.onmessage?.call(socket as WebSocket, { data: JSON.stringify({ tipe }) } as MessageEvent); }
const selesai = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
beforeEach(() => jest.useFakeTimers());
afterEach(() => { jest.clearAllTimers(); jest.useRealTimers(); });
test('data awal HTTP, sinyal WebSocket segera mengambil perubahan, tanpa polling 3 detik saat tersambung', async () => {
  const s = siapkan(); await selesai();
  expect(s.buatSocket).toHaveBeenCalledWith('wss://klira.test/api/publik/layar-panggilan/7/ws');
  pesan(s.sockets[0], 'siap'); await selesai();
  const n = s.ambil.mock.calls.length;
  await jest.advanceTimersByTimeAsync(3000);
  expect(s.ambil).toHaveBeenCalledTimes(n);
  pesan(s.sockets[0], 'perubahan'); await selesai();
  expect(s.ambil).toHaveBeenCalledTimes(n + 1);
  expect(s.mode).toHaveBeenLastCalledWith('websocket');
  s.tutup();
});
test('koneksi putus beralih polling lalu reconnect memakai kursor terakhir', async () => {
  const s = siapkan(); await selesai();
  s.ambil.mockResolvedValue({ ok: true, json: async () => ({ data: data(42) }) });
  pesan(s.sockets[0], 'siap'); await selesai();
  s.sockets[0].onclose?.call(s.sockets[0] as WebSocket, {} as CloseEvent); await selesai();
  expect(s.mode).toHaveBeenLastCalledWith('polling');
  expect(s.ambil).toHaveBeenLastCalledWith('/api/publik/layar-panggilan/7?setelah=42', expect.anything());
  await jest.advanceTimersByTimeAsync(3000);
  expect(s.sockets).toHaveLength(2);
  const n = s.ambil.mock.calls.length;
  pesan(s.sockets[1], 'siap'); await selesai();
  expect(s.ambil.mock.calls.length).toBe(n + 1);
  expect(s.mode).toHaveBeenLastCalledWith('websocket');
  s.tutup();
});
test('sinyal yang datang saat fetch berjalan tidak hilang dan fetch tidak tumpang tindih', async () => {
  const s = siapkan(); await selesai();
  let selesaiFetch!: (value: unknown) => void;
  s.ambil.mockReturnValueOnce(new Promise(resolve => { selesaiFetch = resolve; }));
  pesan(s.sockets[0], 'siap'); await selesai();
  const n = s.ambil.mock.calls.length;
  pesan(s.sockets[0], 'perubahan'); pesan(s.sockets[0], 'perubahan');
  expect(s.ambil).toHaveBeenCalledTimes(n);
  selesaiFetch({ ok: true, json: async () => ({ data: data(43) }) }); await selesai();
  expect(s.ambil).toHaveBeenCalledTimes(n + 1);
  expect(s.ambil).toHaveBeenLastCalledWith('/api/publik/layar-panggilan/7?setelah=43', expect.anything());
  s.tutup();
});
test('pemulihan event lebih dari satu halaman langsung dilanjutkan, bukan menunggu polling', async () => {
  const s = siapkan(); await selesai();
  s.ambil.mockResolvedValueOnce({ ok: true, json: async () => ({ data: data(100, true) }) }).mockResolvedValueOnce({ ok: true, json: async () => ({ data: data(101) }) });
  pesan(s.sockets[0], 'siap'); await selesai();
  expect(s.ambil).toHaveBeenLastCalledWith('/api/publik/layar-panggilan/7?setelah=100', expect.anything());
  expect(s.terima).toHaveBeenLastCalledWith(data(101));
  s.tutup();
});
test('WebSocket gagal dibuka tetap polling, timer dan koneksi dibersihkan saat keluar', async () => {
  const s = siapkan(); await selesai();
  await jest.advanceTimersByTimeAsync(10000);
  expect(s.mode).toHaveBeenLastCalledWith('polling');
  expect(s.sockets[0].close).toHaveBeenCalled();
  expect(s.ambil.mock.calls.length).toBeGreaterThan(1);
  s.tutup();
  const n = s.ambil.mock.calls.length;
  await jest.advanceTimersByTimeAsync(120000);
  expect(s.ambil).toHaveBeenCalledTimes(n);
});
test('HTTP gagal tidak memajukan kursor sehingga retry memulihkan event yang sama', async () => {
  const s = siapkan(); await selesai();
  s.ambil.mockResolvedValueOnce({ ok: false, json: async () => ({ galat: { pesan: 'Gagal' } }) });
  pesan(s.sockets[0], 'siap'); await selesai();
  expect(s.galat).toHaveBeenLastCalledWith('Gagal');
  pesan(s.sockets[0], 'perubahan'); await selesai();
  expect(s.ambil).toHaveBeenLastCalledWith('/api/publik/layar-panggilan/7?setelah=0', expect.anything());
  s.tutup();
});
