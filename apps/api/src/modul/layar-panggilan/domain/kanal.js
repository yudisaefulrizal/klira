import { EventEmitter } from 'node:events';
const kanal = new EventEmitter();
export const kabarkanLayarPanggilan = () => { kanal.emit('perubahan', 1); };
export function dengarkanLayarPanggilan(fn) {
    kanal.on('perubahan', fn);
    return () => { kanal.off('perubahan', fn); };
}
