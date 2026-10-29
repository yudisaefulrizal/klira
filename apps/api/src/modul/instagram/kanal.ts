import { EventEmitter } from 'node:events';
export type PerubahanInstagram = {
  tipe: 'pesan' | 'baca' | 'percakapan' | 'koneksi' | 'siap';
  fasyankes_id: number;
  baru?: boolean;
};
const kanal = new EventEmitter();
export const kabarkanInstagram = (event: PerubahanInstagram) => {
  kanal.emit('perubahan', event);
};
export function dengarkanInstagram(fn: (event: PerubahanInstagram) => void) {
  kanal.on('perubahan', fn);
  return () => {
    kanal.off('perubahan', fn);
  };
}
