import { EventEmitter } from 'node:events';
const kanal = new EventEmitter();
export const kabarkanInstagram = (event) => {
    kanal.emit('perubahan', event);
};
export function dengarkanInstagram(fn) {
    kanal.on('perubahan', fn);
    return () => {
        kanal.off('perubahan', fn);
    };
}
