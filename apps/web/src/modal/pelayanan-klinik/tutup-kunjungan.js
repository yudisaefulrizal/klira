import { KASIR, TOMBOL } from '@klira/shared';
import { kasirKunjungan, tutupKunjungan } from '../../api-klien/kasir.js';
import { GalatApi } from '../../api-klien/klien.js';
import { token } from '../../gaya/token.js';
import { bukaModal1 } from '../../komponen/modal-1/modal-dom.js';
import { bidang, tombol, lencana, peringatan } from '../../komponen/ui/native.js';
import { bisaTutup, daftarSyarat } from './keadaan-kasir.js';
import { KepalaPasien } from './kepala-pasien.js';
import { LengkapiHarga } from './lengkapi-harga.js';
import { rupiah } from './keadaan-order-lab.js';

export function bukaTutupKunjungan({ kunjunganId, onTutup, onSelesai }) {
  const T = KASIR.tutup, LABEL = { tahap: KASIR.bayar.syarat.tahap, tagihan: KASIR.bayar.syarat.tagihan, resep: KASIR.bayar.syarat.resep, lunas: KASIR.bayar.syarat.lunas };
  let g, alasan = '', proses = false, selesai = false, aktif = true, lengkapi;
  function tutup() { aktif = false; lengkapi?.tutup(); modal.tutup(); (selesai ? onSelesai : onTutup)(); }
  const modal = bukaModal1({ judul: T.judul, onTutup: tutup, lindungiTutup: () => !selesai && alasan.trim().length > 0 });
  const status = document.createElement('div'), isi = document.createElement('div'); Object.assign(isi.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md });
  const simpan = tombol(T.simpan, kirim); simpan.disabled = true; modal.aksi.append(tombol(TOMBOL.batal, modal.mintaTutup, 'sekunder'), simpan); modal.isi.append(status, isi);
  function tampil() {
    lengkapi?.tutup(); lengkapi = undefined; isi.replaceChildren(); simpan.disabled = !g || proses || !bisaTutup(g, alasan);
    if (!g) { isi.append(KASIR.memuat); return; }
    modal.konteks.replaceChildren(KepalaPasien({ nama: g.kunjungan.pasien_nama, nomorRm: g.kunjungan.pasien_nomor_rm }));
    const h = document.createElement('strong'); h.textContent = T.syaratJudul; isi.append(h);
    for (const s of daftarSyarat(g)) { const row = document.createElement('div'), label = document.createElement('span'); Object.assign(row.style, { display: 'flex', gap: token.jarak.sm, flexWrap: 'wrap' }); label.style.flexGrow = '1'; label.textContent = LABEL[s.kunci]; row.append(label, lencana(s.ok ? T.ok : T.belum, s.ok ? 'hijau' : s.wajib ? 'merah' : 'kuning')); isi.append(row); }
    if (!g.syarat.tagihan_lengkap) { lengkapi = LengkapiHarga({ kunjunganId, gambaran: g, onUbah(nouveau) { if (aktif) { g = nouveau; tampil(); } } }); isi.append(lengkapi); }
    if (!g.syarat.lunas && g.tagihan.sisa > 0) {
      if (g.syarat.ditanggung_jkn) isi.append(peringatan(`${KASIR.jkn.ditanggung}. ${KASIR.jkn.petunjukTutup}`, 'biru'));
      else { isi.append(peringatan(`${T.alasanPetunjuk} Sisa tagihan ${rupiah(g.tagihan.sisa)}.`)); const f = bidang({ id: 'tutup-alasan', label: T.alasan, jenis: 'textarea', nilai: alasan, maxLength: 300, ubah(v) { alasan = v; simpan.disabled = proses || !bisaTutup(g, alasan); } }); isi.append(f.el); }
    }
    if (!daftarSyarat(g).every(s => s.ok || !s.wajib)) { const el = document.createElement('span'); el.textContent = T.kembaliKasir; el.style.color = token.warna.teksRedup; isi.append(el); }
  }
  async function kirim() {
    if (!g || proses || !bisaTutup(g, alasan)) return; proses = true; simpan.disabled = true; simpan.textContent = T.menutup; status.replaceChildren();
    try {
      const hasil = await tutupKunjungan(kunjunganId, g.syarat.lunas || (g.syarat.ditanggung_jkn && !alasan.trim()) ? {} : { alasan });
      if (!aktif) return; g = hasil; selesai = true; lengkapi?.tutup(); modal.isi.replaceChildren(peringatan(`${T.berhasil} ${T.berhasilPesan}`, 'biru')); modal.aksi.replaceChildren(tombol(TOMBOL.tutup, tutup)); modal.setLebar('modalKecil');
    } catch (e) { if (aktif) status.replaceChildren(peringatan(e instanceof GalatApi ? e.message : KASIR.bayar.gagal)); }
    finally { proses = false; simpan.textContent = T.simpan; simpan.disabled = !g || !bisaTutup(g, alasan); }
  }
  tampil(); modal.fokus(); kasirKunjungan(kunjunganId).then(h => { if (aktif) { g = h; tampil(); } }).catch(e => { if (aktif) { isi.replaceChildren(); status.replaceChildren(peringatan(e instanceof GalatApi ? e.message : KASIR.bayar.gagal)); } });
  return { tutup() { aktif = false; lengkapi?.tutup(); modal.tutup(); } };
}
