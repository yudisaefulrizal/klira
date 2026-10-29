import { HalamanKelolaMaster } from './halaman/kelola-master';
import { KELOMPOK_MASTER } from './util/lokasi-master';
import { HalamanLayarPanggilan } from './halaman/layar-panggilan';
import { PenyediaPesan as PenyediaInstagram } from './komponen/instagram/konteks-pesan';
import { PanelPesan as PanelInstagram } from './komponen/instagram/pesan';
import { HalamanStatistik } from './halaman/statistik';
import { HalamanPesan } from './halaman/pesan';
import { PanelPesan } from './komponen/pesan/pesan';
import { PenyediaPesan } from './komponen/pesan/konteks-pesan';
import { useEffect } from 'react';
import type { ReactElement } from 'react';
import { PemilihTema } from './komponen/pemilih-tema';
import { HALAMAN_AWAL, HALAMAN_MENU } from '@klira/shared';
import { TataLetak } from './komponen/tata-letak';
import { HalamanBerandaTugas } from './halaman/beranda-tugas';
import { HalamanDaftarPasien } from './halaman/daftar-pasien';
import { HalamanFarmasi } from './halaman/farmasi';
import { HalamanGantiKredensial } from './halaman/ganti-kredensial';
import { HalamanKasirKlaim } from './halaman/kasir-klaim';
import { HalamanMasuk } from './halaman/masuk';
import { HalamanPengaturan } from './halaman/pengaturan';
import { HalamanPelindunganData } from './halaman/pelindungan-data';
import { HalamanRawatInap } from './halaman/rawat-inap';
import { HalamanRekamMedis } from './halaman/rekam-medis';
import { HalamanPenunjang } from './halaman/penunjang';
import { HalamanSementara } from './halaman/placeholder';
import { PenyediaPengguna, usePengguna } from './util/konteks-pengguna';
import { PenyediaNavigasi, useNavigasi } from './util/navigasi';
import { putuskanRute, RUTE_GANTI_KREDENSIAL, RUTE_MASUK } from './util/penjaga-rute';

/** Halaman tanpa kerangka menu (sebelum masuk dan layar wajib ganti kredensial). */
const HALAMAN_TANPA_MENU: Record<string, () => ReactElement> = {
  [RUTE_MASUK]: HalamanMasuk,
  [RUTE_GANTI_KREDENSIAL]: HalamanGantiKredensial,
};

/** Halaman menu; halaman yang belum dikerjakan memakai isi sementara berjudul menu. */
const HALAMAN_MENU_ISI: Record<string, () => ReactElement> = Object.fromEntries(
  HALAMAN_MENU.map((h) => [h.path, () => <HalamanSementara judul={h.label} />]),
);
Object.assign(HALAMAN_MENU_ISI, Object.fromEntries(KELOMPOK_MASTER.map(k => [k.path, HalamanKelolaMaster])), {
  [HALAMAN_AWAL.daftarPasien]: HalamanDaftarPasien,
  [HALAMAN_AWAL.berandaTugas]: HalamanBerandaTugas,
  '/statistik': HalamanStatistik,
  '/pesan': HalamanPesan,
  '/pengaturan': HalamanPengaturan,
  '/penunjang': HalamanPenunjang,
  '/farmasi': HalamanFarmasi,
  '/kasir-klaim': HalamanKasirKlaim,
  '/rekam-medis': HalamanRekamMedis,
  '/rawat-inap': HalamanRawatInap,
  '/pelindungan-data': HalamanPelindunganData,
});

function Perute() {
  const { pengguna, memuat } = usePengguna();
  const { path, ganti } = useNavigasi();

  const keputusan = memuat ? null : putuskanRute(path, pengguna);
  useEffect(() => {
    if (keputusan?.tipe === 'alihkan') ganti(keputusan.ke);
  }, [keputusan, ganti]);

  if (!keputusan || keputusan.tipe === 'alihkan') return null;
  const HalamanTanpaMenu = HALAMAN_TANPA_MENU[path];
  if (HalamanTanpaMenu) return <HalamanTanpaMenu />;
  const Halaman = HALAMAN_MENU_ISI[path];
  return Halaman ? <TataLetak><Halaman /></TataLetak> : null;
}

export function App() {
  if (/^\/layar-panggilan(?:\/|$)/.test(window.location.pathname)) return <HalamanLayarPanggilan />;
  return (
    <PenyediaPengguna>
      <PemilihTema />
      <PenyediaNavigasi>
        <PenyediaPesan><PenyediaInstagram><Perute /><PanelPesan /><PanelInstagram /></PenyediaInstagram></PenyediaPesan>
      </PenyediaNavigasi>
    </PenyediaPengguna>
  );
}
