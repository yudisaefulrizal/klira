import { REKAM_MEDIS, TOMBOL } from '@klira/shared';
import { catatPenyampaian } from '../../api-klien/dokumen-rm.js';
import { GalatApi } from '../../api-klien/klien.js';
import { token } from '../../gaya/token.js';
import { bukaModal1 } from '../../komponen/modal-1/modal-dom.js';
import { PemilihPasien } from '../../komponen/pemilih-pasien.js';
import { bidang, tombol, peringatan } from '../../komponen/ui/native.js';
import { adaPerubahan } from '../../util/draf.js';
import { awalPenyampaian, bentukPenyampaian, galatPenyampaian } from './keadaan-dokumen.js';

export function bukaPenyampaianRm({ onTutup, onSelesai }) {
  const P = REKAM_MEDIS.dok.penyampaian, awal = awalPenyampaian(), controls = new Map(); let k = { ...awal }, dicoba = false, proses = false, aktif = true;
  function bersih() { aktif = false; pasien.tutup(); modal.tutup(); }
  const modal = bukaModal1({ judul: P.judul, lindungiTutup: () => adaPerubahan(awal, k), onTutup() { bersih(); onTutup(); } }), status = document.createElement('div'), form = document.createElement('form'); form.noValidate = true; Object.assign(form.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md });
  const pasien = PemilihPasien({ id: 'py-pasien', pasienId: k.pasien_id, onPilih(id) { k = { ...k, pasien_id: id }; perbarui(); } }); form.append(pasien);
  function champ(nom, label, choix, jenis = 'text', maxLength) { const f = bidang({ id: `py-${nom}`, label, opsi: choix, jenis, maxLength, nilai: k[nom], autoComplete: 'off', ubah(v) { k = { ...k, [nom]: v }; perbarui(); } }); controls.set(nom, f); form.append(f.el); return f; }
  const opsi = p => Object.entries(p).map(([nilai, label]) => ({ nilai, label })); champ('penerima_nama', P.penerima); champ('hubungan', P.hubungan, opsi(P.hubunganLabel)); champ('bentuk', P.bentuk, opsi(P.bentukLabel)); const bukti = champ('bukti_persetujuan', P.bukti), aide = document.createElement('small'); aide.textContent = P.buktiPetunjuk; aide.style.color = token.warna.teksRedup; form.append(aide); champ('catatan', P.catatan, undefined, 'textarea', 500);
  function perbarui() { const g = galatPenyampaian(k), perlu = ['keluarga', 'pihak_lain'].includes(k.hubungan); bukti.el.hidden = !perlu; aide.hidden = !perlu || !!(dicoba && g.bukti_persetujuan); for (const [nom, f] of controls) f.setGalat(dicoba ? g[nom] : undefined); pasien.perbarui({ pasienId: k.pasien_id, galat: dicoba ? g.pasien_id : undefined }); }
  const simpan = tombol(P.simpan, kirim);
  async function kirim() { dicoba = true; perbarui(); if (proses || Object.keys(galatPenyampaian(k)).length) return; proses = true; simpan.disabled = true; simpan.textContent = P.menyimpan; status.replaceChildren(); try { await catatPenyampaian(bentukPenyampaian(k)); if (aktif) { bersih(); onSelesai(); } } catch (e) { if (aktif) status.replaceChildren(peringatan(e instanceof GalatApi ? e.message : P.gagal)); } finally { proses = false; simpan.disabled = false; simpan.textContent = P.simpan; } }
  form.addEventListener('submit', e => { e.preventDefault(); void kirim(); }); modal.isi.append(status, form); modal.aksi.append(tombol(TOMBOL.batal, modal.mintaTutup, 'sekunder'), simpan); perbarui(); modal.fokus(); return { tutup: bersih };
}
