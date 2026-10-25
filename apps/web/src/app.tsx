import { useCallback, useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { HALAMAN_AWAL } from '@klira/shared';
import { HalamanBerandaTugas } from './halaman/beranda-tugas';
import { HalamanDaftarPasien } from './halaman/daftar-pasien';
import { HalamanMasuk } from './halaman/masuk';
import { PenyediaPengguna, usePengguna } from './util/konteks-pengguna';
import { putuskanRute, RUTE_MASUK } from './util/penjaga-rute';

const HALAMAN: Record<string, () => ReactElement> = {
  [RUTE_MASUK]: HalamanMasuk,
  [HALAMAN_AWAL.daftarPasien]: HalamanDaftarPasien,
  [HALAMAN_AWAL.berandaTugas]: HalamanBerandaTugas,
};

function Perute() {
  const { pengguna, memuat } = usePengguna();
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const ubah = () => setPath(window.location.pathname);
    window.addEventListener('popstate', ubah);
    return () => window.removeEventListener('popstate', ubah);
  }, []);

  const pindah = useCallback((ke: string) => {
    window.history.replaceState(null, '', ke);
    setPath(ke);
  }, []);

  const keputusan = memuat ? null : putuskanRute(path, pengguna);
  useEffect(() => {
    if (keputusan?.tipe === 'alihkan') pindah(keputusan.ke);
  }, [keputusan, pindah]);

  if (!keputusan || keputusan.tipe === 'alihkan') return null;
  const Halaman = HALAMAN[path];
  return Halaman ? <Halaman /> : null;
}

export function App() {
  return (
    <PenyediaPengguna>
      <Perute />
    </PenyediaPengguna>
  );
}
