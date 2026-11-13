import { GALAT, PENGGUNA, STATUS_AKUN, STATUS_PENGGUNA } from '@klira/shared';
import { daftarPengguna, ubahAktifPengguna } from '../../api-klien/pengguna.js';
import { GalatApi } from '../../api-klien/klien.js';
import { token } from '../../gaya/token.js';
import { baris, sel, tombol, lencana, bidang } from '../../komponen/ui/primitif.js';
import { izinSaatIni } from '../../komponen/izin-saja.js';
import { bukaAturIzin } from '../../modal/akun-pengaturan/atur-izin.js';
import { bukaPembuatanAkun } from '../../modal/akun-pengaturan/pembuatan-akun.js';
import { penggunaSaatIni } from '../../util/sesi/konteks-pengguna.js';
import { keadaanDariQuery, queryDariKeadaan, ubahKeadaan } from '../../util/penyaring/penyaring-daftar.js';
import { tabelTab } from './tabel.js';
export function pasangTabPengguna(wadah, { search, ubahAlamat }) {
  const saya = penggunaSaatIni().pengguna, boleh = izinSaatIni(); let keadaan = keadaanDariQuery(search), hasil = null, aktif = true, versi = 0, timer, tutupModal;
  const kolom = ['nama', 'jenis', 'izin', 'peringatan', 'status', 'tindakan'].map(k => ({ judul: PENGGUNA.kolom[k], rataKanan: k === 'tindakan' })), ui = tabelTab({ id: 'pengguna', label: PENGGUNA.judulTab, kolom, catatan: PENGGUNA.catatan }); wadah.replaceChildren(ui.el);
  const judul = document.createElement('div'); judul.textContent = PENGGUNA.judulTab; Object.assign(judul.style, { fontSize: token.huruf.ukuran.besar, fontWeight: token.huruf.berat.tebal, flexGrow: '1' });
  const cari = bidang({ id: 'cari-pengguna', label: PENGGUNA.cari, jenis: 'search', nilai: keadaan.cari, ubah(v) { clearTimeout(timer); if (v.trim() !== keadaan.cari) timer = setTimeout(() => terapkan({ cari: v.trim() }), 300); } });
  const status = bidang({ id: 'status-pengguna', label: PENGGUNA.kolom.status, nilai: keadaan.status, opsi: STATUS_PENGGUNA.map(st => ({ nilai: st, label: PENGGUNA.filterStatus[st] })), ubah: v => terapkan({ status: v }) });
  ui.kepala.append(judul, cari.el, status.el); if (boleh('akses', 'input')) ui.kepala.append(tombol(PENGGUNA.tambahAkun, () => { tutupModal?.(); tutupModal = bukaPembuatanAkun({ onTutup: tutup, onSelesai() { tutup(); void muat(); } }); }));
  function tutup() { tutupModal?.(); tutupModal = undefined; }
  function terapkan(p) { ubahAlamat(queryDariKeadaan(ubahKeadaan(keadaan, p), { tab: 'pengguna' })); }
  function tampil() {
    ui.tbody.replaceChildren(...(hasil?.data.map(p => {
      const nama = document.createElement('div'), username = document.createElement('div'); nama.textContent = p.nama; nama.style.fontWeight = token.huruf.berat.tebal; username.textContent = p.username; Object.assign(username.style, { fontSize: token.huruf.ukuran.kecil, color: token.warna.teksRedup });
      const aksi = document.createElement('div'); Object.assign(aksi.style, { display: 'inline-flex', alignItems: 'stretch', gap: token.jarak.sm });
      if (boleh('akses', 'input')) aksi.append(tombol(PENGGUNA.aturIzin, () => { tutup(); tutupModal = bukaAturIzin({ pengguna: p, onTutup(berubah) { tutup(); if (berubah) void muat(); } }); }, 'teks'));
      if (p.id !== saya?.id && boleh('akses', 'perbaikan')) aksi.append(tombol(p.aktif ? PENGGUNA.nonaktifkan : PENGGUNA.aktifkan, () => void ubahAktif(p), 'teks'));
      const tindakan = sel(aksi); tindakan.style.textAlign = 'right'; const st = p.aktif ? 'aktif' : 'nonaktif';
      return baris(sel(nama, username), sel(p.jenis_akun_aktif.length ? p.jenis_akun_aktif.join(', ') : PENGGUNA.tanpaJenis), sel(p.jumlah_izin_tambahan), sel(p.jumlah_peringatan_terbuka > 0 ? lencana(PENGGUNA.peringatanTerbuka(p.jumlah_peringatan_terbuka), 'kuning') : PENGGUNA.tanpaPeringatan), sel(lencana(STATUS_AKUN.label(st), STATUS_AKUN.warna(st))), tindakan);
    }) ?? []));
    ui.kosongkan(hasil && !hasil.data.length, PENGGUNA.kosong); ui.nav.replaceChildren();
    if (hasil && hasil.total > hasil.ukuran) { const n = Math.max(1, Math.ceil(hasil.total / hasil.ukuran)), nav = document.createElement('div'), sebelumnya = tombol(PENGGUNA.sebelumnya, () => terapkan({ halaman: keadaan.halaman - 1 }), 'sekunder'), berikut = tombol(PENGGUNA.berikutnya, () => terapkan({ halaman: keadaan.halaman + 1 }), 'sekunder'), angka = document.createElement('span'); Object.assign(nav.style, { display: 'flex', alignItems: 'center', gap: token.jarak.md, padding: token.jarak.md, justifyContent: 'flex-end' }); sebelumnya.disabled = keadaan.halaman <= 1; berikut.disabled = keadaan.halaman >= n; angka.textContent = `${keadaan.halaman} / ${n}`; nav.append(sebelumnya, angka, berikut); ui.nav.append(nav); }
  }
  async function muat() { const saat = ++versi; try { const h = await daftarPengguna({ cari: keadaan.cari, status: keadaan.status, halaman: keadaan.halaman, ukuran: 20 }); if (aktif && saat === versi) { hasil = h; ui.galat(null); tampil(); } } catch (e) { if (aktif && saat === versi) ui.galat(e instanceof GalatApi ? e.message : PENGGUNA.gagalMuat); } }
  async function ubahAktif(p) { try { await ubahAktifPengguna(p.id, !p.aktif); if (!aktif) return; if (hasil) hasil = { ...hasil, data: hasil.data.map(x => x.id === p.id ? { ...x, aktif: !p.aktif } : x) }; ui.galat(null); tampil(); } catch (e) { if (aktif) ui.galat(e instanceof GalatApi ? e.message : GALAT.umum); } }
  void muat(); return { muat, perbaruiAlamat(baru) { clearTimeout(timer); const lama = JSON.stringify(keadaan); keadaan = keadaanDariQuery(baru); cari.kontrol.value = keadaan.cari; status.kontrol.value = keadaan.status; if (lama !== JSON.stringify(keadaan)) { tampil(); void muat(); } }, tutup() { aktif = false; versi++; clearTimeout(timer); tutup(); wadah.replaceChildren(); } };
}
