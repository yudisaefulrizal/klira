import { EventEmitter } from 'node:events';
const kanal = new EventEmitter();
export const kabarkanWhatsapp = (event) => {
    kanal.emit('perubahan', event);
};
export function dengarkanWhatsapp(fn) {
    kanal.on('perubahan', fn);
    return () => {
        kanal.off('perubahan', fn);
    };
}
