import { TombolPesan as TombolWa, PanelPesan as PanelWa } from './halaman/pesan/whatsapp/panel-pesan.js';
import { TombolPesan as TombolIg, PanelPesan as PanelIg } from './halaman/pesan/instagram/panel-pesan.js';
import { sesiPesan as whatsapp } from './halaman/pesan/whatsapp/konteks-pesan.js';
import { sesiPesan as instagram } from './halaman/pesan/instagram/konteks-pesan.js';
import { HALAMAN_AWAL, HALAMAN_MENU } from '@klira/shared';
import { sesiPengguna, penggunaSaatIni } from './util/sesi/konteks-pengguna.js';
import { navigasi } from './util/navigasi/navigasi.js';
import { putuskanRute } from './util/sesi/penjaga-rute.js';
import { pasangTemaTampilan } from './komponen/tampilan/tema-tampilan.js';
import { pasangTataLetak } from './komponen/tampilan/tata-letak.js';
import { pasangLogAudit } from './halaman/log-audit/log-audit.js';
import { pasangStatistik } from './halaman/statistik/statistik.js';
import { pasangBerandaTugas } from './halaman/beranda-tugas/beranda-tugas.js';
import { pasangPelindunganData } from './halaman/pelindungan-data/pelindungan-data.js';

const halaman = {
  [HALAMAN_AWAL.daftarPasien]: ['daftar-pasien', 'HalamanDaftarPasien'],
  '/pesan': ['pesan', 'HalamanPesan'], '/akses': ['pengaturan', 'HalamanAkses'], '/pengaturan-klinik': ['pengaturan', 'HalamanPengaturanKlinik'],
  '/penunjang': ['penunjang', 'HalamanPenunjang'], '/farmasi': ['farmasi', 'HalamanFarmasi'], '/kasir-klaim': ['kasir-klaim', 'HalamanKasirKlaim'], '/rekam-medis': ['rekam-medis', 'HalamanRekamMedis'], '/rawat-inap': ['rawat-inap', 'HalamanRawatInap'],
};
export async function pasangAplikasiInternal(wadah) {
  let tutupHalaman, kerangka, tutupTema, generasi = 0, pathAktif, controller, aktif = true, memasang = false;
  const tema = document.createElement('div'), badan = document.createElement('div'), pesan = document.createElement('div');
  tema.style.display = badan.style.display = pesan.style.display = 'contents'; wadah.replaceChildren(tema, badan, pesan);
  async function tampilkan() {
    const { path, search } = navigasi.potret();
    // Halaman yang sama masih dipasang (mis. halaman memanggil ganti() saat dibangun): jangan pasang kedua kali.
    if (memasang && path === pathAktif) return;
    const versi = ++generasi, { pengguna, memuat, keluar } = penggunaSaatIni();
    if (memuat) return;
    const keputusan = putuskanRute(path, pengguna);
    if (keputusan.tipe === 'alihkan') { navigasi.ganti(keputusan.ke); return; }
    if (path === pathAktif && controller?.perbaruiAlamat) { controller.perbaruiAlamat(search); return; }
    tutupHalaman?.(); controller = undefined; pathAktif = path;
    memasang = true;
    try {
      if (!kerangka) kerangka = pasangTataLetak(badan, { path, pengguna, keluar, pindah: navigasi.pindah });
      else kerangka.perbarui({ path, pengguna, keluar, pindah: navigasi.pindah });
      const isi = document.createElement('div'); isi.style.display = 'contents'; kerangka.isi.append(isi);
      if (path === '/log-audit') controller = pasangLogAudit(isi, search, q => navigasi.ganti(`/log-audit${q}`));
      else if (path === '/statistik') tutupHalaman = pasangStatistik(isi);
      else if (path === HALAMAN_AWAL.berandaTugas) tutupHalaman = pasangBerandaTugas(isi, pengguna, navigasi.ganti);
      else if (path === '/pelindungan-data') controller = pasangPelindunganData(isi, { pengguna, search, ganti: navigasi.ganti, bukaModal: async modal => {
        const modules = { dpia: ['dpia-pdp', 'bukaDpiaPdp', 'dpia'], insiden: ['insiden-pdp', 'bukaInsidenPdp', 'insiden'], prosesor: ['prosesor-pdp', 'bukaProsesorPdp', 'prosesor'], retensi: ['pemusnahan-pdp', 'bukaPemusnahanPdp', 'musnah'], 'catat-hak': ['catat-hak', 'bukaCatatHak', null], hak: ['proses-hak', 'bukaProsesHak', 'hak'] };
        const [file, ekspor, properti] = modules[modal.jenis]; const modul = await import(`./modal/pelindungan-data/${file}.js`);
        let tutup; const onTutup = () => tutup?.(); const onSelesai = () => { onTutup(); controller?.muat(); };
        tutup = modul[ekspor]({ ...(properti ? { [properti]: modal.nilai } : {}), onTutup, onSelesai });
      } });
      else if (halaman[path]) {
        const [file, ekspor] = halaman[path];
        const modul = await import(`./halaman/${file}/${file}.js`);
        if (!aktif || versi !== generasi) { isi.remove(); return; }
        const el = modul[ekspor](); isi.append(el); tutupHalaman = () => { el.tutup?.(); isi.remove(); }; if (el.perbaruiAlamat) controller = { perbaruiAlamat: el.perbaruiAlamat, tutup: tutupHalaman };
      } else {
        const { HalamanSementara } = await import('./halaman/placeholder/placeholder.js'); isi.append(HalamanSementara({ judul: HALAMAN_MENU.find(h => h.path === path)?.label ?? '' })); tutupHalaman = () => isi.remove();
      }
      if (controller) { const courant = controller; tutupHalaman = () => { courant.tutup(); isi.remove(); }; }
    } finally { if (versi === generasi) memasang = false; }
  }
  navigasi.mulai(); whatsapp.mulai(); instagram.mulai();
  const lapisanPesan = [TombolWa(), TombolIg(), PanelWa(), PanelIg()]; pesan.append(...lapisanPesan);
  const lepasNavigasi = navigasi.langganan(() => void tampilkan());
  const lepasSesi = sesiPengguna.langganan(() => { tutupTema?.(); tutupTema = pasangTemaTampilan(tema, penggunaSaatIni().pengguna); void tampilkan(); });
  await sesiPengguna.muat();
  return () => { aktif = false; generasi++; lepasNavigasi(); lepasSesi(); for (const el of lapisanPesan) el.tutup(); navigasi.tutup(); whatsapp.tutup(); instagram.tutup(); tutupTema?.(); tutupHalaman?.(); kerangka?.tutup(); wadah.replaceChildren(); };
}
