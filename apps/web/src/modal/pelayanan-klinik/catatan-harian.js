import { KLINIS, RAWAT_INAP, TANDA_VITAL, TOMBOL } from '@klira/shared';
import { daftarCatatanHarian, tambahCatatanHarian } from '../../api-klien/rawat-inap.js';
import { GalatApi } from '../../api-klien/klien.js';
import { token } from '../../gaya/token.js';
import { bukaModal1 } from '../../komponen/modal-1/modal-dom.js';
import { bidang, tombol, kartu, lencana, peringatan } from '../../komponen/ui/native.js';
import { adaPerubahan } from '../../util/draf.js';
import { formatWaktu } from '../../util/penyaring-tab.js';
import { KepalaPasien } from './kepala-pasien.js';
import { awalCatatan, bentukCatatan, galatCatatan } from './keadaan-rawat-inap.js';

export function bukaCatatanHarian({ kunjunganId, pasien, sudahPulang = false, onTutup }) {
  const C = RAWAT_INAP.cppt, awal = awalCatatan();
  let k = awalCatatan(), dicoba = false, proses = false, aktif = true, versi = 0;
  const modal = bukaModal1({ judul: C.judul, lebar: 'modalBesar', lindungiTutup: () => adaPerubahan(awal, k), onTutup() { aktif = false; versi++; modal.tutup(); onTutup(); } });
  modal.konteks.append(KepalaPasien({ nama: pasien.nama, nomorRm: pasien.nomor_rm }));
  const status = document.createElement('div'), form = document.createElement('form'), historique = document.createElement('div'), general = document.createElement('div'), controls = new Map(); form.noValidate = true;
  for (const el of [form, historique]) Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md });
  const h = document.createElement('strong'); h.textContent = C.tambah; form.append(h);
  for (const nama of ['subjektif', 'objektif', 'asesmen', 'rencana', 'instruksi']) { const f = bidang({ id: `cppt-${nama}`, label: C[nama], jenis: 'textarea', nilai: k[nama], maxLength: 2000, ubah(v) { k = { ...k, [nama]: v }; erreurs(); } }); controls.set(nama, f); form.append(f.el); }
  const tvTitle = document.createElement('strong'); tvTitle.textContent = C.tandaVital; const tv = document.createElement('div'); Object.assign(tv.style, { display: 'flex', gap: token.jarak.sm, flexWrap: 'wrap' });
  for (const t of TANDA_VITAL) { const f = bidang({ id: `cppt-tv-${t.kunci}`, label: `${KLINIS.tandaVital[t.kunci]} (${KLINIS.tandaVital.satuan[t.satuan] ?? t.satuan})`, nilai: k.tanda_vital[t.kunci], autoComplete: 'off', ubah(v) { k = { ...k, tanda_vital: { ...k.tanda_vital, [t.kunci]: v } }; erreurs(); } }); f.kontrol.inputMode = 'decimal'; controls.set(`tanda_vital.${t.kunci}`, f); tv.append(f.el); }
  form.append(tvTitle, tv, general);
  function erreurs() { const g = galatCatatan(k); for (const [nama, f] of controls) f.setGalat(dicoba ? g[nama] : undefined); general.replaceChildren(); if (dicoba && g.tanda_vital) general.append(peringatan(g.tanda_vital)); }
  async function muat() { const id = ++versi; try { const liste = await daftarCatatanHarian(kunjunganId); if (!aktif || id !== versi) return; historique.replaceChildren(); const title = document.createElement('strong'); title.textContent = C.daftar; historique.append(title); if (!liste.length) historique.append(C.kosong); for (const c of liste) { const box = kartu({ susun: 'xs', style: { padding: token.jarak.md } }), row = document.createElement('div'), date = document.createElement('strong'); Object.assign(row.style, { display: 'flex', gap: token.jarak.sm, flexWrap: 'wrap' }); date.textContent = formatWaktu(c.waktu); row.append(date, c.dibuat_oleh_nama ? C.oleh(c.dibuat_oleh_nama) : '', lencana(c.verifikasi === 'sah' ? C.sah : C.berubah, c.verifikasi === 'sah' ? 'hijau' : 'merah')); box.append(row); for (const [prefix, nama] of [['S', 'subjektif'], ['O', 'objektif'], ['A', 'asesmen'], ['P', 'rencana'], [C.instruksi, 'instruksi']]) { if (nama === 'instruksi' && !c.instruksi) continue; const p = document.createElement('span'); p.style.whiteSpace = 'pre-wrap'; p.textContent = `${prefix}: ${c[nama]}`; box.append(p); } if (c.tanda_vital) { const p = document.createElement('small'); p.style.color = token.warna.teksRedup; p.textContent = TANDA_VITAL.filter(t => c.tanda_vital[t.kunci] != null).map(t => `${KLINIS.tandaVital[t.kunci]} ${c.tanda_vital[t.kunci]}`).join(' · '); box.append(p); } historique.append(box); } } catch (e) { if (aktif && id === versi) status.append(peringatan(e instanceof GalatApi ? e.message : C.gagal)); } }
  const simpan = tombol(C.simpan, kirim);
  async function kirim() { if (sudahPulang || proses) return; dicoba = true; erreurs(); if (Object.keys(galatCatatan(k)).length) return; proses = true; simpan.disabled = true; simpan.textContent = C.menyimpan; status.replaceChildren(); try { await tambahCatatanHarian(kunjunganId, bentukCatatan(k)); if (!aktif) return; k = awalCatatan(); dicoba = false; for (const [nama, f] of controls) f.kontrol.value = nama.startsWith('tanda_vital.') ? k.tanda_vital[nama.slice(12)] : k[nama]; erreurs(); status.replaceChildren(peringatan(C.tersimpan, 'biru')); void muat(); } catch (e) { if (aktif) status.replaceChildren(peringatan(e instanceof GalatApi ? e.message : C.gagal)); } finally { proses = false; simpan.disabled = false; simpan.textContent = C.simpan; } }
  form.addEventListener('submit', e => { e.preventDefault(); void kirim(); }); modal.isi.append(status, sudahPulang ? peringatan(C.ditutup, 'biru') : form, historique); modal.aksi.append(tombol(TOMBOL.tutup, modal.mintaTutup, 'sekunder')); if (!sudahPulang) modal.aksi.append(simpan); modal.fokus(); void muat(); return { tutup() { aktif = false; versi++; modal.tutup(); } };
}
