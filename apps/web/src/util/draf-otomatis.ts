import { useCallback, useEffect, useRef, useState } from 'react';
import { adaPerubahan, bacaDraf, hapusDraf, simpanDraf } from './draf';
import type { Draf, PenyimpananDraf } from './draf';

const simpananLokal = (): PenyimpananDraf | null => (typeof localStorage === 'undefined' ? null : localStorage);
const TUNDA_MS = 400;

/**
 * Draf otomatis modal bertahap (3.2, 5.1n): isian disimpan ke penyimpanan lokal dengan kunci per alur, ditunda
 * sebentar dan disimpan segera saat modal ditutup. `hapus` membuang draf dan menghentikan penyimpanan berikutnya
 * (setelah berhasil disimpan ke server atau dibuang pengguna). Draf yang ada dibaca sekali saat dibuka.
 */
export function useDrafOtomatis<T>(opsi: { kunci: string; nilai: T; awal: T; langkah: number; aktif: boolean }) {
  const { kunci, nilai, awal, langkah, aktif } = opsi;
  const [pulihan] = useState<Draf<T> | null>(() => bacaDraf<T>(kunci, simpananLokal()));
  const dihapus = useRef(false);
  const terbaru = useRef({ nilai, langkah, awal });
  terbaru.current = { nilai, langkah, awal };

  useEffect(() => {
    if (!aktif || !adaPerubahan(awal, nilai)) return;
    const simpan = () => {
      if (!dihapus.current && adaPerubahan(terbaru.current.awal, terbaru.current.nilai)) simpanDraf(kunci, terbaru.current.nilai, terbaru.current.langkah, simpananLokal());
    };
    const t = setTimeout(simpan, TUNDA_MS);
    return () => {
      clearTimeout(t);
      simpan();
    };
  }, [kunci, nilai, awal, langkah, aktif]);

  const hapus = useCallback(() => {
    dihapus.current = true;
    hapusDraf(kunci, simpananLokal());
  }, [kunci]);

  /** Buang draf tersimpan tetapi tetap menyimpan isian berikutnya (mulai baru). */
  const buang = useCallback(() => hapusDraf(kunci, simpananLokal()), [kunci]);

  return { pulihan, hapus, buang };
}
