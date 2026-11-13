import { PDP, TOMBOL } from '@klira/shared';
import { simpanRopa } from '../../api-klien/pdp.js';
import { GalatApi } from '../../api-klien/klien.js';
import { token } from '../../gaya/token.js';
import { bukaModalBertahap } from '../../komponen/modal-bertahap/modal-dom.js';
import { bidang, tombol } from '../../komponen/ui/native.js';
import { adaPerubahan } from '../../util/draf.js';
import { awalRopa, galatRopa, langkahBermasalahRopa } from './keadaan-pdp.js';
const R = PDP.ropa;
const urutan = [['nama_kegiatan', R.namaKegiatan], ['ppdp_nama', R.ppdp], ['sumber_tujuan', R.sumberTujuan], ['dasar', R.dasar], ['tujuan', R.tujuan], ['jenis_data', R.jenisData], ['kategori_subjek', R.kategoriSubjek], ['pihak_akses', R.pihakAkses], ['pemenuhan_hak', R.pemenuhanHak], ['aliran', R.aliran], ['masa_retensi', R.masaRetensi], ['pengamanan', R.pengamanan], ['transfer', R.transfer]];
export function bukaRopaPdp({ ropa = null, onTutup, onSelesai }) {
  const awal = awalRopa(ropa), k = { ...awal }; let dicoba = false, memproses = false, selesai = false, aktif = true, fields = [];
  function validasi() {
    const g = galatRopa(k);
    for (const { nama, field, panjang } of fields) {
      if (!panjang) field.setGalat(dicoba ? g[nama] : undefined);
      else if (dicoba && g[nama]) field.kontrol.setAttribute('aria-invalid', 'true'); else field.kontrol.removeAttribute('aria-invalid');
    }
    return g;
  }
  function bagian(nama) { const g = galatRopa(k); return nama.every(n => !g[n]); }
  function isi(daftar, pengendali = false) {
    fields = []; const el = document.createElement('div'); Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md });
    if (pengendali) { const s = document.createElement('span'); s.textContent = R.pengendali; s.style.color = token.warna.teksRedup; el.append(s); }
    for (const [nama, label, panjang] of daftar) {
      const field = bidang({ id: `ropa-${nama}`, label, nilai: k[nama], jenis: panjang ? 'textarea' : 'text', maxLength: panjang ? 500 : undefined, autoComplete: panjang || nama === 'dasar' ? undefined : 'off', opsi: nama === 'dasar' ? [{ nilai: '', label: R.pilih }, ...Object.entries(R.dasarLabel).map(([nilai, label]) => ({ nilai, label }))] : undefined,
        ubah(nilai) { k[nama] = nilai; validasi(); modal.perbarui(); },
      }); fields.push({ nama, field, panjang }); el.append(field.el);
    }
    validasi(); return el;
  }
  function ringkasan() {
    fields = []; const el = document.createElement('div'), section = document.createElement('section'), h4 = document.createElement('h4'), dl = document.createElement('dl');
    Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md }); Object.assign(section.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.xs }); h4.textContent = R.judul; Object.assign(h4.style, { margin: '0', fontSize: token.huruf.ukuran.besar, fontWeight: token.huruf.berat.tebal }); Object.assign(dl.style, { margin: '0', display: 'grid', gridTemplateColumns: 'max-content 1fr', columnGap: token.jarak.md, rowGap: token.jarak.xs });
    for (const [nama, label] of urutan) { const row = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd'); row.style.display = 'contents'; dt.textContent = label; dt.style.color = token.warna.teksRedup; dd.textContent = (nama === 'dasar' ? R.dasarLabel[k.dasar] : k[nama]) || '-'; Object.assign(dd.style, { margin: '0', fontWeight: token.huruf.berat.sedang, overflowWrap: 'anywhere' }); row.append(dt, dd); dl.append(row); }
    section.append(h4, dl); el.append(section); return el;
  }
  const langkah = [
    { id: 'pihak', judul: R.langkah.pihak, selesai: () => bagian(['nama_kegiatan', 'sumber_tujuan']), isi: () => isi([['nama_kegiatan', R.namaKegiatan], ['ppdp_nama', R.ppdp], ['sumber_tujuan', R.sumberTujuan, true]], true) },
    { id: 'dasar', judul: R.langkah.dasar, selesai: () => bagian(['dasar', 'tujuan', 'jenis_data', 'kategori_subjek']), isi: () => isi([['dasar', R.dasar], ['tujuan', R.tujuan, true], ['jenis_data', R.jenisData, true], ['kategori_subjek', R.kategoriSubjek]]) },
    { id: 'akses', judul: R.langkah.akses, selesai: () => bagian(['pihak_akses', 'pemenuhan_hak', 'aliran']), isi: () => isi([['pihak_akses', R.pihakAkses, true], ['pemenuhan_hak', R.pemenuhanHak, true], ['aliran', R.aliran, true]]) },
    { id: 'retensi', judul: R.langkah.retensi, selesai: () => bagian(['masa_retensi', 'pengamanan', 'transfer']), isi: () => isi([['masa_retensi', R.masaRetensi], ['pengamanan', R.pengamanan, true], ['transfer', R.transfer]]) },
    { id: 'ringkasan', judul: R.langkah.ringkasan, isi: ringkasan },
  ];
  const modal = bukaModalBertahap({ judul: R.judul, langkah, labelKirim: R.simpan, onKirim: () => void kirim(), onTutup: () => selesai ? onSelesai() : onTutup(), lindungiTutup: () => adaPerubahan(awal, k) });
  async function kirim() {
    dicoba = true; if (memproses) return; const g = validasi(), masalah = langkahBermasalahRopa(g); if (masalah >= 0) { modal.ke(masalah); return; }
    memproses = true; modal.perbarui({ labelKirim: PDP.menyimpan, nonaktif: true, galat: '' });
    try { await simpanRopa(ropa?.id ?? null, k); if (!aktif) return; selesai = true; const p = document.createElement('p'); p.style.margin = '0'; p.textContent = R.hasilPesan; modal.hasil({ judul: R.hasilJudul, isi: p, aksi: [tombol(TOMBOL.tutup, onSelesai)] }); }
    catch (e) { if (aktif) modal.perbarui({ galat: e instanceof GalatApi ? e.message : R.gagal }); }
    finally { if (aktif) { memproses = false; modal.perbarui({ labelKirim: R.simpan, nonaktif: false }); } }
  }
  return () => { aktif = false; modal.tutup(); };
}
