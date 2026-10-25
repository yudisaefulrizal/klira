import { useEffect, useState } from 'react';

/** Nilai yang baru berubah setelah `ms` tanpa perubahan lagi (untuk pencarian saat mengetik). */
export function useNilaiTertunda<T>(nilai: T, ms = 300): T {
  const [tertunda, setTertunda] = useState(nilai);
  useEffect(() => {
    const t = setTimeout(() => setTertunda(nilai), ms);
    return () => clearTimeout(t);
  }, [nilai, ms]);
  return tertunda;
}
