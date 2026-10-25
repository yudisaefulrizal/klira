import { useEffect, useState } from 'react';
import { GalatApi } from '../api-klien/klien';

type Halaman<T> = { data: T[]; total: number; ukuran: number };

/** Memuat daftar berhalaman; `versi` yang berubah memuat ulang (setelah modal selesai). */
export function useDaftar<T>(ambil: (halaman: number) => Promise<Halaman<T>>, pesanGagal: string, versi: number) {
  const [halaman, setHalaman] = useState(1);
  const [hasil, setHasil] = useState<Halaman<T> | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  useEffect(() => {
    let batal = false;
    ambil(halaman)
      .then((h) => {
        if (batal) return;
        setHasil(h);
        setGalat(null);
      })
      .catch((e) => !batal && setGalat(e instanceof GalatApi ? e.message : pesanGagal));
    return () => {
      batal = true;
    };
  }, [ambil, halaman, pesanGagal, versi]);
  return { halaman, setHalaman, hasil, galat };
}
