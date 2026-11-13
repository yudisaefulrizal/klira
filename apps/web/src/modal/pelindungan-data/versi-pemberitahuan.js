import { PDP, TOMBOL } from '@klira/shared';
import { buatPemberitahuan } from '../../api-klien/pdp.js';
import { GalatApi } from '../../api-klien/klien.js';
import { token } from '../../gaya/token.js';
import { bukaModal1 } from '../../komponen/modal-1/modal-dom.js';
import { bidang, peringatan, tombol } from '../../komponen/ui/native.js';
import { adaPerubahan } from '../../util/draf.js';
import { awalPemberitahuan, galatPemberitahuan } from './keadaan-pdp.js';
const P = PDP.pemberitahuan;
export function bukaVersiPemberitahuan({ berlaku, onTutup, onSelesai }) {
  const awal = awalPemberitahuan(berlaku), k = { ...awal };
  let dicoba = false, memproses = false, aktif = true;
  const modal = bukaModal1({ judul: P.judul, lebar: 'modalBesar', onTutup, lindungiTutup: () => adaPerubahan(awal, k) });
  const pesan = document.createElement('div'), form = document.createElement('form'), petunjuk = document.createElement('span'), isiGalat = document.createElement('div');
  pesan.style.display = isiGalat.style.display = 'contents'; form.id = 'bentuk-pemberitahuan'; form.noValidate = true; Object.assign(form.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md });
  petunjuk.textContent = P.petunjuk; Object.assign(petunjuk.style, { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }); form.append(petunjuk);
  const fields = {};
  for (const [nama, id, label] of [['judul', 'pb-judul', P.judulIsian], ['tujuan', 'pb-tujuan', P.tujuan], ['isi', 'pb-isi', P.isi]]) {
    fields[nama] = bidang({ id, label, nilai: k[nama], jenis: nama === 'isi' ? 'textarea' : 'text', maxLength: nama === 'isi' ? 20000 : undefined, autoComplete: nama === 'isi' ? undefined : 'off', ubah(nilai) { k[nama] = nilai; validasi(); } }); form.append(fields[nama].el);
  }
  form.append(isiGalat); modal.isi.append(pesan, form);
  function validasi() {
    const g = galatPemberitahuan(k); for (const nama of ['judul', 'tujuan']) fields[nama].setGalat(dicoba ? g[nama] : undefined);
    isiGalat.replaceChildren(); if (dicoba && g.isi) { fields.isi.kontrol.setAttribute('aria-invalid', 'true'); isiGalat.append(peringatan(g.isi)); } else fields.isi.kontrol.removeAttribute('aria-invalid'); return g;
  }
  const simpan = tombol(PDP.simpan); simpan.type = 'submit'; simpan.setAttribute('form', form.id); modal.aksi.append(tombol(TOMBOL.batal, onTutup, 'sekunder'), simpan);
  form.addEventListener('submit', async e => {
    e.preventDefault(); dicoba = true; const g = validasi(); if (Object.keys(g).length || memproses) return;
    memproses = true; simpan.disabled = true; simpan.textContent = PDP.menyimpan; pesan.replaceChildren();
    try { await buatPemberitahuan(k); if (aktif) onSelesai(); }
    catch (e) { if (aktif) pesan.replaceChildren(peringatan(e instanceof GalatApi ? e.message : P.gagal)); }
    finally { if (aktif) { memproses = false; simpan.disabled = false; simpan.textContent = PDP.simpan; } }
  });
  modal.fokus(); return () => { aktif = false; modal.tutup(); };
}
