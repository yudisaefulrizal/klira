import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { bukaLapisanRiwayat } from './riwayat-lapisan';

type Navigasi = {
  path: string;
  search: string;
  /** Pindah dengan riwayat baru (tombol kembali peramban kembali ke sini). */
  pindah: (ke: string) => void;
  /** Ganti alamat tanpa menambah riwayat (alihan, perubahan penyaring). */
  ganti: (ke: string) => void;
};

const KonteksNavigasi = createContext<Navigasi | null>(null);

/** Perute ringan berbasis History API: alamat tetap tiap halaman (5.1k), tombol kembali berfungsi. */
export function PenyediaNavigasi({ children }: { children: ReactNode }) {
  const [lokasi, setLokasi] = useState({ path: window.location.pathname, search: window.location.search });

  useEffect(() => {
    const ubah = () => setLokasi({ path: window.location.pathname, search: window.location.search });
    window.addEventListener('popstate', ubah);
    return () => window.removeEventListener('popstate', ubah);
  }, []);

  const terapkan = useCallback((ke: string, ganti: boolean) => {
    const url = new URL(ke, window.location.origin);
    if (ganti) window.history.replaceState(null, '', ke);
    else window.history.pushState(null, '', ke);
    setLokasi({ path: url.pathname, search: url.search });
  }, []);
  const pindah = useCallback((ke: string) => terapkan(ke, false), [terapkan]);
  const ganti = useCallback((ke: string) => terapkan(ke, true), [terapkan]);

  const nilai = useMemo(() => ({ ...lokasi, pindah, ganti }), [lokasi, pindah, ganti]);
  return <KonteksNavigasi.Provider value={nilai}>{children}</KonteksNavigasi.Provider>;
}

export function useNavigasi(): Navigasi {
  const k = useContext(KonteksNavigasi);
  if (!k) throw new Error('useNavigasi harus di dalam PenyediaNavigasi');
  return k;
}

/**
 * Selama `terbuka`, tombol kembali peramban memanggil `onKembali` (true = lapisan ditutup) alih-alih keluar dari halaman (5.1j).
 */
export function useLapisanRiwayat(terbuka: boolean, onKembali: () => boolean): void {
  const terakhir = useRef(onKembali);
  terakhir.current = onKembali;
  useEffect(() => {
    if (!terbuka) return;
    return bukaLapisanRiwayat(window, () => terakhir.current());
  }, [terbuka]);
}
