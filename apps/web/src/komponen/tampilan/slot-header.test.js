import { daftarkanSlotHeader, pantauSlotHeader } from './slot-header.js';

describe('slot header', () => {
    it('pemantau menerima slot sekarang, slot baru, dan null saat bilah atas dilepas', () => {
        const a = { id: 'a' }, b = { id: 'b' }, dilihat = [];
        const lepasA = daftarkanSlotHeader(a);
        const berhenti = pantauSlotHeader((s) => dilihat.push(s?.id ?? null));
        const lepasB = daftarkanSlotHeader(b); // bilah atas dibangun ulang
        lepasA(); // pencabut milik bilah lama tidak boleh menghapus slot yang baru
        expect(dilihat).toEqual(['a', 'b']);
        lepasB();
        expect(dilihat).toEqual(['a', 'b', null]);
        berhenti();
        daftarkanSlotHeader({ id: 'c' })();
        expect(dilihat).toHaveLength(3);
    });
});
