import { pantauStatusKoneksi } from './status-koneksi';
import type { SocketLayar } from './sambungan-layar-panggilan';
function siapkan(fasilitas: number | undefined = 7) {
  const sockets: SocketLayar[] = [];
  const server = jest.fn(), layar = jest.fn();
  const ambil = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'ok' }) });
  const buatSocket = jest.fn(() => {
    const socket: SocketLayar = { onmessage: null, onclose: null, onerror: null, close: jest.fn() };
    sockets.push(socket); return socket;
  });
  const pantau = pantauStatusKoneksi(fasilitas, { asal: 'https://klira.test', ambil, buatSocket, server, layar });
  return { pantau, sockets, server, layar, ambil, buatSocket };
}
const selesai = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
function pesan(socket: SocketLayar, data: unknown) { socket.onmessage?.call(socket as WebSocket, { data: JSON.stringify(data) } as MessageEvent); }
beforeEach(() => jest.useFakeTimers());
afterEach(() => { jest.clearAllTimers(); jest.useRealTimers(); });
test('server diperiksa terpisah; socket pemantau tidak menyatakan layar terhubung sebelum jumlah diterima', async () => {
  const s = siapkan(); await selesai();
  expect(s.server).toHaveBeenLastCalledWith('terhubung');
  expect(s.buatSocket).toHaveBeenCalledWith('wss://klira.test/api/publik/layar-panggilan/7/ws?pemantau=1');
  pesan(s.sockets[0], { tipe: 'siap' });
  expect(s.layar).toHaveBeenLastCalledWith({ status: 'memeriksa', jumlah: null });
  pesan(s.sockets[0], { tipe: 'layar', jumlah: 0 });
  expect(s.layar).toHaveBeenLastCalledWith({ status: 'tidak-ada', jumlah: 0 });
  pesan(s.sockets[0], { tipe: 'layar', jumlah: 2 });
  expect(s.layar).toHaveBeenLastCalledWith({ status: 'terhubung', jumlah: 2 });
  s.pantau.tutup();
});
test('koneksi pemantau putus menghapus status layar lama, server tetap dapat terhubung', async () => {
  const s = siapkan(); await selesai();
  pesan(s.sockets[0], { tipe: 'layar', jumlah: 1 });
  s.sockets[0].onclose?.call(s.sockets[0] as WebSocket, {} as CloseEvent);
  expect(s.layar).toHaveBeenLastCalledWith({ status: 'tidak-diketahui', jumlah: null });
  await selesai();
  expect(s.server).toHaveBeenLastCalledWith('terhubung');
  await jest.advanceTimersByTimeAsync(1000);
  expect(s.sockets).toHaveLength(2);
  s.pantau.tutup();
});
test('HTTP gagal menunjukkan server terputus dan pemeriksaan berikutnya memulihkan status', async () => {
  const s = siapkan(); await selesai();
  s.ambil.mockRejectedValueOnce(new Error('offline'));
  await s.pantau.periksaServer();
  expect(s.server).toHaveBeenLastCalledWith('terputus');
  await jest.advanceTimersByTimeAsync(15000);
  expect(s.server).toHaveBeenLastCalledWith('terhubung');
  s.pantau.tutup();
});
test('tanpa akun fasilitas tidak membuka pemantau dan cleanup menghentikan seluruh timer', async () => {
  const s = siapkan(0); await selesai();
  expect(s.buatSocket).not.toHaveBeenCalled();
  expect(s.layar).toHaveBeenLastCalledWith({ status: 'tanpa-fasilitas', jumlah: null });
  s.pantau.tutup(); const n = s.ambil.mock.calls.length;
  await jest.advanceTimersByTimeAsync(120000);
  expect(s.ambil).toHaveBeenCalledTimes(n);
});
test('heartbeat macet tidak mempertahankan indikator layar hijau', async () => {
  const s = siapkan(); await selesai();
  pesan(s.sockets[0], { tipe: 'layar', jumlah: 1 });
  await jest.advanceTimersByTimeAsync(45000);
  expect(s.layar).toHaveBeenLastCalledWith({ status: 'tidak-diketahui', jumlah: null });
  expect(s.sockets[0].close).toHaveBeenCalled();
  s.pantau.tutup();
});
