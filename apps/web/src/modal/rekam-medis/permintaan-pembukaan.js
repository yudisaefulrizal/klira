import { REKAM_MEDIS, TOMBOL } from '@klira/shared';
import { ajukanPembukaan } from '../../api-klien/dokumen-rm.js';
import { GalatApi } from '../../api-klien/klien.js';
import { token } from '../../gaya/token.js';
import { bukaModalBertahap } from '../../komponen/modal-bertahap/modal-bertahap.js';
import { PemilihPasien } from '../../komponen/pemilih-pasien.js';
import { bidang, tombol } from '../../komponen/ui/primitif.js';
import { KotakCentang } from '../../komponen/ui/kotak-centang.js';
import { DaftarRingkasan } from '../../komponen/ui/susunan.js';
import { adaPerubahan } from '../../util/draf/draf.js';
import { awalPembukaan, bentukPembukaan, galatPembukaan, langkahBermasalahPembukaan } from './keadaan-dokumen.js';

export function bukaPermintaanPembukaan({ onTutup, onSelesai }) {
  const P = REKAM_MEDIS.dok.pembukaan, awal = awalPembukaan(), controls = new Map(); let k = { ...awal }, indeks = 0, dicoba = false, galat = null, proses = false, selesai = false, aktif = true, pasien, modal;
  function tutup() { aktif = false; pasien?.tutup(); modal.tutup(); (selesai ? onSelesai : onTutup)(); }
  function perbarui() { const g = galatPembukaan(k); for (const [nom, f] of controls) f.setGalat(dicoba ? g[nom] : undefined); pasien?.perbarui({ pasienId: k.pasien_id, galat: dicoba ? g.pasien_id : undefined }); modal?.perbarui({ galat: galat ?? '', labelKirim: proses ? P.memproses : P.ajukan, nonaktif: proses }); }
  function repeindre() { if (modal) modal.ke(indeks, { fokus: false, beritahu: false }); perbarui(); }
  function champ(el, nom, label, jenis = 'text', maxLength, opsi, refresh = false) { const f = bidang({ id: `pb-${nom}`, label, jenis, maxLength, opsi, nilai: k[nom], autoComplete: 'off', ubah(v) { k = { ...k, [nom]: v }; if (refresh) repeindre(); else perbarui(); } }); controls.set(nom, f); f.setGalat(dicoba ? galatPembukaan(k)[nom] : undefined); el.append(f.el); }
  function isi(n) { pasien?.tutup(); pasien = undefined; controls.clear(); const el = document.createElement('div'); Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md });
    if (n === 0) { pasien = PemilihPasien({ id: 'pb-pasien', pasienId: k.pasien_id, galat: dicoba ? galatPembukaan(k).pasien_id : undefined, onPilih(id) { k = { ...k, pasien_id: id }; perbarui(); } }); el.append(pasien); champ(el, 'pemohon_nama', P.pemohon); champ(el, 'pemohon_instansi', P.instansi); }
    if (n === 1) { champ(el, 'dasar', P.dasarLabel, 'text', undefined, Object.entries(P.dasar).map(([nilai, label]) => ({ nilai, label })), true); if (k.dasar === 'hukum') champ(el, 'alasan_hukum', P.alasanHukum, 'text', undefined, [{ nilai: '', label: '...' }, ...Object.entries(P.alasan).map(([nilai, label]) => ({ nilai, label }))]); champ(el, 'dasar_rinci', P.dasarRinci, 'textarea', 500); champ(el, 'cakupan', P.cakupan, 'textarea', 500); el.append(KotakCentang({ id: 'pb-samar', label: P.samar, keterangan: P.samarPetunjuk, checked: k.identitas_disamarkan, onChange(e) { k = { ...k, identitas_disamarkan: e.target.checked }; perbarui(); } })); }
    if (n === 2) { el.append(DaftarRingkasan({ bagian: [{ judul: P.judul, baris: [{ label: P.pemohon, nilai: [k.pemohon_nama, k.pemohon_instansi].filter(Boolean).join(' · ') || '-' }, { label: P.dasarLabel, nilai: `${P.dasar[k.dasar]}${k.dasar === 'hukum' && k.alasan_hukum ? ` · ${P.alasan[k.alasan_hukum]}` : ''}` }, { label: P.dasarRinci, nilai: k.dasar_rinci || '-' }, { label: P.cakupan, nilai: k.cakupan || '-' }, { label: P.samar, nilai: k.identitas_disamarkan ? P.samarYa : P.samarTidak }] }] })); const info = document.createElement('small'); info.textContent = P.info; info.style.color = token.warna.teksRedup; el.append(info); } return el;
  }
  modal = bukaModalBertahap({ judul: P.judul, langkah: ['pemohon', 'dasar', 'ringkasan'].map((id, n) => ({ id, judul: P.langkah[id], isi: () => isi(n), selesai: n < 2 ? () => { const g = galatPembukaan(k); return n === 0 ? !g.pasien_id && !g.pemohon_nama : !g.alasan_hukum && !g.dasar_rinci && !g.cakupan; } : undefined })), onIndeks(n) { indeks = n; }, onTutup: tutup, lindungiTutup: () => adaPerubahan(awal, k), onKirim: kirim, labelKirim: P.ajukan });
  async function kirim() { dicoba = true; if (proses) return; const masalah = langkahBermasalahPembukaan(galatPembukaan(k)); if (masalah >= 0) { indeks = masalah; repeindre(); return; } proses = true; galat = null; perbarui(); try { await ajukanPembukaan(bentukPembukaan(k)); if (!aktif) return; selesai = true; pasien?.tutup(); const p = document.createElement('p'); p.style.margin = '0'; p.textContent = P.hasilPesan; modal.hasil({ judul: P.hasilJudul, isi: p, aksi: [tombol(TOMBOL.tutup, tutup)] }); } catch (e) { if (aktif) galat = e instanceof GalatApi ? e.message : P.gagal; } finally { proses = false; if (aktif) perbarui(); } }
  perbarui(); return { tutup() { aktif = false; pasien?.tutup(); modal.tutup(); } };
}
