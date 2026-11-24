import { token } from '../../gaya/token.js';
import { tab } from '../../komponen/ui/primitif.js';
import { penggunaSaatIni } from '../../util/sesi/konteks-pengguna.js';
import { navigasiSaatIni } from '../../util/navigasi/navigasi.js';
import { bacaTabTerakhir, pilihTab, simpanTabTerakhir } from '../../util/tab/ingatan-tab.js';
import { HALAMAN_PENGATURAN, tabDiizinkan } from '../../util/tab/tab-pengaturan.js';
const simpanan = () => typeof sessionStorage === 'undefined' ? null : sessionStorage;
const modul = {
  pengguna: ['./tab-pengguna.js', 'pasangTabPengguna'],
  'jenis-akun': ['./tab-jenis-akun.js', 'pasangTabJenisAkun'],
  peringatan: ['./tab-peringatan.js', 'pasangTabPeringatan'],
  keamanan: ['./tab-keamanan.js', 'pasangTabKeamanan'],
  profil: ['./tab-profil.js', 'pasangTabProfil'],
  poli: ['../../komponen/master/kelola-master-tab.js', 'KelolaMasterTab', 'master'],
  shift: ['../../komponen/master/tab-shift.js', 'TabShift', 'komponen'],
  backup: ['./tab-backup.js', 'pasangTabBackup'],
  satusehat: ['../satusehat/satusehat.js', 'HalamanSatusehat', 'komponen'],
  'test-endpoint': ['../test-endpoint/test-endpoint.js', 'HalamanTestEndpoint', 'komponen'],
  'pelindungan-data': ['../pelindungan-data/pelindungan-data.js', 'pasangPelindunganData', 'pdp'],
  'log-audit': ['../log-audit/log-audit.js', 'pasangLogAudit', 'audit'],
  arsitektur: ['./tab-arsitektur.js', 'TabArsitektur', 'komponen'],
};
function buatHalamanPengaturan(kunci) {
  const pengguna = penggunaSaatIni().pengguna, { path, search, ganti } = navigasiSaatIni(), h = HALAMAN_PENGATURAN[kunci], daftar = pengguna ? tabDiizinkan(h.tab, pengguna) : [], ids = daftar.map(t => t.id);
  let aktif, controller, versi = 0, hidup = true;
  const el = document.createElement('div'), header = document.createElement('header'), h1 = document.createElement('h1'), isi = document.createElement('div'); el.style.display = isi.style.display = 'contents'; Object.assign(header.style, { display: 'flex', alignItems: 'center', gap: token.jarak.md, flexWrap: 'wrap' }); h1.textContent = h.judul; Object.assign(h1.style, { margin: '0', fontSize: token.huruf.ukuran.halaman, fontWeight: token.huruf.berat.tebal, flexGrow: '1' }); header.append(h1);
  const tabs = ids.length ? tab(daftar, '', h.judul, id => ganti(`${path}?tab=${id}`)) : null; if (tabs) header.append(tabs.el); el.append(header, isi);
  async function perbaruiAlamat(alamat) {
    const dariAlamat = new URLSearchParams(alamat).get('tab'), terpilih = ids.length ? pilihTab(ids, dariAlamat, bacaTabTerakhir(kunci, ids, simpanan())) : undefined;
    if (!terpilih) return; tabs.pilih(terpilih); simpanTabTerakhir(kunci, terpilih, simpanan());
    if (aktif === terpilih) controller?.perbaruiAlamat?.(dariAlamat === terpilih ? alamat : '');
    else {
      const saat = ++versi; controller?.tutup(); controller = undefined; isi.replaceChildren(); aktif = terpilih;
      const [file, ekspor, tipe] = modul[terpilih], m = await import(file);
      if (!hidup || saat !== versi) return;
      const gabungTab = q => { const p = new URLSearchParams(q.startsWith('?') ? q.slice(1) : q); p.set('tab', terpilih); return `${path}?${p}`; };
      const subSearch = dariAlamat === terpilih ? alamat : '';
      if (tipe === 'komponen') {
        const node = m[ekspor](); isi.append(node);
        controller = { tutup() { node.tutup?.(); isi.replaceChildren(); } };
      } else if (tipe === 'master') {
        const node = m[ekspor]({ jenis: terpilih }); isi.append(node); node.perbaruiAlamat?.(subSearch);
        controller = { perbaruiAlamat(q) { node.perbaruiAlamat?.(q); }, tutup() { node.tutup?.(); isi.replaceChildren(); } };
      } else if (tipe === 'audit') {
        controller = m[ekspor](isi, subSearch, q => ganti(gabungTab(q)));
      } else if (tipe === 'pdp') {
        controller = m[ekspor](isi, {
          pengguna, search: subSearch, ganti: q => ganti(gabungTab(q)),
          bukaModal: async modal => {
            const mod = { dpia: ['dpia-pdp', 'bukaDpiaPdp', 'dpia'], insiden: ['insiden-pdp', 'bukaInsidenPdp', 'insiden'], prosesor: ['prosesor-pdp', 'bukaProsesorPdp', 'prosesor'], retensi: ['pemusnahan-pdp', 'bukaPemusnahanPdp', 'musnah'], 'catat-hak': ['catat-hak', 'bukaCatatHak', null], hak: ['proses-hak', 'bukaProsesHak', 'hak'] };
            const [f, eks, prop] = mod[modal.jenis], md = await import(`../../modal/pelindungan-data/${f}.js`);
            let tutup; const onTutup = () => tutup?.(); const onSelesai = () => { onTutup(); controller?.muat(); };
            tutup = md[eks]({ ...(prop ? { [prop]: modal.nilai } : {}), onTutup, onSelesai });
          },
        });
      } else {
        controller = m[ekspor](isi, { search: subSearch, ubahAlamat: q => ganti(`${path}${q}`) });
      }
    }
    if (dariAlamat !== terpilih) ganti(`${path}?tab=${terpilih}`);
  }
  void perbaruiAlamat(search); el.perbaruiAlamat = perbaruiAlamat; el.tutup = () => { hidup = false; versi++; controller?.tutup(); el.replaceChildren(); }; return el;
}
export const HalamanAkses = () => buatHalamanPengaturan('akses');
export const HalamanPengaturanKlinik = () => buatHalamanPengaturan('klinik');
