import { jest } from '@jest/globals';
import { sambungkanNotifikasi } from './sambungan-notifikasi.js';

test('menerima event notifikasi dari WebSocket dan menutup koneksi saat tutup()', () => {
    let socket;
    const onNotifikasi = jest.fn();
    const s = sambungkanNotifikasi({
        asal: 'https://klira.test',
        buatSocket(url) {
            expect(url).toBe('wss://klira.test/api/notifikasi/ws');
            socket = { close: jest.fn(), onmessage: null, onclose: null, onerror: null };
            return socket;
        },
        onNotifikasi,
    });

    socket.onmessage({ data: JSON.stringify({ tipe: 'siap' }) });
    socket.onmessage({ data: JSON.stringify({ tipe: 'hidup' }) });
    expect(onNotifikasi).not.toHaveBeenCalled();

    const ev1 = { tipe: 'skrining_selesai', kunjungan_id: 12, nomor_antrean: 'A-002' };
    socket.onmessage({ data: JSON.stringify(ev1) });
    expect(onNotifikasi).toHaveBeenCalledWith(ev1);

    const ev2 = { tipe: 'order_lab_baru', kunjungan_id: 12, jumlah: 3, prioritas: 'segera' };
    socket.onmessage({ data: JSON.stringify(ev2) });
    expect(onNotifikasi).toHaveBeenCalledWith(ev2);

    s.tutup();
    expect(socket.close).toHaveBeenCalled();
});
