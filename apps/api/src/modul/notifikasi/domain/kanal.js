import { EventEmitter } from 'node:events';

const kanal = new EventEmitter();

/**
 * Mengirim event notifikasi internal (mis. skrining selesai, order lab baru)
 * ke listener WebSocket tanpa menggagalkan proses utama.
 */
export const kabarkanNotifikasi = (event) => {
    kanal.emit('notifikasi', event);
};

export function dengarkanNotifikasi(fn) {
    kanal.on('notifikasi', fn);
    return () => {
        kanal.off('notifikasi', fn);
    };
}
