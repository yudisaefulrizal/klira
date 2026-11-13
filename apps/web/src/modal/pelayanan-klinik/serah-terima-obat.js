import { KASIR, STATUS_RESEP, TOMBOL } from '@klira/shared';
import { resepKunjungan, serahkanObat } from '../../api-klien/farmasi.js';
import { GalatApi } from '../../api-klien/klien.js';
import { token } from '../../gaya/token.js';
import { bukaModal1 } from '../../komponen/modal-1/modal-1.js';
import { bidang, tombol, lencana, peringatan, kartu } from '../../komponen/ui/primitif.js';
import { KotakCentang } from '../../komponen/ui/kotak-centang.js';
import { awalSerah, bentukSerah, galatSerah } from './keadaan-farmasi.js';
import { KepalaPasien } from './kepala-pasien.js';
import { TampilanResep } from './tampilan-resep.js';

export function buatSerahObat(kunjunganId, diizinkan = true, onUbah = () => {}) {
  const B = KASIR.bayar, isi = document.createElement('div'); Object.assign(isi.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md });
  let resep = null, serah = awalSerah(), kekurangan = [], galat = null, info = null, dicoba = false, memproses = false, berubah = false, aktif = true;
  const siap = () => (resep ?? []).filter(r => r.status === 'siap'), belum = () => (resep ?? []).filter(r => r.status === 'diajukan' || r.status === 'ditelaah');
  function tampil() {
    isi.replaceChildren();
    if (!resep) { isi.append(KASIR.memuat); return; }
    if (!resep.length) isi.append(B.serahKosong);
    for (const r of resep) { const box = kartu({ susun: 'xs', style: { padding: token.jarak.md } }), row = document.createElement('div'), nama = document.createElement('strong'); nama.textContent = r.nomor_resep; Object.assign(row.style, { display: 'flex', gap: token.jarak.sm, justifyContent: 'space-between', flexWrap: 'wrap' }); row.append(nama, lencana(STATUS_RESEP.label(r.status), STATUS_RESEP.warna(r.status))); box.append(row, TampilanResep({ resep: r })); isi.append(box); }
    if (belum().length) isi.append(peringatan(B.serahBelumSiap, 'biru'));
    if (kekurangan.length) { const box = peringatan(''), h = document.createElement('strong'); h.textContent = B.stokKurangJudul; box.append(h); for (const pesan of kekurangan) { const el = document.createElement('div'); el.textContent = pesan; box.append(el); } isi.append(box); }
    if (siap().length) {
      const p = document.createElement('span'); p.textContent = B.serahInfo; Object.assign(p.style, { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }); isi.append(p);
      if (kekurangan.length) {
        isi.append(KotakCentang({ id: 'serah-izinkan', label: B.izinkanStokKurang, checked: serah.izinkan, onChange(e) { serah = { ...serah, izinkan: e.target.checked }; tampil(); onUbah(); } }));
        if (serah.izinkan) { const f = bidang({ id: 'serah-alasan', label: B.alasanStok, jenis: 'textarea', nilai: serah.alasan, maxLength: 300, ubah(v) { serah = { ...serah, alasan: v }; f.setGalat(dicoba ? galatSerah(serah) : undefined); } }); f.setGalat(dicoba ? galatSerah(serah) : undefined); isi.append(f.el); }
      }
    }
    if (resep.length && !siap().length && !belum().length) isi.append(peringatan(B.serahSudah, 'biru'));
  }
  function kabari() { if (aktif) { tampil(); onUbah(); } }
  async function muat() { const hasil = await resepKunjungan(kunjunganId); if (aktif) resep = hasil; }
  async function serahkan() {
    if (memproses || !siap().length || belum().length) return;
    if (galatSerah(serah)) { dicoba = true; kabari(); return; }
    memproses = true; galat = info = null; kabari();
    try { await serahkanObat(kunjunganId, bentukSerah(serah)); if (!aktif) return; berubah = true; kekurangan = []; serah = awalSerah(); dicoba = false; info = B.serahTercatat; await muat(); }
    catch (e) { if (aktif) { if (e instanceof GalatApi && e.rincian?.length) kekurangan = e.rincian.map(r => r.pesan); galat = e instanceof GalatApi ? e.message : B.gagal; } }
    finally { memproses = false; kabari(); }
  }
  tampil();
  if (diizinkan) muat().then(kabari).catch(e => { if (aktif) { galat = e instanceof GalatApi ? e.message : B.gagal; kabari(); } });
  return { isi, serahkan, get resep() { return resep; }, get bisaSerah() { return siap().length > 0 && !belum().length; }, get selesai() { return !!resep && !siap().length && !belum().length; }, get memproses() { return memproses; }, get berubah() { return berubah; }, get galat() { return galat; }, get info() { return info; }, tutup() { aktif = false; } };
}

export function bukaSerahTerimaObat({ kunjunganId, pasien, onTutup, onSelesai }) {
  const B = KASIR.bayar;
  function tutup() { if (s.memproses) return; s.tutup(); modal.tutup(); (s.berubah ? onSelesai : onTutup)(); }
  const modal = bukaModal1({ judul: B.serahJudul, lebar: 'modalBesar', onTutup: tutup });
  modal.konteks.append(KepalaPasien({ nama: pasien.nama, nomorRm: pasien.nomor_rm }));
  const status = document.createElement('div'), fermer = tombol(TOMBOL.tutup, tutup, 'sekunder'), kirim = tombol(B.serah, () => s.serahkan());
  const s = buatSerahObat(kunjunganId, true, perbarui);
  function perbarui() { status.replaceChildren(); if (s.galat) status.append(peringatan(s.galat)); if (s.info) status.append(peringatan(s.info, 'biru')); fermer.disabled = s.memproses; kirim.hidden = !s.resep?.some(r => r.status === 'siap'); kirim.disabled = s.memproses || !s.bisaSerah; kirim.textContent = s.memproses ? B.menyerahkan : B.serah; }
  modal.isi.append(status, s.isi); modal.aksi.append(fermer, kirim); perbarui(); modal.fokus();
  return { tutup() { s.tutup(); modal.tutup(); } };
}
