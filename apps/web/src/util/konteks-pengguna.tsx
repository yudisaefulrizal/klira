import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { PenggunaSaya } from '@klira/shared';
import type { MasukanGanti } from '../api-klien/akses';
import { ambilSaya, gantiKredensial as panggilGanti, keluar as panggilKeluar, masuk as panggilMasuk } from '../api-klien/akses';

type Konteks = {
  pengguna: PenggunaSaya | null;
  memuat: boolean;
  masuk: (username: string, kataSandi: string) => Promise<PenggunaSaya>;
  keluar: () => Promise<void>;
  gantiKredensial: (masukan: MasukanGanti) => Promise<PenggunaSaya>;
};

const KonteksPengguna = createContext<Konteks | null>(null);

export function PenyediaPengguna({ children }: { children: ReactNode }) {
  const [pengguna, setPengguna] = useState<PenggunaSaya | null>(null);
  const [memuat, setMemuat] = useState(true);

  useEffect(() => {
    ambilSaya()
      .then(setPengguna)
      .catch(() => setPengguna(null))
      .finally(() => setMemuat(false));
  }, []);

  const masuk = useCallback(async (username: string, kataSandi: string) => {
    const hasil = await panggilMasuk(username, kataSandi);
    setPengguna(hasil);
    return hasil;
  }, []);
  const keluar = useCallback(async () => {
    await panggilKeluar();
    setPengguna(null);
  }, []);

  const gantiKredensial = useCallback(async (masukan: MasukanGanti) => {
    const hasil = await panggilGanti(masukan);
    setPengguna(hasil);
    return hasil;
  }, []);

  const nilai = useMemo(
    () => ({ pengguna, memuat, masuk, keluar, gantiKredensial }),
    [pengguna, memuat, masuk, keluar, gantiKredensial],
  );
  return <KonteksPengguna.Provider value={nilai}>{children}</KonteksPengguna.Provider>;
}

export function usePengguna(): Konteks {
  const k = useContext(KonteksPengguna);
  if (!k) throw new Error('usePengguna harus di dalam PenyediaPengguna');
  return k;
}
