import { EventEmitter } from 'node:events';
const kanal = new EventEmitter();
export const kabarkanLayarPanggilan = (fasyankesId: number) => { kanal.emit('perubahan', fasyankesId); };
export function dengarkanLayarPanggilan(fn: (fasyankesId: number) => void) {
  kanal.on('perubahan', fn);
  return () => { kanal.off('perubahan', fn); };
}
