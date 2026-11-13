import { bukaCatatHak } from '../../modal/pelindungan-data/catat-hak.js';
import { bukaProsesHak } from '../../modal/pelindungan-data/proses-hak.js';
import { bukaInsidenPdp } from '../../modal/pelindungan-data/insiden-pdp.js';
import { bukaPemusnahanPdp } from '../../modal/pelindungan-data/pemusnahan-pdp.js';
import { bukaProsesorPdp } from '../../modal/pelindungan-data/prosesor-pdp.js';
import { bukaDpiaPdp } from '../../modal/pelindungan-data/dpia-pdp.js';
import { bukaRopaPdp } from '../../modal/pelindungan-data/ropa-pdp.js';
import { bukaTarikPersetujuan } from '../../modal/pelindungan-data/tarik-persetujuan.js';
import { bukaVersiPemberitahuan } from '../../modal/pelindungan-data/versi-pemberitahuan.js';
import { PDP } from '@klira/shared';
import { daftarRopa, daftarDpia, daftarInsiden, daftarProsesor, daftarPemusnahan, ambilKebijakan, daftarPersetujuanPdp, daftarPemberitahuan, daftarHak } from '../../api-klien/pdp.js';
import { izinUntuk } from '../../util/sesi/izin-pengguna.js';
import { formatWaktu } from '../../util/tab/penyaring-tab.js';
import { token } from '../../gaya/token.js';
import { tombol, sel, baris, lencana, kartu, tabel, bidang } from '../../komponen/ui/primitif.js';
import { pasangDaftarPdp } from './tabel-daftar.js';
const STATUS = { diterima: 'Diterima', disetujui: 'Disetujui', ditolak: 'Ditolak', dilaksanakan: 'Dilaksanakan', selesai: 'Selesai' };
const WARNA = { diterima: 'kuning', disetujui: 'biru', ditolak: 'merah', dilaksanakan: 'ungu', selesai: 'hijau' };
function kecil(teks) { const el = document.createElement('div'); el.textContent = teks; Object.assign(el.style, { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }); return el; }
function pasien(p) { const nama = document.createElement('div'); nama.textContent = p.pasien_nama; nama.style.fontWeight = token.huruf.berat.tebal; return sel(nama, kecil(p.pasien_nomor_rm)); }
function kanan(...nodes) { const el = sel(...nodes); el.style.textAlign = 'right'; return el; }
function kolom(peta, daftar) { return daftar.map(k => ({ judul: peta[k], ...(k === 'tindakan' ? { rataKanan: true } : {}) })); }

/** Tujuh tab PDP: data/izin/aksi dipertahankan; modal yang belum dimigrasikan dibuka pemanggil. */
export function pasangTabPdp(wadah, jenis, pengguna, bukaModal) {
  const boleh = izinUntuk(pengguna), aksiAtas = [], sebelum = document.createElement('div'), isi = document.createElement('div');
  sebelum.style.display = isi.style.display = 'contents'; wadah.replaceChildren(sebelum, isi);
  let aktif = true, permintaanTambahan = 0, berlaku = null, tutupModal, saringan = { status: '', cari: '' }, kepala, saatHasil;
  const buka = (tipe, nilai = null) => {
    if (!['tarik', 'pemberitahuan', 'ropa', 'dpia', 'prosesor', 'insiden', 'retensi', 'catat-hak', 'hak'].includes(tipe)) { bukaModal({ jenis: tipe, nilai }); return; }
    tutupModal?.();
    const onTutup = () => { tutupModal?.(); tutupModal = undefined; };
    const onSelesai = () => { onTutup(); void daftar.muat(); void tambahan(); };
    tutupModal = tipe === 'insiden' ? bukaInsidenPdp({ insiden: nilai, onTutup, onSelesai }) : tipe === 'retensi' ? bukaPemusnahanPdp({ musnah: nilai, onTutup, onSelesai }) : tipe === 'catat-hak' ? bukaCatatHak({ onTutup, onSelesai }) : tipe === 'hak' ? bukaProsesHak({ hak: nilai, onTutup, onSelesai }) : tipe === 'prosesor' ? bukaProsesorPdp({ prosesor: nilai, onTutup, onSelesai }) : tipe === 'dpia' ? bukaDpiaPdp({ dpia: nilai, onTutup, onSelesai }) : tipe === 'ropa' ? bukaRopaPdp({ ropa: nilai, onTutup, onSelesai }) : tipe === 'tarik' ? bukaTarikPersetujuan({ persetujuan: nilai, onTutup, onSelesai }) : bukaVersiPemberitahuan({ berlaku: nilai, onTutup, onSelesai });
  };
  const ubah = (tipe, nilai, label = PDP.ubah) => boleh('pdp', 'perbaikan') ? tombol(label, () => buka(tipe, nilai), 'teks') : null;
  const tambah = (label, tipe = jenis) => { if (boleh('pdp', 'input')) aksiAtas.push(tombol(label, () => buka(tipe))); };
  let config;
  if (jenis === 'ropa') {
    const R = PDP.ropa, ekspor = document.createElement('a'); ekspor.href = '/api/pdp/ropa?format=csv'; ekspor.download = ''; ekspor.textContent = PDP.ekspor; aksiAtas.push(ekspor); tambah(R.tambah);
    config = { label: PDP.tab.ropa, kolom: kolom(R.kolom, ['kegiatan', 'dasar', 'jenis', 'retensi', 'diperbarui', 'tindakan']), ambil: daftarRopa, kosong: R.kosong,
      baris: r => baris(sel(r.nama_kegiatan), sel(R.dasarLabel[r.dasar]), sel(r.jenis_data), sel(r.masa_retensi), sel(formatWaktu(r.diperbarui_pada)), kanan(ubah('ropa', r))) };
  } else if (jenis === 'dpia') {
    const D = PDP.dpia; tambah(D.tambah);
    config = { label: PDP.tab.dpia, kolom: kolom(D.kolom, ['pemrosesan', 'tinjau', 'ditinjau', 'tindakan']), ambil: daftarDpia, kosong: D.kosong,
      baris: d => { const ropa = d.ropa_nama ? document.createElement('div') : null; if (ropa) ropa.textContent = d.ropa_nama;
        return baris(sel(d.pemrosesan, ropa), sel(d.tinjau_ulang_pada, ' ', d.jatuh_tempo ? lencana(D.jatuhTempo, 'merah') : null), sel(d.ditinjau_pada ? formatWaktu(d.ditinjau_pada) : '-'), kanan(ubah('dpia', d))); } };
  } else if (jenis === 'insiden') {
    const I = PDP.insiden; tambah(I.catat);
    config = { label: PDP.tab.insiden, kolom: kolom(I.kolom, ['waktu', 'jenis', 'data', 'terdampak', 'notifikasi', 'tindakan']), ambil: daftarInsiden, kosong: I.kosong,
      baris: i => baris(sel(formatWaktu(i.waktu_diketahui)), sel(i.siber ? I.jenisSiber : I.jenisLain), sel(i.data_terungkap), sel(I.terdampak(i.jumlah_terdampak)), sel(i.sisa_jam === null ? lencana(formatWaktu(i.notifikasi_lembaga_pada ?? i.notifikasi_pasien_pada ?? i.batas_notifikasi), 'hijau') : lencana(PDP.batas.sisa(i.sisa_jam), i.terlambat ? 'merah' : 'kuning')), kanan(ubah('insiden', i, I.ubah))) };
  } else if (jenis === 'prosesor') {
    const P = PDP.prosesor; tambah(P.tambah);
    config = { label: PDP.tab.prosesor, kolom: kolom(P.kolom, ['nama', 'layanan', 'lokasi', 'perjanjian', 'sla', 'status', 'tindakan']), ambil: daftarProsesor, kosong: P.kosong,
      baris: p => baris(sel(p.nama), sel(p.layanan), sel(p.lokasi_data), sel(p.nomor_perjanjian ?? '-', ' ', p.butir_kurang.length ? lencana(P.butirKurang(p.butir_kurang.length), 'kuning') : null), sel(p.sla_lapor_jam ? `${p.sla_lapor_jam} jam` : '-'), sel(lencana(p.aktif ? P.aktifLabel : P.nonaktifLabel, p.aktif ? 'hijau' : 'abu')), kanan(ubah('prosesor', p))) };
  } else if (jenis === 'retensi') {
    const M = PDP.retensi; tambah(M.rencana);
    config = { label: M.pemusnahan, kolom: kolom(M.kolom, ['cakupan', 'jadwal', 'status', 'tindakan']), ambil: daftarPemusnahan, kosong: M.kosong, catatan: M.petunjuk,
      baris: p => baris(sel(p.cakupan), sel(p.jadwal, ' ', p.terlambat ? lencana(PDP.batas.terlambat, 'merah') : null), sel(lencana(M.status[p.status], M.warna[p.status])), kanan(tombol(p.tahap_berikut && boleh('pdp', 'perbaikan') ? M.proses : PDP.rincian, () => buka('retensi', boleh('pdp', 'perbaikan') ? p : { ...p, tahap_berikut: null }), 'teks'))) };
  } else if (jenis === 'persetujuan') {
    const T = PDP.tarik;
    config = { label: T.daftar, kolom: kolom(T.kolom, ['pasien', 'jenis', 'tujuan', 'waktu', 'status', 'tindakan']), ambil: h => daftarPersetujuanPdp({ halaman: h }), kosong: T.kosong,
      baris: s => baris(pasien(s), sel(`${s.jenis} v${s.versi_teks}`), sel(s.tujuan), sel(formatWaktu(s.waktu)), sel(lencana(s.status === 'ditarik' ? T.ditarik : T.diberikan, s.status === 'ditarik' ? 'merah' : 'hijau'), s.penarikan ? kecil(T.batasHenti(formatWaktu(s.penarikan.batas_henti))) : null), kanan(s.status === 'diberikan' ? ubah('tarik', s, T.tombol) : null)) };
  } else if (jenis === 'hak') {
    const H = PDP.hak; kepala = document.createElement('form'); Object.assign(kepala.style, { display: 'flex', alignItems: 'flex-end', gap: token.jarak.md, padding: token.jarak.md, flexWrap: 'wrap' });
    const cari = bidang({ id: 'hak-cari', label: H.cari, jenis: 'search', autoComplete: 'off' });
    const status = bidang({ id: 'hak-status', label: PDP.filterStatus, opsi: [{ nilai: '', label: PDP.semuaStatus }, ...Object.entries(STATUS).map(([nilai, label]) => ({ nilai, label }))] });
    const terapkan = tombol(PDP.terapkan); terapkan.type = 'submit'; const hitungan = kecil('');
    kepala.append(cari.el, status.el, terapkan, tombol(PDP.aturUlang, () => { cari.kontrol.value = status.kontrol.value = ''; saringan = { status: '', cari: '' }; void daftar.awal(); }, 'sekunder'), hitungan);
    if (boleh('pdp', 'input')) kepala.append(tombol(H.catat, () => buka('catat-hak')));
    kepala.addEventListener('submit', e => { e.preventDefault(); saringan = { status: status.kontrol.value, cari: cari.kontrol.value }; void daftar.awal(); });
    saatHasil = h => { hitungan.textContent = `${H.aktif(h.aktif)} · ${H.terlambat(h.terlambat)}`; };
    config = { label: PDP.tab.hak, kolom: kolom(H.kolom, ['pasien', 'hak', 'pemohon', 'batas', 'status', 'tindakan']), ambil: halaman => daftarHak({ ...saringan, status: saringan.status || undefined, halaman }), kosong: H.kosong,
      baris: k => { const batas = k.sisa_jam !== null ? kecil(PDP.batas.sisa(k.sisa_jam)) : null; if (batas && k.terlambat) batas.style.color = token.warna.status.merah.teks;
        return baris(pasien(k), sel(H.hakLabel[k.jenis]), sel(k.pemohon_nama, kecil(`${H.hubunganLabel[k.pemohon_hubungan]} · ${H.saluranLabel[k.saluran]}`)), sel(formatWaktu(k.batas_waktu), batas), sel(lencana(STATUS[k.status], WARNA[k.status])), kanan(tombol(k.tahap_berikut && boleh('pdp', 'perbaikan') ? H.proses : PDP.rincian, () => buka('hak', boleh('pdp', 'perbaikan') ? k : { ...k, tahap_berikut: null }), 'teks'))); } };
  } else throw new Error('Tab PDP tidak dikenal.');
  const daftar = pasangDaftarPdp(isi, { ...config, aksiAtas: aksiAtas.length ? aksiAtas : null, kepala, saatHasil });
  async function tambahan() {
    const versi = ++permintaanTambahan;
    if (jenis === 'retensi') {
      const M = PDP.retensi, card = kartu({ style: { padding: '0', overflow: 'hidden' } }), table = tabel(kolom(M.kolomKebijakan, ['jenis', 'periode', 'dasar', 'metode']), M.kebijakan); card.append(table.el); sebelum.replaceChildren(card);
      try { const kebijakan = await ambilKebijakan(); if (aktif && versi === permintaanTambahan) table.tbody.replaceChildren(...kebijakan.map(k => baris(sel(k.jenis_data), sel(M.tahun(k.periode_tahun)), sel(k.dasar_hukum), sel(k.metode_musnah)))); } catch { /* Tabel kosong mengikuti tampilan sebelumnya saat API gagal. */ }
    } else if (jenis === 'persetujuan') {
      const P = PDP.pemberitahuan;
      function pemberitahuan(teks) {
        const card = kartu({ susun: 'sm' }), kepala = document.createElement('div'), judul = document.createElement('strong');
        Object.assign(kepala.style, { display: 'flex', alignItems: 'center', gap: token.jarak.md, flexWrap: 'wrap' }); judul.textContent = P.daftar; Object.assign(judul.style, { flexGrow: '1', fontSize: token.huruf.ukuran.besar }); kepala.append(judul); if (boleh('pdp', 'input')) kepala.append(tombol(P.tombol, () => buka('pemberitahuan', berlaku))); card.append(kepala);
        if (!teks.length) card.append(kecil(P.kosong));
        for (const t of teks) {
          const row = document.createElement('div'), top = document.createElement('div'), nama = document.createElement('strong');
          Object.assign(row.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.xs }); Object.assign(top.style, { display: 'flex', alignItems: 'center', gap: token.jarak.sm, flexWrap: 'wrap' }); nama.textContent = t.judul;
          const waktu = document.createElement('span'); waktu.textContent = formatWaktu(t.dibuat_pada); Object.assign(waktu.style, { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil });
          top.append(nama, lencana(`${P.versi(t.versi)} · ${t.aktif ? P.aktif : P.tidakAktif}`, t.aktif ? 'hijau' : 'abu'), waktu);
          const tujuan = document.createElement('span'); tujuan.textContent = t.tujuan; Object.assign(tujuan.style, { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }); row.append(top, tujuan); card.append(row);
        }
        sebelum.replaceChildren(card);
      }
      if (!sebelum.childNodes.length) pemberitahuan([]);
      try { const teks = await daftarPemberitahuan(); if (aktif && versi === permintaanTambahan) { berlaku = teks.find(t => t.aktif) ?? null; pemberitahuan(teks); } } catch { /* Pertahankan informasi terakhir. */ }
    }
  }
  void tambahan();
  return { muat() { void daftar.muat(); if (jenis === 'persetujuan') void tambahan(); }, tutup() { aktif = false; permintaanTambahan++; tutupModal?.(); daftar.tutup(); wadah.replaceChildren(); } };
}
