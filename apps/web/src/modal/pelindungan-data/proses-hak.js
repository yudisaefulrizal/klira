import { PDP, TOMBOL } from '@klira/shared';
import { prosesHak } from '../../api-klien/pdp.js';
import { GalatApi } from '../../api-klien/klien.js';
import { bukaModalBertahap } from '../../komponen/modal-bertahap/modal-bertahap.js';
import { DaftarRingkasan } from '../../komponen/ui/susunan.js';
import { tombol } from '../../komponen/ui/primitif.js';
import { adaPerubahan } from '../../util/draf/draf.js';
import { formatWaktu } from '../../util/tab/penyaring-tab.js';
import { awalProsesHak, bentukProsesHak, galatProsesHak, indeksTahapHak } from './keadaan-pdp.js';
import { bidangPdp } from './formulir.js';
const H = PDP.hak;
export function bukaProsesHak({ hak, onTutup, onSelesai }) {
  const tahap = hak.tahap_berikut, awal = awalProsesHak(), k = { ...awal }; let dicoba = false, memproses = false, selesai = false, aktif = true;
  const f = bidangPdp(k, { prefix: 'ph', galat: () => tahap ? galatProsesHak(tahap, k) : {}, dicoba: () => dicoba, berubah: () => modal.perbarui() });
  const menunggu = () => f.kecil(tahap === null ? H.selesai : H.tahapBerikut[tahap]);
  const langkah = [
    { id: 'tinjau', judul: H.langkahProses.tinjau, isi() {
      const el = f.kolom(); el.append(f.kecil(H.tinjauInfo), DaftarRingkasan({ bagian: [{ judul: `${hak.pasien_nama} (${hak.pasien_nomor_rm})`, baris: [{ label: H.jenis, nilai: H.hakLabel[hak.jenis] }, { label: H.pemohon, nilai: `${hak.pemohon_nama} (${H.hubunganLabel[hak.pemohon_hubungan]}) · ${H.saluranLabel[hak.saluran]}` }, { label: H.verifikasi, nilai: hak.verifikasi }, { label: H.rincian, nilai: hak.rincian ?? '-' }, { label: H.kolom.batas, nilai: `${formatWaktu(hak.batas_waktu)}${hak.sisa_jam !== null ? ` · ${PDP.batas.sisa(hak.sisa_jam)}` : ''}` }, { label: H.kolom.status, nilai: tahap ? H.tahapBerikut[tahap] : H.selesai }] }] })); return el;
    } },
    { id: 'keputusan', judul: H.langkahProses.keputusan, selesai: () => tahap !== 'keputusan', isi() {
      const el = f.kolom(); if (tahap !== 'keputusan') return menunggu(); const alasan = document.createElement('div'); alasan.style.display = 'contents';
      function alasanTolak() { alasan.replaceChildren(); if (k.keputusan === 'tolak') alasan.append(f.isian('alasan', H.alasanTolak, { jenis: 'textarea', maxLength: 500, petunjuk: H.alasanTolakPetunjuk })); f.perbarui(); }
      el.append(f.isian('keputusan', H.keputusan, { opsi: [{ nilai: '', label: '...' }, { nilai: 'setujui', label: H.setujui }, { nilai: 'tolak', label: H.tolak }], ubah: alasanTolak }), alasan); alasanTolak(); return el;
    } },
    { id: 'pelaksanaan', judul: H.langkahProses.pelaksanaan, selesai: () => tahap === 'notifikasi' || tahap === null, isi() { const el = f.kolom(); if (tahap !== 'pelaksanaan') return menunggu(); el.append(f.isian('pelaksanaan', H.pelaksanaan, { jenis: 'textarea', maxLength: 1000 })); f.perbarui(); return el; } },
    { id: 'notifikasi', judul: H.langkahProses.notifikasi, selesai: () => tahap === null, isi() { const el = f.kolom(); if (tahap !== 'notifikasi') return menunggu(); el.append(f.isian('catatan', H.notifikasi, { jenis: 'textarea', maxLength: 300 }), f.kecil(H.notifikasiPetunjuk)); return el; } },
  ];
  const modal = bukaModalBertahap({ judul: H.prosesJudul, langkah, labelKirim: H.simpanProses, onKirim: () => void kirim(), onTutup: () => selesai ? onSelesai() : onTutup(), lindungiTutup: () => adaPerubahan(awal, k) }); modal.ke(indeksTahapHak(tahap)); modal.perbarui({ nonaktif: tahap === null });
  async function kirim() {
    dicoba = true; if (!tahap || memproses) return; const g = f.perbarui(); if (Object.keys(g).length) { modal.ke(indeksTahapHak(tahap)); return; }
    memproses = true; modal.perbarui({ labelKirim: H.memproses, nonaktif: true, galat: '' });
    try { await prosesHak(hak.id, bentukProsesHak(tahap, k)); if (!aktif) return; selesai = true; const p = document.createElement('p'); p.style.margin = '0'; p.textContent = H.tahapTersimpan; modal.hasil({ judul: H.prosesJudul, isi: p, aksi: [tombol(TOMBOL.tutup, onSelesai)] }); }
    catch (e) { if (aktif) modal.perbarui({ galat: e instanceof GalatApi ? e.message : H.gagalProses }); }
    finally { if (aktif) { memproses = false; modal.perbarui({ labelKirim: H.simpanProses, nonaktif: tahap === null }); } }
  }
  return () => { aktif = false; f.tutup(); modal.tutup(); };
}
