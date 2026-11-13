import { BUTIR_PERJANJIAN, PDP, TOMBOL } from '@klira/shared';
import { simpanProsesor } from '../../api-klien/pdp.js';
import { GalatApi } from '../../api-klien/klien.js';
import { token } from '../../gaya/token.js';
import { bukaModalBertahap } from '../../komponen/modal-bertahap/modal-bertahap.js';
import { bidang, tombol, peringatan } from '../../komponen/ui/primitif.js';
import { KotakCentang } from '../../komponen/ui/kotak-centang.js';
import { adaPerubahan } from '../../util/draf/draf.js';
import { alihButir, awalProsesor, bentukProsesor, galatProsesor, langkahBermasalahProsesor } from './keadaan-pdp.js';
const P = PDP.prosesor;
export function bukaProsesorPdp({ prosesor = null, onTutup, onSelesai }) {
  const awal = awalProsesor(prosesor), k = { ...awal, sub: awal.sub.map(s => ({ ...s })), butir: [...awal.butir] };
  let fields = [], dicoba = false, memproses = false, selesai = false, aktif = true, subGalat;
  const kecil = teks => { const el = document.createElement('span'); el.textContent = teks; Object.assign(el.style, { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }); return el; };
  function kolom() { fields = []; subGalat = undefined; const el = document.createElement('div'); Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md }); return el; }
  function input(id, label, nilai, ubah, nama, jenis = 'text') {
    const f = bidang({ id, label, nilai, jenis, autoComplete: jenis === 'date' ? undefined : 'off', ubah(v) { ubah(v); validasi(); modal.perbarui(); } }); fields.push({ nama, f }); return f;
  }
  function validasi() { const g = galatProsesor(k); for (const { nama, f } of fields) if (nama) f.setGalat(dicoba ? g[nama] : undefined); if (subGalat) { subGalat.replaceChildren(); if (dicoba && g.sub_prosesor) subGalat.append(peringatan(g.sub_prosesor)); } return g; }
  const langkah = [
    { id: 'identitas', judul: P.langkah.identitas, selesai: () => { const g = galatProsesor(k); return !g.nama && !g.layanan && !g.lokasi_data; }, isi() {
      const el = kolom(); for (const [nama, id, label] of [['nama', 'pro-nama', P.nama], ['layanan', 'pro-layanan', P.layanan], ['lokasi_data', 'pro-lokasi', P.lokasi]]) el.append(input(id, label, k[nama], v => { k[nama] = v; }, nama).el);
      el.append(KotakCentang({ id: 'pro-aktif', label: P.aktif, checked: k.aktif, onChange(e) { k.aktif = e.target.checked; } })); validasi(); return el;
    } },
    { id: 'perjanjian', judul: P.langkah.perjanjian, isi() {
      const el = kolom(), strong = document.createElement('strong'), jumlah = kecil(''); strong.textContent = P.butir;
      el.append(input('pro-perjanjian', P.nomorPerjanjian, k.nomor_perjanjian, v => { k.nomor_perjanjian = v; }).el, strong);
      function hitung() { jumlah.textContent = k.butir.length < BUTIR_PERJANJIAN.length ? P.butirKurang(BUTIR_PERJANJIAN.length - k.butir.length) : ''; jumlah.hidden = k.butir.length === BUTIR_PERJANJIAN.length; }
      for (const b of BUTIR_PERJANJIAN) el.append(KotakCentang({ id: `pro-butir-${b}`, label: P.butirLabel[b], checked: k.butir.includes(b), onChange(e) { k.butir = alihButir(k, b, e.target.checked).butir; hitung(); modal.perbarui(); } })); el.append(jumlah); hitung(); return el;
    } },
    { id: 'sub', judul: P.langkah.sub, selesai: () => !Object.keys(galatProsesor(k)).some(x => x.startsWith('sub_prosesor') || x === 'sla_lapor_jam'), isi() {
      const el = kolom(), strong = document.createElement('strong'), list = document.createElement('div'); strong.textContent = P.sub; list.style.display = 'contents';
      function sub() {
        fields = fields.filter(f => !f.nama?.startsWith('sub_prosesor.')); list.replaceChildren();
        k.sub.forEach((s, i) => {
          const frame = document.createElement('div'); Object.assign(frame.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.sm, padding: token.jarak.md, border: `${token.ukuran.garis} solid ${token.warna.garis}`, borderRadius: token.radius.sedang });
          for (const [nama, id, label, type] of [['nama', `pro-sub-nama-${i}`, P.subNama], ['layanan', `pro-sub-layanan-${i}`, P.subLayanan], ['persetujuan_pada', `pro-sub-tgl-${i}`, P.subPersetujuan, 'date']]) frame.append(input(id, label, s[nama], v => { s[nama] = v; }, `sub_prosesor.${i}.${nama}`, type).el);
          frame.append(tombol(P.buang, () => { k.sub = k.sub.filter((_, j) => i !== j); sub(); validasi(); modal.perbarui(); }, 'teks')); list.append(frame);
        });
      }
      const sla = input('pro-sla', P.sla, k.sla, v => { k.sla = v; }, 'sla_lapor_jam'); sla.kontrol.inputMode = 'numeric';
      subGalat = document.createElement('div'); subGalat.style.display = 'contents';
      el.append(strong, list, tombol(P.tambahSub, () => { k.sub.push({ nama: '', layanan: '', persetujuan_pada: '' }); sub(); validasi(); }, 'sekunder'), sla.el, kecil(P.slaPetunjuk), subGalat); sub(); validasi(); return el;
    } },
  ];
  const modal = bukaModalBertahap({ judul: P.judul, langkah, labelKirim: P.simpan, onKirim: () => void kirim(), onTutup: () => selesai ? onSelesai() : onTutup(), lindungiTutup: () => adaPerubahan(awal, k) });
  async function kirim() {
    dicoba = true; if (memproses) return; const g = validasi(), masalah = langkahBermasalahProsesor(g); if (masalah >= 0) { modal.ke(masalah); return; }
    memproses = true; modal.perbarui({ labelKirim: PDP.menyimpan, nonaktif: true, galat: '' });
    try { await simpanProsesor(prosesor?.id ?? null, bentukProsesor(k)); if (!aktif) return; selesai = true; const p = document.createElement('p'); p.style.margin = '0'; p.textContent = P.hasilPesan; modal.hasil({ judul: P.hasilJudul, isi: p, aksi: [tombol(TOMBOL.tutup, onSelesai)] }); }
    catch (e) { if (aktif) modal.perbarui({ galat: e instanceof GalatApi ? e.message : P.gagal }); }
    finally { if (aktif) { memproses = false; modal.perbarui({ labelKirim: P.simpan, nonaktif: false }); } }
  }
  return () => { aktif = false; modal.tutup(); };
}
