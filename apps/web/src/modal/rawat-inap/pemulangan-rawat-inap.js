import { DISPOSISI_PULANG, RAWAT_INAP, TOMBOL } from '@klira/shared';
import { pulangkanPasien } from '../../api-klien/rawat-inap.js';
import { GalatApi } from '../../api-klien/klien.js';
import { token } from '../../gaya/token.js';
import { bukaModalBertahap } from '../../komponen/modal-bertahap/modal-bertahap.js';
import { bidang, tombol } from '../../komponen/ui/primitif.js';
import { KotakCentang } from '../../komponen/ui/kotak-centang.js';
import { DaftarRingkasan } from '../../komponen/ui/susunan.js';
import { adaPerubahan } from '../../util/draf/draf.js';
import { KepalaPasien } from '../pasien/kepala-pasien.js';
import { awalPulang, bentukPulang, galatPulang, langkahBermasalahPulang } from './keadaan-rawat-inap.js';

export function bukaPemulanganRawatInap({ kunjunganId, pasien, onTutup, onSelesai }) {
  const P = RAWAT_INAP.pulang, awal = awalPulang();
  let k = { ...awal }, indeks = 0, dicoba = false, galat = null, proses = false, hasil = false, aktif = true, modal;
  const controls = new Map();
  function tutup() { aktif = false; modal.tutup(); (hasil ? onSelesai : onTutup)(); }
  function perbarui() { const g = galatPulang(k); for (const [nama, f] of controls) f.setGalat(dicoba ? g[nama] : undefined); modal?.perbarui({ galat: galat ?? '', nonaktif: proses, labelKirim: proses ? P.menyimpan : P.simpan }); }
  function champ(nama, label, jenis = 'text', maxLength, opsi) { const f = bidang({ id: `pul-${nama}`, label, jenis, maxLength, opsi, nilai: k[nama], autoComplete: 'off', ubah(v) { k = { ...k, [nama]: v }; perbarui(); } }); controls.set(nama, f); f.setGalat(dicoba ? galatPulang(k)[nama] : undefined); return f.el; }
  function isi(n) { controls.clear(); const el = document.createElement('div'); Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md });
    if (n === 0) el.append(champ('ringkasan', P.ringkasan, 'textarea', 3000), champ('terapi', P.terapi, 'textarea', 1000));
    if (n === 1) el.append(champ('diagnosis_akhir', P.diagnosis));
    if (n === 2) el.append(champ('disposisi', P.disposisi, 'text', undefined, DISPOSISI_PULANG.nilai.map(v => ({ nilai: v, label: DISPOSISI_PULANG.label(v) }))), champ('kondisi_pulang', P.kondisi));
    if (n === 3) el.append(champ('tindak_lanjut', P.tindak, 'textarea', 1000));
    if (n === 4) { el.append(KotakCentang({ id: 'pul-resume', label: P.buatResume, keterangan: P.buatResumePetunjuk, checked: k.buat_resume, onChange(e) { k = { ...k, buat_resume: e.target.checked }; perbarui(); } }), DaftarRingkasan({ bagian: [{ judul: P.judul, baris: [{ label: P.ringkasan, nilai: k.ringkasan || '-' }, { label: P.terapi, nilai: k.terapi || '-' }, { label: P.diagnosis, nilai: k.diagnosis_akhir || '-' }, { label: P.disposisi, nilai: k.disposisi ? DISPOSISI_PULANG.label(k.disposisi) : '-' }, { label: P.kondisi, nilai: k.kondisi_pulang || '-' }, { label: P.tindak, nilai: k.tindak_lanjut || '-' }] }] })); const info = document.createElement('small'); info.textContent = P.info; info.style.color = token.warna.teksRedup; el.append(info); } return el;
  }
  const ids = ['ringkasan', 'diagnosis', 'kondisi', 'tindak', 'resume'];
  modal = bukaModalBertahap({ judul: P.judul, langkah: ids.map((id, n) => ({ id, judul: P.langkah[id], isi: () => isi(n), selesai: n < 3 ? () => { const g = galatPulang(k); return n === 0 ? !g.ringkasan : n === 1 ? !g.diagnosis_akhir : !g.disposisi && !g.kondisi_pulang; } : undefined })), onIndeks(n) { indeks = n; }, onTutup: tutup, lindungiTutup: () => adaPerubahan(awal, k), konteks: () => KepalaPasien({ nama: pasien.nama, nomorRm: pasien.nomor_rm }), labelKirim: P.simpan, onKirim: kirim });
  async function kirim() { dicoba = true; if (proses) return; const masalah = langkahBermasalahPulang(galatPulang(k)); if (masalah >= 0) { indeks = masalah; modal.ke(indeks); perbarui(); return; } proses = true; galat = null; perbarui(); try { const h = await pulangkanPasien(kunjunganId, bentukPulang(k)); if (!aktif) return; hasil = true; const p = document.createElement('p'); p.style.margin = '0'; p.textContent = P.hasilPesan(h.tagihan_kamar, h.resume_dibuat); modal.hasil({ judul: P.hasilJudul, isi: p, aksi: [tombol(TOMBOL.tutup, tutup)] }); } catch (e) { if (aktif) galat = e instanceof GalatApi ? e.message : P.gagal; } finally { proses = false; if (aktif) perbarui(); } }
  perbarui(); return { tutup() { aktif = false; modal.tutup(); } };
}
