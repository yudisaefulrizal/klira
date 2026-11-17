import { pool } from './koneksi.js';
import { daftarIdFasyankes } from './data-access/fasyankes.js';
/**
 * Satu instalasi (satu database) melayani tepat satu fasyankes; klinik lain memakai instalasi dan database sendiri.
 * Login, koneksi WhatsApp/Instagram, dan cadangan bekerja atas seluruh database, jadi fasyankes kedua tidak boleh ada.
 */
export class GalatFasyankesGanda extends Error {
    constructor() {
        super('Database ini berisi lebih dari satu fasyankes, padahal satu instalasi Klira hanya melayani satu fasyankes. '
            + 'Pindahkan fasyankes lain ke database sendiri, atau bangun ulang database pengembangan (migrasi fresh lalu seed).');
    }
}
/** Id fasyankes instalasi ini, atau null bila belum ada (belum di-seed). Melempar GalatFasyankesGanda bila lebih dari satu. */
export async function pastikanFasyankesTunggal(koneksi = pool) {
    const ids = await daftarIdFasyankes(2, koneksi);
    if (ids.length > 1)
        throw new GalatFasyankesGanda();
    return ids[0] ?? null;
}
