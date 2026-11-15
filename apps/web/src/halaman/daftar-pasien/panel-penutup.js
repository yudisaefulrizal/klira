import { KASIR, MAKS_BARIS_BAYAR, METODE_BAYAR, STATUS_HASIL_LAB } from '@klira/shared';
import { catatPembayaran, hapusItemTagihan, kasirKunjungan, tutupKunjungan } from '../../api-klien/kasir.js';
import { GalatApi } from '../../api-klien/klien.js';
import { token } from '../../gaya/token.js';
import { izinSaatIni } from '../../komponen/izin/izin-saja.js';
import { bidang, baris, kartu, lencana, peringatan, sel, tabel, tombol } from '../../komponen/ui/primitif.js';
import { DaftarRingkasan } from '../../komponen/ui/susunan.js';
import { buatSerahObat } from '../../modal/farmasi/serah-terima-obat.js';
import { awalBayar, bentukBayar, bisaTutup, daftarSyarat, galatBayar, hapusBaris, hargaDiubah, ringkasBayar, tambahBaris, ubahBaris, ubahHargaTersedia } from '../../modal/kasir-klaim/keadaan-kasir.js';
import { LengkapiHarga } from '../../modal/kasir-klaim/lengkapi-harga.js';
import { bukaSerahHasil } from '../../modal/kasir-klaim/serah-hasil.js';
import { TambahItemTarif } from '../../modal/kasir-klaim/tambah-item-tarif.js';
import { bukaUbahHarga } from '../../modal/kasir-klaim/ubah-harga.js';
import { rupiah } from '../../modal/penunjang/keadaan-order-lab.js';
import { formatWaktu } from '../../util/tab/penyaring-tab.js';

const P = KASIR.penutup, B = KASIR.bayar, T = KASIR.tutup;
const LABEL_SYARAT = { tahap: B.syarat.tahap, tagihan: B.syarat.tagihan, resep: B.syarat.resep, lunas: B.syarat.lunas };

/**
 * Tab Penutup di panel kunjungan (pengganti modal Pembayaran, Serah terima obat, dan Tutup kunjungan): ringkasan diagnosis dan tindakan, tagihan, pembayaran,
 * serah obat, lalu tutup kunjungan, masing-masing aktif sesuai izin akun. `onBerubah()` dipanggil tiap perubahan yang menggeser tahap atau tagihan.
 */
export function PanelPenutup({ kunjunganId, klinis, onBerubah }) {
  const boleh = izinSaatIni();
  const bolehKasir = boleh('kasir', 'lihat') || boleh('kasir', 'input') || boleh('kasir', 'perbaikan'), bolehBayar = boleh('kasir', 'input'), bolehTutup = boleh('kasir', 'perbaikan'), bolehObat = boleh('farmasi', 'input');
  const el = document.createElement('div'); Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md });
  let g = null, bayar = awalBayar(), galatMuat = null, galat = null, info = null, dicoba = false, memproses = false, alasan = '', ditutup = null, aktif = true, anak = [], modalHarga, modalSerah;
  const tahap = () => g?.kunjungan.tahap_layanan ?? klinis().kunjungan.tahap_layanan;
  // Setelah obat diserahkan, syarat tutup (resep sudah diserahkan) berubah di server: data kasir dimuat ulang sekali per penyerahan.
  let serahSegar = true;
  const serah = buatSerahObat(kunjunganId, bolehObat, () => {
    if (!aktif) return;
    if (serah.memproses) serahSegar = false;
    else if (serah.berubah && !serahSegar) { serahSegar = true; el.muat(); onBerubah(); }
    lukis();
  }, { ringkas: true });

  const kolom = () => { const e = document.createElement('div'); Object.assign(e.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md }); return e; };
  const teks = (isi, redup = false) => { const e = document.createElement('span'); e.textContent = isi; if (redup) Object.assign(e.style, { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }); return e; };
  const ringkas = (rows) => DaftarRingkasan({ bagian: [{ judul: '', baris: rows }] });
  const bagian = (judul, ...isi) => { const k = kartu({ susun: 'md', style: { padding: token.jarak.md } }), h = document.createElement('h3'); h.textContent = judul; h.style.margin = '0'; k.append(h, ...isi.filter(Boolean)); return k; };
  const terapkan = (h) => { if (!aktif) return; g = h; bayar = awalBayar(h.syarat.ditanggung_jkn ? 0 : h.tagihan.sisa); onBerubah(); lukis(); };
  async function jalankan(f) {
    if (memproses) return; memproses = true; galat = info = null; lukis();
    try { await f(); }
    catch (e) { if (aktif) galat = e instanceof GalatApi ? e.message : B.gagal; }
    finally { memproses = false; if (aktif) lukis(); }
  }

  // --- Ringkasan ---
  // Hanya diagnosis: tindakan dan obat sudah tampil sebagai item di tagihan.
  function ringkasan() {
    const dx = klinis().bagian.diagnosis.isi?.item ?? [];
    const daftar = kolom(); daftar.style.gap = token.jarak.xs;
    const h = document.createElement('strong'); h.textContent = P.diagnosis; daftar.append(h);
    if (!dx.length) daftar.append(teks(P.kosong, true));
    for (const d of dx) daftar.append(teks(`${d.kode} — ${d.nama}${d.peran === 'utama' ? ' (utama)' : ''}`));
    return bagian(P.ringkasan, daftar);
  }

  // --- Tagihan ---
  function tagihan() {
    const e = kolom(); if (!g) { e.append(KASIR.memuat); return bagian(P.tagihan, e); }
    const t = g.tagihan;
    if (t.status_tagihan !== 'lengkap') { e.append(peringatan(B.tagihanBelum)); if (bolehBayar) { const f = LengkapiHarga({ kunjunganId, gambaran: g, onUbah: terapkan }); anak.push(f); e.append(f); } }
    const tbl = tabel([{ judul: B.kolom.item }, { judul: B.kolom.jumlah }, { judul: B.kolom.harga }, { judul: B.kolom.subtotal, rataKanan: true }], B.tagihanJudul);
    for (const i of t.item) {
      const nama = sel(i.nama);
      if (i.manual) nama.append(teks(` · ${KASIR.tambah.manual}`, true)); if (i.tindakan_sumber) nama.append(teks(` · ${KASIR.tambah.dariTindakan}`, true));
      if (hargaDiubah(i)) { const k = teks(`${KASIR.ubahHarga.diubah}: ${i.alasan_ubah_harga}`, true); k.style.display = 'block'; nama.append(k); }
      if (bolehBayar && ubahHargaTersedia(i, g)) { const b = tombol(KASIR.ubahHarga.aksi, () => { modalHarga = bukaUbahHarga({ kunjunganId, item: i, onTutup() { modalHarga = undefined; }, onUbah(h) { modalHarga = undefined; terapkan(h); } }); }, 'teks'); b.disabled = memproses; b.setAttribute('aria-label', `${KASIR.ubahHarga.aksi} ${i.nama}`); nama.append(' · ', b); }
      if (bolehBayar && i.manual && tahap() !== 'ditutup') { const b = tombol(KASIR.tambah.hapus, () => jalankan(async () => terapkan(await hapusItemTagihan(kunjunganId, i.id))), 'teks'); b.disabled = memproses; b.setAttribute('aria-label', `${KASIR.tambah.hapus} ${i.nama}`); nama.append(' · ', b); }
      const harga = sel(); if (hargaDiubah(i)) { const coret = document.createElement('s'); coret.textContent = rupiah(i.harga_acuan ?? 0); coret.style.color = token.warna.teksRedup; coret.setAttribute('aria-label', `${KASIR.ubahHarga.hargaAcuan} ${rupiah(i.harga_acuan ?? 0)}`); harga.append(coret, ' '); }
      harga.append(i.harga === null ? '-' : rupiah(i.harga));
      const sub = sel(i.harga === null ? '-' : rupiah(i.harga * i.jumlah)); sub.style.textAlign = 'right'; tbl.tbody.append(baris(nama, sel(i.jumlah), harga, sub));
    }
    e.append(tbl.el);
    // Baris tambah item dari tarif tepat di bawah daftar item (seperti baris tambah obat di resep), sebelum total.
    if (bolehBayar && tahap() !== 'ditutup') { const tambah = TambahItemTarif({ kunjunganId, gambaran: g, onUbah: terapkan, ringkas: true }); anak.push(tambah); e.append(tambah); }
    e.append(ringkas([{ label: B.total, nilai: rupiah(t.total) }, { label: B.dibayar, nilai: rupiah(t.dibayar) }, { label: B.sisa, nilai: t.sisa === 0 ? B.lunas : g.syarat.ditanggung_jkn ? `${rupiah(t.sisa)} (${KASIR.jkn.ditanggung})` : rupiah(t.sisa) }]));
    // Penunjang saja: status hasil lab dan penyerahannya, terpisah dari pembayaran.
    if (g.hasil_lab?.status) {
      const hl = g.hasil_lab, blok = kolom(), judul = document.createElement('strong'); judul.textContent = KASIR.serahHasil.judul;
      const r1 = document.createElement('div'); Object.assign(r1.style, { display: 'flex', gap: token.jarak.md, alignItems: 'center', flexWrap: 'wrap' });
      r1.append(lencana(STATUS_HASIL_LAB.label(hl.status), STATUS_HASIL_LAB.warna(hl.status)), teks(`${hl.divalidasi}/${hl.total}`, true));
      if (hl.status === 'diserahkan') r1.append(teks(KASIR.serahHasil.diserahkanPada(formatWaktu(hl.diserahkan_pada), hl.penerima_nama ?? '-'), true));
      if (hl.status === 'belum_diserahkan' && bolehBayar) { const b = tombol(KASIR.serahHasil.serahkan, () => { modalSerah = bukaSerahHasil({ kunjunganId, pasienNama: g.kunjungan.pasien_nama, onTutup() { modalSerah = undefined; }, onSelesai(h) { modalSerah = undefined; terapkan(h); } }); }, 'sekunder'); b.disabled = memproses || (g.tagihan.sisa > 0 && !g.syarat.ditanggung_jkn); r1.append(b); }
      if (hl.status === 'belum_diserahkan' && g.tagihan.sisa > 0 && !g.syarat.ditanggung_jkn) r1.append(teks(`${B.sisa}: ${rupiah(g.tagihan.sisa)}`, true));
      if (hl.status === 'menunggu') blok.append(teks(KASIR.serahHasil.menunggu, true));
      blok.prepend(judul, r1); e.append(blok);
    }
    return bagian(P.tagihan, e);
  }

  // --- Pembayaran ---
  // Pembayaran, serah obat, dan penutupan dikerjakan sekaligus oleh tombol Tutup kunjungan; di sini hanya perhitungan apa yang akan diproses.
  const bayarDiisi = () => bayar.baris.some((b) => b.jumlah.trim());
  const bayarSah = () => !!g && g.tagihan.sisa > 0 && Object.keys(galatBayar(bayar, g.tagihan.sisa)).length === 0;
  /** Pembayaran yang diisi ikut dicatat bila sah, shift kasir terbuka, tagihan lengkap, dan akun boleh mencatat. */
  const akanBayar = () => !!g && bolehBayar && bayarDiisi() && bayarSah() && g.shift_terbuka && g.tagihan.status_tagihan === 'lengkap';
  const akanSerah = () => bolehObat && serah.bisaSerah;
  const sisaAkhir = () => (g ? g.tagihan.sisa - (akanBayar() ? ringkasBayar(bayar, g.tagihan.sisa).diterapkan : 0) : 0);
  /** Tombol Tutup kunjungan aktif bila semua syarat terpenuhi atau ikut dipenuhi oleh pembayaran dan serah obat yang akan diproses. */
  function bisaProses() {
    if (!g || memproses || !bolehTutup || ditutup || tahap() !== 'kasir') return false;
    if (bayarDiisi() && !bayarSah()) return false;
    const resepOk = g.syarat.resep_diserahkan || akanSerah(), lunasOk = sisaAkhir() <= 0 || g.syarat.ditanggung_jkn || !!alasan.trim();
    return g.syarat.tagihan_lengkap && resepOk && lunasOk;
  }
  let ringkasTutup = null, tombolTutup = null, blokAlasan = null;
  /** Memperbarui ringkasan "akan diproses" dan tombol tanpa menggambar ulang panel (dipanggil saat mengetik). */
  function segarkanTutup() {
    if (!tombolTutup || !g) return;
    tombolTutup.disabled = !bisaProses();
    // Peringatan dan alasan menutup belum lunas hanya perlu bila pembayaran yang diisi tidak melunasi sisa tagihan.
    if (blokAlasan) blokAlasan.style.display = sisaAkhir() <= 0 ? 'none' : 'flex';
    const rencana = [...(akanBayar() ? [P.akanBayar(rupiah(ringkasBayar(bayar, g.tagihan.sisa).diterapkan))] : []), ...(akanSerah() ? [P.akanSerah(serah.resep.filter((r) => r.status === 'siap').length)] : []), P.akanTutup];
    ringkasTutup.textContent = `${P.saatTutup} ${rencana.join(', ')}.`;
  }
  async function catatSaja() {
    dicoba = true; if (!akanBayar()) { lukis(); return; }
    await jalankan(async () => { const h = await catatPembayaran(kunjunganId, bentukBayar(bayar)); if (!aktif) return; info = `${B.tercatat(rupiah(h.diterapkan))}${h.kembalian ? ` ${B.kembalian(rupiah(h.kembalian))}.` : ''}`; dicoba = false; g = { ...g, tagihan: h.tagihan }; bayar = awalBayar(h.tagihan.sisa); onBerubah(); });
  }
  function pembayaran() {
    const e = kolom(); if (!g) { e.append(KASIR.memuat); return bagian(P.pembayaran, e); }
    const t = g.tagihan;
    if (!g.shift_terbuka && bolehBayar) e.append(peringatan(B.tanpaShift)); if (t.status_tagihan !== 'lengkap') e.append(peringatan(B.tagihanBelum));
    if (!t.pembayaran.length) e.append(teks(B.tanpaPembayaran, true));
    for (const p of t.pembayaran) { const r = document.createElement('div'); Object.assign(r.style, { display: 'flex', gap: token.jarak.sm, flexWrap: 'wrap' }); const jumlah = teks(rupiah(p.jumlah)); jumlah.style.flexGrow = '1'; r.append(lencana(METODE_BAYAR.label(p.metode), METODE_BAYAR.warna(p.metode)), jumlah, teks(`${p.kasir_nama ?? '-'} · ${formatWaktu(p.waktu)}`, true)); e.append(r); }
    if (t.sisa > 0 && t.total > 0 && bolehBayar && tahap() !== 'ditutup') {
      const sisa = document.createElement('strong'); sisa.textContent = `${B.sisa}: ${rupiah(t.sisa)}`; e.append(sisa);
      const opsiMetode = ['tunai', 'transfer', 'qris'].map((m) => ({ nilai: m, label: METODE_BAYAR.label(m) }));
      const erreur = document.createElement('div'), ringk = document.createElement('div'), fields = [];
      const hitung = () => {
        const gb = galatBayar(bayar, t.sisa); for (const [i, metode, jumlah] of fields) { metode.setGalat(dicoba ? gb[`pembayaran.${i}.metode`] : undefined); jumlah.setGalat(dicoba ? gb[`pembayaran.${i}.jumlah`] : undefined); }
        erreur.replaceChildren(); if (dicoba && (gb.pembayaran ?? gb[''])) erreur.append(peringatan(gb.pembayaran ?? gb['']));
        ringk.replaceChildren(); const r = ringkasBayar(bayar, t.sisa); if (r.diterima > 0) ringk.append(ringkas([{ label: B.totalDiterima, nilai: rupiah(r.diterima) }, { label: B.diterapkan, nilai: rupiah(r.diterapkan) }, { label: B.kembalianLabel, nilai: rupiah(r.kembalian) }]));
        segarkanTutup();
      };
      bayar.baris.forEach((b, i) => {
        const r = document.createElement('div'); Object.assign(r.style, { display: 'flex', gap: token.jarak.md, flexWrap: 'wrap', alignItems: 'flex-end' });
        const metode = bidang({ id: `bayar-metode-${i}`, label: i === 0 ? B.metode : B.metodeKe(i + 1), opsi: opsiMetode, nilai: b.metode, ubah(v) { bayar = ubahBaris(bayar, i, { metode: v }); hitung(); } });
        const jumlah = bidang({ id: `bayar-jumlah-${i}`, label: i === 0 ? B.diterima : B.diterimaKe(i + 1), nilai: b.jumlah, autoComplete: 'off', ubah(v) { bayar = ubahBaris(bayar, i, { jumlah: v }); hitung(); } });
        jumlah.kontrol.inputMode = 'numeric'; jumlah.el.style.flexGrow = '1'; metode.kontrol.disabled = jumlah.kontrol.disabled = memproses; fields.push([i, metode, jumlah]); r.append(metode.el, jumlah.el);
        if (i > 0) { const h = tombol(B.hapusMetode, () => { bayar = hapusBaris(bayar, i); lukis(); }, 'teks'); h.disabled = memproses; h.setAttribute('aria-label', `${B.hapusMetode} ${B.metodeKe(i + 1)}`); r.append(h); }
        e.append(r);
      });
      if (bayar.baris.length < MAKS_BARIS_BAYAR) { const b = tombol(B.tambahMetode, () => { bayar = tambahBaris(bayar, t.sisa); lukis(); }, 'sekunder'); b.disabled = memproses; e.append(b); }
      e.append(erreur, ringk);
      if (bolehTutup) e.append(teks(P.diprosesSaatTutup, true));
      else {
        // Akun yang boleh mencatat pembayaran tetapi tidak boleh menutup kunjungan mencatatnya sendiri di sini.
        const simpan = tombol(memproses ? P.mencatat : P.catatPembayaran, () => void catatSaja()); simpan.style.alignSelf = 'flex-start'; simpan.disabled = memproses || !akanBayar(); e.append(simpan);
      }
      hitung();
    }
    else if (t.total > 0 && t.sisa <= 0) e.append(peringatan(B.lunas, 'biru'));
    return bagian(P.pembayaran, e);
  }

  // --- Serah obat ---
  /**
   * Obat diserahkan oleh tombol Tutup kunjungan, jadi bagian ini tidak tampil sebagai kartu sendiri (rinciannya sudah ada di tagihan). Ia baru muncul bila ada yang
   * perlu ditindaklanjuti: stok kurang yang menunggu persetujuan, galat penyerahan, atau akun farmasi yang tidak boleh menutup kunjungan dan menyerahkan obat sendiri.
   */
  function serahObat() {
    const sendiri = !bolehTutup && serah.resep?.some((r) => r.status === 'siap');
    if (!serah.adaKekurangan && !serah.galat && !sendiri) return null;
    const pesan = []; if (serah.galat) pesan.push(peringatan(serah.galat));
    let aksi = null;
    if (sendiri) { aksi = tombol(serah.memproses ? P.menyerahkan : P.serahkan, () => void serah.serahkan()); aksi.style.alignSelf = 'flex-start'; aksi.disabled = serah.memproses || !serah.bisaSerah; }
    return bagian(serah.adaKekurangan ? P.persetujuanStok : P.serahObat, ...pesan, serah.isi, aksi);
  }

  // --- Tutup kunjungan ---
  function tutup() {
    const e = kolom(); ringkasTutup = tombolTutup = blokAlasan = null; if (!g) { e.append(KASIR.memuat); return bagian(P.tutup, e); }
    if (ditutup || tahap() === 'ditutup') { e.append(peringatan(ditutup ?? P.sudahDitutup, 'biru')); return bagian(P.tutup, e); }
    const h = document.createElement('strong'); h.textContent = T.syaratJudul; e.append(h);
    for (const sy of daftarSyarat(g)) {
      const r = document.createElement('div'), label = document.createElement('span'); Object.assign(r.style, { display: 'flex', gap: token.jarak.sm, flexWrap: 'wrap' }); label.style.flexGrow = '1'; label.textContent = LABEL_SYARAT[sy.kunci];
      // Syarat resep dan lunas yang akan dipenuhi oleh serah obat atau pembayaran dalam proses yang sama ditandai "ikut diproses".
      const ikut = !sy.ok && ((sy.kunci === 'resep' && akanSerah()) || (sy.kunci === 'lunas' && sisaAkhir() <= 0));
      r.append(label, ikut ? lencana(P.ikutDiproses, 'biru') : lencana(sy.ok ? T.ok : T.belum, sy.ok ? 'hijau' : sy.wajib ? 'merah' : 'kuning')); e.append(r);
    }
    if (!g.syarat.lunas && g.tagihan.sisa > 0) {
      if (g.syarat.ditanggung_jkn) e.append(peringatan(`${KASIR.jkn.ditanggung}. ${KASIR.jkn.petunjukTutup}`, 'biru'));
      else { blokAlasan = kolom(); blokAlasan.append(peringatan(`${T.alasanPetunjuk} Sisa tagihan ${rupiah(g.tagihan.sisa)}. ${P.alasanKosongkan}`)); const f = bidang({ id: 'tutup-alasan', label: T.alasan, jenis: 'textarea', nilai: alasan, maxLength: 300, ubah(v) { alasan = v; segarkanTutup(); } }); blokAlasan.append(f.el); e.append(blokAlasan); }
    }
    if (!bolehTutup) e.append(peringatan(T.tanpaIzin, 'biru'));
    ringkasTutup = teks('', true); tombolTutup = tombol(memproses ? P.menutup : P.tutupKunjungan, () => void prosesTutup()); tombolTutup.style.alignSelf = 'flex-start';
    e.append(ringkasTutup, tombolTutup); segarkanTutup();
    return bagian(P.tutup, e);
  }
  /** Tutup kunjungan: mencatat pembayaran yang diisi, menyerahkan obat yang siap, lalu menutup. Berhenti di langkah yang gagal; langkah sebelumnya tetap tersimpan. */
  async function prosesTutup() {
    if (!bisaProses()) return;
    dicoba = true; if (bayarDiisi() && !bayarSah()) { lukis(); return; }
    memproses = true; galat = info = null; lukis();
    const selesai = []; let langkah = '';
    try {
      if (akanBayar()) {
        langkah = P.pembayaran; const h = await catatPembayaran(kunjunganId, bentukBayar(bayar)); if (!aktif) return;
        g = { ...g, tagihan: h.tagihan }; bayar = awalBayar(h.tagihan.sisa); dicoba = false;
        selesai.push(`${B.tercatat(rupiah(h.diterapkan))}${h.kembalian ? ` ${B.kembalian(rupiah(h.kembalian))}.` : ''}`);
      }
      if (akanSerah()) {
        langkah = P.serahObat; await serah.serahkan(); if (!aktif) return;
        if (serah.bisaSerah) throw new Error(serah.galat ?? B.gagal); // masih ada resep siap: serah gagal (mis. stok kurang menunggu persetujuan)
        selesai.push(B.serahTercatat);
      }
      langkah = P.tutup; g = await kasirKunjungan(kunjunganId); if (!aktif) return;
      if (!bisaTutup(g, alasan)) throw new Error(T.kembaliKasir);
      g = await tutupKunjungan(kunjunganId, g.syarat.lunas || (g.syarat.ditanggung_jkn && !alasan.trim()) ? {} : { alasan }); if (!aktif) return;
      ditutup = [...selesai, `${T.berhasil} ${T.berhasilPesan}`].join(' ');
    }
    catch (e) {
      if (!aktif) return;
      info = selesai.length ? selesai.join(' ') : null;
      // Galat serah obat sudah tampil di bagiannya sendiri (mis. stok kurang menunggu persetujuan); tidak diulang.
      galat = `${langkah === P.serahObat ? '' : `${e instanceof GalatApi || e instanceof Error ? e.message : B.gagal} `}${P.berhentiDi(langkah)}`;
      // Data kasir dimuat ulang supaya tampilan mengikuti langkah yang sudah tersimpan.
      void kasirKunjungan(kunjunganId).then((h) => { if (aktif) { g = h; lukis(); } }).catch(() => {});
    }
    finally { memproses = false; if (aktif) { onBerubah(); lukis(); } }
  }

  function lukis() {
    if (!aktif) return;
    const fokus = document.activeElement, id = el.contains(fokus) ? fokus.id : '', mulai = fokus?.selectionStart, akhir = fokus?.selectionEnd;
    for (const a of anak) a.tutup?.(); anak = [];
    const bagianTampil = [];
    if (galatMuat) bagianTampil.push(peringatan(galatMuat));
    if (['menunggu_skrining', 'pemeriksaan'].includes(tahap())) { el.replaceChildren(ringkasan(), peringatan(P.belumTersedia, 'biru')); return; }
    if (info) bagianTampil.push(peringatan(info, 'biru'));
    if (galat) bagianTampil.push(peringatan(galat));
    el.replaceChildren(...[ringkasan(), ...bagianTampil, ...(bolehKasir ? [tagihan(), ...(bolehBayar ? [pembayaran()] : [])] : []), ...(bolehObat ? [serahObat()] : []), ...(bolehKasir && bolehTutup ? [tutup()] : [])].filter(Boolean));
    if (!bolehKasir && !bolehObat) el.append(peringatan(P.tanpaIzin, 'biru'));
    if (id) { const f = document.getElementById(id); f?.focus({ preventScroll: true }); if (mulai != null && f?.setSelectionRange) { try { f.setSelectionRange(mulai, akhir); } catch { /* tipe isian tanpa seleksi */ } } }
  }
  el.muat = () => {
    if (!bolehKasir) return;
    kasirKunjungan(kunjunganId).then((h) => { if (aktif) { g = h; bayar = awalBayar(h.syarat.ditanggung_jkn ? 0 : h.tagihan.sisa); galatMuat = null; lukis(); } })
      .catch((e) => { if (aktif) { galatMuat = e instanceof GalatApi ? e.message : B.gagal; lukis(); } });
  };
  el.perbarui = () => lukis();
  el.tutup = () => { aktif = false; for (const a of anak) a.tutup?.(); modalHarga?.tutup(); modalSerah?.tutup(); serah.tutup(); };
  lukis(); el.muat();
  return el;
}
