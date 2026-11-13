import { EventEmitter } from 'node:events';
export type PerubahanWhatsapp = {
  tipe: 'pesan' | 'baca' | 'percakapan' | 'koneksi' | 'siap' | 'dibersihkan';
  fasyankes_id: number;
  baru?: boolean;
};
const kanal = new EventEmitter();
export const kabarkanWhatsapp = (event: PerubahanWhatsapp) => {
  kanal.emit('perubahan', event);
};
export function dengarkanWhatsapp(fn: (event: PerubahanWhatsapp) => void) {
  kanal.on('perubahan', fn);
  return () => {
    kanal.off('perubahan', fn);
  };
}
