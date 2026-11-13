import { token } from '../../gaya/token.js';
import { tab } from '../../komponen/ui/primitif.js';
import { penggunaSaatIni } from '../../util/sesi/konteks-pengguna.js';
import { navigasiSaatIni } from '../../util/navigasi/navigasi.js';
import { bacaTabTerakhir, pilihTab, simpanTabTerakhir } from '../../util/tab/ingatan-tab.js';
import { HALAMAN_PENGATURAN, tabDiizinkan } from '../../util/tab/tab-pengaturan.js';
const simpanan = () => typeof sessionStorage === 'undefined' ? null : sessionStorage;
const modul = { pengguna: ['tab-pengguna', 'pasangTabPengguna'], 'jenis-akun': ['tab-jenis-akun', 'pasangTabJenisAkun'], peringatan: ['tab-peringatan', 'pasangTabPeringatan'], keamanan: ['tab-keamanan', 'pasangTabKeamanan'], profil: ['tab-profil', 'pasangTabProfil'], backup: ['tab-backup', 'pasangTabBackup'] };
function buatHalamanPengaturan(kunci) {
  const pengguna = penggunaSaatIni().pengguna, { path, search, ganti } = navigasiSaatIni(), h = HALAMAN_PENGATURAN[kunci], daftar = pengguna ? tabDiizinkan(h.tab, pengguna) : [], ids = daftar.map(t => t.id);
  let aktif, controller, versi = 0, hidup = true;
  const el = document.createElement('div'), header = document.createElement('header'), h1 = document.createElement('h1'), isi = document.createElement('div'); el.style.display = isi.style.display = 'contents'; Object.assign(header.style, { display: 'flex', alignItems: 'center', gap: token.jarak.md, flexWrap: 'wrap' }); h1.textContent = h.judul; Object.assign(h1.style, { margin: '0', fontSize: token.huruf.ukuran.halaman, fontWeight: token.huruf.berat.tebal, flexGrow: '1' }); header.append(h1);
  const tabs = ids.length ? tab(daftar, '', h.judul, id => ganti(`${path}?tab=${id}`)) : null; if (tabs) header.append(tabs.el); el.append(header, isi);
  async function perbaruiAlamat(alamat) {
    const dariAlamat = new URLSearchParams(alamat).get('tab'), terpilih = ids.length ? pilihTab(ids, dariAlamat, bacaTabTerakhir(kunci, ids, simpanan())) : undefined;
    if (!terpilih) return; tabs.pilih(terpilih); simpanTabTerakhir(kunci, terpilih, simpanan());
    if (aktif === terpilih) controller?.perbaruiAlamat?.(dariAlamat === terpilih ? alamat : '');
    else { const saat = ++versi; controller?.tutup(); controller = undefined; isi.replaceChildren(); aktif = terpilih; const [file, ekspor] = modul[terpilih], m = await import(`./${file}.js`); if (!hidup || saat !== versi) return; controller = m[ekspor](isi, { search: dariAlamat === terpilih ? alamat : '', ubahAlamat: q => ganti(`${path}${q}`) }); }
    if (dariAlamat !== terpilih) ganti(`${path}?tab=${terpilih}`);
  }
  void perbaruiAlamat(search); el.perbaruiAlamat = perbaruiAlamat; el.tutup = () => { hidup = false; versi++; controller?.tutup(); el.replaceChildren(); }; return el;
}
export const HalamanAkses = () => buatHalamanPengaturan('akses');
export const HalamanPengaturanKlinik = () => buatHalamanPengaturan('klinik');
