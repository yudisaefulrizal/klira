import { JENIS_AKUN, STATUS_AKUN } from '@klira/shared';
import { daftarJenisAkun, riwayatJenisAkun, ubahJenisAkun } from '../../api-klien/izin.js';
import { GalatApi } from '../../api-klien/klien.js';
import { izinSaatIni } from '../../komponen/izin-saja.js';
import { bukaKonfirmasi } from '../../komponen/modal-1/modal-dom.js';
import { bukaPanelDetail } from '../../komponen/panel-detail/panel-detail.js';
import { baris, sel, tombol, lencana, peringatan } from '../../komponen/ui/native.js';
import { token } from '../../gaya/token.js';
import { barisRiwayat } from '../../modal/akun-pengaturan/keadaan-jenis-akun.js';
import { bukaModalJenisAkun } from '../../modal/akun-pengaturan/jenis-akun.js';
import { formatWaktu } from '../../util/penyaring-tab.js';
import { tabelTab } from './tabel-dom.js';
export function pasangTabJenisAkun(wadah) {
  const boleh = izinSaatIni(); let data = null, aktif = true, versi = 0, tutupModal, konfirmasi, panel, versiRiwayat = 0;
  const ui = tabelTab({ id: 'jenis-akun', label: JENIS_AKUN.judulTab, kolom: ['nama', 'syarat', 'izin', 'aktif', 'pemakai', 'tindakan'].map(k => ({ judul: JENIS_AKUN.kolom[k], rataKanan: k === 'tindakan' })), catatan: JENIS_AKUN.catatan }); ui.kepala.style.alignItems = 'center'; wadah.replaceChildren(ui.el);
  const judul = document.createElement('div'); judul.textContent = JENIS_AKUN.judulTab; Object.assign(judul.style, { fontSize: token.huruf.ukuran.besar, fontWeight: token.huruf.berat.tebal, flexGrow: '1' }); ui.kepala.append(judul); if (boleh('akses', 'input')) ui.kepala.append(tombol(JENIS_AKUN.buat, () => buka()));
  function tutup() { tutupModal?.(); tutupModal = undefined; }
  function buka(jenis) { tutup(); tutupModal = bukaModalJenisAkun({ jenis, onTutup: tutup, onSelesai() { tutup(); void muat(); } }); }
  function tampil() {
    ui.tbody.replaceChildren(...(data?.map(j => {
      const nama = sel(j.nama); nama.style.fontWeight = token.huruf.berat.tebal; const aksi = document.createElement('div'); Object.assign(aksi.style, { display: 'inline-flex', alignItems: 'stretch', gap: token.jarak.sm });
      if (boleh('akses', 'perbaikan')) aksi.append(tombol(JENIS_AKUN.ubah, () => buka(j), 'teks'), tombol(j.aktif ? JENIS_AKUN.nonaktifkan : JENIS_AKUN.aktifkan, () => status(j), 'teks')); aksi.append(tombol(JENIS_AKUN.riwayat, () => void riwayat(j), 'teks'));
      const tindakan = sel(aksi); tindakan.style.textAlign = 'right'; const st = j.aktif ? 'aktif' : 'nonaktif'; return baris(nama, sel(j.syarat_profesi || JENIS_AKUN.tanpaSyarat), sel(j.izin.length), sel(lencana(STATUS_AKUN.label(st), STATUS_AKUN.warna(st))), sel(j.jumlah_pemakai ?? 0), tindakan);
    }) ?? [])); ui.kosongkan(data && !data.length, JENIS_AKUN.kosong);
  }
  async function muat() { const saat = ++versi; try { const rows = await daftarJenisAkun(); if (aktif && saat === versi) { data = rows; ui.galat(null); tampil(); } } catch (e) { if (aktif && saat === versi) ui.galat(e instanceof GalatApi ? e.message : JENIS_AKUN.gagalMuat); } }
  function status(j) {
    konfirmasi?.tutup(); konfirmasi = bukaKonfirmasi({ judul: JENIS_AKUN.statusJudul(j.nama, !j.aktif), pesan: j.aktif ? JENIS_AKUN.statusPesanNonaktif : JENIS_AKUN.statusPesanAktif, labelYa: j.aktif ? JENIS_AKUN.nonaktifkan : JENIS_AKUN.aktifkan, alasan: { label: JENIS_AKUN.alasan, wajib: true }, onTidak() { konfirmasi.tutup(); konfirmasi = undefined; }, onYa: alasan => void ubahStatus(j, alasan) });
  }
  async function ubahStatus(j, alasan) { konfirmasi?.perbarui({ memproses: true }); try { await ubahJenisAkun(j.id, { aktif: !j.aktif, alasan_perubahan: alasan }); if (!aktif) return; konfirmasi?.tutup(); konfirmasi = undefined; await muat(); } catch (e) { if (aktif) { konfirmasi?.tutup(); konfirmasi = undefined; ui.galat(e instanceof GalatApi ? e.message : JENIS_AKUN.gagalSimpan); } } }
  async function riwayat(j) {
    const saat = ++versiRiwayat; panel?.tutup(); const close = () => { versiRiwayat++; panel?.tutup(); panel = undefined; }; panel = bukaPanelDetail({ judul: JENIS_AKUN.riwayatJudul(j.nama), onTutup: close, bagian: [] });
    try {
      const rows = await riwayatJenisAkun(j.id); if (!aktif || saat !== versiRiwayat) return;
      const isi = rows.length ? undefined : document.createElement('span'); if (isi) { isi.textContent = JENIS_AKUN.riwayatKosong; isi.style.color = token.warna.teksRedup; }
      panel.perbarui(rows.map(r => { const b = barisRiwayat(r); return { judul: formatWaktu(r.dibuat_pada), baris: [{ label: JENIS_AKUN.riwayatBagian.perubahan, nilai: b.perubahan }, { label: JENIS_AKUN.riwayatBagian.alasan, nilai: b.alasan }, { label: JENIS_AKUN.riwayatBagian.oleh, nilai: b.oleh }] }; }), isi);
    } catch { if (aktif && saat === versiRiwayat) panel.isi.append(peringatan(JENIS_AKUN.riwayatGagal)); }
  }
  void muat(); return { muat, tutup() { aktif = false; versi++; versiRiwayat++; tutup(); konfirmasi?.tutup(); panel?.tutup(); wadah.replaceChildren(); } };
}
