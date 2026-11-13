import { buatSesiPengguna } from './sesi-pengguna.js';
export const sesiPengguna = buatSesiPengguna();
/** Snapshot dan aksi sesi native; halaman memasang subscription sendiri selama lifecycle-nya. */
export function penggunaSaatIni() {
  return { ...sesiPengguna.potret(), masuk: sesiPengguna.masuk, keluar: sesiPengguna.keluar, gantiKredensial: sesiPengguna.gantiKredensial };
}
