import { sambungkanKanalWs } from '../ws/kanal-ws.js';

export const PERISTIWA_NOTIFIKASI = 'klira:notifikasi';
const TIPE_NOTIFIKASI = ['skrining_selesai', 'order_lab_baru', 'hasil_lab_selesai', 'hasil_lab_kasir'];

/**
 * Menjaga koneksi WebSocket `/api/notifikasi/ws` selama sesi aktif,
 * memantau heartbeat, menyambung ulang otomatis, dan meneruskan event notifikasi.
 */
export function sambungkanNotifikasi(opsi) {
    return sambungkanKanalWs({
        path: '/api/notifikasi/ws',
        asal: opsi.asal,
        buatSocket: opsi.buatSocket,
        saatPesan(pesan, awasi) {
            if (!TIPE_NOTIFIKASI.includes(pesan.tipe))
                return;
            awasi();
            opsi.onNotifikasi?.(pesan);
            if (typeof window !== 'undefined')
                window.dispatchEvent(new CustomEvent(PERISTIWA_NOTIFIKASI, { detail: pesan }));
        },
    });
}
