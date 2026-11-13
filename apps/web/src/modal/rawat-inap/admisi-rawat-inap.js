import { CARA_PEMBAYARAN, INDIKATOR_KELAS, KELAS_RAWAT, KUNJUNGAN, RAWAT_INAP, TOMBOL } from '@klira/shared';
import { admisiRawatInap, ambilAsalAdmisi, ambilOpsiRawatInap } from '../../api-klien/rawat-inap.js';
import { GalatApi } from '../../api-klien/klien.js';
import { token } from '../../gaya/token.js';
import { bukaModalBertahap } from '../../komponen/modal-bertahap/modal-bertahap.js';
import { PemilihPasien } from '../../komponen/pemilih-pasien.js';
import { bidang, tombol, peringatan } from '../../komponen/ui/primitif.js';
import { KotakCentang } from '../../komponen/ui/kotak-centang.js';
import { DaftarRingkasan } from '../../komponen/ui/susunan.js';
import { adaPerubahan } from '../../util/draf/draf.js';
import { awalAdmisi, bentukAdmisi, galatAdmisi, isiSpriAsal, langkahBermasalahAdmisi } from './keadaan-rawat-inap.js';
import { rupiahAtau } from '../penunjang/keadaan-order-lab.js';
import { KeteranganAsuransi } from '../pasien/keterangan-asuransi.js';

export function bukaAdmisiRawatInap({ onTutup, onSelesai }) {
  const A = RAWAT_INAP.admisi, awal = awalAdmisi();
  let k = { ...awal }, opsi = null, asal = null, indeks = 0, dicoba = false, galat = null, proses = false, hasil = false, aktif = true, versiAsal = 0, modal, enfants = [];
  const controls = new Map();
  function bersihAnak() { for (const el of enfants) el.tutup?.(); enfants = []; }
  function tutup() { aktif = false; versiAsal++; bersihAnak(); modal.tutup(); (hasil ? onSelesai : onTutup)(); }
  function erreurs() { const g = galatAdmisi(k); if (asal?.rawat_inap_id) g.pasien_id = A.sudahInap; else if (asal?.ada_pembayaran) g.pasien_id = A.adaPembayaran; return g; }
  function caraBayar() { return asal?.asal?.cara_pembayaran ?? k.cara_pembayaran; }
  function perbarui() { const g = erreurs(); for (const [nama, f] of controls) f.setGalat(dicoba ? g[nama] : undefined); modal?.perbarui({ galat: galat ?? '', nonaktif: proses || !opsi, labelKirim: proses ? A.menyimpan : A.simpan }); }
  function repeindre() { if (modal && aktif && !hasil) { modal.ke(indeks, { fokus: false, beritahu: false }); perbarui(); } }
  function petit(teks) { const el = document.createElement('small'); el.textContent = teks; el.style.color = token.warna.teksRedup; return el; }
  function champ(el, nama, label, choix, jenis = 'text', maxLength, redessiner = false) { const f = bidang({ id: `adm-${nama}`, label, opsi: choix, jenis, maxLength, nilai: k[nama], autoComplete: 'off', ubah(v) { k = { ...k, [nama]: v }; if (redessiner) repeindre(); else perbarui(); } }); controls.set(nama, f); f.setGalat(dicoba ? erreurs()[nama] : undefined); el.append(f.el); }
  async function pasienDipilih(id) { const saat = ++versiAsal; k = { ...k, pasien_id: id }; asal = null; repeindre(); if (id === null) return; try { const a = await ambilAsalAdmisi(id); if (!aktif || saat !== versiAsal) return; asal = a; k = isiSpriAsal(k, a.asal?.spri ?? null); repeindre(); } catch { if (aktif && saat === versiAsal) { asal = null; repeindre(); } } }
  function isi(n) {
    bersihAnak(); controls.clear(); const el = document.createElement('div'); Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md });
    if (n === 0) {
      const pemilih = PemilihPasien({ id: 'adm-pasien', pasienId: k.pasien_id, onPilih: pasienDipilih, galat: dicoba ? erreurs().pasien_id : undefined }); enfants.push(pemilih); el.append(pemilih);
      if (k.pasien_id !== null && !asal) el.append(petit(A.cekAsal)); if (asal?.asal) el.append(peringatan(A.asalInfo(asal.asal.poli_nama), 'biru')); if (asal && !asal.asal && !asal.rawat_inap_id) el.append(petit(A.tanpaAsal));
      if (!asal?.asal && k.pasien_id !== null) champ(el, 'cara_pembayaran', KUNJUNGAN.caraBayar, CARA_PEMBAYARAN.opsi, 'text', undefined, true);
      if (k.pasien_id !== null && caraBayar() === 'asuransi') { const ket = KeteranganAsuransi({ pasienId: k.pasien_id }); enfants.push(ket); el.append(ket); }
    }
    if (n === 1) { champ(el, 'bed_id', A.bed, [{ nilai: '', label: A.bedMenunggu }, ...(opsi?.bed_kosong ?? []).map(b => ({ nilai: String(b.id), label: `${b.ruang_nama ? `${b.ruang_nama} · ` : ''}${b.nama}` }))]); champ(el, 'kelas', A.kelas, KELAS_RAWAT.nilai.map(v => ({ nilai: v, label: KELAS_RAWAT.label(v) }))); champ(el, 'indikator', A.indikator, INDIKATOR_KELAS.nilai.map(v => ({ nilai: v, label: INDIKATOR_KELAS.label(v) }))); champ(el, 'tarif_id', A.tarif, [{ nilai: '', label: A.tarifTanpa }, ...(opsi?.tarif_kamar ?? []).map(t => ({ nilai: String(t.id), label: `${t.nama} (${rupiahAtau(t.harga_umum)})` }))]); }
    if (n === 2) { champ(el, 'dpjp_id', A.dpjpUtama, [{ nilai: '', label: A.pilihDpjp }, ...(opsi?.dpjp ?? []).map(d => ({ nilai: String(d.id), label: `${d.nama}${d.profesi ? ` (${d.profesi})` : ''}` }))], 'text', undefined, true); const group = document.createElement('div'), h = document.createElement('strong'); group.setAttribute('role', 'group'); group.setAttribute('aria-label', A.dpjpBersama); Object.assign(group.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.xs }); h.textContent = A.dpjpBersama; group.append(h); for (const d of (opsi?.dpjp ?? []).filter(d => String(d.id) !== k.dpjp_id)) group.append(KotakCentang({ id: `adm-bersama-${d.id}`, label: `${d.nama}${d.profesi ? ` (${d.profesi})` : ''}`, checked: k.dpjp_bersama.includes(String(d.id)), onChange(e) { k = { ...k, dpjp_bersama: e.target.checked ? [...k.dpjp_bersama, String(d.id)] : k.dpjp_bersama.filter(x => x !== String(d.id)) }; repeindre(); } })); if (dicoba && erreurs().dpjp_bersama) group.append(peringatan(erreurs().dpjp_bersama)); el.append(group); }
    if (n === 3) { champ(el, 'spri', A.spri); el.append(petit(A.spriPetunjuk)); champ(el, 'keluhan_singkat', A.keluhan, undefined, 'textarea', 500); }
    if (n === 4) { const bed = opsi?.bed_kosong.find(b => String(b.id) === k.bed_id), tarif = opsi?.tarif_kamar.find(t => String(t.id) === k.tarif_id); if (asal?.asal) el.append(peringatan(A.asalInfo(asal.asal.poli_nama), 'biru')); el.append(DaftarRingkasan({ bagian: [{ judul: A.judul, baris: [{ label: A.bed, nilai: bed ? `${bed.ruang_nama ?? ''} ${bed.nama}`.trim() : A.bedMenunggu }, { label: A.kelas, nilai: `${KELAS_RAWAT.label(k.kelas)} · ${INDIKATOR_KELAS.label(k.indikator)}` }, { label: A.tarif, nilai: tarif?.nama ?? A.tarifTanpa }, { label: A.dpjpUtama, nilai: opsi?.dpjp.find(d => String(d.id) === k.dpjp_id)?.nama ?? '-' }, { label: A.dpjpBersama, nilai: k.dpjp_bersama.map(id => opsi?.dpjp.find(d => String(d.id) === id)?.nama).filter(Boolean).join(', ') || '-' }, { label: A.spri, nilai: k.spri || '-' }, { label: A.keluhan, nilai: k.keluhan_singkat || '-' }, { label: KUNJUNGAN.caraBayar, nilai: CARA_PEMBAYARAN.label(caraBayar()) }] }] })); }
    return el;
  }
  const ids = ['pasien', 'ruang', 'dpjp', 'spri', 'ringkasan']; modal = bukaModalBertahap({ judul: A.judul, langkah: ids.map((id, n) => ({ id, judul: A.langkah[id], isi: () => isi(n), selesai: n < 3 ? () => { const g = erreurs(); return n === 0 ? !g.pasien_id : n === 1 ? !g.bed_id && !g.kelas && !g.tarif_id : !g.dpjp_id && !g.dpjp_bersama; } : undefined })), onIndeks(n) { indeks = n; }, onTutup: tutup, lindungiTutup: () => adaPerubahan(awal, k), labelKirim: A.simpan, onKirim: kirim });
  async function kirim() { dicoba = true; if (proses) return; const masalah = langkahBermasalahAdmisi(erreurs()); if (masalah >= 0) { indeks = masalah; repeindre(); return; } proses = true; galat = null; perbarui(); try { const h = await admisiRawatInap(bentukAdmisi(k)); if (!aktif) return; hasil = true; bersihAnak(); const p = document.createElement('p'); p.style.margin = '0'; p.textContent = A.hasilPesan(h.menunggu_ruangan); modal.hasil({ judul: A.hasilJudul, isi: p, aksi: [tombol(TOMBOL.tutup, tutup)] }); } catch (e) { if (aktif) galat = e instanceof GalatApi ? e.message : A.gagal; } finally { proses = false; if (aktif) perbarui(); } }
  perbarui(); ambilOpsiRawatInap().then(o => { if (aktif) { opsi = o; repeindre(); } }).catch(e => { if (aktif) { galat = e instanceof GalatApi ? e.message : A.gagal; perbarui(); } }); return { tutup() { aktif = false; versiAsal++; bersihAnak(); modal.tutup(); } };
}
