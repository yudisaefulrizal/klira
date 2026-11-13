import { MODAL } from '@klira/shared';
import { token } from '../../gaya/token.js';
import { alasanSiap } from '../../util/alasan.js';
import { bukaDialog } from '../ui/buka-dialog.js';
import { bidang, tombol, peringatan as kotak } from '../ui/primitif.js';
import { KotakCentang } from '../ui/kotak-centang.js';
export const isianPeringatanAwal = { alasan: '', terima: false };
export const dariIsian = i => ({ alasan: i.alasan.trim(), terima_untuk_akun: i.terima });
export const isianPeringatanSiap = i => alasanSiap(i.alasan, true);
export function FormPeringatan({ peringatan, nilai, onUbah, opsiTerima = true, idDasar = 'peringatan' }) {
  let keadaan = { ...nilai };
  const el = document.createElement('section'); el.setAttribute('aria-label', MODAL.peringatanJudul); Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.sm });
  const alert = kotak('', 'kuning'), strong = document.createElement('strong'), ul = document.createElement('ul'), ket = document.createElement('div'); strong.textContent = MODAL.peringatanJudul; Object.assign(ul.style, { margin: `${token.jarak.xs} 0 0`, paddingLeft: token.jarak.lg });
  for (const w of peringatan) { const li = document.createElement('li'); li.textContent = w.pesan; ul.append(li); } ket.textContent = MODAL.peringatanKeterangan; ket.style.marginTop = token.jarak.sm; alert.append(strong, ul, ket);
  const alasan = bidang({ id: `${idDasar}-alasan`, label: MODAL.peringatanAlasan, jenis: 'textarea', nilai: keadaan.alasan, ubah(v) { keadaan.alasan = v; onUbah({ ...keadaan }); } }); alasan.kontrol.required = true; el.append(alert, alasan.el);
  if (opsiTerima) el.append(KotakCentang({ id: `${idDasar}-terima`, label: MODAL.peringatanTerima, keterangan: MODAL.peringatanTerimaKet, checked: keadaan.terima, onChange(e) { keadaan.terima = e.target.checked; onUbah({ ...keadaan }); } }));
  return el;
}
export function bukaDialogPeringatan(props) {
  let nilai = { ...isianPeringatanAwal };
  const dialog = bukaDialog({ judul: MODAL.peringatanJudul, onEsc: () => props.onBatal(), lapis: 'konfirmasi', lebar: 'modalSedang' }), form = document.createElement('form'), aksi = document.createElement('div');
  Object.assign(form.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md, padding: token.jarak.lg }); Object.assign(aksi.style, { display: 'flex', alignItems: 'stretch', gap: token.jarak.sm, justifyContent: 'flex-end' });
  const lanjut = tombol(props.labelLanjut ?? MODAL.lanjutkanDenganAlasan); lanjut.type = 'submit'; aksi.append(tombol(MODAL.batal, () => props.onBatal(), 'sekunder'), lanjut);
  form.append(FormPeringatan({ peringatan: props.peringatan, nilai, opsiTerima: props.opsiTerima, idDasar: 'dialog-peringatan', onUbah(v) { nilai = v; perbarui(); } }), aksi); dialog.isi.append(form);
  function perbarui(baru = {}) { props = { ...props, ...baru }; lanjut.disabled = !isianPeringatanSiap(nilai) || !!props.memproses; lanjut.textContent = props.labelLanjut ?? MODAL.lanjutkanDenganAlasan; }
  form.addEventListener('submit', e => { e.preventDefault(); if (!lanjut.disabled) props.onLanjut(dariIsian(nilai)); }); perbarui(); dialog.fokus(); return { tutup: dialog.tutup, perbarui };
}
