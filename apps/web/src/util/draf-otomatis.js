import { adaPerubahan } from './draf.js';
const TUNDA_MS = 400;
/** Satu lifecycle draf: baca sekali, simpan tertunda, flush saat ditutup, hapus/buang sesuai pilihan pengguna. */
export function buatDrafOtomatis(opsi, berubah = () => {}) {
  let terbaru = opsi, dihapus = false, ditutup = false, timer, perluFlush = false;
  const bacaAwal = opsi.adaptor.baca();
  const asinkron = bacaAwal instanceof Promise;
  const keadaan = { pulihan: asinkron ? null : bacaAwal, siap: !asinkron };
  if (asinkron) bacaAwal.then(pulihan => {
    if (!ditutup) { keadaan.pulihan = pulihan; keadaan.siap = true; berubah({ ...keadaan }); }
  }, () => { if (!ditutup) { keadaan.siap = true; berubah({ ...keadaan }); } });
  function simpan() {
    const { adaptor, nilai, awal, langkah } = terbaru;
    if (!dihapus && adaPerubahan(adaptor.saring(awal), adaptor.saring(nilai))) void adaptor.simpan(nilai, langkah);
  }
  return {
    get keadaan() { return keadaan; },
    perbarui(baru) {
      if (ditutup) return;
      terbaru = baru;
      clearTimeout(timer);
      // Konsumen lama melakukan flush ketika opsi berganti; nilai terbaru harus ikut tersimpan.
      if (perluFlush) simpan();
      perluFlush = !!baru.aktif && adaPerubahan(baru.adaptor.saring(baru.awal), baru.adaptor.saring(baru.nilai));
      if (perluFlush) timer = setTimeout(simpan, TUNDA_MS);
    },
    hapus() { dihapus = true; clearTimeout(timer); void terbaru.adaptor.hapus(); },
    buang() { void terbaru.adaptor.hapus(); },
    tutup() { if (ditutup) return; ditutup = true; clearTimeout(timer); if (perluFlush) simpan(); },
  };
}
