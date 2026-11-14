import { KASIR, STATUS_HASIL_LAB } from '@klira/shared';
import { hasilBelumDiserahkan } from '../../api-klien/kasir.js';
import { GalatApi } from '../../api-klien/klien.js';
import { izinSaatIni } from '../../komponen/izin/izin-saja.js';
import { kartu, tombol, tabel, baris, sel, lencana, peringatan } from '../../komponen/ui/primitif.js';
import { token } from '../../gaya/token.js';
import { bukaSerahHasil } from '../../modal/kasir-klaim/serah-hasil.js';
import { formatWaktu } from '../../util/tab/penyaring-tab.js';

/** Hasil lab kunjungan penunjang saja yang belum diserahkan (lintas tanggal), dengan tombol Serahkan hasil bila hasil sudah divalidasi. */
export function TabHasil() {
  const S = KASIR.serahHasil, boleh = izinSaatIni(), el = document.createElement('div'), status = document.createElement('div'), isi = document.createElement('div');
  let aktif = true, versi = 0, modal;
  Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md });
  const judul = document.createElement('h2'); judul.textContent = S.daftarJudul; judul.style.margin = '0'; el.append(judul, status, isi);
  async function muat() {
    const saat = ++versi;
    try {
      const daftar = await hasilBelumDiserahkan();
      if (!aktif || saat !== versi) return;
      status.replaceChildren(); isi.replaceChildren();
      if (!daftar.length) { const kosong = document.createElement('p'); kosong.textContent = S.daftarKosong; kosong.style.color = token.warna.teksRedup; isi.append(kosong); return; }
      const box = kartu({ style: { padding: '0', overflow: 'hidden' } });
      const tbl = tabel(['Pasien', 'Nomor RM', 'Tanggal daftar', 'Perujuk', 'Hasil', 'Tindakan'].map((j) => ({ judul: j, rataKanan: j === 'Tindakan' })), S.daftarJudul);
      for (const r of daftar) {
        const hasil = sel(); hasil.append(lencana(STATUS_HASIL_LAB.label(r.status), STATUS_HASIL_LAB.warna(r.status)), ` ${r.divalidasi}/${r.total}`);
        const aksi = sel(); aksi.style.textAlign = 'right';
        if (r.status === 'belum_diserahkan' && boleh('kasir', 'input')) aksi.append(tombol(S.serahkan, () => { modal = bukaSerahHasil({ kunjunganId: r.kunjungan_id, pasienNama: r.pasien_nama, onTutup() { modal = undefined; }, onSelesai() { modal = undefined; void muat(); } }); }, 'sekunder'));
        tbl.tbody.append(baris(sel(r.pasien_nama), sel(r.pasien_nomor_rm), sel(formatWaktu(r.mulai)), sel(r.perujuk ?? '-'), hasil, aksi));
      }
      box.append(tbl.el); isi.append(box);
    } catch (e) { if (aktif && saat === versi) status.replaceChildren(peringatan(e instanceof GalatApi ? e.message : KASIR.rekap.gagalMuat)); }
  }
  void muat();
  el.tutup = () => { aktif = false; versi++; modal?.tutup(); };
  return el;
}
