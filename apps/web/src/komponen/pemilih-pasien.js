import { REKAM_MEDIS } from '@klira/shared';
import { daftarPasien } from '../api-klien/pasien.js';
import { buatNilaiTertunda } from '../util/tunda.js';
import { bidang } from './ui/native.js';
import { token } from '../gaya/token.js';
const D = REKAM_MEDIS.dok;
export function PemilihPasien(awal) {
  let props = awal, hasil = [], tertunda = '', aktif = true, versi = 0;
  const el = document.createElement('div'); Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.sm });
  const pilih = bidang({ id: awal.id, label: D.pasienLabel, opsi: [], ubah(nilai) { props = { ...props, pasienId: nilai ? Number(nilai) : null }; props.onPilih(props.pasienId); } });
  const tunda = buatNilaiTertunda(async q => {
    tertunda = q; const saat = ++versi; if (!q) { hasil = []; opsi(); return; }
    try { const h = await daftarPasien({ cari: q, halaman: 1, ukuran: 10 }); if (aktif && saat === versi) { hasil = h.data; opsi(); } }
    catch { if (aktif && saat === versi) { hasil = []; opsi(); } }
  }, 250);
  const cari = bidang({ id: `${awal.id}-cari`, label: D.pasienCari, jenis: 'search', autoComplete: 'off', ubah: q => tunda.ubah(q.trim()) });
  function opsi() {
    pilih.kontrol.replaceChildren();
    for (const o of [{ nilai: '', label: tertunda && !hasil.length ? D.pasienKosong : D.pasienPilih }, ...hasil.map(p => ({ nilai: String(p.id), label: `${p.nama} (${p.nomor_rm})` }))]) { const option = document.createElement('option'); option.value = o.nilai; option.textContent = o.label; pilih.kontrol.append(option); }
    pilih.kontrol.value = props.pasienId === null ? '' : String(props.pasienId); pilih.setGalat(props.galat);
  }
  el.append(cari.el, pilih.el); opsi(); el.perbarui = baru => { props = { ...props, ...baru }; opsi(); }; el.tutup = () => { aktif = false; versi++; tunda.tutup(); }; return el;
}
