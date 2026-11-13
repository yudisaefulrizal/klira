import { PDP, TOMBOL } from '@klira/shared';
import { tarikPersetujuan } from '../../api-klien/pdp.js';
import { GalatApi } from '../../api-klien/klien.js';
import { token } from '../../gaya/token.js';
import { bukaModal1 } from '../../komponen/modal-1/modal-1.js';
import { bidang, peringatan, tombol } from '../../komponen/ui/primitif.js';
import { formatWaktu } from '../../util/tab/penyaring-tab.js';
import { galatTarik } from './keadaan-pdp.js';
const T = PDP.tarik;
export function bukaTarikPersetujuan({ persetujuan, onTutup, onSelesai }) {
  let alasan = '', dicoba = false, memproses = false, batas = null, aktif = true;
  const modal = bukaModal1({ judul: T.judul, onTutup: () => batas ? onSelesai() : onTutup(), lindungiTutup: () => !batas && alasan.trim().length > 0 });
  const pesan = document.createElement('div'), form = document.createElement('form'), identitas = document.createElement('span'), nama = document.createElement('strong'), detail = document.createElement('span'), petunjuk = document.createElement('span');
  pesan.style.display = 'contents'; form.id = 'bentuk-tarik'; form.noValidate = true; Object.assign(form.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md });
  nama.textContent = persetujuan.pasien_nama; detail.textContent = `${persetujuan.pasien_nomor_rm} · ${persetujuan.jenis} v${persetujuan.versi_teks} · ${formatWaktu(persetujuan.waktu)}`; detail.style.color = token.warna.teksRedup; identitas.append(nama, ' ', detail);
  const field = bidang({ id: 'tarik-alasan', label: T.alasan, jenis: 'textarea', maxLength: 500, ubah(nilai) { alasan = nilai; validasi(); } });
  Object.assign(petunjuk.style, { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil });
  function validasi() { const g = galatTarik(persetujuan.id, alasan); if (dicoba && g.alasan) field.kontrol.setAttribute('aria-invalid', 'true'); else field.kontrol.removeAttribute('aria-invalid'); petunjuk.textContent = dicoba && g.alasan ? g.alasan : T.petunjuk; return g; }
  form.append(identitas, field.el, petunjuk); modal.isi.append(pesan, form);
  const simpan = tombol(T.tombol); simpan.type = 'submit'; simpan.setAttribute('form', form.id); modal.aksi.append(tombol(TOMBOL.batal, onTutup, 'sekunder'), simpan);
  form.addEventListener('submit', async e => {
    e.preventDefault(); dicoba = true; const g = validasi(); if (Object.keys(g).length || memproses) return;
    memproses = true; simpan.disabled = true; simpan.textContent = PDP.menyimpan; pesan.replaceChildren();
    try {
      const hasil = await tarikPersetujuan({ persetujuan_id: persetujuan.id, alasan }); if (!aktif) return; batas = hasil.batas_henti;
      modal.setLebar('modalKecil'); modal.isi.replaceChildren(peringatan(`${T.tersimpan} ${T.batasHenti(formatWaktu(batas))}`, 'biru')); modal.aksi.replaceChildren(tombol(TOMBOL.tutup, onSelesai));
    } catch (e) { if (aktif) pesan.replaceChildren(peringatan(e instanceof GalatApi ? e.message : T.gagal)); }
    finally { if (aktif) { memproses = false; simpan.disabled = false; simpan.textContent = T.tombol; } }
  });
  validasi(); modal.fokus(); return () => { aktif = false; modal.tutup(); };
}
