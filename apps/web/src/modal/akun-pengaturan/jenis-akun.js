import { JENIS_AKUN } from '@klira/shared';
import { buatJenisAkun, daftarIzin, ubahJenisAkun } from '../../api-klien/izin.js';
import { GalatApi } from '../../api-klien/klien.js';
import { token } from '../../gaya/token.js';
import { bukaModal1 } from '../../komponen/modal-1/modal-1.js';
import { bidang, tombol, peringatan } from '../../komponen/ui/primitif.js';
import { KotakCentang } from '../../komponen/ui/kotak-centang.js';
import { adaPerubahanJenis, alihIzin, awalJenis, bentukBuat, bentukUbah, galatJenis, kelompokkanIzin, labelAksiCakupan, semuaTerpilih, setKelompok } from './keadaan-jenis-akun.js';
export function bukaModalJenisAkun({ jenis, onTutup, onSelesai }) {
  const ubah = jenis !== undefined, awal = awalJenis(jenis), form = { ...awal, izin: [...awal.izin] };
  let katalog = null, dicoba = false, memproses = false, aktif = true, kelompok = [];
  const modal = bukaModal1({ judul: ubah ? JENIS_AKUN.judulUbah : JENIS_AKUN.judulBuat, lebar: 'modalBesar', onTutup, lindungiTutup: () => adaPerubahanJenis(awal, form) || form.alasan.trim() !== '' });
  const pesan = document.createElement('div'); pesan.style.display = 'contents';
  const nama = bidang({ id: 'jenis-nama', label: JENIS_AKUN.nama, nilai: form.nama, maxLength: 150, ubah(v) { form.nama = v; perbarui(); } });
  const syarat = bidang({ id: 'jenis-syarat', label: JENIS_AKUN.syarat, nilai: form.syarat, maxLength: 200, ubah(v) { form.syarat = v; perbarui(); } });
  const syaratRoot = document.createElement('div'), hint = document.createElement('small'); hint.textContent = JENIS_AKUN.syaratPetunjuk; Object.assign(hint.style, { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }); syaratRoot.append(syarat.el, hint);
  const section = document.createElement('section'), kepala = document.createElement('div'), tumbuh = document.createElement('div'), h3 = document.createElement('h3'), hitungan = document.createElement('span'), info = document.createElement('span'), grid = document.createElement('div');
  section.setAttribute('aria-label', JENIS_AKUN.izinJudul); Object.assign(section.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.sm }); Object.assign(kepala.style, { display: 'flex', alignItems: 'baseline', gap: token.jarak.md }); tumbuh.style.flexGrow = '1';
  h3.textContent = JENIS_AKUN.izinJudul; Object.assign(h3.style, { margin: '0', fontSize: token.huruf.ukuran.besar, fontWeight: token.huruf.berat.tebal }); tumbuh.append(h3); hitungan.style.color = token.warna.teksRedup; kepala.append(tumbuh, hitungan);
  info.textContent = JENIS_AKUN.izinPetunjuk; Object.assign(info.style, { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil });
  Object.assign(grid.style, { display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${token.ukuran.kolomKelompok}, 1fr))`, columnGap: token.jarak.sm, rowGap: token.jarak.sm, maxHeight: token.ukuran.tinggiDaftar, overflowY: 'auto' }); section.append(kepala, info, grid);
  const alasan = bidang({ id: 'jenis-alasan', label: ubah ? JENIS_AKUN.alasan : JENIS_AKUN.alasanBuat, nilai: form.alasan, jenis: 'textarea', maxLength: 1000, ubah(v) { form.alasan = v; perbarui(); } }); alasan.kontrol.setAttribute('aria-required', String(ubah));
  const galatAlasan = document.createElement('div'); galatAlasan.style.display = 'contents'; modal.isi.append(pesan, nama.el, syaratRoot, section, alasan.el, galatAlasan);
  const simpan = tombol(JENIS_AKUN.simpan, () => void kirim()); modal.aksi.append(tombol(JENIS_AKUN.batal, onTutup, 'sekunder'), simpan);
  const checks = new Map(), buttons = new Map();
  function daftar() {
    checks.clear(); buttons.clear(); grid.replaceChildren(); kelompok = kelompokkanIzin(katalog ?? []);
    for (const k of kelompok) {
      const frame = document.createElement('fieldset'), legend = document.createElement('legend'); Object.assign(frame.style, { display: 'flex', flexDirection: 'column', alignItems: 'unset', gap: token.jarak.xs, padding: token.jarak.sm, border: `${token.ukuran.garis} solid ${token.warna.garis}`, borderRadius: token.radius.sedang, margin: '0', minWidth: '0' });
      legend.textContent = JENIS_AKUN.izinFitur(k.label); Object.assign(legend.style, { fontWeight: token.huruf.berat.tebal, padding: `0 ${token.jarak.xs}` }); frame.append(legend);
      const pilih = tombol('', () => { form.izin = setKelompok(form.izin, k, !semuaTerpilih(form.izin, k)); perbarui(); }, 'teks'); pilih.style.alignSelf = 'flex-start'; buttons.set(k.fitur, pilih); frame.append(pilih);
      for (const i of k.izin) { const check = KotakCentang({ id: `izin-${i.id}`, label: labelAksiCakupan(i), checked: form.izin.includes(i.id), onChange() { form.izin = alihIzin(form.izin, i.id); perbarui(); } }); checks.set(i.id, check.querySelector('input')); frame.append(check); }
      grid.append(frame);
    }
    perbarui();
  }
  function perbarui() {
    const g = galatJenis(form, ubah), berubah = adaPerubahanJenis(awal, form); nama.setGalat(dicoba ? g.nama : undefined); galatAlasan.replaceChildren(); if (dicoba && g.alasan_perubahan) galatAlasan.append(peringatan(g.alasan_perubahan));
    simpan.disabled = memproses || ubah && !berubah; simpan.textContent = memproses ? JENIS_AKUN.menyimpan : JENIS_AKUN.simpan;
    hitungan.textContent = JENIS_AKUN.izinTerpilih(form.izin.length, katalog?.length ?? 0); for (const [id, check] of checks) check.checked = form.izin.includes(id);
    for (const k of kelompok) buttons.get(k.fitur).textContent = semuaTerpilih(form.izin, k) ? JENIS_AKUN.lepasSemuaFitur : JENIS_AKUN.pilihSemuaFitur;
  }
  async function kirim() {
    dicoba = true; perbarui(); if (memproses || Object.keys(galatJenis(form, ubah)).length || ubah && !adaPerubahanJenis(awal, form)) return;
    memproses = true; pesan.replaceChildren(); perbarui();
    try { if (jenis) await ubahJenisAkun(jenis.id, bentukUbah(awal, form)); else await buatJenisAkun(bentukBuat(form)); if (aktif) onSelesai(); }
    catch (e) { if (aktif) { pesan.append(peringatan(e instanceof GalatApi ? e.message : JENIS_AKUN.gagalSimpan)); memproses = false; perbarui(); } }
  }
  daftarIzin().then(k => { if (aktif) { katalog = k; daftar(); } }).catch(e => { if (aktif) pesan.append(peringatan(e instanceof GalatApi ? e.message : JENIS_AKUN.gagalMuatKatalog)); });
  perbarui(); modal.fokus(); return () => { aktif = false; modal.tutup(); };
}
