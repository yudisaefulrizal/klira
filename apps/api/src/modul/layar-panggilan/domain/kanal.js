import { EventEmitter } from 'node:events';
const kanal = new EventEmitter();
export const kabarkanLayarPanggilan = (fasyankesId) => { kanal.emit('perubahan', fasyankesId); };
export function dengarkanLayarPanggilan(fn) {
    kanal.on('perubahan', fn);
    return () => { kanal.off('perubahan', fn); };
}
