import { PENUNJANG, TOMBOL } from '@klira/shared';
import { GalatApi } from '../../api-klien/klien.js';
import { buatMasterPemeriksaan, ubahMasterPemeriksaan } from '../../api-klien/penunjang.js';
import { token } from '../../gaya/token.js';
import { bukaModal1 } from '../../komponen/modal-1/modal-dom.js';
import { PencarianLoinc } from '../../komponen/pencarian-loinc.js';
import { bidang, tombol, peringatan } from '../../komponen/ui/native.js';
import { KotakCentang } from '../../komponen/ui/kotak-centang.js';
import { adaPerubahan } from '../../util/draf.js';
import { awalMasterPemeriksaan, bentukMasterPemeriksaan, galatMasterPemeriksaan, perubahanMaster } from './keadaan-master-pemeriksaan.js';

export function bukaMasterPemeriksaan({ master, onTutup, onSelesai }) {
  const M = PENUNJANG.master, awal = awalMasterPemeriksaan(master);
  let k = { ...awal }, dicoba = false, proses = false, aktif = true;
  function bersih() { aktif = false; loinc.tutup(); modal.tutup(); }
  const modal = bukaModal1({ judul: master ? M.judulUbah : M.judulTambah, lindungiTutup: () => adaPerubahan(awal, k), onTutup() { bersih(); onTutup(); } });
  const status = document.createElement('div'), form = document.createElement('form'), controls = new Map(); form.noValidate = true;
  Object.assign(form.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md });
  const loinc = PencarianLoinc({ id: 'mp-loinc', label: M.bidang.kode_loinc, petunjuk: M.petunjuk.kode_loinc, value: k.kode_loinc, onChange(v) { k = { ...k, kode_loinc: v }; erreurs(); } });
  function champ(nom) { const f = bidang({ id: `mp-${nom}`, label: M.bidang[nom], nilai: k[nom], autoComplete: 'off', ubah(v) { k = { ...k, [nom]: v }; erreurs(); } }); controls.set(nom, f); f.el.style.flex = '1 1 0'; if (nom.startsWith('rujukan_') && nom !== 'rujukan_teks') f.kontrol.inputMode = 'decimal'; if (nom.startsWith('harga_')) f.kontrol.inputMode = 'numeric'; if (M.petunjuk[nom]) { const p = document.createElement('small'); p.textContent = M.petunjuk[nom]; p.style.color = token.warna.teksRedup; f.el.append(p); } return f.el; }
  function ligne(...noms) { const row = document.createElement('div'); Object.assign(row.style, { display: 'flex', gap: token.jarak.md, flexWrap: 'wrap' }); row.append(...noms.map(champ)); return row; }
  form.append(ligne('kode', 'nama'), loinc, ligne('jenis_spesimen', 'satuan'), ligne('rujukan_min', 'rujukan_maks'), champ('rujukan_teks'), ligne('harga_umum', 'harga_jkn'), KotakCentang({ id: 'mp-aktif', label: M.bidang.aktif, checked: k.aktif, onChange(e) { k = { ...k, aktif: e.target.checked }; } }));
  function erreurs() { const g = galatMasterPemeriksaan(k); for (const [nom, f] of controls) f.setGalat(dicoba ? g[nom] : undefined); loinc.perbarui({ galat: dicoba ? g.kode_loinc : undefined }); }
  const simpan = tombol(TOMBOL.simpan, kirim);
  async function kirim() { dicoba = true; erreurs(); if (proses || Object.keys(galatMasterPemeriksaan(k)).length) return; proses = true; simpan.disabled = true; simpan.textContent = PENUNJANG.order.memesan; status.replaceChildren(); try { if (master) await ubahMasterPemeriksaan(master.id, perubahanMaster(awal, k)); else await buatMasterPemeriksaan(bentukMasterPemeriksaan(k)); if (aktif) { bersih(); onSelesai(); } } catch (e) { if (aktif) status.replaceChildren(peringatan(e instanceof GalatApi ? e.message : M.gagalMuat)); } finally { proses = false; simpan.disabled = false; simpan.textContent = TOMBOL.simpan; } }
  form.addEventListener('submit', e => { e.preventDefault(); void kirim(); }); modal.isi.append(status, form); modal.aksi.append(tombol(TOMBOL.batal, modal.mintaTutup, 'sekunder'), simpan); modal.fokus(); return { tutup: bersih };
}
