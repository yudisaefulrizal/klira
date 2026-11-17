const { GalatFasyankesGanda, pastikanFasyankesTunggal } = await import('./fasyankes-tunggal.js');

/** Koneksi tiruan: mengembalikan baris yang diberikan tanpa menyentuh database. */
const koneksi = (baris) => ({ query: async () => [baris] });

describe('pastikanFasyankesTunggal', () => {
    it('null bila belum ada fasyankes (database belum di-seed)', async () => {
        expect(await pastikanFasyankesTunggal(koneksi([]))).toBeNull();
    });
    it('mengembalikan id fasyankes satu-satunya', async () => {
        expect(await pastikanFasyankesTunggal(koneksi([{ id: 7 }]))).toBe(7);
    });
    it('menolak database yang berisi lebih dari satu fasyankes', async () => {
        await expect(pastikanFasyankesTunggal(koneksi([{ id: 1 }, { id: 2 }]))).rejects.toBeInstanceOf(GalatFasyankesGanda);
    });
});
