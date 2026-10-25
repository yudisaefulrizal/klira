import { useEffect } from 'react';
import type { ReactElement } from 'react';
import { HALAMAN_AWAL, HALAMAN_MENU } from '@klira/shared';
import { TataLetak } from './komponen/tata-letak';
import { HalamanBerandaTugas } from './halaman/beranda-tugas';
import { HalamanDaftarPasien } from './halaman/daftar-pasien';
import { HalamanGantiKredensial } from './halaman/ganti-kredensial';
import { HalamanMasuk } from './halaman/masuk';
import { HalamanPengaturan } from './halaman/pengaturan';
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
Object.assign(HALAMAN_MENU_ISI, {
  [HALAMAN_AWAL.daftarPasien]: HalamanDaftarPasien,
  [HALAMAN_AWAL.berandaTugas]: HalamanBerandaTugas,
  '/pengaturan': HalamanPengaturan,
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
  return (
    <PenyediaPengguna>
      <PenyediaNavigasi>
        <Perute />
      </PenyediaNavigasi>
    </PenyediaPengguna>
  );
}
