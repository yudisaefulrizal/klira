import { GalatApi } from '../api-klien/klien.js';
/** Daftar berhalaman; respons lama tidak menimpa permintaan terbaru atau halaman yang sudah ditutup. */
export function buatDaftar(ambil, pesanGagal, berubah, awal = { halaman: 1, hasil: null, galat: null }) {
  let keadaan = { ...awal };
  let versi = 0, ditutup = false;
  const beri = () => { if (!ditutup) berubah(keadaan); };
  async function muat() {
    if (ditutup) return;
    const permintaan = ++versi;
    try {
      const hasil = await ambil(keadaan.halaman);
      if (!ditutup && permintaan === versi) { keadaan = { ...keadaan, hasil, galat: null }; beri(); }
    } catch (e) {
      if (!ditutup && permintaan === versi) { keadaan = { ...keadaan, galat: e instanceof GalatApi ? e.message : pesanGagal }; beri(); }
    }
  }
  return {
    get keadaan() { return keadaan; }, muat,
    perbarui(panggil, pesan) { ambil = panggil; pesanGagal = pesan; return muat(); },
    pindah(halaman) {
      if (ditutup || halaman === keadaan.halaman) return;
      keadaan = { ...keadaan, halaman }; beri(); return muat();
    },
    tutup() { ditutup = true; versi++; },
  };
}
