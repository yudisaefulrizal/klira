import { PDP, TOMBOL } from '@klira/shared';
import { detailPasien } from '../../api-klien/pasien.js';
import { simpanInsiden } from '../../api-klien/pdp.js';
import { GalatApi } from '../../api-klien/klien.js';
import { token } from '../../gaya/token.js';
import { bukaModalBertahap } from '../../komponen/modal-bertahap/modal-bertahap.js';
import { PemilihPasien } from '../../komponen/pencarian/pemilih-pasien.js';
import { KotakCentang } from '../../komponen/ui/kotak-centang.js';
import { DaftarRingkasan } from '../../komponen/ui/susunan.js';
import { tombol, peringatan } from '../../komponen/ui/primitif.js';
import { adaPerubahan } from '../../util/draf/draf.js';
import { formatWaktu } from '../../util/tab/penyaring-tab.js';
import { awalInsiden, bentukInsiden, buangPasienTerdampak, galatInsiden, langkahBermasalahInsiden, tambahPasienTerdampak } from './keadaan-pdp.js';
import { bidangPdp } from './formulir.js';
const I = PDP.insiden;
const batasDari = diketahui => diketahui ? new Date(new Date(`${diketahui}:00+07:00`).getTime() + 72 * 3600000).toISOString() : '';
export function bukaInsidenPdp({ insiden = null, onTutup, onSelesai }) {
  const awal = awalInsiden(insiden), k = { ...awal, pasien: awal.pasien.map(p => ({ ...p })) }; let pilih = null, dicoba = false, memproses = false, selesai = false, aktif = true;
  const f = bidangPdp(k, { prefix: 'ins', galat: () => galatInsiden(k), dicoba: () => dicoba, berubah: () => modal.perbarui() });
  const langkah = [
    { id: 'kejadian', judul: I.langkah.kejadian, selesai: () => { const g = galatInsiden(k); return !g.waktu_kejadian && !g.waktu_diketahui && !g.uraian; }, isi() {
      const el = f.kolom(), batas = f.kecil('');
      function tanggal() { batas.hidden = !k.waktu_diketahui; batas.textContent = k.waktu_diketahui ? I.batas(formatWaktu(batasDari(k.waktu_diketahui))) : ''; }
      el.append(f.isian('waktu_kejadian', I.waktuKejadian, { id: 'ins-kejadian', jenis: 'datetime-local' }), f.isian('waktu_diketahui', I.waktuDiketahui, { id: 'ins-diketahui', jenis: 'datetime-local', ubah: tanggal }), batas, KotakCentang({ id: 'ins-siber', label: I.siber, checked: k.siber, onChange(e) { k.siber = e.target.checked; } }), f.isian('uraian', I.uraian, { jenis: 'textarea', maxLength: 4000 })); tanggal(); f.perbarui(); return el;
    } },
    { id: 'dampak', judul: I.langkah.dampak, selesai: () => { const g = galatInsiden(k); return !g.data_terungkap && !g.pasien_ids; }, isi() {
      const el = f.kolom(), judul = document.createElement('strong'), list = document.createElement('div'); list.style.display = 'contents';
      function daftar() {
        judul.textContent = `${I.pasienTerdampak} (${k.pasien.length})`; list.replaceChildren(); if (!k.pasien.length) list.append(f.kecil(I.kosongPasien));
        for (const p of k.pasien) { const row = document.createElement('div'), nama = document.createElement('span'); Object.assign(row.style, { display: 'flex', alignItems: 'center', gap: token.jarak.sm }); nama.style.flexGrow = '1'; nama.append(p.nama, ' ', f.kecil(p.nomor_rm)); row.append(nama);
          if (!insiden?.pasien.some(lama => lama.id === p.id)) row.append(tombol(I.buang, () => { k.pasien = buangPasienTerdampak(k, p.id).pasien; daftar(); f.perbarui(); modal.perbarui(); }, 'teks')); list.append(row); }
      }
      const tambah = tombol(I.tambahPasien, async () => {
        if (pilih === null) return;
        try { const p = await detailPasien(pilih); if (!aktif) return; k.pasien = tambahPasienTerdampak(k, { id: p.id, nama: p.nama, nomor_rm: p.nomor_rm }).pasien; pilih = null; picker.perbarui({ pasienId: null }); tambah.disabled = true; daftar(); f.perbarui(); modal.perbarui(); }
        catch (e) { if (aktif) modal.perbarui({ galat: e instanceof GalatApi ? e.message : I.gagal }); }
      }, 'sekunder'); tambah.disabled = pilih === null;
      const picker = PemilihPasien({ id: 'ins-pasien', pasienId: pilih, onPilih(id) { pilih = id; tambah.disabled = id === null; } }); f.simpanCleanup(() => picker.tutup());
      el.append(f.isian('data_terungkap', I.dataTerungkap, { id: 'ins-data', jenis: 'textarea', maxLength: 1000 }), judul, list, picker, tambah); daftar(); f.perbarui(); return el;
    } },
    { id: 'penanganan', judul: I.langkah.penanganan, isi() { const el = f.kolom(); el.append(f.isian('penanganan', I.penanganan, { jenis: 'textarea', maxLength: 4000 }), f.isian('pemulihan', I.pemulihan, { jenis: 'textarea', maxLength: 4000 }), f.isian('kontak_ppdp', I.kontak, { id: 'ins-kontak', autoComplete: 'off' })); return el; } },
    { id: 'notifikasi', judul: I.langkah.notifikasi, selesai: () => { const g = galatInsiden(k); return !g.notifikasi_pasien_pada && !g.notifikasi_lembaga_pada; }, isi() {
      const el = f.kolom(); if (k.waktu_diketahui) el.append(peringatan(I.batas(formatWaktu(batasDari(k.waktu_diketahui))), 'biru'));
      el.append(f.isian('notifikasi_pasien_pada', I.notifPasien, { id: 'ins-notif-pasien', jenis: 'datetime-local' }), f.isian('notifikasi_lembaga_pada', I.notifLembaga, { id: 'ins-notif-lembaga', jenis: 'datetime-local' }), DaftarRingkasan({ bagian: [{ judul: I.judul, baris: [{ label: I.uraian, nilai: k.uraian || '-' }, { label: I.dataTerungkap, nilai: k.data_terungkap || '-' }, { label: I.pasienTerdampak, nilai: I.terdampak(k.pasien.length) }, { label: I.penanganan, nilai: k.penanganan || '-' }] }] })); f.perbarui(); return el;
    } },
  ];
  const modal = bukaModalBertahap({ judul: I.judul, langkah, labelKirim: I.simpan, onKirim: () => void kirim(), onTutup: () => selesai ? onSelesai() : onTutup(), lindungiTutup: () => adaPerubahan(awal, k) });
  async function kirim() {
    dicoba = true; if (memproses) return; const g = f.perbarui(), masalah = langkahBermasalahInsiden(g); if (masalah >= 0) { modal.ke(masalah); return; }
    memproses = true; modal.perbarui({ labelKirim: PDP.menyimpan, nonaktif: true, galat: '' });
    try { await simpanInsiden(insiden?.id ?? null, bentukInsiden(k)); if (!aktif) return; selesai = true; const p = document.createElement('p'); p.style.margin = '0'; p.textContent = I.hasilPesan; modal.hasil({ judul: I.hasilJudul, isi: p, aksi: [tombol(TOMBOL.tutup, onSelesai)] }); }
    catch (e) { if (aktif) modal.perbarui({ galat: e instanceof GalatApi ? e.message : I.gagal }); }
    finally { if (aktif) { memproses = false; modal.perbarui({ labelKirim: I.simpan, nonaktif: false }); } }
  }
  return () => { aktif = false; f.tutup(); modal.tutup(); };
}
