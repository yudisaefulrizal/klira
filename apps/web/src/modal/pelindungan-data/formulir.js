import { bidang, peringatan } from '../../komponen/ui/primitif.js';
import { kolomFleks, teksRedupKecil } from '../../gaya/tata-letak.js';
/** Penyusunan bidang modal PDP; keadaan dan aturan bisnis tetap milik masing-masing alur. */
export function bidangPdp(k, { prefix, galat, dicoba, berubah }) {
  let fields = [], lepas = [];
  function kecil(teks) { const el = document.createElement('span'); el.textContent = teks; teksRedupKecil(el); return el; }
  function perbarui() {
    const g = galat();
    for (const { nama, f, pesan, area, petunjuk } of fields) {
      const error = dicoba() ? g[nama] : undefined;
      if (!area) f.setGalat(error);
      else { pesan.replaceChildren(); if (error) { f.kontrol.setAttribute('aria-invalid', 'true'); pesan.append(peringatan(error)); } else f.kontrol.removeAttribute('aria-invalid'); }
      if (petunjuk) petunjuk.textContent = error ?? petunjuk.dataset.petunjuk;
    }
    return g;
  }
  function kolom() {
    lepas.forEach(f => f()); lepas = []; fields = [];
    const el = document.createElement('div'); kolomFleks(el, 'md'); return el;
  }
  function isian(nama, label, opsi = {}) {
    const { id = `${prefix}-${nama}`, jenis = 'text', petunjuk, ubah, ...sisa } = opsi;
    const f = bidang({ id, label, jenis, nilai: k[nama], ...sisa, ubah(nilai) { k[nama] = nilai; ubah?.(nilai); perbarui(); berubah(); } });
    const root = document.createElement('div'), pesan = document.createElement('div'); root.style.display = pesan.style.display = 'contents'; root.append(f.el, pesan);
    const hint = petunjuk ? kecil(petunjuk) : null; if (hint) { hint.dataset.petunjuk = petunjuk; root.append(hint); }
    fields.push({ nama, f, pesan, area: jenis === 'textarea', petunjuk: hint }); root.kontrol = f.kontrol; return root;
  }
  return { kolom, isian, kecil, perbarui, simpanCleanup: f => lepas.push(f), tutup() { lepas.forEach(f => f()); lepas = []; } };
}
