import { GALAT, INTERPRETASI_HASIL, MODAL, PENUNJANG, TOMBOL } from '@klira/shared';
import { adaptorDrafServer } from '../../api-klien/draf-klinis.js';
import { GalatApi } from '../../api-klien/klien.js';
import { isiHasilLab, ordersKunjungan, validasiHasilLab } from '../../api-klien/penunjang.js';
import { token } from '../../gaya/token.js';
import { bukaModalBertahap } from '../../komponen/modal-bertahap/modal-dom.js';
import { bidang, kartu, tombol, lencana, peringatan } from '../../komponen/ui/native.js';
import { KotakCentang } from '../../komponen/ui/kotak-centang.js';
import { adaPerubahan } from '../../util/draf.js';
import { buatDrafOtomatis } from '../../util/draf-otomatis.js';
import { KepalaPasien } from './kepala-pasien.js';
import { awalHasilLab, galatHasilLab, langkahBermasalahHasil, menungguHasil, pulihkanHasilLab, rencanaHasil, saranUntuk, terapkanSaran, ubahIsian } from './keadaan-hasil-lab.js';
export const ALUR_HASIL_LAB = 'hasil-lab';

export function bukaHasilLab({ kunjunganId, pasien, onTutup, onSelesai }) {
  const H = PENUNJANG.hasil, adaptor = adaptorDrafServer(kunjunganId, ALUR_HASIL_LAB);
  let orders = null, awal = awalHasilLab([]), k = awalHasilLab([]), indeks = 0, galatMuat = null, galat = null, proses = false, siap = false, dipulihkan = false, hasil = null, tersimpan = false, aktif = true, modal;
  const draf = buatDrafOtomatis({ adaptor, nilai: k, awal, langkah: indeks, aktif: false }, () => pulihkan());
  function simpanDraf() { draf.perbarui({ adaptor, nilai: k, awal, langkah: indeks, aktif: siap && !hasil }); }
  function pulihkan() { if (!aktif || !orders || !draf.keadaan.siap || siap) return; awal = awalHasilLab(orders); const p = draf.keadaan.pulihan; k = p ? pulihkanHasilLab(awal, p.nilai) : awalHasilLab(orders); indeks = p ? Math.max(0, Math.min(p.langkah, 2)) : 0; dipulihkan = !!p; siap = true; simpanDraf(); tampil(true); }
  function tutup() { aktif = false; draf.tutup(); modal.tutup(); (tersimpan ? onSelesai : onTutup)(); }
  function colonne() { const el = document.createElement('div'); Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md }); return el; }
  function texte(teks, redup = false) { const el = document.createElement('span'); el.textContent = teks; if (redup) Object.assign(el.style, { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }); return el; }
  function changer(b, id, valeur) { k = ubahIsian(k, b, id, valeur); simpanDraf(); afficherEtat(); }
  function box(o, ...contenu) { const el = kartu({ susun: 'md', style: { padding: token.jarak.md } }), row = document.createElement('div'), nom = document.createElement('strong'); nom.textContent = o.nama; Object.assign(row.style, { display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: token.jarak.md }); row.append(nom, texte(o.rujukan_teks ? `${H.rujukan}: ${o.rujukan_teks}` : H.rujukanTidakAda, true)); el.append(row, ...contenu); return el; }
  function contenu(n) {
    if (!orders || !siap) return galatMuat ? peringatan(galatMuat) : texte(PENUNJANG.memuat, true);
    const menunggu = menungguHasil(orders); if (!menunggu.length) return peringatan(H.kosong, 'biru');
    const el = colonne();
    if (n === 0) { el.append(texte(H.petunjukHasil, true)); for (const o of menunggu) { const f = bidang({ id: `hasil-nilai-${o.id}`, label: o.satuan ? `${H.nilai} (${o.satuan})` : H.nilai, nilai: k.nilai[o.id] ?? '', maxLength: 200, autoComplete: 'off', ubah(v) { changer('nilai', o.id, v); } }); el.append(box(o, f.el)); } }
    if (n === 1) { el.append(texte(H.petunjukInterpretasi, true)); const g = galatHasilLab(k, orders); for (const o of menunggu) { const nilai = (k.nilai[o.id] ?? '').trim(); if (!nilai) { el.append(box(o, texte(H.belumDiisi, true))); continue; } const f = bidang({ id: `hasil-interpretasi-${o.id}`, label: H.interpretasi, nilai: k.interpretasi[o.id] ?? '', opsi: [{ nilai: '', label: H.pilihInterpretasi }, ...INTERPRETASI_HASIL.nilai.map(v => ({ nilai: v, label: INTERPRETASI_HASIL.label(v) }))], ubah(v) { changer('interpretasi', o.id, v); f.setGalat(galatHasilLab(k, orders)[o.id]); } }); f.setGalat(g[o.id]); const catatan = bidang({ id: `hasil-catatan-${o.id}`, label: H.catatan, nilai: k.catatan[o.id] ?? '', maxLength: 1000, autoComplete: 'off', ubah(v) { changer('catatan', o.id, v); } }); const b = box(o, texte(`${H.nilai}: ${nilai}${o.satuan ? ` ${o.satuan}` : ''}`), f.el); const saran = saranUntuk(o, nilai); if (saran) b.append(texte(H.saran(INTERPRETASI_HASIL.label(saran)), true)); b.append(catatan.el); el.append(b); } }
    if (n === 2) { el.append(texte(H.petunjukValidasi)); const h = document.createElement('strong'); h.textContent = H.ringkasanHasil; el.append(h); const r = rencanaHasil(k, orders), ul = document.createElement('ul'); if (!r.length) el.append(peringatan(H.ringkasanKosong, 'kuning')); for (const x of r) { const li = document.createElement('li'), nilai = document.createElement('strong'); Object.assign(li.style, { display: 'flex', gap: token.jarak.md, flexWrap: 'wrap', marginBottom: token.jarak.xs }); const nama = texte(x.order.nama); nama.style.flexGrow = '1'; nilai.textContent = `${x.nilai}${x.order.satuan ? ` ${x.order.satuan}` : ''}`; li.append(nama, nilai, lencana(INTERPRETASI_HASIL.label(x.interpretasi), INTERPRETASI_HASIL.warna(x.interpretasi))); ul.append(li); } el.append(ul, KotakCentang({ id: 'hasil-validasi', label: H.validasiSekarang, keterangan: H.validasiKet, checked: k.validasi, onChange(e) { k = { ...k, validasi: e.target.checked }; simpanDraf(); afficherEtat(); } }), peringatan(H.addendumInfo, 'biru')); }
    return el;
  }
  function catatanDraf() { if (!dipulihkan) return []; const el = peringatan(MODAL.drafDipulihkan, 'biru'); el.append(tombol(MODAL.buangDraf, () => { draf.buang(); k = awalHasilLab(orders ?? []); indeks = 0; dipulihkan = false; simpanDraf(); tampil(true); }, 'teks')); return el; }
  function afficherEtat() { modal?.perbarui({ labelKirim: proses ? H.memproses : k.validasi ? H.kirimValidasi : H.kirim, nonaktif: proses || !siap || !orders || !menungguHasil(orders).length || !rencanaHasil(k, orders).length, galat: galat ?? '' }); }
  function tampil(remonter = false) { if (!modal || !aktif || hasil) return; if (remonter) modal.ke(indeks, { fokus: false, beritahu: false }); afficherEtat(); }
  modal = bukaModalBertahap({ judul: H.judul, langkah: [{ id: 'hasil', judul: H.langkah.hasil, isi: () => contenu(0), selesai: () => !!orders && rencanaHasil(k, orders).length > 0 && indeks > 0 }, { id: 'interpretasi', judul: H.langkah.interpretasi, isi: () => contenu(1), selesai: () => !!orders && rencanaHasil(k, orders).length > 0 && indeks > 1 }, { id: 'validasi', judul: H.langkah.validasi, isi: () => contenu(2) }], konteks: () => KepalaPasien({ nama: pasien.nama, nomorRm: pasien.nomor_rm }), catatan: catatanDraf, onTutup: tutup, lindungiTutup: () => siap && adaPerubahan(awal, k), onIndeks(n) { if (orders && n >= 1 && indeks === 0) k = terapkanSaran(k, orders); indeks = n; galat = null; simpanDraf(); tampil(true); }, onLanjut(dari) { if (!orders || !siap) return false; if (dari === 0 && !menungguHasil(orders).some(o => (k.nilai[o.id] ?? '').trim())) { galat = H.langkahSebelumnya; afficherEtat(); return false; } if (dari === 0) k = terapkanSaran(k, orders); const g = galatHasilLab(k, orders); if (dari === 1 && Object.keys(g).length) { galat = Object.values(g)[0]; afficherEtat(); return false; } galat = null; return true; }, labelKirim: H.kirim, onKirim: kirim });
  async function kirim() {
    if (!orders || proses || !siap) return; const probleme = langkahBermasalahHasil(k, orders); if (probleme >= 0) { galat = probleme === 0 ? H.langkahSebelumnya : Object.values(galatHasilLab(k, orders))[0] ?? H.langkahSebelumnya; indeks = probleme; tampil(true); return; }
    galat = null; proses = true; afficherEtat(); const r = { disimpan: 0, divalidasi: 0, addendum: 0 }; let berjalan = ''; const validasi = k.validasi, rencana = rencanaHasil(k, orders);
    try { for (const x of rencana) { berjalan = x.order.nama; await isiHasilLab(x.order.id, { nilai: x.nilai, interpretasi: x.interpretasi, catatan: x.catatan }); r.disimpan++; tersimpan = true; if (validasi) { const v = await validasiHasilLab(x.order.id); r.divalidasi++; if (v.addendum.length) r.addendum++; } } draf.hapus(); if (!aktif) return; hasil = r; const isi = colonne(); isi.append(texte(H.selesaiPesan(r.disimpan, r.divalidasi))); if (r.addendum > 0) isi.append(peringatan(H.addendumDibuat(r.addendum), 'biru')); modal.hasil({ judul: H.selesaiJudul, isi, aksi: [tombol(TOMBOL.tutup, tutup)] }); }
    catch (e) { if (aktif) { galat = `${H.gagalSebagian(berjalan)} ${e instanceof GalatApi ? e.message : GALAT.umum}`; try { const o = await ordersKunjungan(kunjunganId); if (aktif) { orders = o; awal = awalHasilLab(o); } } catch {} tampil(true); } }
    finally { proses = false; if (aktif) afficherEtat(); }
  }
  afficherEtat(); ordersKunjungan(kunjunganId).then(o => { if (!aktif) return; orders = o; awal = awalHasilLab(o); pulihkan(); tampil(true); }).catch(e => { if (aktif) { galatMuat = e instanceof GalatApi ? e.message : PENUNJANG.order.gagalMuat; tampil(true); } });
  return { tutup() { aktif = false; draf.tutup(); modal.tutup(); } };
}
