import { PDP, TOMBOL } from '@klira/shared';
import { opsiProsesor, prosesPemusnahan, rencanaPemusnahan } from '../../api-klien/pdp.js';
import { GalatApi } from '../../api-klien/klien.js';
import { bukaModalBertahap } from '../../komponen/modal-bertahap/modal-dom.js';
import { PemilihPasien } from '../../komponen/pemilih-pasien.js';
import { KotakCentang } from '../../komponen/ui/kotak-centang.js';
import { tombol, peringatan } from '../../komponen/ui/native.js';
import { adaPerubahan } from '../../util/draf.js';
import { awalProsesMusnah, awalRencanaMusnah, bentukRencanaMusnah, galatProsesMusnah, galatRencanaMusnah, indeksTahapMusnah, bentukProsesMusnah } from './keadaan-pdp.js';
import { bidangPdp } from './formulir-dom.js';
const M = PDP.retensi;
export function bukaPemusnahanPdp({ musnah = null, onTutup, onSelesai }) {
  const tahap = musnah?.tahap_berikut ?? null, baru = !musnah, awalR = awalRencanaMusnah(), awalP = awalProsesMusnah(), r = { ...awalR }, p = { ...awalP };
  let dicoba = false, memproses = false, selesai = false, aktif = true, prosesor = [], selectProsesor;
  const galat = () => baru ? galatRencanaMusnah(r) : tahap ? galatProsesMusnah(tahap, p, PDP.galat.cadanganWajib) : {};
  const opsi = { prefix: 'mus', galat, dicoba: () => dicoba, berubah: () => modal.perbarui() }, fR = bidangPdp(r, opsi), fP = bidangPdp(p, opsi);
  function bersihkan() { fR.tutup(); fP.tutup(); }
  function pilihProsesor() { if (!selectProsesor) return; selectProsesor.replaceChildren(); for (const o of [{ id: '', nama: M.pilihProsesor }, ...prosesor]) { const option = document.createElement('option'); option.value = String(o.id); option.textContent = o.nama; selectProsesor.append(option); } selectProsesor.value = p.prosesor_id; }
  const langkah = [
    { id: 'data', judul: M.langkah.data, selesai: () => !baru || !galatRencanaMusnah(r).cakupan, isi() {
      bersihkan(); const el = fR.kolom(); if (!baru) { const strong = document.createElement('strong'); strong.textContent = musnah.cakupan; el.append(strong, fR.kecil(`${M.dasarLabel[musnah.dasar]}${musnah.pasien_nama ? ` · ${musnah.pasien_nama}` : ''} · ${M.jadwal} ${musnah.jadwal}`), fR.kecil(`${M.tahapSekarang}: ${M.status[musnah.status]}`)); return el; }
      const hak = document.createElement('div'); hak.style.display = 'contents';
      function tampilHak() { hak.replaceChildren(); if (r.dasar === 'permintaan_hak') { const field = fR.isian('permintaan_hak_id', M.permintaanHak, { id: 'mus-hak', autoComplete: 'off' }); field.kontrol.inputMode = 'numeric'; hak.append(field); } }
      const picker = PemilihPasien({ id: 'mus-pasien', pasienId: r.pasien_id, onPilih(id) { r.pasien_id = id; } }); fR.simpanCleanup(() => picker.tutup());
      el.append(fR.kecil(M.petunjuk), fR.isian('cakupan', M.cakupan, { jenis: 'textarea', maxLength: 500 }), fR.isian('dasar', M.dasar, { opsi: Object.entries(M.dasarLabel).map(([nilai, label]) => ({ nilai, label })), ubah: tampilHak }), hak, picker, fR.isian('jadwal', M.jadwal, { jenis: 'date' })); tampilHak(); fR.perbarui(); return el;
    } },
    { id: 'perintah', judul: M.langkah.perintah, selesai: () => !baru && tahap !== 'perintah', isi() {
      bersihkan(); const el = fP.kolom(); if (baru || tahap !== 'perintah') return fP.kecil(M.menunggu);
      const select = fP.isian('prosesor_id', M.prosesor, { id: 'mus-prosesor', opsi: [] }); selectProsesor = select.kontrol; pilihProsesor(); el.append(select, fP.isian('nomor_perintah', M.nomorPerintah, { id: 'mus-nomor', autoComplete: 'off' })); fP.perbarui(); return el;
    } },
    { id: 'pelaksanaan', judul: M.langkah.pelaksanaan, selesai: () => !baru && (tahap === 'berita_acara' || tahap === null), isi() {
      bersihkan(); const el = fP.kolom(); if (baru || tahap !== 'pelaksanaan') return fP.kecil(M.menunggu); const pesan = document.createElement('div'); pesan.style.display = 'contents';
      function cadangan() { pesan.replaceChildren(); const g = galat(); if (dicoba && g.mencakup_cadangan) pesan.append(peringatan(g.mencakup_cadangan)); }
      el.append(fP.isian('pelaksana', M.pelaksana, { autoComplete: 'off' }), fP.isian('metode', M.metode, { autoComplete: 'off' }), KotakCentang({ id: 'mus-cadangan', label: M.cadangan, checked: p.mencakup_cadangan, onChange(e) { p.mencakup_cadangan = e.target.checked; cadangan(); } }), pesan, fP.isian('pelaksanaan_pada', M.pelaksanaanPada, { id: 'mus-waktu', jenis: 'datetime-local' })); cadangan(); fP.perbarui(); return el;
    } },
    { id: 'berita', judul: M.langkah.beritaAcara, selesai: () => !baru && tahap === null, isi() { bersihkan(); const el = fP.kolom(); if (baru || tahap !== 'berita_acara') return fP.kecil(M.menunggu); el.append(fP.isian('berita_acara', M.beritaAcara, { id: 'mus-ba', jenis: 'textarea', maxLength: 4000 })); fP.perbarui(); return el; } },
  ];
  const labelKirim = baru ? M.simpanRencana : M.simpanTahap;
  const modal = bukaModalBertahap({ judul: PDP.tab.retensi, langkah, labelKirim, onKirim: () => void kirim(), onTutup: () => selesai ? onSelesai() : onTutup(), lindungiTutup: () => adaPerubahan(awalR, r) || adaPerubahan(awalP, p) }); modal.ke(indeksTahapMusnah(tahap)); modal.perbarui({ nonaktif: !baru && !tahap });
  opsiProsesor().then(o => { if (aktif) { prosesor = o; pilihProsesor(); } }).catch(() => {});
  async function kirim() {
    dicoba = true; if (memproses || !baru && !tahap) return; const g = baru ? fR.perbarui() : fP.perbarui(); if (Object.keys(g).length) { modal.ke(baru ? 0 : indeksTahapMusnah(tahap)); return; }
    memproses = true; modal.perbarui({ labelKirim: PDP.menyimpan, nonaktif: true, galat: '' });
    try { if (baru) await rencanaPemusnahan(bentukRencanaMusnah(r)); else await prosesPemusnahan(musnah.id, bentukProsesMusnah(tahap, p)); if (!aktif) return; selesai = true; const text = document.createElement('p'); text.style.margin = '0'; text.textContent = M.hasilPesan; modal.hasil({ judul: M.hasilJudul, isi: text, aksi: [tombol(TOMBOL.tutup, onSelesai)] }); }
    catch (e) { if (aktif) modal.perbarui({ galat: e instanceof GalatApi ? e.message : M.gagal }); }
    finally { if (aktif) { memproses = false; modal.perbarui({ labelKirim, nonaktif: !baru && !tahap }); } }
  }
  return () => { aktif = false; bersihkan(); modal.tutup(); };
}
