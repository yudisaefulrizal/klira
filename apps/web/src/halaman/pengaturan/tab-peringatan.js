import { DAFTAR_PERINGATAN as D, JENIS_PERINGATAN, PERINGATAN_IZIN } from '@klira/shared';
import { daftarPeringatan } from '../../api-klien/izin.js';
import { GalatApi } from '../../api-klien/klien.js';
import { bidang, tombol, baris, sel, lencana, paginasi } from '../../komponen/ui/native.js';
import { token } from '../../gaya/token.js';
import { BAWAAN_PERINGATAN, bacaPenyaring, formatWaktu, queryPenyaring, rentangTerbalik, saringanPeringatan, ubahPenyaring } from '../../util/penyaring-tab.js';
import { tabelTab } from './tabel-dom.js';
export function pasangTabPeringatan(wadah, { search, ubahAlamat }) {
  let keadaan = bacaPenyaring(search, BAWAAN_PERINGATAN), draf = { ...keadaan.nilai }, hasil = null, aktif = true, versi = 0;
  const ui = tabelTab({ id: 'peringatan', label: D.judulTab, kolom: ['pengguna', 'jenis', 'alasan', 'penetapan', 'waktu', 'diterima'].map(k => ({ judul: D.kolom[k] })), catatan: D.catatan });
  const judul = document.createElement('div'); judul.textContent = D.judulTab; Object.assign(judul.style, { padding: `${token.jarak.md} ${token.jarak.md} 0`, fontSize: token.huruf.ukuran.besar, fontWeight: token.huruf.berat.tebal });
  const form = document.createElement('form'); Object.assign(form.style, { display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap', gap: token.jarak.md, padding: token.jarak.md }); ui.kepala.style.display = 'contents'; ui.kepala.append(judul, form); wadah.replaceChildren(ui.el);
  const inputs = {};
  for (const [nama, label, jenis] of [['cari', D.filterPengguna, 'search'], ['jenis', D.filterJenis, 'text'], ['dari', D.filterDari, 'date'], ['sampai', D.filterSampai, 'date']]) {
    const f = bidang({ id: `peringatan-${nama}`, label, jenis, nilai: draf[nama], ...(nama === 'jenis' ? { opsi: [{ nilai: '', label: D.semuaJenis }, ...JENIS_PERINGATAN.map(j => ({ nilai: j, label: PERINGATAN_IZIN[j] }))] } : {}), ubah(v) { draf[nama] = v; validasiRentang(); } }); if (nama === 'jenis') f.kontrol.style.maxWidth = token.ukuran.kartu; inputs[nama] = f; form.append(f.el);
  }
  const terapkan = tombol(D.terapkan); terapkan.type = 'submit'; form.append(terapkan, tombol(D.aturUlang, () => pasang({ nilai: { ...BAWAAN_PERINGATAN }, halaman: 1 }), 'sekunder'));
  function pasang(k) { ubahAlamat(queryPenyaring('peringatan', k, BAWAAN_PERINGATAN)); }
  function validasiRentang() { const terbalik = rentangTerbalik(draf.dari, draf.sampai); inputs.sampai.setGalat(terbalik ? D.rentangTerbalik : undefined); terapkan.disabled = terbalik; return !terbalik; }
  form.addEventListener('submit', e => { e.preventDefault(); if (validasiRentang()) pasang(ubahPenyaring(keadaan, draf)); });
  function tampil() {
    ui.tbody.replaceChildren(...(hasil?.data.map(p => { const pengguna = sel(p.pengguna_nama ?? D.tanpaPengguna); pengguna.style.fontWeight = token.huruf.berat.tebal; const penetap = document.createElement('div'), sumber = document.createElement('div'); penetap.textContent = p.ditetapkan_oleh_nama ?? D.tanpaPengguna; sumber.textContent = D.sumber[p.sumber] ?? p.sumber; Object.assign(sumber.style, { fontSize: token.huruf.ukuran.kecil, color: token.warna.teksRedup }); return baris(pengguna, sel(PERINGATAN_IZIN[p.jenis_peringatan] ?? p.jenis_peringatan), sel(p.alasan_pimpinan), sel(penetap, sumber), sel(formatWaktu(p.waktu)), sel(lencana(p.diterima_untuk_akun ? D.diterimaYa : D.diterimaTidak, p.diterima_untuk_akun ? 'hijau' : 'abu'))); }) ?? []));
    ui.kosongkan(hasil && !hasil.data.length, D.kosong); ui.nav.replaceChildren(); if (hasil) { const nav = paginasi(keadaan.halaman, hasil.total, hasil.ukuran, h => pasang({ ...keadaan, halaman: h })); if (nav) ui.nav.append(nav); }
  }
  async function muat() { const saat = ++versi; try { const h = await daftarPeringatan(saringanPeringatan(keadaan, 20)); if (aktif && saat === versi) { hasil = h; ui.galat(null); tampil(); } } catch (e) { if (aktif && saat === versi) ui.galat(e instanceof GalatApi ? e.message : D.gagalMuat); } }
  validasiRentang(); void muat(); return { perbaruiAlamat(baru) { const lama = JSON.stringify(keadaan); keadaan = bacaPenyaring(baru, BAWAAN_PERINGATAN); draf = { ...keadaan.nilai }; for (const [k, f] of Object.entries(inputs)) f.kontrol.value = draf[k]; validasiRentang(); if (lama !== JSON.stringify(keadaan)) { tampil(); void muat(); } }, tutup() { aktif = false; versi++; wadah.replaceChildren(); } };
}
