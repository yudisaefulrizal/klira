import { PDP, TOMBOL } from '@klira/shared';
import { catatHak } from '../../api-klien/pdp.js';
import { GalatApi } from '../../api-klien/klien.js';
import { bukaModalBertahap } from '../../komponen/modal-bertahap/modal-dom.js';
import { PemilihPasien } from '../../komponen/pemilih-pasien.js';
import { DaftarRingkasan } from '../../komponen/ui/susunan.js';
import { tombol } from '../../komponen/ui/native.js';
import { adaPerubahan } from '../../util/draf.js';
import { formatWaktu } from '../../util/penyaring-tab.js';
import { awalHak, bentukHak, galatHak, langkahBermasalahHak } from './keadaan-pdp.js';
import { bidangPdp } from './formulir-dom.js';
const H = PDP.hak;
const opsi = (peta, kosong) => [...(kosong ? [{ nilai: '', label: kosong }] : []), ...Object.entries(peta).map(([nilai, label]) => ({ nilai, label }))];
export function bukaCatatHak({ onTutup, onSelesai }) {
  const awal = awalHak(), k = { ...awal }; let dicoba = false, memproses = false, batas = null, aktif = true, pasien;
  const f = bidangPdp(k, { prefix: 'hak', galat: () => galatHak(k), dicoba: () => dicoba, berubah: () => { pasien?.perbarui({ galat: dicoba ? galatHak(k).pasien_id : undefined }); modal.perbarui(); } });
  const langkah = [
    { id: 'pemohon', judul: H.langkah.pemohon, selesai: () => !langkahBermasalahHak(galatHak(k)), isi() {
      const el = f.kolom(); pasien = PemilihPasien({ id: 'hak-pasien', pasienId: k.pasien_id, galat: dicoba ? galatHak(k).pasien_id : undefined, onPilih(id) { k.pasien_id = id; pasien.perbarui({ galat: dicoba ? galatHak(k).pasien_id : undefined }); modal.perbarui(); } }); f.simpanCleanup(() => pasien.tutup());
      el.append(pasien, f.isian('pemohon_nama', H.pemohon, { id: 'hak-pemohon', autoComplete: 'off' }), f.isian('pemohon_hubungan', H.hubungan, { id: 'hak-hubungan', opsi: opsi(H.hubunganLabel) }), f.isian('saluran', H.saluran, { opsi: opsi(H.saluranLabel) }), f.isian('verifikasi', H.verifikasi, { jenis: 'textarea', maxLength: 300, petunjuk: H.verifikasiPetunjuk })); f.perbarui(); return el;
    } },
    { id: 'jenis', judul: H.langkah.jenis, selesai: () => !galatHak(k).jenis, isi() { const el = f.kolom(); el.append(f.isian('jenis', H.jenis, { opsi: opsi(H.hakLabel, '...') }), f.isian('rincian', H.rincian, { jenis: 'textarea', maxLength: 1000 })); f.perbarui(); return el; } },
    { id: 'ringkasan', judul: H.langkah.ringkasan, isi() { f.kolom(); return DaftarRingkasan({ bagian: [{ judul: H.judul, baris: [{ label: H.pemohon, nilai: `${k.pemohon_nama || '-'} (${H.hubunganLabel[k.pemohon_hubungan] ?? '-'})` }, { label: H.saluran, nilai: H.saluranLabel[k.saluran] ?? '-' }, { label: H.verifikasi, nilai: k.verifikasi || '-' }, { label: H.jenis, nilai: H.hakLabel[k.jenis] ?? '-' }, { label: H.rincian, nilai: k.rincian || '-' }] }] }); } },
  ];
  const modal = bukaModalBertahap({ judul: H.judul, langkah, labelKirim: H.ajukan, onKirim: () => void kirim(), onTutup: () => batas ? onSelesai() : onTutup(), lindungiTutup: () => adaPerubahan(awal, k) });
  async function kirim() {
    dicoba = true; if (memproses) return; const g = f.perbarui(), masalah = langkahBermasalahHak(g); if (masalah >= 0) { modal.ke(masalah); return; }
    memproses = true; modal.perbarui({ labelKirim: H.mencatat, nonaktif: true, galat: '' });
    try { const hasil = await catatHak(bentukHak(k)); if (!aktif) return; batas = hasil.batas_waktu; const p = document.createElement('p'); p.style.margin = '0'; p.textContent = H.hasilPesan(formatWaktu(batas)); modal.hasil({ judul: H.hasilJudul, isi: p, aksi: [tombol(TOMBOL.tutup, onSelesai)] }); }
    catch (e) { if (aktif) modal.perbarui({ galat: e instanceof GalatApi ? e.message : H.gagal }); }
    finally { if (aktif) { memproses = false; modal.perbarui({ labelKirim: H.ajukan, nonaktif: false }); } }
  }
  return () => { aktif = false; f.tutup(); modal.tutup(); };
}
