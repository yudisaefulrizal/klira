import { KEAMANAN, STATUS_BACKUP, formatUkuranByte } from '@klira/shared';
import { GalatApi } from '../../api-klien/klien.js';
import { alamatUnduhBackup, daftarRiwayatBackup, resetSistem, unggahBackup } from '../../api-klien/keamanan.js';
import { izinSaatIni } from '../../komponen/izin-saja.js';
import { bukaKonfirmasi } from '../../komponen/modal-1/modal-1.js';
import { bidang, kartu, tombol, peringatan, baris, sel, lencana, paginasi } from '../../komponen/ui/primitif.js';
import { token } from '../../gaya/token.js';
import { formatWaktu } from '../../util/penyaring-tab.js';
import { tabelTab } from './tabel-dom.js';
export function pasangTabBackup(wadah) {
  let backup = null, halaman = 1, aktif = true, versi = 0, sistemMemproses = false, galatSistem = null, konfirmasi;
  const ui = tabelTab({ id: 'backup', label: KEAMANAN.backupJudul, kolom: ['waktu', 'status', 'ukuran', 'lokasi'].map(k => ({ judul: KEAMANAN.backupKolom[k] })) }); wadah.replaceChildren(ui.el);
  Object.assign(ui.kepala.style, { flexDirection: 'column', alignItems: 'flex-start', gap: token.jarak.xs }); const judul = document.createElement('div'), ket = document.createElement('span'); judul.textContent = KEAMANAN.backupJudul; Object.assign(judul.style, { fontSize: token.huruf.ukuran.besar, fontWeight: token.huruf.berat.tebal }); ket.textContent = KEAMANAN.backupPetunjuk; ket.style.color = token.warna.teksRedup; ui.kepala.append(judul, ket);
  const pesanSistem = document.createElement('div'); pesanSistem.style.display = 'contents'; const tombolSistem = [];
  function tutupKonfirmasi() { konfirmasi?.tutup(); konfirmasi = undefined; }
  if (izinSaatIni()('akses', 'perbaikan')) {
    const card = kartu({ susun: 'md' }), label = document.createElement('div'), info = document.createElement('span'), aksi = document.createElement('div'), input = document.createElement('input'); label.textContent = KEAMANAN.sistemJudul; Object.assign(label.style, { fontSize: token.huruf.ukuran.besar, fontWeight: token.huruf.berat.tebal }); info.textContent = KEAMANAN.sistemPetunjuk; info.style.color = token.warna.teksRedup; Object.assign(aksi.style, { display: 'flex', alignItems: 'center', gap: token.jarak.sm, flexWrap: 'wrap' }); input.type = 'file'; input.accept = '.sql'; input.hidden = true;
    const link = document.createElement('a'), unduh = tombol(KEAMANAN.unduh, null, 'sekunder'); unduh.tabIndex = -1; link.href = alamatUnduhBackup; link.download = ''; link.style.textDecoration = 'none'; link.append(unduh);
    const unggah = tombol(KEAMANAN.unggah, () => input.click(), 'sekunder'), reset = tombol(KEAMANAN.reset, () => {
      tutupKonfirmasi(); let ketik = ''; const isi = document.createElement('div'), teks = document.createElement('span'); Object.assign(isi.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.sm }); teks.textContent = KEAMANAN.resetPesan;
      const f = bidang({ id: 'ketik-reset', label: 'RESET', ubah(v) { ketik = v; konfirmasi?.perbarui({ memproses: sistemMemproses || ketik !== 'RESET' }); } }); isi.append(teks, f.el);
      konfirmasi = bukaKonfirmasi({ judul: KEAMANAN.resetJudul, pesan: isi, labelYa: KEAMANAN.resetYa, memproses: true, onTidak: tutupKonfirmasi, onYa: () => void jalankanSistem(resetSistem, KEAMANAN.resetGagal) });
    });
    input.addEventListener('change', () => { const berkas = input.files?.[0]; input.value = ''; if (!berkas) return; tutupKonfirmasi(); konfirmasi = bukaKonfirmasi({ judul: KEAMANAN.pulihJudul, pesan: KEAMANAN.pulihPesan(berkas.name), labelYa: KEAMANAN.pulihYa, memproses: sistemMemproses, onTidak: tutupKonfirmasi, onYa: () => void jalankanSistem(() => unggahBackup(berkas), KEAMANAN.pulihGagal) }); });
    tombolSistem.push(unduh, unggah, reset); aksi.append(link, unggah, reset, input); card.append(label, info, pesanSistem, aksi); ui.el.prepend(card);
  }
  function sistem() { pesanSistem.replaceChildren(); if (galatSistem) pesanSistem.append(peringatan(galatSistem)); if (sistemMemproses) pesanSistem.append(peringatan(KEAMANAN.memproses, 'biru')); tombolSistem.forEach(b => { b.disabled = sistemMemproses; }); }
  async function jalankanSistem(f, gagal) { sistemMemproses = true; galatSistem = null; sistem(); konfirmasi?.perbarui({ memproses: true }); try { await f(); if (aktif) window.location.assign('/'); } catch (e) { if (aktif) { galatSistem = e instanceof GalatApi ? e.message : gagal; sistemMemproses = false; tutupKonfirmasi(); sistem(); } } }
  function tampil() {
    ui.tbody.replaceChildren(...(backup?.data.map(b => { const lokasi = sel(b.lokasi ?? KEAMANAN.tanpaLokasi); lokasi.style.overflowWrap = 'anywhere'; return baris(sel(formatWaktu(b.waktu)), sel(b.status in STATUS_BACKUP.peta ? lencana(STATUS_BACKUP.label(b.status), STATUS_BACKUP.warna(b.status)) : b.status), sel(formatUkuranByte(b.ukuran_byte)), lokasi); }) ?? [])); ui.kosongkan(backup && !backup.data.length, KEAMANAN.backupKosong); ui.nav.replaceChildren(); if (backup) { const nav = paginasi(halaman, backup.total, backup.ukuran, n => { halaman = n; void muat(); }); if (nav) ui.nav.append(nav); }
  }
  async function muat() { const saat = ++versi; try { const h = await daftarRiwayatBackup(halaman, 10); if (aktif && saat === versi) { backup = h; ui.galat(null); tampil(); } } catch (e) { if (aktif && saat === versi) ui.galat(e instanceof GalatApi ? e.message : KEAMANAN.backupGagalMuat); } }
  void muat(); return { tutup() { aktif = false; versi++; tutupKonfirmasi(); wadah.replaceChildren(); } };
}
