import { NAVIGASI, PENUNJANG } from '@klira/shared';
import { cariLoinc } from '../api-klien/penunjang.js';
import { token } from '../gaya/token.js';
import { buatNilaiTertunda } from '../util/tunda.js';
import { bidang, tombol } from './ui/native.js';
import { InfoBantuan } from './ui/info-bantuan.js';
const M = PENUNJANG.master;
export function PencarianLoinc(awal) {
  let props = awal, hasil = null, terbuka = false, memuat = false, galatCari = null, nama = null, versi = 0, aktif = true;
  const el = document.createElement('div'), info = document.createElement('div'); Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.xs }); info.style.display = 'contents';
  const field = bidang({ id: props.id, label: props.label, nilai: props.value, autoComplete: 'off', ubah(value) { props.value = value; props.onChange(value); terbuka = true; tunda.ubah(value.trim()); tampil(); } }); field.kontrol.placeholder = M.cariLoincPetunjuk;
  if (props.petunjuk) { const label = field.el.querySelector('label'), baris = document.createElement('div'); Object.assign(baris.style, { display: 'flex', alignItems: 'center', gap: token.jarak.xs }); label.replaceWith(baris); baris.append(label, InfoBantuan({ label: props.label, children: props.petunjuk })); }
  field.kontrol.addEventListener('keydown', e => { if (e.key === 'Escape') { terbuka = false; tampil(); } }); el.append(field.el, info);
  const redup = teks => { const s = document.createElement('span'); s.textContent = teks; Object.assign(s.style, { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }); return s; };
  function tampil() {
    info.replaceChildren(); field.setGalat(props.galat || galatCari || undefined);
    if (nama && !terbuka) info.append(redup(nama)); if (memuat && terbuka) info.append(redup(NAVIGASI.memuat));
    if (terbuka && hasil?.length) {
      const scroll = document.createElement('div'), ul = document.createElement('ul'); Object.assign(scroll.style, { maxHeight: token.ukuran.tinggiDaftar, overflowY: 'auto' }); ul.setAttribute('aria-label', M.hasilLoinc); Object.assign(ul.style, { display: 'flex', flexDirection: 'column', gap: '0', padding: '0', margin: '0', listStyle: 'none', overflow: 'hidden', border: `${token.ukuran.garis} solid ${token.warna.garis}`, borderRadius: token.radius.sedang });
      for (const h of hasil) { const li = document.createElement('li'), code = document.createElement('strong'), teks = document.createElement('span'), kelas = document.createElement('small'); li.style.borderTop = `${token.ukuran.garis} solid ${token.warna.garisHalus}`; code.textContent = h.kode; code.style.minWidth = token.ukuran.kolomKode; teks.style.flexGrow = '1'; teks.append(h.nama); kelas.textContent = h.kelas; Object.assign(kelas.style, { display: 'block', color: token.warna.teksRedup }); teks.append(kelas);
        const button = tombol('', () => { props.value = h.kode; field.kontrol.value = h.kode; props.onChange(h.kode); nama = h.nama; terbuka = false; tunda.ubah(h.kode); tampil(); }, 'teks'); Object.assign(button.style, { display: 'flex', alignItems: 'center', gap: token.jarak.sm, textAlign: 'left', height: 'auto', padding: token.jarak.sm, width: '100%', color: token.warna.teks, fontWeight: token.huruf.berat.biasa }); button.append(code, teks); li.append(button); ul.append(li);
      } scroll.append(ul, redup(M.hakCiptaLoinc)); info.append(scroll);
    }
    if (terbuka && hasil && !hasil.length && !memuat) info.append(redup(M.loincTidakAda));
  }
  const tunda = buatNilaiTertunda(async q => { const saat = ++versi; if (q.length < 2) { hasil = nama = null; memuat = false; tampil(); return; } memuat = true; galatCari = null; tampil();
    try { const h = await cariLoinc(q, 10); if (aktif && saat === versi) { hasil = h; nama = h.find(x => x.kode === q)?.nama ?? null; } }
    catch { if (aktif && saat === versi) galatCari = M.gagalCariLoinc; }
    finally { if (aktif && saat === versi) { memuat = false; tampil(); } }
  }, 250);
  tampil(); tunda.ubah(props.value.trim()); el.perbarui = baru => { const lama = props.value; props = { ...props, ...baru }; field.kontrol.value = props.value; if (lama !== props.value) tunda.ubah(props.value.trim()); tampil(); }; el.tutup = () => { aktif = false; versi++; tunda.tutup(); }; return el;
}
