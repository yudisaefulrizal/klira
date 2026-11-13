/** Menunda pemberitahuan sampai nilai tidak berubah selama ms; tutup membatalkan pekerjaan tertunda. */
export function buatNilaiTertunda(berubah, ms = 300) {
  let timer, ditutup = false;
  return {
    ubah(nilai, jeda = ms) {
      if (ditutup) return;
      clearTimeout(timer);
      timer = setTimeout(() => { timer = undefined; if (!ditutup) berubah(nilai); }, jeda);
    },
    tutup() { ditutup = true; clearTimeout(timer); },
  };
}
