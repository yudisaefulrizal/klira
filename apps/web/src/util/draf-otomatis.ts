import { useCallback, useEffect, useRef, useState } from 'react';
import { adaPerubahan, bacaDraf, hapusDraf, saringSensitif, simpanDraf } from './draf';
import type { Draf, PenyimpananDraf } from './draf';

const simpananLokal = (): PenyimpananDraf | null => (typeof localStorage === 'undefined' ? null : localStorage);
const TUNDA_MS = 400;

/**
 * Draf otomatis modal bertahap (3.2, 5.1n): isian disimpan ke penyimpanan lokal dengan kunci per alur, ditunda
 * sebentar dan disimpan segera saat modal ditutup. `hapus` membuang draf dan menghentikan penyimpanan berikutnya
 * Opsi `sensitif` mengecualikan bidang dari draf; draf kedaluwarsa (bawaan 30 menit) dibuang saat dibaca.
 * (setelah berhasil disimpan ke server atau dibuang pengguna). Draf yang ada dibaca sekali saat dibuka.
 */
export function useDrafOtomatis<T>(opsi: { kunci: string; nilai: T; awal: T; langkah: number; aktif: boolean; sensitif?: readonly string[]; kedaluwarsaMs?: number }) {
  const { kunci, nilai, awal, langkah, aktif, sensitif, kedaluwarsaMs } = opsi;
  const [pulihan] = useState<Draf<T> | null>(() => bacaDraf<T>(kunci, simpananLokal(), { kedaluwarsaMs }));
  const dihapus = useRef(false);
  const terbaru = useRef({ nilai, langkah, awal, sensitif });
  terbaru.current = { nilai, langkah, awal, sensitif };

  useEffect(() => {
    if (!aktif || !adaPerubahan(saringSensitif(awal, sensitif), saringSensitif(nilai, sensitif))) return;
    const simpan = () => {
      const t = terbaru.current;
      const aman = saringSensitif(t.nilai, t.sensitif);
      if (!dihapus.current && adaPerubahan(saringSensitif(t.awal, t.sensitif), aman)) simpanDraf(kunci, aman, t.langkah, simpananLokal());
    };
    const t = setTimeout(simpan, TUNDA_MS);
    return () => {
      clearTimeout(t);
      simpan();
    };
  }, [kunci, nilai, awal, langkah, aktif, sensitif]);

  const hapus = useCallback(() => {
    dihapus.current = true;
    hapusDraf(kunci, simpananLokal());
  }, [kunci]);

  /** Buang draf tersimpan tetapi tetap menyimpan isian berikutnya (mulai baru). */
  const buang = useCallback(() => hapusDraf(kunci, simpananLokal()), [kunci]);

  return { pulihan, hapus, buang };
}
