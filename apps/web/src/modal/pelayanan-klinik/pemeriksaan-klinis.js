import { TombolIkonPasien } from '../../komponen/ikon-pasien.js';
import { BAGIAN_KLINIS, GALAT, KLINIS, TAHAP_LAYANAN } from '@klira/shared';
import { buatOrderLab } from '../../api-klien/penunjang.js';
import { awalOrderLab, bentukOrderLab, galatOrderLab } from './keadaan-order-lab.js';
import { GalatApi } from '../../api-klien/klien.js';
import { adaptorDrafServer } from '../../api-klien/draf-klinis.js';
import { adaIsianResep, awalResep, bentukResep, galatResep } from './keadaan-farmasi.js';
import { buatResep, resepKunjungan } from '../../api-klien/farmasi.js';
import { ambilKlinis, ambilKonteksKlinis, daftarFavorit, selesaikanPemeriksaan, simpanBagian } from '../../api-klien/klinis.js';
import { token } from '../../gaya/token.js';
import { izinSaatIni } from '../../komponen/izin-saja.js';
import { Lencana } from '../../komponen/ui/lencana.js';
import { KotakCentang } from '../../komponen/ui/kotak-centang.js';
import { Peringatan } from '../../komponen/ui/peringatan.js';
import { Kolom, Sebaris } from '../../komponen/ui/susunan.js';
import { adaPerubahan, hapusDrafKlinisLama } from '../../util/draf.js';
import { buatDrafOtomatis } from '../../util/draf-otomatis.js';
import { batasi } from '../../util/langkah.js';
import { h } from '../../util/h.js';
import { KonteksKlinis } from './konteks-klinis.js';
import { adaPerubahanBagian, awalKeadaan, bagianLangkah, langkahDraf, bagianDiModal, daftarLangkah, disahkanDari, isiBagian, keadaanAwalForm, keadaanDariServer, LABEL_BAGIAN, mulaiUbahKeperawatan, pakaiTemplat, perluAlasan, pulihkanKeadaan, rencanaSimpan, salinKeKeadaan, statusRingkasan, syaratSelesaiTerpenuhi, tambahDiagnosis, tambahTindakan } from './keadaan-pemeriksaan.js';
import { LangkahNarasi, LangkahAnamnesis, LangkahDiagnosis, LangkahPemeriksaan, LangkahRingkasan, LangkahTandaVital, LangkahTindakan, LangkahTindakLanjut } from './langkah-pemeriksaan.js';
import { BagianKeperawatan, InfoKunjunganSkrining, RingkasanSkriningDokter } from './langkah-keperawatan.js';
import { LangkahPenunjang } from './langkah-penunjang.js';
import { LangkahResep } from './langkah-resep.js';
import { RingkasanOrderKunjungan } from './ringkasan-order-kunjungan.js';
import { HasilPenunjangKunjungan } from './hasil-penunjang-kunjungan.js';
import { bukaModalBertahap } from '../../komponen/modal-bertahap/modal-bertahap.js';
import { tombol } from '../../komponen/ui/primitif.js';
import { bukaPanelFavorit } from './panel-favorit.js';
import { bukaPanelKeluarga } from './panel-keluarga.js';
import { bukaPanelRiwayat } from './panel-riwayat.js';
import { bukaPanelSalin } from './panel-salin.js';

export const ALUR_PEMERIKSAAN = 'pemeriksaan-klinis';
export const ALUR_SKRINING = 'skrining';
const labelBagian = LABEL_BAGIAN;

const ikonSalin = () => h('svg', { width: '24', height: '24', style: { width: '24px', height: '24px', flexShrink: '0' }, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '1.7', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true' }, h('rect', { x: '8', y: '8', width: '12', height: '13', rx: '2' }), h('path', { d: 'M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3' }));
const ikonFavorit = () => h('svg', { width: '24', height: '24', style: { width: '24px', height: '24px', flexShrink: '0' }, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '1.7', strokeLinejoin: 'round', 'aria-hidden': 'true' }, h('path', { d: 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z' }));

/**
 * Modal Pemeriksaan klinis (formulir RM): Anamnesa > Pemeriksaan fisik > Penunjang > Kesimpulan > Terapi > Tindak lanjut > Ringkasan.
 * Simpan = pengesahan catatan per bagian yang berubah. Draf otomatis di SERVER (bukan penyimpanan lokal). Controller native: state di closure,
 * paint() merender ulang langkah aktif dan memulihkan fokus; widget berumur panjang (penunjang) disimpan di cache agar tidak dimuat ulang.
 */
export function bukaPemeriksaanKlinis({ kunjunganId, pasien, mode, onTutup, onSelesai }) {
  if (!document.querySelector('link[data-pemeriksaan-klinis]')) {
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = new URL('./pemeriksaan-klinis.css', import.meta.url).href; css.dataset.pemeriksaanKlinis = '1'; document.head.append(css);
  }
  const konfig = daftarLangkah(mode), adaptor = adaptorDrafServer(kunjunganId, mode === 'skrining' ? ALUR_SKRINING : ALUR_PEMERIKSAAN);
  let klinis = null, konteks = null, galatMuat = null, keadaan = awalKeadaan(), indeks = 0, dikunjungi = [0], tampilGalat = false, galat = null, memproses = false;
  let selesaiDipilih = true, hasil = null, favorit = [], adaTersimpan = false, sedangMengirim = false, ubahKeperawatan = false, formSiap = false, aktif = true, modal, ditutup = false;
  const cache = {}, panelTerbuka = [];
  const widget = (kunci, buat, props) => { const w = (cache[kunci] ??= buat()); if (props) w.perbarui?.(props); return w; };

  const server = () => (klinis ? keadaanDariServer(klinis.bagian) : awalKeadaan());
  const awalForm = () => (klinis ? keadaanAwalForm(mode, klinis.bagian) : awalKeadaan());
  const draf = buatDrafOtomatis({ adaptor, nilai: keadaan, awal: awalKeadaan(), langkah: 0, aktif: false }, () => pulihkan());
  const catatDraf = () => draf.perbarui({ adaptor, nilai: keadaan, awal: awalForm(), langkah: indeks, aktif: formSiap && !hasil });
  function pulihkan() {
    if (!aktif || !klinis || !draf.keadaan.siap || formSiap) return;
    const p = draf.keadaan.pulihan, dasar = awalForm();
    if (p) {
      keadaan = pulihkanKeadaan(dasar, p.nilai); indeks = batasi(langkahDraf(p.langkah, p.nilai), konfig.length);
      dikunjungi = Array.from({ length: indeks + 1 }, (_x, i) => i);
    } else keadaan = dasar;
    formSiap = true; catatDraf(); paint();
  }

  const setKeadaan = (v) => { keadaan = typeof v === 'function' ? v(keadaan) : v; catatDraf(); paint(); };
  const setUbahKeperawatan = (v) => { ubahKeperawatan = v; paint(); };
  const setGalat = (v) => { galat = v; status(); };
  const setTampilGalat = (v) => { tampilGalat = v; paint(); };
  const setSelesaiDipilih = (v) => { selesaiDipilih = v; paint(); };
  const ubah = (p) => setKeadaan((k) => ({ ...k, ...p }));
  function pindah(n) { indeks = batasi(n, konfig.length); if (!dikunjungi.includes(indeks)) dikunjungi.push(indeks); catatDraf(); paint(); }

  function turunan() {
    const sv = server(), disahkan = klinis ? disahkanDari(klinis.bagian) : {};
    const rencana = rencanaSimpan(mode, keadaan, sv, disahkan);
    const galatDi = (bagian) => (tampilGalat && bagian ? rencana.find((r) => r.bagian === bagian)?.galat ?? null : null);
    const alasanPerlu = perluAlasan(rencana, disahkan);
    const bisaSelesai = mode === 'periksa' && !!klinis && klinis.kunjungan.tahap_layanan === 'pemeriksaan' && syaratSelesaiTerpenuhi(disahkan, rencana) && ['anamnesis', 'diagnosis', 'tindak_lanjut'].every((b) => klinis.bagian[b].verifikasi === 'sah' || rencana.some((r) => r.bagian === b && !r.galat));
    const pilihSelesai = selesaiDipilih && bisaSelesai;
    const adaResepBaru = adaIsianResep(keadaan.resep);
    const adaYangDikirim = rencana.length > 0 || pilihSelesai || keadaan.lab_dipilih || adaResepBaru;
    const statusBagian = Object.fromEntries(BAGIAN_KLINIS.map((b) => [b, statusRingkasan(b, keadaan, sv, klinis?.bagian[b].verifikasi ?? 'belum_disahkan')]));
    const infoServer = (b) => (b && klinis ? klinis.bagian[b] : null);
    const dasar = (b) => ({ k: keadaan, ubah, galat: galatDi(b), server: infoServer(b) });
    const favoritDari = (j) => favorit.filter((f) => f.jenis === j);
    return { server: sv, disahkan, rencana, galatDi, alasanPerlu, bisaSelesai, pilihSelesai, adaResepBaru, adaYangDikirim, statusBagian, dasar, favoritDari };
  }

  function status() { modal?.perbarui({ galat: galat ?? '', labelKirim: memproses ? KLINIS.tombol.menyimpan : KLINIS.tombol.simpan, nonaktif: memproses || !formSiap || !turunan().adaYangDikirim }); }
  function paint() {
    if (!modal || !aktif || hasil) return;
    const fokus = document.activeElement, id = fokus?.id, mulai = fokus?.selectionStart, akhir = fokus?.selectionEnd;
    modal.ke(indeks, { fokus: false, beritahu: false }); status();
    if (id) { const f = document.getElementById(id); f?.focus(); if (mulai != null && f?.setSelectionRange) { try { f.setSelectionRange(mulai, akhir); } catch { /* tipe tanpa seleksi */ } } }
  }

  function isiLangkah(l) {
    const { server, rencana, galatDi, alasanPerlu, bisaSelesai, adaResepBaru, statusBagian, dasar, favoritDari } = turunan();
    if (!klinis || !formSiap) return galatMuat ? h(Peringatan, null, galatMuat) : h('span', { style: { color: token.warna.teksRedup } }, KLINIS.konteks.memuat);
  switch (l.id) {
      case 'anamnesis':
        {
          const keperawatanBerubah = adaPerubahanBagian('keperawatan', keadaan, server);
          return h(Kolom, null, h(RingkasanSkriningDokter, {
            ...dasar('keperawatan'),
            tersimpan: server,
            terbuka: ubahKeperawatan || keperawatanBerubah,
            berubah: keperawatanBerubah,
            onBuka: () => {
              setKeadaan(mulaiUbahKeperawatan);
              setUbahKeperawatan(true);
            },
            onTutupUbah: () => {
              setKeadaan(k => ({
                ...k,
                keperawatan: server.keperawatan
              }));
              setUbahKeperawatan(false);
            }
          }), h(LangkahAnamnesis, {
            ...dasar('anamnesis')
          }));
        }
      case 'keperawatan':
        return h(Kolom, null, h(InfoKunjunganSkrining, {
          konteks: konteks
        }), h(LangkahTandaVital, {
          ...dasar('tanda_vital')
        }), h(BagianKeperawatan, {
          ...dasar('keperawatan')
        }));
      case 'pemeriksaan':
        return h(Kolom, null, h(LangkahTandaVital, {
          ...dasar('tanda_vital')
        }), h(LangkahPemeriksaan, {
          ...dasar('pemeriksaan')
        }));
      case 'penunjang':
        return h(Kolom, null, widget('hasil', () => HasilPenunjangKunjungan({ kunjunganId }), null), h(KotakCentang, {
          id: "penunjang-lab",
          label: KLINIS.penunjang.pesanLab,
          checked: keadaan.lab_dipilih,
          disabled: memproses,
          onChange: e => ubah({
            lab_dipilih: e.target.checked
          })
        }), keadaan.lab_dipilih && ((P) => widget('penunjang', () => LangkahPenunjang(P), P))({
          cara: konteks?.kunjungan.cara_pembayaran === 'jkn' ? 'jkn' : 'umum',
          k: keadaan.order_lab,
          onUbah: order_lab => ubah({
            order_lab
          }),
          disabled: memproses,
          galatPilihan: tampilGalat ? galatOrderLab(keadaan.order_lab) : null
        }));
      case 'kesimpulan':
        return h(Kolom, null, h(LangkahDiagnosis, {
          ...dasar('diagnosis'),
          favorit: favoritDari('diagnosis')
        }), h(LangkahNarasi, {
          bagian: "diagnosis_banding",
          keterangan: KLINIS.kesimpulan.bandingKet,
          ...dasar('diagnosis_banding')
        }), h(LangkahNarasi, {
          bagian: "kie",
          ...dasar('kie')
        }));
      case 'terapi':
        return h(Kolom, null, h(LangkahTindakan, {
          ...dasar('tindakan'),
          favorit: favoritDari('tindakan')
        }), h(LangkahNarasi, {
          bagian: "obat_poli",
          keterangan: KLINIS.terapi.obatPoliKet,
          ...dasar('obat_poli')
        }), h(LangkahResep, {
          teks: keadaan.resep,
          onUbah: resep => ubah({
            resep
          }),
          tampilGalat: tampilGalat && adaResepBaru,
          disabled: memproses
        }));
      case 'tindak_lanjut':
        return h(LangkahTindakLanjut, {
          ...dasar('tindak_lanjut')
        });
      default:
        return h(LangkahRingkasan, {
          k: keadaan,
          ubah: ubah,
          rencana: rencana,
          status: statusBagian,
          bagian: bagianDiModal(mode),
          labelBagian: labelBagian,
          perluAlasan: alasanPerlu,
          bisaSelesai: bisaSelesai,
          tampilSelesai: mode === 'periksa',
          selesai: selesaiDipilih,
          onSelesai: setSelesaiDipilih
        }, mode === 'periksa' && ((P) => widget('order', () => RingkasanOrderKunjungan(P), P))({
          kunjunganId: kunjunganId,
          k: keadaan
        }));
    }
  }

  function tutupAkhir(selesai) { if (ditutup) return; ditutup = true; aktif = false; draf.tutup(); for (const w of Object.values(cache)) w.tutup?.(); for (const p of panelTerbuka) p?.tutup?.(); modal?.tutup(); (selesai ? onSelesai : onTutup)(); }
  const tutup = () => tutupAkhir(adaTersimpan);

  async function kirim() {
    if (sedangMengirim) return;
    const { rencana, alasanPerlu, adaResepBaru, pilihSelesai, disahkan } = turunan();
    const galatObat = adaResepBaru ? Object.values(galatResep(keadaan.resep))[0] : undefined;
    if (galatObat) { tampilGalat = true; galat = galatObat; pindah(konfig.findIndex((l) => l.id === 'terapi')); return; }
    if (keadaan.lab_dipilih && galatOrderLab(keadaan.order_lab)) { tampilGalat = true; galat = galatOrderLab(keadaan.order_lab); pindah(konfig.findIndex((l) => l.id === 'penunjang')); return; }
    const masalah = rencana.findIndex((r) => r.galat);
    if (masalah >= 0) { tampilGalat = true; galat = rencana[masalah].galat; const n = konfig.findIndex((l) => bagianLangkah(l).includes(rencana[masalah].bagian)); pindah(n >= 0 ? n : konfig.length - 1); return; }
    if (alasanPerlu && !keadaan.alasan.trim()) { setGalat(KLINIS.galat.alasanPerbaikan); return; }
    galat = null; sedangMengirim = true; memproses = true; status();
    let labBerjalan = false, resepBerjalan = false, disimpan = 0, pesanTagihan = null, bagianBerjalan = null;
    try {
      for (const r of rencana) {
        bagianBerjalan = r.bagian;
        const hs = await simpanBagian(kunjunganId, r.bagian, isiBagian(r.bagian, keadaan), disahkan[r.bagian] ? keadaan.alasan : undefined);
        if (hs.tersimpan) disimpan += 1;
        if (hs.pesan_tagihan) pesanTagihan = hs.pesan_tagihan;
        adaTersimpan = adaTersimpan || hs.tersimpan;
      }
      bagianBerjalan = null;
      if (keadaan.lab_dipilih) {
        labBerjalan = true; await buatOrderLab(kunjunganId, bentukOrderLab({ ...keadaan.order_lab, prioritas: 'rutin' })); labBerjalan = false;
        adaTersimpan = true;
        keadaan = { ...keadaan, lab_dipilih: false, order_lab: awalOrderLab() }; // order yang berhasil tidak dipesan lagi bila tahap berikutnya gagal
      }
      if (adaResepBaru) {
        resepBerjalan = true; await buatResep(kunjunganId, bentukResep(keadaan.resep)); resepBerjalan = false;
        adaTersimpan = true;
        keadaan = { ...keadaan, resep: awalResep() };
      }
      let kunjungan = (await ambilKlinis(kunjunganId)).kunjungan;
      if (pilihSelesai) {
        const perluFarmasi = (await resepKunjungan(kunjunganId)).some((r) => r.status === 'diajukan' || r.status === 'ditelaah');
        kunjungan = await selesaikanPemeriksaan(kunjunganId, perluFarmasi ? 'resep' : 'kasir');
        adaTersimpan = true;
      }
      if (!aktif) return;
      draf.hapus();
      hasil = { jumlah: disimpan, kunjungan, pesanTagihan };
      tampilkanHasil();
    } catch (e) {
      if (!aktif) return;
      const pesan = e instanceof GalatApi ? e.message : GALAT.umum;
      galat = resepBerjalan ? `Penyimpanan pemeriksaan belum lengkap pada bagian resep. ${pesan}` : labBerjalan ? `Penyimpanan pemeriksaan belum lengkap pada bagian lab. ${pesan}` : bagianBerjalan ? `${KLINIS.gagalSebagian(labelBagian[bagianBerjalan])} ${pesan}` : pesan;
      void ambilKlinis(kunjunganId).then((k) => { if (aktif) { klinis = k; paint(); } }).catch(() => undefined);
      tampilGalat = true; paint();
    } finally {
      sedangMengirim = false; memproses = false; if (aktif) status();
    }
  }

  function tampilkanHasil() {
    const isi = h(Kolom, null,
      h('p', { style: { margin: 0 } }, mode === 'skrining' ? KLINIS.hasil.pesanSkrining : 'Pemeriksaan tersimpan dan disahkan.'),
      h(Sebaris, null, h('span', { style: { color: token.warna.teksRedup } }, KLINIS.hasil.tahap), h(Lencana, { warna: TAHAP_LAYANAN.warna(hasil.kunjungan.tahap_layanan) }, TAHAP_LAYANAN.label(hasil.kunjungan.tahap_layanan))),
      hasil.pesanTagihan && h(Peringatan, { nada: 'kuning' }, hasil.pesanTagihan));
    modal.hasil({ judul: mode === 'skrining' ? KLINIS.hasil.judul : 'Pemeriksaan tersimpan', isi, aksi: [tombol(KLINIS.hasil.tutup, () => tutupAkhir(true))] });
  }

  const salin = (s, pilih) => { const { keadaan: baru, jumlah } = salinKeKeadaan(keadaan, s, pilih, new Date()); setKeadaan(baru); return jumlah; };
  const pakaiKode = (jenis, x) => {
    if (jenis === 'diagnosis') setKeadaan((k) => ({ ...k, diagnosis: tambahDiagnosis(k.diagnosis, x) }));
    else if (jenis === 'tindakan') setKeadaan((k) => ({ ...k, tindakan: tambahTindakan(k.tindakan, x, new Date()) }));
  };
  const pakaiTemplatCatatan = (t) => setKeadaan((k) => pakaiTemplat(k, t));
  const buka = (fn) => { const p = fn(); panelTerbuka.push(p); return p; };

  const aksiHeader = h('div', { className: 'pemeriksaan-aksi-header', role: 'group', 'aria-label': 'Alat pemeriksaan' },
    TombolIkonPasien({ ikon: 'riwayat', label: KLINIS.tombol.riwayat, varian: 'teks', style: { padding: 0 }, onClick: () => buka(() => bukaPanelRiwayat({ pasienId: pasien.id, nama: pasien.nama, kecualiKunjunganId: kunjunganId, onTutup() {} })) }),
    mode === 'periksa' && TombolIkonPasien({ label: KLINIS.tombol.salin, varian: 'teks', style: { padding: 0 }, ikonKustom: ikonSalin(), onClick: () => buka(() => bukaPanelSalin({ kunjunganId, pasienId: pasien.id, onSalin: salin, onTutup() {} })) }),
    mode === 'periksa' && TombolIkonPasien({ label: KLINIS.tombol.favorit, varian: 'teks', style: { padding: 0 }, ikonKustom: ikonFavorit(), onClick: () => { if (izinSaatIni()('klinis', 'input')) buka(() => bukaPanelFavorit({ k: keadaan, favorit, onFavorit(f) { favorit = f; }, onPakaiKode: pakaiKode, onPakaiTemplat: pakaiTemplatCatatan, onTutup() {} })); } }),
    TombolIkonPasien({ ikon: 'keluarga', label: KLINIS.tombol.keluarga, varian: 'teks', style: { padding: 0 }, onClick: () => buka(() => bukaPanelKeluarga({ pasienId: pasien.id, nama: pasien.nama, onTutup() {} })) }));

  const langkah = konfig.map((l, n) => ({
    id: l.id, judul: l.judul, isi: () => isiLangkah(l),
    selesai: () => { const { disahkan, rencana, galatDi } = turunan(); return bagianLangkah(l).some((b) => disahkan[b]) && bagianLangkah(l).every((b) => !rencana.some((r) => r.bagian === b) && !galatDi(b)) && dikunjungi.includes(n) && indeks !== n; },
  }));
  modal = bukaModalBertahap({
    judul: mode === 'skrining' ? KLINIS.judulSkrining : KLINIS.judul, langkah, indeksAwal: 0,
    onIndeks(n) { galat = null; pindah(n); },
    konteks: () => KonteksKlinis({ konteks, nama: pasien.nama, nomorRm: pasien.nomor_rm }),
    aksiHeader, onTutup: tutup, lindungiTutup: () => formSiap && adaPerubahan(awalForm(), keadaan),
    onLanjut(dari) {
      const bagian = bagianLangkah(konfig[dari]), g = turunan().rencana.find((r) => bagian.includes(r.bagian) && r.galat)?.galat;
      if (g) { tampilGalat = true; galat = g; paint(); return false; }
      galat = null; return true;
    },
    labelKirim: KLINIS.tombol.simpan, onKirim() { if (!memproses) void kirim(); },
  });
  status();

  hapusDrafKlinisLama();
  Promise.all([ambilKlinis(kunjunganId), ambilKonteksKlinis(kunjunganId), daftarFavorit().catch(() => [])])
    .then(([k, c, f]) => { if (!aktif) return; klinis = k; konteks = c; favorit = f; pulihkan(); paint(); })
    .catch((e) => { if (aktif) { galatMuat = e instanceof GalatApi ? e.message : KLINIS.konteks.gagal; paint(); } });
  return { tutup() { if (aktif) { aktif = false; draf.tutup(); for (const w of Object.values(cache)) w.tutup?.(); modal.tutup(); } } };
}
