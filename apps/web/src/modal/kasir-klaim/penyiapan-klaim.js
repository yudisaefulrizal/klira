import { BERKAS_KLAIM, KLAIM, STATUS_KLAIM, TOMBOL } from '@klira/shared';
import { GalatApi } from '../../api-klien/klien.js';
import { kandidatKlaim, kodeKlaimKunjungan, siapkanKlaim, ubahBerkasKlaim } from '../../api-klien/klaim.js';
import { token } from '../../gaya/token.js';
import { bukaModalBertahap } from '../../komponen/modal-bertahap/modal-bertahap.js';
import { bidang, tombol, peringatan } from '../../komponen/ui/primitif.js';
import { KotakCentang } from '../../komponen/ui/kotak-centang.js';
import { DaftarRingkasan } from '../../komponen/ui/susunan.js';
import { adaPerubahan } from '../../util/draf/draf.js';
import { formatWaktu } from '../../util/tab/penyaring-tab.js';
import { alihBerkas, awalKlaim, bentukSiapkan, bentukUbahBerkas, galatKlaim, kurangBerkas, langkahBermasalahKlaim, pilihKandidat } from './keadaan-klaim.js';

export function bukaPenyiapanKlaim({ klaim = null, onTutup, onSelesai }) {
  const S = KLAIM.siap, awal = awalKlaim(klaim), ubah = !!klaim;
  let k = { ...awal }, kandidat = ubah ? [] : null, kode = klaim ? { diagnosis: klaim.diagnosis, tindakan: klaim.tindakan } : null, indeks = 0, dicoba = false, galat = null, proses = false, hasil = false, aktif = true, versi = 0, modal;
  const controls = new Map(), teksKode = x => x.length ? x.map(v => `${v.kode} ${v.nama}`).join('; ') : S.kosongKode;
  function tutup() { aktif = false; versi++; modal.tutup(); (hasil ? onSelesai : onTutup)(); }
  function perbarui() { const g = galatKlaim(k, ubah); for (const [nom, f] of controls) f.setGalat(dicoba ? g[nom] : undefined); modal?.perbarui({ galat: galat ?? '', nonaktif: proses || (!ubah && kandidat === null), labelKirim: proses ? S.menyimpan : S.simpan }); }
  function repeindre() { if (modal && aktif && !hasil) { modal.ke(indeks, { fokus: false, beritahu: false }); perbarui(); } }
  async function pilih(v) { const saat = ++versi; k = pilihKandidat(k, kandidat?.find(c => String(c.kunjungan_id) === v)); kode = null; repeindre(); if (k.kunjungan_id === null) return; try { const d = await kodeKlaimKunjungan(k.kunjungan_id); if (aktif && saat === versi) { kode = d; repeindre(); } } catch { if (aktif && saat === versi) { kode = null; repeindre(); } } }
  function champ(el, nom, label, jenis = 'text', maxLength, opsi, change) { const f = bidang({ id: `klm-${nom}`, label, jenis, maxLength, opsi, nilai: k[nom] ?? '', autoComplete: 'off', ubah(v) { if (change) change(v); else { k = { ...k, [nom]: v }; perbarui(); } } }); controls.set(nom, f); f.setGalat(dicoba ? galatKlaim(k, ubah)[nom] : undefined); el.append(f.el); }
  function petit(teks) { const el = document.createElement('small'); el.style.color = token.warna.teksRedup; el.textContent = teks; return el; }
  function resume(judul, baris) { return DaftarRingkasan({ bagian: [{ judul, baris }] }); }
  function isi(n) { controls.clear(); const el = document.createElement('div'); Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md }); const terpilih = kandidat?.find(c => c.kunjungan_id === k.kunjungan_id), jenis = klaim?.jenis ?? terpilih?.jenis ?? 'AMB';
    if (n === 0) { if (ubah) { const h = document.createElement('strong'); h.append(klaim.pasien_nama, ' ', petit(klaim.pasien_nomor_rm)); el.append(h); } else { if (kandidat && !kandidat.length) el.append(peringatan(S.tanpaKandidat, 'biru')); champ(el, 'kunjungan_id', S.kunjungan, 'text', undefined, [{ nilai: '', label: S.pilihKunjungan }, ...(kandidat ?? []).map(c => ({ nilai: String(c.kunjungan_id), label: `${c.pasien_nama} (${c.pasien_nomor_rm}) · ${formatWaktu(c.waktu_tutup)}${c.jenis === 'IMP' ? ' · rawat inap' : ''}` }))], pilih); } champ(el, 'nomor_sep', S.sep); el.append(petit(S.sepPetunjuk)); }
    if (n === 1) { if (klaim?.kode_beda) el.append(peringatan(S.kodeBeda)); el.append(resume(S.kodeSumber, [{ label: S.diagnosis, nilai: kode ? teksKode(kode.diagnosis) : '-' }, { label: S.tindakan, nilai: kode ? teksKode(kode.tindakan) : '-' }])); }
    if (n === 2) { el.append(petit(S.berkasPetunjuk)); for (const b of BERKAS_KLAIM.filter(b => (b !== 'spri' && b !== 'ringkasan_rm') || jenis === 'IMP')) el.append(KotakCentang({ id: `klm-berkas-${b}`, label: KLAIM.berkasLabel[b], checked: k.berkas.includes(b), onChange(e) { k = alihBerkas(k, b, e.target.checked, BERKAS_KLAIM); perbarui(); } })); if (jenis === 'IMP' && !(klaim?.resume_ada ?? terpilih?.resume_ada ?? false)) el.append(peringatan(S.resumeBelum)); champ(el, 'catatan', S.catatan, 'textarea', 300); }
    if (n === 3) { const kurang = kurangBerkas(jenis, k); if (kurang.length) el.append(peringatan(S.kurang(kurang.length), 'biru')); el.append(resume(S.judul, [{ label: KLAIM.kolom.pasien, nilai: klaim ? klaim.pasien_nama : terpilih ? `${terpilih.pasien_nama} (${terpilih.pasien_nomor_rm})` : '-' }, { label: S.sep, nilai: k.nomor_sep || '-' }, { label: S.diagnosis, nilai: kode ? teksKode(kode.diagnosis) : '-' }, { label: S.tindakan, nilai: kode ? teksKode(kode.tindakan) : '-' }, { label: S.langkah.berkas, nilai: k.berkas.map(b => KLAIM.berkasLabel[b]).join('; ') || '-' }, { label: S.catatan, nilai: k.catatan || '-' }])); } return el;
  }
  modal = bukaModalBertahap({ judul: ubah ? S.ubahJudul : S.judul, langkah: ['kunjungan', 'kode', 'berkas', 'ringkasan'].map((id, n) => ({ id, judul: S.langkah[id], isi: () => isi(n), selesai: n === 0 ? () => { const g = galatKlaim(k, ubah); return !g.kunjungan_id && !g.nomor_sep; } : n === 2 ? () => !galatKlaim(k, ubah).berkas : undefined })), onIndeks(n) { indeks = n; }, onTutup: tutup, lindungiTutup: () => adaPerubahan(awal, k), onKirim: kirim, labelKirim: S.simpan });
  async function kirim() { dicoba = true; if (proses) return; const masalah = langkahBermasalahKlaim(galatKlaim(k, ubah)); if (masalah >= 0) { indeks = masalah; repeindre(); return; } proses = true; galat = null; perbarui(); try { const h = klaim ? await ubahBerkasKlaim(klaim.id, bentukUbahBerkas(k)) : await siapkanKlaim(bentukSiapkan(k)); if (!aktif) return; hasil = true; const p = document.createElement('p'); p.style.margin = '0'; p.textContent = S.hasilPesan(STATUS_KLAIM.label(h.status)); modal.hasil({ judul: S.hasilJudul, isi: p, aksi: [tombol(TOMBOL.tutup, tutup)] }); } catch (e) { if (aktif) galat = e instanceof GalatApi ? e.message : S.gagal; } finally { proses = false; if (aktif) perbarui(); } }
  perbarui(); if (!ubah) kandidatKlaim().then(d => { if (aktif) { kandidat = d; repeindre(); } }).catch(e => { if (aktif) { galat = e instanceof GalatApi ? e.message : S.gagal; perbarui(); } }); return { tutup() { aktif = false; versi++; modal.tutup(); } };
}
