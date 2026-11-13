import { FARMASI, JENIS_MUTASI, TOMBOL } from '@klira/shared';
import { catatMutasiStok, stokObat } from '../../api-klien/farmasi.js';
import { GalatApi } from '../../api-klien/klien.js';
import { token } from '../../gaya/token.js';
import { bukaModal1 } from '../../komponen/modal-1/modal-1.js';
import { bidang, tombol, peringatan, lencana } from '../../komponen/ui/primitif.js';
import { adaPerubahan } from '../../util/draf/draf.js';
import { formatWaktu } from '../../util/tab/penyaring-tab.js';
import { awalMutasi, bentukMutasi, galatMutasi, gantiJenisMutasi, pilihBatch } from './keadaan-farmasi.js';

export function bukaMutasiStok({ obat, onTutup, onSelesai }) {
  const M = FARMASI.mutasi, awal = awalMutasi(String(obat.id));
  let k = { ...awal }, stok = [], riwayat = [], dicoba = false, proses = false, tercatat = false, aktif = true;
  const modal = bukaModal1({ judul: `${M.judul}: ${obat.nama_tampil}`, lindungiTutup: () => adaPerubahan(awal, k), onTutup() { aktif = false; modal.tutup(); (tercatat ? onSelesai : onTutup)(); } });
  const status = document.createElement('div'), form = document.createElement('form'), historique = document.createElement('div'); form.noValidate = true; Object.assign(form.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md });
  const controls = new Map(), simpan = tombol(M.simpan, kirim);
  function galatBidang() { const g = galatMutasi(k); for (const [nama, f] of controls) f.setGalat(dicoba ? g[nama] : undefined); }
  function tambah(nama, label, opsi, jenis = 'text', change) { const f = bidang({ id: `mutasi-${nama}`, label, opsi, jenis, nilai: k[nama], maxLength: nama === 'alasan' ? 300 : undefined, autoComplete: 'off', ubah(v) { k = change ? change(v) : { ...k, [nama]: v }; if (change) tampil(); else galatBidang(); } }); controls.set(nama, f); form.append(f.el); return f; }
  function tampil() {
    form.replaceChildren(); controls.clear();
    tambah('jenis', M.jenis, ['terima', 'keluar', 'koreksi'].map(j => ({ nilai: j, label: M.jenisLabel[j] })), 'text', v => gantiJenisMutasi(k, v));
    const p = document.createElement('small'); p.textContent = k.jenis === 'terima' ? M.petunjukTerima : k.jenis === 'keluar' ? M.petunjukKeluar : M.petunjukKoreksi; p.style.color = token.warna.teksRedup; form.append(p);
    if (k.jenis === 'terima') { tambah('batch', M.batch).kontrol.placeholder = M.batchContoh; tambah('kedaluwarsa', M.kedaluwarsa, undefined, 'date'); }
    else tambah('batch', M.batch, [{ nilai: '', label: M.pilihBatch }, ...stok.map(s => ({ nilai: s.batch, label: M.opsiBatch(s.batch, s.jumlah, obat.satuan, s.kedaluwarsa) }))], 'text', v => pilihBatch(k, stok, v));
    const bantuan = document.createElement('small'); bantuan.textContent = M.penjelasanBatch; form.append(bantuan);
    const s = stok.find(s => s.batch === k.batch); if (s) form.append(M.stokSekarang(s.jumlah, obat.satuan));
    tambah('jumlah', `${M.jumlah} (${obat.satuan})`).kontrol.inputMode = 'numeric'; if (k.jenis !== 'terima') tambah('alasan', M.alasan, undefined, 'textarea'); galatBidang();
    historique.replaceChildren(); if (riwayat.length) { historique.setAttribute('role', 'group'); historique.setAttribute('aria-label', M.riwayat); const h = document.createElement('strong'); h.textContent = M.riwayat; historique.append(h); for (const m of riwayat.slice(0, 8)) { const row = document.createElement('div'); Object.assign(row.style, { display: 'flex', gap: token.jarak.sm, flexWrap: 'wrap', marginTop: token.jarak.xs }); const petit = document.createElement('small'); petit.style.color = token.warna.teksRedup; petit.textContent = `${m.pengguna_nama ?? '-'} · ${formatWaktu(m.waktu)}`; row.append(lencana(JENIS_MUTASI.label(m.jenis), JENIS_MUTASI.warna(m.jenis)), `${M.batchRiwayat(m.batch)}: ${m.jumlah > 0 ? '+' : ''}${m.jumlah}${m.alasan ? ` (${m.alasan})` : ''}`, petit); historique.append(row); } }
  }
  async function muat() { const h = await stokObat(obat.id); if (aktif) { stok = h.stok; riwayat = h.mutasi; tampil(); } }
  async function kirim() { dicoba = true; galatBidang(); if (proses || Object.keys(galatMutasi(k)).length) return; proses = true; simpan.disabled = true; simpan.textContent = M.menyimpan; status.replaceChildren(); try { await catatMutasiStok(bentukMutasi(k)); if (!aktif) return; tercatat = true; k = { ...awal, jenis: k.jenis }; dicoba = false; status.replaceChildren(peringatan(M.tersimpan, 'biru')); tampil(); await muat(); } catch (e) { if (aktif) status.append(peringatan(e instanceof GalatApi ? e.message : M.gagal)); } finally { proses = false; simpan.disabled = false; simpan.textContent = M.simpan; } }
  form.addEventListener('submit', e => { e.preventDefault(); void kirim(); }); modal.isi.append(status, form, historique); modal.aksi.append(tombol(TOMBOL.tutup, modal.mintaTutup, 'sekunder'), simpan); tampil(); modal.fokus(); muat().catch(e => { if (aktif) status.replaceChildren(peringatan(e instanceof GalatApi ? e.message : M.gagal)); }); return { tutup() { aktif = false; modal.tutup(); } };
}
