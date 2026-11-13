import { KASIR, MAKS_BARIS_BAYAR, METODE_BAYAR, MODAL, TOMBOL } from '@klira/shared';
import { catatPembayaran, hapusItemTagihan, kasirKunjungan } from '../../api-klien/kasir.js';
import { GalatApi } from '../../api-klien/klien.js';
import { token } from '../../gaya/token.js';
import { bukaModal1 } from '../../komponen/modal-1/modal-1.js';
import { bidang, tombol, peringatan, lencana, tabel, baris, sel } from '../../komponen/ui/primitif.js';
import { DaftarRingkasan } from '../../komponen/ui/susunan.js';
import { formatWaktu } from '../../util/penyaring-tab.js';
import { awalBayar, bentukBayar, galatBayar, hapusBaris, hargaDiubah, ringkasBayar, tambahBaris, ubahBaris, ubahHargaTersedia } from './keadaan-kasir.js';
import { KepalaPasien } from './kepala-pasien.js';
import { rupiah } from './keadaan-order-lab.js';
import { LengkapiHarga } from './lengkapi-harga.js';
import { TambahItemTarif } from './tambah-item-tarif.js';
import { bukaUbahHarga } from './ubah-harga.js';
import { buatSerahObat } from './serah-terima-obat.js';

export function bukaPembayaran({ kunjunganId, pasien, kasir, farmasi, onTutup, onSelesai }) {
  const B = KASIR.bayar;
  let g = null, indeks = 0, bayar = awalBayar(), galat = null, info = null, dicoba = false, memproses = false, berubah = false, aktif = true, anak = [], modalHarga;
  const opsiMetode = ['tunai', 'transfer', 'qris'].map(m => ({ nilai: m, label: METODE_BAYAR.label(m) }));
  function selesaiTutup() { if (memproses || serah.memproses) return; aktif = false; bersih(); modalHarga?.tutup(); serah.tutup(); modal.tutup(); (berubah || serah.berubah ? onSelesai : onTutup)(); }
  const modal = bukaModal1({ judul: kasir ? B.judul : B.serahJudul, lebar: 'modalBesar', onTutup: selesaiTutup });
  const root = modal.isi.parentElement; root.style.height = token.ukuran.tinggiModal;
  modal.isi.className = 'modal-langkah-layout'; Object.assign(modal.isi.style, { flexDirection: 'row', gap: '0', padding: '0', flexGrow: '1', minHeight: '0', overflow: 'hidden' });
  const nav = document.createElement('nav'), section = document.createElement('section'), heading = document.createElement('h3'), status = document.createElement('div'), contenu = document.createElement('div');
  nav.className = 'modal-langkah-nav'; nav.setAttribute('aria-label', MODAL.daftarLangkah); Object.assign(nav.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.sm, flex: `0 0 ${token.ukuran.navLangkah}`, padding: token.jarak.md, boxSizing: 'border-box', overflowY: 'auto', borderRight: `${token.ukuran.garis} solid ${token.warna.garis}` });
  section.className = 'modal-langkah-isi'; Object.assign(section.style, { flexGrow: '1', minWidth: '0', overflowY: 'auto', padding: `${token.jarak.lg} ${token.jarak.xl}` });
  Object.assign(heading.style, { marginTop: '0', fontSize: token.huruf.ukuran.judul }); section.append(heading, status, contenu); modal.isi.append(nav, section);
  const retour = tombol(TOMBOL.kembali, () => ke(indeks - 1), 'sekunder'), position = document.createElement('span'), principal = tombol(TOMBOL.lanjut, suite);
  Object.assign(position.style, { flexGrow: '1', textAlign: 'center', color: token.warna.teksRedup }); modal.aksi.append(retour, position, principal);
  const serah = buatSerahObat(kunjunganId, farmasi, () => { if (aktif) afficher(); });
  function etapes() { return [...(kasir ? [{ id: 'tagihan', judul: B.langkah.tagihan }, { id: 'pembayaran', judul: B.langkah.pembayaran }] : []), ...(farmasi && serah.resep?.length || !kasir ? [{ id: 'serah', judul: B.langkah.serah }] : [])]; }
  function bersih() { for (const el of anak) el.tutup?.(); anak = []; }
  function colonne() { const el = document.createElement('div'); Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md }); return el; }
  function texte(teks, redup = false) { const el = document.createElement('span'); el.textContent = teks; if (redup) Object.assign(el.style, { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }); return el; }
  function resume(rows) { return DaftarRingkasan({ bagian: [{ judul: '', baris: rows }] }); }
  function jkn(el) { if (g?.syarat.ditanggung_jkn) el.append(peringatan(`${KASIR.jkn.ditanggung}. ${KASIR.jkn.petunjukBayar}`, 'biru')); }
  function appliquer(h) { if (!aktif) return; g = h; bayar = awalBayar(h.syarat.ditanggung_jkn ? 0 : h.tagihan.sisa); berubah = true; afficher(); }
  async function jalankan(f) {
    if (memproses) return; memproses = true; galat = info = null; afficher();
    try { await f(); if (aktif) berubah = true; }
    catch (e) { if (aktif) galat = e instanceof GalatApi ? e.message : B.gagal; }
    finally { memproses = false; if (aktif) afficher(); }
  }
  function perluBayar() { return !!g && g.tagihan.sisa > 0 && !(g.syarat.ditanggung_jkn && bayar.baris.every(b => !b.jumlah.trim())); }
  function catat() {
    dicoba = true;
    if (memproses || !g || Object.keys(galatBayar(bayar, g.tagihan.sisa)).length || !g.shift_terbuka || g.tagihan.status_tagihan !== 'lengkap' || g.tagihan.sisa <= 0) { afficher(); return; }
    const masukan = bentukBayar(bayar);
    void jalankan(async () => { const h = await catatPembayaran(kunjunganId, masukan); if (!aktif) return; info = `${B.tercatat(rupiah(h.diterapkan))}${h.kembalian ? ` ${B.kembalian(rupiah(h.kembalian))}.` : ''}`; dicoba = false; g = { ...g, tagihan: h.tagihan }; bayar = awalBayar(h.tagihan.sisa); });
  }
  function tagihan() {
    const el = colonne(); if (!g) { el.append(KASIR.memuat); return el; } const t = g.tagihan;
    const h = document.createElement('h3'); h.textContent = B.tagihanJudul; h.style.margin = '0'; el.append(h); jkn(el);
    if (t.status_tagihan !== 'lengkap') { el.append(peringatan(B.tagihanBelum)); const f = LengkapiHarga({ kunjunganId, gambaran: g, onUbah: appliquer }); anak.push(f); el.append(f); }
    const table = tabel([{ judul: B.kolom.item }, { judul: B.kolom.jumlah }, { judul: B.kolom.harga }, { judul: B.kolom.subtotal, rataKanan: true }], B.tagihanJudul);
    for (const i of t.item) {
      const nama = sel(i.nama);
      if (i.manual) nama.append(texte(` · ${KASIR.tambah.manual}`, true)); if (i.tindakan_sumber) nama.append(texte(` · ${KASIR.tambah.dariTindakan}`, true));
      if (hargaDiubah(i)) { const k = texte(`${KASIR.ubahHarga.diubah}: ${i.alasan_ubah_harga}`, true); k.style.display = 'block'; nama.append(k); }
      if (ubahHargaTersedia(i, g)) { const b = tombol(KASIR.ubahHarga.aksi, () => { modalHarga = bukaUbahHarga({ kunjunganId, item: i, onTutup() { modalHarga = undefined; }, onUbah(h) { modalHarga = undefined; appliquer(h); } }); }, 'teks'); b.disabled = memproses; b.setAttribute('aria-label', `${KASIR.ubahHarga.aksi} ${i.nama}`); nama.append(' · ', b); }
      if (i.manual && g.kunjungan.tahap_layanan !== 'ditutup') { const b = tombol(KASIR.tambah.hapus, () => jalankan(async () => appliquer(await hapusItemTagihan(kunjunganId, i.id))), 'teks'); b.disabled = memproses; b.setAttribute('aria-label', `${KASIR.tambah.hapus} ${i.nama}`); nama.append(' · ', b); }
      const harga = sel(); if (hargaDiubah(i)) { const coret = document.createElement('s'); coret.textContent = rupiah(i.harga_acuan ?? 0); coret.style.color = token.warna.teksRedup; coret.setAttribute('aria-label', `${KASIR.ubahHarga.hargaAcuan} ${rupiah(i.harga_acuan ?? 0)}`); harga.append(coret, ' '); } harga.append(i.harga === null ? '-' : rupiah(i.harga));
      const sub = sel(i.harga === null ? '-' : rupiah(i.harga * i.jumlah)); sub.style.textAlign = 'right'; table.tbody.append(baris(nama, sel(i.jumlah), harga, sub));
    }
    el.append(table.el, resume([{ label: B.total, nilai: rupiah(t.total) }, { label: B.dibayar, nilai: rupiah(t.dibayar) }, { label: B.sisa, nilai: t.sisa === 0 ? B.lunas : g.syarat.ditanggung_jkn ? `${rupiah(t.sisa)} (${KASIR.jkn.ditanggung})` : rupiah(t.sisa) }]));
    const tambah = TambahItemTarif({ kunjunganId, gambaran: g, onUbah: appliquer }); anak.push(tambah); el.append(tambah); return el;
  }
  function paiement() {
    const el = colonne(); if (!g) { el.append(KASIR.memuat); return el; } const t = g.tagihan; jkn(el);
    if (!g.shift_terbuka) el.append(peringatan(B.tanpaShift)); if (t.status_tagihan !== 'lengkap') el.append(peringatan(B.tagihanBelum));
    const h = document.createElement('h3'); h.textContent = B.pembayaranJudul; h.style.margin = '0'; el.append(h);
    if (!t.pembayaran.length) el.append(texte(B.tanpaPembayaran, true));
    for (const p of t.pembayaran) { const row = document.createElement('div'); Object.assign(row.style, { display: 'flex', gap: token.jarak.sm, flexWrap: 'wrap' }); const jumlah = texte(rupiah(p.jumlah)); jumlah.style.flexGrow = '1'; row.append(lencana(METODE_BAYAR.label(p.metode), METODE_BAYAR.warna(p.metode)), jumlah, texte(`${p.kasir_nama ?? '-'} · ${formatWaktu(p.waktu)}`, true)); el.append(row); }
    if (t.sisa > 0 && t.total > 0) {
      const sisa = document.createElement('strong'); sisa.textContent = `${B.sisa}: ${rupiah(t.sisa)}`; el.append(sisa);
      const gForm = galatBayar(bayar, t.sisa), erreur = document.createElement('div'), ringkas = document.createElement('div'), fields = [];
      function calculer() {
        const gb = galatBayar(bayar, t.sisa); for (const [i, metode, jumlah] of fields) { metode.setGalat(dicoba ? gb[`pembayaran.${i}.metode`] : undefined); jumlah.setGalat(dicoba ? gb[`pembayaran.${i}.jumlah`] : undefined); }
        erreur.replaceChildren(); if (dicoba && (gb.pembayaran ?? gb[''])) erreur.append(peringatan(gb.pembayaran ?? gb['']));
        ringkas.replaceChildren(); const r = ringkasBayar(bayar, t.sisa); if (r.diterima > 0) ringkas.append(resume([{ label: B.totalDiterima, nilai: rupiah(r.diterima) }, { label: B.diterapkan, nilai: rupiah(r.diterapkan) }, { label: B.kembalianLabel, nilai: rupiah(r.kembalian) }])); footer();
      }
      bayar.baris.forEach((b, i) => {
        const row = document.createElement('div'); Object.assign(row.style, { display: 'flex', gap: token.jarak.md, flexWrap: 'wrap', alignItems: 'flex-end' });
        const metode = bidang({ id: `bayar-metode-${i}`, label: i === 0 ? B.metode : B.metodeKe(i + 1), opsi: opsiMetode, nilai: b.metode, ubah(v) { bayar = ubahBaris(bayar, i, { metode: v }); calculer(); } });
        const jumlah = bidang({ id: `bayar-jumlah-${i}`, label: i === 0 ? B.diterima : B.diterimaKe(i + 1), nilai: b.jumlah, autoComplete: 'off', ubah(v) { bayar = ubahBaris(bayar, i, { jumlah: v }); calculer(); } }); jumlah.kontrol.inputMode = 'numeric'; jumlah.el.style.flexGrow = '1'; metode.kontrol.disabled = jumlah.kontrol.disabled = memproses; fields.push([i, metode, jumlah]); row.append(metode.el, jumlah.el);
        if (i > 0) { const b = tombol(B.hapusMetode, () => { bayar = hapusBaris(bayar, i); afficher(); }, 'teks'); b.disabled = memproses; b.setAttribute('aria-label', `${B.hapusMetode} ${B.metodeKe(i + 1)}`); row.append(b); } el.append(row);
      });
      if (bayar.baris.length < MAKS_BARIS_BAYAR) { const b = tombol(B.tambahMetode, () => { bayar = tambahBaris(bayar, t.sisa); afficher(); }, 'sekunder'); b.disabled = memproses; el.append(b); }
      el.append(erreur, ringkas); calculer();
    } else if (t.total > 0) el.append(peringatan(B.lunas, 'biru'));
    return el;
  }
  function footer() {
    const langkah = etapes(), id = langkah[indeks]?.id, sibuk = memproses || serah.memproses;
    retour.disabled = indeks === 0 || sibuk; position.textContent = MODAL.langkah(indeks + 1, langkah.length);
    if (id === 'serah') { principal.textContent = serah.bisaSerah ? serah.memproses ? B.menyerahkan : B.serah : B.selesai; principal.disabled = sibuk; }
    else if (id === 'tagihan') { principal.textContent = TOMBOL.lanjut; principal.disabled = memproses; }
    else { principal.textContent = perluBayar() ? memproses ? B.mencatat : B.catat : indeks < langkah.length - 1 ? TOMBOL.lanjut : B.selesai; principal.disabled = memproses || !g || (perluBayar() && (!g.shift_terbuka || g.tagihan.status_tagihan !== 'lengkap')); }
  }
  function suite() { const langkah = etapes(), id = langkah[indeks]?.id; if (principal.disabled) return; if (id === 'serah') { if (serah.bisaSerah) void serah.serahkan(); else selesaiTutup(); } else if (id === 'pembayaran' && perluBayar()) catat(); else if (indeks < langkah.length - 1) ke(indeks + 1); else selesaiTutup(); }
  function ke(i) { if (memproses || serah.memproses) return; indeks = Math.max(0, Math.min(i, etapes().length - 1)); afficher(); section.querySelector('input:not([disabled]),select:not([disabled]),textarea:not([disabled])')?.focus(); }
  function afficher() {
    if (!aktif) return; bersih(); const langkah = etapes(); indeks = Math.min(indeks, langkah.length - 1); const id = langkah[indeks].id;
    modal.judul.textContent = kasir ? langkah.some(l => l.id === 'serah') ? B.judulDenganObat : B.judul : B.serahJudul;
    modal.konteks.replaceChildren(KepalaPasien({ nama: g?.kunjungan.pasien_nama ?? pasien.nama, nomorRm: g?.kunjungan.pasien_nomor_rm ?? pasien.nomor_rm }));
    nav.replaceChildren(); langkah.forEach((l, n) => { const ok = l.id === 'tagihan' ? g?.tagihan.status_tagihan === 'lengkap' : l.id === 'serah' ? serah.selesai : g?.tagihan.total > 0 && (g.tagihan.sisa === 0 || g.syarat.ditanggung_jkn); const b = tombol(`${ok ? '✓' : n + 1}  ${l.judul}`, () => ke(n), n === indeks ? 'utama' : 'teks'); b.style.textAlign = 'left'; b.disabled = memproses || serah.memproses; if (n === indeks) b.setAttribute('aria-current', 'step'); nav.append(b); });
    heading.textContent = langkah[indeks].judul; status.replaceChildren(); const pesan = id === 'serah' ? serah.info : info, gagal = id === 'serah' ? serah.galat : galat; if (pesan) status.append(peringatan(pesan, 'biru')); if (gagal) status.append(peringatan(gagal));
    contenu.replaceChildren(id === 'serah' ? serah.isi : id === 'tagihan' ? tagihan() : paiement()); footer();
  }
  afficher(); modal.fokus();
  if (kasir) kasirKunjungan(kunjunganId).then(h => { if (aktif) { g = h; bayar = awalBayar(h.syarat.ditanggung_jkn ? 0 : h.tagihan.sisa); afficher(); } }).catch(e => { if (aktif) { galat = e instanceof GalatApi ? e.message : B.gagal; afficher(); } });
  return { tutup() { aktif = false; bersih(); modalHarga?.tutup(); serah.tutup(); modal.tutup(); } };
}
