import { KASIR, MAKS_BARIS_BAYAR, METODE_BAYAR, NILAI_METODE_BAYAR } from '@klira/shared';
import { catatPembayaran, hapusItemTagihan, kasirKunjungan, tutupKunjungan } from '../../api-klien/kasir.js';
import { kirimKunjunganPcare } from '../../api-klien/pcare.js';
import { kirimKunjunganSatusehat } from '../../api-klien/satusehat.js';
import { GalatApi, pesanGalat } from '../../api-klien/klien.js';
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
import { navigasiSaatIni } from '../../util/navigasi/navigasi.js';
import { barisFleks, kolomFleks, teksRedupKecil } from '../../gaya/tata-letak.js';

const P = KASIR.penutup, B = KASIR.bayar, T = KASIR.tutup;
const LABEL_SYARAT = { tahap: B.syarat.tahap, tagihan: B.syarat.tagihan, resep: B.syarat.resep, lunas: B.syarat.lunas };

/**
 * Tab Penutup di panel kunjungan (pengganti modal Pembayaran, Serah terima obat, dan Tutup kunjungan): ringkasan diagnosis dan tindakan, tagihan, pembayaran,
 * serah obat, lalu tutup kunjungan, masing-masing aktif sesuai izin akun. `onBerubah()` dipanggil tiap perubahan yang menggeser tahap atau tagihan.
 */
export function PanelPenutup({ kunjunganId, pasien, ringkas: kjRingkas, klinis, onBerubah, onKepala }) {
  const boleh = izinSaatIni();
  const bolehKasir = boleh('kasir', 'lihat') || boleh('kasir', 'input') || boleh('kasir', 'perbaikan'), bolehBayar = boleh('kasir', 'input'), bolehTutup = boleh('kasir', 'perbaikan'), bolehObat = boleh('farmasi', 'input');
  const el = document.createElement('div'); kolomFleks(el, 'md');
  let g = null, bayar = awalBayar(), galatMuat = null, galat = null, info = null, dicoba = false, memproses = false, alasan = '', ditutup = null, aktif = true, anak = [], modalHarga, modalSerah, bukaTambahItem = false;
  const tahap = () => g?.kunjungan.tahap_layanan ?? klinis().kunjungan.tahap_layanan;
  // Setelah obat diserahkan, syarat tutup (resep sudah diserahkan) berubah di server: data kasir dimuat ulang sekali per penyerahan.
  let serahSegar = true;
  const serah = buatSerahObat(kunjunganId, bolehObat, () => {
    if (!aktif) return;
    if (serah.memproses) serahSegar = false;
    else if (serah.berubah && !serahSegar) { serahSegar = true; el.muat(); onBerubah(); }
    lukis(); onKepala?.();
  }, { ringkas: true });

  const kolom = () => { const e = document.createElement('div'); kolomFleks(e, 'md'); return e; };
  const teks = (isi, redup = false) => { const e = document.createElement('span'); e.textContent = isi; if (redup) teksRedupKecil(e); return e; };
  const ringkas = (rows) => DaftarRingkasan({ bagian: [{ judul: '', baris: rows }] });
  const bagian = (judul, ...isi) => { const k = kartu({ susun: 'md', style: { padding: token.jarak.md } }), h = document.createElement('h3'); h.textContent = judul; h.style.margin = '0'; k.append(h, ...isi.filter(Boolean)); return k; };
  // Pasien JKN atau asuransi: baris pertama langsung memakai metodenya, supaya yang ditanggung tetap diinput sebagai pembayaran.
  const metodeBawaan = (h) => (['jkn', 'asuransi'].includes(h.kunjungan.cara_pembayaran) ? h.kunjungan.cara_pembayaran : 'tunai');
  const terapkan = (h) => { if (!aktif) return; g = h; bayar = awalBayar(h.tagihan.sisa, metodeBawaan(h)); onBerubah(); lukis(); onKepala?.(); };
  async function jalankan(f) {
    if (memproses) return; memproses = true; galat = info = null; lukis(); onKepala?.();
    try { await f(); }
    catch (e) { if (aktif) galat = pesanGalat(e, B.gagal); }
    finally { memproses = false; if (aktif) { lukis(); onKepala?.(); } }
  }

  // --- Ringkasan ---
  // Hanya diagnosis: tindakan dan obat sudah tampil sebagai item di tagihan.
  function ringkasan() {
    const dx = klinis().bagian.diagnosis?.isi?.item ?? [];
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
    // Tombol + Tambah item ditampilkan lebih dulu; form pilih item baru muncul setelah ditekan.
    if (bolehBayar && tahap() !== 'ditutup') {
      if (!bukaTambahItem) {
        const btnTambah = tombol(`+ ${KASIR.tambah.tambahBaris}`, () => { bukaTambahItem = true; lukis(); }, 'sekunder');
        btnTambah.disabled = memproses;
        btnTambah.style.alignSelf = 'flex-start';
        e.append(btnTambah);
      } else {
        const wadahTambah = document.createElement('div');
        barisFleks(wadahTambah, 'sm', { rata: 'center', bungkus: true });
        const tambah = TambahItemTarif({ kunjunganId, gambaran: g, onUbah(h) { bukaTambahItem = false; terapkan(h); }, ringkas: true });
        tambah.style.flex = '1 1 320px';
        anak.push(tambah);
        const btnBatal = tombol('Batal', () => { bukaTambahItem = false; lukis(); }, 'teks');
        wadahTambah.append(tambah, btnBatal);
        e.append(wadahTambah);
      }
    }
    e.append(ringkas([{ label: B.total, nilai: rupiah(t.total) }]));
    if (g.hasil_lab?.status === 'diserahkan') e.append(teks(KASIR.serahHasil.diserahkanPada(formatWaktu(g.hasil_lab.diserahkan_pada), g.hasil_lab.penerima_nama ?? '-'), true));
    else if (g.hasil_lab?.status === 'menunggu') e.append(teks(KASIR.serahHasil.menunggu, true));
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
    const resepOk = g.syarat.resep_diserahkan || akanSerah(), lunasOk = sisaAkhir() <= 0 || !!alasan.trim();
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
    if (!g) return null;
    const t = g.tagihan;
    if (t.sisa <= 0 || t.total <= 0 || tahap() === 'ditutup') return null;
    const e = kolom();
    if (!g.shift_terbuka) e.append(peringatan(B.tanpaShift, 'merah', { label: 'Buka Kasir dan klaim →', href: '/kasir-klaim?tab=shift', onClick: () => navigasiSaatIni().pindah('/kasir-klaim?tab=shift') }));
    for (const p of t.pembayaran) { const r = document.createElement('div'); barisFleks(r, 'sm', { bungkus: true }); const jumlah = teks(rupiah(p.jumlah)); jumlah.style.flexGrow = '1'; r.append(lencana(METODE_BAYAR.label(p.metode), METODE_BAYAR.warna(p.metode)), jumlah, teks(`${p.kasir_nama ?? '-'} · ${formatWaktu(p.waktu)}`, true)); e.append(r); }
    {
      const opsiMetode = NILAI_METODE_BAYAR.map((m) => ({ nilai: m, label: METODE_BAYAR.label(m) }));
      const erreur = document.createElement('div'), ringk = document.createElement('div'), fields = [];
      const hitung = () => {
        const gb = galatBayar(bayar, t.sisa); for (const [i, metode, jumlah] of fields) { metode.setGalat(dicoba ? gb[`pembayaran.${i}.metode`] : undefined); jumlah.setGalat(dicoba ? gb[`pembayaran.${i}.jumlah`] : undefined); }
        erreur.replaceChildren(); if (dicoba && (gb.pembayaran ?? gb[''])) erreur.append(peringatan(gb.pembayaran ?? gb['']));
        ringk.replaceChildren(); const r = ringkasBayar(bayar, t.sisa); if (r.diterima > 0) ringk.append(ringkas([{ label: B.totalDiterima, nilai: rupiah(r.diterima) }, { label: B.diterapkan, nilai: rupiah(r.diterapkan) }, { label: B.kembalianLabel, nilai: rupiah(r.kembalian) }]));
        segarkanTutup();
      };
      bayar.baris.forEach((b, i) => {
        const r = document.createElement('div'); barisFleks(r, 'md', { rata: 'flex-end', bungkus: true });
        const metode = bidang({ id: `bayar-metode-${i}`, label: i === 0 ? B.metode : B.metodeKe(i + 1), opsi: opsiMetode, nilai: b.metode, ubah(v) { bayar = ubahBaris(bayar, i, { metode: v }); hitung(); } });
        const jumlah = bidang({ id: `bayar-jumlah-${i}`, label: i === 0 ? B.diterima : B.diterimaKe(i + 1), nilai: b.jumlah, autoComplete: 'off', ubah(v) { bayar = ubahBaris(bayar, i, { jumlah: v }); hitung(); } });
        jumlah.kontrol.inputMode = 'numeric'; jumlah.el.style.flex = '0 0 200px'; jumlah.el.style.maxWidth = '100%'; metode.kontrol.disabled = jumlah.kontrol.disabled = memproses; fields.push([i, metode, jumlah]); r.append(metode.el, jumlah.el);
        if (i > 0) { const h = tombol(B.hapusMetode, () => { bayar = hapusBaris(bayar, i); lukis(); }, 'teks'); h.disabled = memproses; h.setAttribute('aria-label', `${B.hapusMetode} ${B.metodeKe(i + 1)}`); r.append(h); }
        e.append(r);
      });
      if (bayar.baris.length < MAKS_BARIS_BAYAR) { const b = tombol(B.tambahMetode, () => { bayar = tambahBaris(bayar, t.sisa); lukis(); }, 'sekunder'); b.disabled = memproses; b.style.alignSelf = 'flex-start'; e.append(b); }
      e.append(erreur, ringk);
      if (bolehTutup) e.append(teks(P.diprosesSaatTutup, true));
      else {
        // Akun yang boleh mencatat pembayaran tetapi tidak boleh menutup kunjungan mencatatnya sendiri di sini.
        const simpan = tombol(memproses ? P.mencatat : P.catatPembayaran, () => void catatSaja()); simpan.style.alignSelf = 'flex-start'; simpan.disabled = memproses || !akanBayar(); e.append(simpan);
      }
      hitung();
    }
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
    const e = kolom(); ringkasTutup = tombolTutup = blokAlasan = null;
    if (ditutup || tahap() === 'ditutup') return null;
    if (!g) { e.append(KASIR.memuat); return bagian(P.tutup, e); }
    const h = document.createElement('strong'); h.textContent = T.syaratJudul; e.append(h);
    for (const sy of daftarSyarat(g)) {
      const r = document.createElement('div'), label = document.createElement('span'); barisFleks(r, 'sm', { bungkus: true }); label.style.flexGrow = '1'; label.textContent = LABEL_SYARAT[sy.kunci];
      // Syarat resep dan lunas yang akan dipenuhi oleh serah obat atau pembayaran dalam proses yang sama ditandai "ikut diproses".
      const ikut = !sy.ok && ((sy.kunci === 'resep' && akanSerah()) || (sy.kunci === 'lunas' && sisaAkhir() <= 0));
      r.append(label, ikut ? lencana(P.ikutDiproses, 'biru') : lencana(sy.ok ? T.ok : T.belum, sy.ok ? 'hijau' : sy.wajib ? 'merah' : 'kuning')); e.append(r);
    }
    if (!g.syarat.lunas && g.tagihan.sisa > 0) {
      { blokAlasan = kolom(); blokAlasan.append(peringatan(`${T.alasanPetunjuk} Sisa tagihan ${rupiah(g.tagihan.sisa)}. ${P.alasanKosongkan}`)); const f = bidang({ id: 'tutup-alasan', label: T.alasan, jenis: 'textarea', nilai: alasan, maxLength: 300, ubah(v) { alasan = v; segarkanTutup(); } }); blokAlasan.append(f.el); e.append(blokAlasan); }
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
    memproses = true; galat = info = null; lukis(); onKepala?.();
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
      g = await tutupKunjungan(kunjunganId, g.syarat.lunas ? {} : { alasan }); if (!aktif) return;
      ditutup = [...selesai, `${T.berhasil} ${T.berhasilPesan}`].join(' ');
    }
    catch (e) {
      if (!aktif) return;
      info = selesai.length ? selesai.join(' ') : null;
      // Galat serah obat sudah tampil di bagiannya sendiri (mis. stok kurang menunggu persetujuan); tidak diulang.
      galat = `${langkah === P.serahObat ? '' : `${e instanceof GalatApi || e instanceof Error ? e.message : B.gagal} `}${P.berhentiDi(langkah)}`;
      // Data kasir dimuat ulang supaya tampilan mengikuti langkah yang sudah tersimpan.
      void kasirKunjungan(kunjunganId).then((h) => { if (aktif) { g = h; lukis(); onKepala?.(); } }).catch(() => { });
    }
    finally { memproses = false; if (aktif) { onBerubah(); lukis(); onKepala?.(); } }
  }

  /** Tombol aksi untuk baris atas kanan (`profil-panel-kepala`) saat tab Penutup dibuka; cetak ditangani menu printer bersama. */
  function aksiKepala() {
    if (!g) return [];
    const daftar = [], hl = g.hasil_lab;
    if (hl?.status === 'belum_diserahkan' && bolehBayar) {
      const b = tombol(KASIR.serahHasil.serahkan, () => { modalSerah = bukaSerahHasil({ kunjunganId, pasienNama: g.kunjungan.pasien_nama, onTutup() { modalSerah = undefined; }, onSelesai(h) { modalSerah = undefined; terapkan(h); } }); }, 'sekunder');
      b.disabled = memproses || (g.tagihan.sisa > 0 && !g.syarat.ditanggung_jkn);
      daftar.push(b);
    }
    return daftar;
  }

  function integrasiCard() {
    const kj = g?.kunjungan ?? klinis()?.kunjungan;
    if (!kj) return null;
    const barisIntegrasi = [];
    if (kj.cara_pembayaran === 'jkn') {
      const statusPcare = kj.pcare_status === 'terkirim' ? `Terkirim (${kj.pcare_no_kunjungan ?? '-'})` : kj.pcare_status === 'gagal' ? `Gagal: ${kj.pcare_pesan ?? 'Periksa data'}` : 'Belum dikirim';
      barisIntegrasi.push({ label: 'BPJS PCare', nilai: statusPcare });
    }
    barisIntegrasi.push({ label: 'SATUSEHAT', nilai: kj.encounter_id ? `Terkirim (Encounter/${kj.encounter_id})` : 'Belum dikirim' });
    const wadahAksi = document.createElement('div');
    barisFleks(wadahAksi, 'sm', { bungkus: true });
    if (kj.cara_pembayaran === 'jkn') {
      const bPc = tombol(kj.pcare_no_kunjungan ? 'Sinkron Ulang PCare' : 'Kirim ke PCare', () => void jalankan(async () => {
        const h = await kirimKunjunganPcare(kunjunganId, { perbarui: Boolean(kj.pcare_no_kunjungan) });
        if (g?.kunjungan) Object.assign(g.kunjungan, { pcare_no_kunjungan: h.no_kunjungan, pcare_status: 'terkirim', pcare_pesan: null });
        info = `Kunjungan berhasil dikirim ke PCare (${h.no_kunjungan}).`;
        onBerubah();
      }), 'sekunder');
      bPc.disabled = memproses;
      wadahAksi.append(bPc);
    }
    if (!kj.encounter_id) {
      const bSs = tombol('Kirim ke SATUSEHAT', () => void jalankan(async () => {
        const h = await kirimKunjunganSatusehat(kunjunganId);
        if (g?.kunjungan) g.kunjungan.encounter_id = h.encounter_id;
        info = `Kunjungan berhasil dikirim ke SATUSEHAT (Encounter/${h.encounter_id}).`;
        onBerubah();
      }), 'sekunder');
      bSs.disabled = memproses;
      wadahAksi.append(bSs);
    }
    return bagian('Status Integrasi (PCare & SATUSEHAT)', ringkas(barisIntegrasi), wadahAksi.childElementCount ? wadahAksi : null);
  }

  function lukis() {
    if (!aktif) return;
    const fokus = document.activeElement, id = el.contains(fokus) ? fokus.id : '', mulai = fokus?.selectionStart, akhir = fokus?.selectionEnd;
    for (const a of anak) a.tutup?.(); anak = [];
    const bagianTampil = [];
    if (galatMuat) bagianTampil.push(peringatan(galatMuat));
    if (['menunggu_skrining', 'pemeriksaan'].includes(tahap())) { el.replaceChildren(...(klinis().bagian.diagnosis ? [ringkasan()] : []), peringatan(P.belumTersedia, 'biru')); return; }
    if (ditutup) bagianTampil.push(peringatan(ditutup, 'biru'));
    if (info) bagianTampil.push(peringatan(info, 'biru'));
    if (galat) bagianTampil.push(peringatan(galat));
    el.replaceChildren(...[...(klinis().bagian.diagnosis ? [ringkasan()] : []), ...bagianTampil, ...(bolehKasir ? [tagihan(), ...(bolehBayar ? [pembayaran()] : [])] : []), ...(bolehObat ? [serahObat()] : []), ...(bolehKasir && bolehTutup ? [tutup()] : []), integrasiCard()].filter(Boolean));
    if (!bolehKasir && !bolehObat) el.append(peringatan(P.tanpaIzin, 'biru'));
    if (id) { const f = document.getElementById(id); f?.focus({ preventScroll: true }); if (mulai != null && f?.setSelectionRange) { try { f.setSelectionRange(mulai, akhir); } catch { /* tipe isian tanpa seleksi */ } } }
  }
  el.muat = () => {
    if (!bolehKasir) return;
    kasirKunjungan(kunjunganId).then((h) => { if (aktif) { g = h; bayar = awalBayar(h.tagihan.sisa, metodeBawaan(h)); galatMuat = null; lukis(); onKepala?.(); } })
      .catch((e) => { if (aktif) { galatMuat = pesanGalat(e, B.gagal); lukis(); onKepala?.(); } });
  };
  el.keadaanKepala = () => ({ kasir: g, resepSerah: serah.resep ?? [], aksi: aksiKepala() });
  el.perbarui = () => lukis();
  el.tutup = () => { aktif = false; for (const a of anak) a.tutup?.(); modalHarga?.tutup(); modalSerah?.tutup(); serah.tutup(); };
  lukis(); el.muat();
  return el;
}
