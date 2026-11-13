import { PDP, TOMBOL } from '@klira/shared';
import { daftarRopa, simpanDpia } from '../../api-klien/pdp.js';
import { GalatApi } from '../../api-klien/klien.js';
import { token } from '../../gaya/token.js';
import { bukaModalBertahap } from '../../komponen/modal-bertahap/modal-bertahap.js';
import { bidang, tombol, peringatan } from '../../komponen/ui/primitif.js';
import { KotakCentang } from '../../komponen/ui/kotak-centang.js';
import { adaPerubahan } from '../../util/draf.js';
import { awalDpia, bentukDpia, galatDpia, langkahBermasalahDpia } from './keadaan-pdp.js';
const D = PDP.dpia;
export function bukaDpiaPdp({ dpia = null, onTutup, onSelesai }) {
  const awal = awalDpia(dpia), k = { ...awal }; let fields = [], ropa = [], pilihRopa, dicoba = false, memproses = false, selesai = false, aktif = true;
  const kecil = teks => { const el = document.createElement('span'); el.textContent = teks; Object.assign(el.style, { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }); return el; };
  const kolom = () => { const el = document.createElement('div'); Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md }); fields = []; return el; };
  function field(nama, label, jenis = 'text') {
    const f = bidang({ id: `dpia-${nama === 'tinjau_ulang_pada' ? 'tinjau' : nama === 'saran_ppdp' ? 'saran' : nama}`, label, jenis, nilai: k[nama], maxLength: jenis === 'textarea' ? 4000 : undefined, autoComplete: nama === 'pemrosesan' ? 'off' : undefined, ubah(nilai) { k[nama] = nilai; validasi(); modal.perbarui(); } });
    const pesan = document.createElement('div'); pesan.style.display = 'contents'; fields.push({ nama, f, pesan, jenis }); const root = document.createElement('div'); root.style.display = 'contents'; root.append(f.el, pesan); return root;
  }
  function validasi() {
    const g = galatDpia(k);
    for (const { nama, f, pesan, jenis } of fields) {
      const error = dicoba ? g[nama] : undefined;
      if (jenis !== 'textarea') f.setGalat(error);
      else { pesan.replaceChildren(); if (error) { f.kontrol.setAttribute('aria-invalid', 'true'); pesan.append(peringatan(error)); } else f.kontrol.removeAttribute('aria-invalid'); }
    }
    return g;
  }
  function opsiRopa() {
    if (!pilihRopa) return; pilihRopa.replaceChildren();
    for (const o of [{ id: '', nama_kegiatan: D.tanpaRopa }, ...ropa]) { const option = document.createElement('option'); option.value = String(o.id); option.textContent = o.nama_kegiatan; pilihRopa.append(option); } pilihRopa.value = k.ropa_id;
  }
  const langkah = [
    { id: 'risiko', judul: D.langkah.risiko, selesai: () => { const g = galatDpia(k); return !g.pemrosesan && !g.risiko; }, isi() {
      const el = kolom(), select = bidang({ id: 'dpia-ropa', label: D.ropa, opsi: [], ubah(nilai) { k.ropa_id = nilai; } }); pilihRopa = select.kontrol; opsiRopa();
      el.append(kecil(D.petunjuk), field('pemrosesan', D.pemrosesan), select.el, field('risiko', D.risiko, 'textarea')); validasi(); return el;
    } },
    { id: 'mitigasi', judul: D.langkah.mitigasi, selesai: () => !galatDpia(k).mitigasi, isi() { const el = kolom(); el.append(field('mitigasi', D.mitigasi, 'textarea')); validasi(); return el; } },
    { id: 'saran', judul: D.langkah.saran, isi() { const el = kolom(); el.append(field('saran_ppdp', D.saran, 'textarea')); return el; } },
    { id: 'tinjau', judul: D.langkah.tinjau, selesai: () => !galatDpia(k).tinjau_ulang_pada, isi() { const el = kolom(); el.append(field('tinjau_ulang_pada', D.tinjauUlang, 'date'), KotakCentang({ id: 'dpia-ditinjau', label: D.tandaiDitinjau, checked: k.tandai_ditinjau, onChange(e) { k.tandai_ditinjau = e.target.checked; } })); validasi(); return el; } },
  ];
  const modal = bukaModalBertahap({ judul: D.judul, langkah, labelKirim: D.simpan, onKirim: () => void kirim(), onTutup: () => selesai ? onSelesai() : onTutup(), lindungiTutup: () => adaPerubahan(awal, k) });
  daftarRopa(1).then(h => { if (aktif) { ropa = h.data; opsiRopa(); } }).catch(() => {});
  async function kirim() {
    dicoba = true; if (memproses) return; const g = validasi(), masalah = langkahBermasalahDpia(g); if (masalah >= 0) { modal.ke(masalah); return; }
    memproses = true; modal.perbarui({ labelKirim: PDP.menyimpan, nonaktif: true, galat: '' });
    try { await simpanDpia(dpia?.id ?? null, bentukDpia(k)); if (!aktif) return; selesai = true; const p = document.createElement('p'); p.style.margin = '0'; p.textContent = D.hasilPesan; modal.hasil({ judul: D.hasilJudul, isi: p, aksi: [tombol(TOMBOL.tutup, onSelesai)] }); }
    catch (e) { if (aktif) modal.perbarui({ galat: e instanceof GalatApi ? e.message : D.gagal }); }
    finally { if (aktif) { memproses = false; modal.perbarui({ labelKirim: D.simpan, nonaktif: false }); } }
  }
  return () => { aktif = false; modal.tutup(); };
}
