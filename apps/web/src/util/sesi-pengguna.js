import { ambilSaya, masuk, keluar, gantiKredensial } from '../api-klien/akses.js';
import { hapusSemuaDraf } from './draf.js';

/** Lifecycle sesi pengguna untuk UI native maupun konsumen React sementara. */
export function buatSesiPengguna(api = { ambilSaya, masuk, keluar, gantiKredensial }, simpanan = () => typeof localStorage === 'undefined' ? null : localStorage) {
  let keadaan = { pengguna: null, memuat: true }, versi = 0, aktif = true;
  const pendengar = new Set();
  const terapkan = perubahan => {
    if (!aktif) return;
    keadaan = { ...keadaan, ...perubahan }; pendengar.forEach(f => f());
  };
  return {
    potret: () => keadaan,
    langganan(f) { pendengar.add(f); return () => pendengar.delete(f); },
    async muat() {
      const saat = ++versi;
      let pengguna = null;
      try { pengguna = await api.ambilSaya(); } catch { /* Gangguan sesi ditangani seperti belum masuk. */ }
      if (saat === versi) terapkan({ pengguna, memuat: false });
    },
    async masuk(username, kataSandi) {
      const saat = ++versi;
      const hasil = await api.masuk(username, kataSandi);
      hapusSemuaDraf(simpanan());
      if (saat === versi) terapkan({ pengguna: hasil, memuat: false });
      return hasil;
    },
    async keluar() {
      const saat = ++versi;
      try { await api.keluar(); } finally { hapusSemuaDraf(simpanan()); }
      if (saat === versi) terapkan({ pengguna: null, memuat: false });
    },
    async gantiKredensial(masukan) {
      const saat = ++versi;
      const hasil = await api.gantiKredensial(masukan);
      if (saat === versi) terapkan({ pengguna: hasil, memuat: false });
      return hasil;
    },
    tutup() { aktif = false; versi++; pendengar.clear(); },
  };
}
