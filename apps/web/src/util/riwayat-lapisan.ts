export type JendelaRiwayat = {
  history: Pick<History, 'pushState' | 'back'>;
  addEventListener(jenis: 'popstate', f: () => void): void;
  removeEventListener(jenis: 'popstate', f: () => void): void;
};

const tumpukan: symbol[] = [];

/**
 * Tombol kembali peramban menutup modal atau panel, bukan keluar dari halaman (5.1j): saat lapisan dibuka satu
 * entri riwayat ditambahkan (alamat sama). `onKembali` mengembalikan true bila lapisan benar-benar ditutup;
 * false (mis. perlu konfirmasi) memasang kembali entri riwayat. Mengembalikan fungsi pembersih: bila lapisan
 * ditutup lewat antarmuka, entri riwayat tadi dilepas dengan `back()`.
 */
export function bukaLapisanRiwayat(w: JendelaRiwayat, onKembali: () => boolean): () => void {
  let masihAda = true;
  const penanda = Symbol('lapisan');
  tumpukan.push(penanda);
  w.history.pushState({ klira_lapisan: true }, '');
  const saatKembali = () => {
    // Satu kali kembali hanya menutup lapisan teratas (panel di atas modal menutup panel dahulu).
    if (tumpukan[tumpukan.length - 1] !== penanda) return;
    masihAda = false;
    if (!onKembali()) {
      w.history.pushState({ klira_lapisan: true }, '');
      masihAda = true;
    }
  };
  w.addEventListener('popstate', saatKembali);
  return () => {
    w.removeEventListener('popstate', saatKembali);
    const i = tumpukan.indexOf(penanda);
    if (i >= 0) tumpukan.splice(i, 1);
    if (masihAda) w.history.back();
  };
}
