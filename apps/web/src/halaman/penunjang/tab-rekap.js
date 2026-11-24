import { INTERPRETASI_HASIL, NILAI_STATUS_ORDER, PENUNJANG, STATUS_ORDER_PENUNJANG } from '@klira/shared';
import { pesanGalat } from '../../api-klien/klien.js';
import { rekapLab } from '../../api-klien/penunjang.js';
import { izinSaatIni } from '../../komponen/izin/izin-saja.js';
import { bidang, kartu, tombol, tabel, baris, sel, lencana, peringatan } from '../../komponen/ui/primitif.js';
import { token } from '../../gaya/token.js';
import { bukaAmbilSpesimen } from '../../modal/penunjang/ambil-spesimen.js';
import { bukaCetakHasilLab } from '../../modal/penunjang/cetak-hasil-lab.js';
import { bukaHasilLab } from '../../modal/penunjang/hasil-lab.js';
import { navigasiSaatIni } from '../../util/navigasi/navigasi.js';
import { formatWaktu } from '../../util/tab/penyaring-tab.js';

const UKURAN = 20;

export function pasangTabRekap(wadah) {
  const R = PENUNJANG.rekap, boleh = izinSaatIni(), { ganti } = navigasiSaatIni(), awal = { status: '', dari: '', sampai: '' };
  let draf = { ...awal }, terapan = { ...awal }, aktif = true, urut = 0, modal;
  let halaman = 1, total = 0, jumlahDimuat = 0, memuat = false, adaLagi = false;

  const el = document.createElement('div'), box = kartu({ style: { padding: '0', overflow: 'hidden' } }), toolbar = document.createElement('form'), status = document.createElement('div'), kosong = document.createElement('div'), kaki = document.createElement('div');
  Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md });
  Object.assign(toolbar.style, { display: 'flex', gap: token.jarak.md, padding: token.jarak.md, flexWrap: 'wrap', alignItems: 'flex-end' });
  Object.assign(kaki.style, { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: token.jarak.md, padding: token.jarak.md, color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil });

  const fStatus = bidang({ id: 'rekap-status', label: R.filterStatus, opsi: [{ nilai: '', label: R.semuaStatus }, ...NILAI_STATUS_ORDER.map(s => ({ nilai: s, label: STATUS_ORDER_PENUNJANG.label(s) }))], ubah(v) { draf.status = v; } });
  const dari = bidang({ id: 'rekap-dari', label: R.dari, jenis: 'date', ubah(v) { draf.dari = v; periode(); } }), sampai = bidang({ id: 'rekap-sampai', label: R.sampai, jenis: 'date', ubah(v) { draf.sampai = v; periode(); } });
  const terapkan = tombol('Terapkan'); terapkan.type = 'submit';
  function periode() { const terbalik = !!draf.dari && !!draf.sampai && draf.dari > draf.sampai; sampai.setGalat(terbalik ? 'Tanggal akhir sebelum tanggal awal.' : undefined); terapkan.disabled = terbalik; }
  toolbar.append(fStatus.el, dari.el, sampai.el, terapkan, tombol('Atur ulang', () => { draf = { ...awal }; terapan = { ...awal }; fStatus.kontrol.value = dari.kontrol.value = sampai.kontrol.value = ''; periode(); void muat(false); }, 'sekunder'));
  toolbar.addEventListener('submit', e => { e.preventDefault(); if (!terapkan.disabled) { terapan = { ...draf }; void muat(false); } });

  const table = tabel(['pasien', 'pemeriksaan', 'pemesan', 'status', 'hasil', 'waktu', 'tindakan'].map(k => ({ judul: R.kolom[k], rataKanan: k === 'tindakan' })), PENUNJANG.tab.rekap);
  Object.assign(kosong.style, { padding: token.jarak.md, color: token.warna.teksRedup });
  box.append(toolbar, status, table.el, kosong, kaki);

  const catatan = document.createElement('p'), tautan = document.createElement('a');
  Object.assign(catatan.style, { margin: '0', color: token.warna.teksRedup });
  tautan.href = '/pasien'; tautan.textContent = R.bukaDaftar;
  tautan.addEventListener('click', e => { e.preventDefault(); ganti('/pasien'); });
  catatan.append(R.catatan, ' ', tautan);
  el.append(box, catatan);
  wadah.append(el);

  function buatAksi(o) {
    const aksi = sel(); aksi.style.textAlign = 'right';
    const row = document.createElement('div'); Object.assign(row.style, { display: 'flex', gap: token.jarak.sm, justifyContent: 'flex-end' });
    const pasien = { nama: o.pasien_nama, nomor_rm: o.pasien_nomor_rm };
    const tutupModal = () => { modal = undefined; };
    const selesai = () => { modal = undefined; void muat(false); };
    if (boleh('penunjang', 'input') && o.status === 'dipesan') {
      row.append(tombol(PENUNJANG.aksi.spesimen, () => { modal?.tutup(); modal = bukaAmbilSpesimen({ kunjunganId: o.kunjungan_id, pasien, onTutup: tutupModal, onSelesai: selesai }); }, 'teks'));
    }
    if (boleh('penunjang', 'input') && (o.status === 'spesimen_diambil' || o.status === 'menunggu_hasil')) {
      row.append(tombol(PENUNJANG.aksi.hasil, () => { modal?.tutup(); modal = bukaHasilLab({ kunjunganId: o.kunjungan_id, pasien, onTutup: tutupModal, onSelesai: selesai }); }, 'teks'));
    }
    if (o.status === 'divalidasi') {
      row.append(tombol(PENUNJANG.cetak.tombol, () => { modal?.tutup(); modal = bukaCetakHasilLab({ kunjunganId: o.kunjungan_id, pasien, kunjungan: { id: o.kunjungan_id }, onTutup: tutupModal }); }, 'teks'));
    }
    if (row.childNodes.length) aksi.append(row);
    return aksi;
  }

  function buatBaris(o) {
    const pasien = sel(), nom = document.createElement('div'), rm = document.createElement('div');
    nom.textContent = o.pasien_nama; nom.style.fontWeight = token.huruf.berat.tebal;
    rm.textContent = o.pasien_nomor_rm; Object.assign(rm.style, { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil });
    pasien.append(nom, rm);
    const hasil = sel(o.hasil_singkat ?? '-');
    if (o.interpretasi) hasil.append(' ', lencana(INTERPRETASI_HASIL.label(o.interpretasi), INTERPRETASI_HASIL.warna(o.interpretasi)));
    return baris(pasien, sel(o.nama), sel(o.dibuat_oleh_nama ?? '-'), sel(lencana(STATUS_ORDER_PENUNJANG.label(o.status), STATUS_ORDER_PENUNJANG.warna(o.status))), hasil, sel(formatWaktu(o.dibuat_pada)), buatAksi(o));
  }

  function lukisKaki() {
    kaki.replaceChildren();
    kaki.hidden = !jumlahDimuat && !memuat;
    if (memuat) { kaki.append(PENUNJANG.memuat); return; }
    if (!jumlahDimuat) return;
    kaki.append(`${jumlahDimuat} / ${total}`);
    if (adaLagi) kaki.append(tombol('Muat lagi', () => { void muat(true); }, 'sekunder'));
  }

  async function muat(lanjut = false) {
    if (lanjut && (memuat || !adaLagi)) return;
    const id = lanjut ? urut : ++urut;
    const target = lanjut ? halaman + 1 : 1;
    if (!lanjut) {
      halaman = 1; total = 0; jumlahDimuat = 0; adaLagi = false;
      table.tbody.replaceChildren();
      kosong.hidden = true;
    }
    memuat = true;
    lukisKaki();
    try {
      const h = await rekapLab({ status: terapan.status || undefined, dari: terapan.dari || undefined, sampai: terapan.sampai || undefined, halaman: target, ukuran: UKURAN });
      if (!aktif || id !== urut) return;
      status.replaceChildren();
      for (const o of h.data) table.tbody.append(buatBaris(o));
      halaman = target;
      total = h.total;
      jumlahDimuat += h.data.length;
      adaLagi = h.data.length > 0 && jumlahDimuat < total;
      kosong.hidden = !!jumlahDimuat;
      kosong.textContent = jumlahDimuat ? '' : R.kosong;
    } catch (e) {
      if (aktif && id === urut) status.replaceChildren(peringatan(pesanGalat(e, R.gagalMuat)));
    } finally {
      if (aktif && id === urut) {
        memuat = false;
        lukisKaki();
      }
    }
  }

  const pengamat = typeof IntersectionObserver !== 'undefined'
    ? new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting) && adaLagi && !memuat) void muat(true);
    }, { rootMargin: '200px' })
    : null;
  pengamat?.observe(kaki);

  void muat(false);
  return { tutup() { aktif = false; urut++; pengamat?.disconnect(); modal?.tutup(); el.remove(); } };
}
