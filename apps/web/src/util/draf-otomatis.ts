import { useCallback, useEffect, useRef, useState } from 'react';
import { adaPerubahan } from './draf';
import type { AdaptorDraf, Draf } from './draf';

const TUNDA_MS = 400;

/**
 * Draf otomatis modal bertahap (3.2, 5.1n): isian disimpan lewat adaptor (lokal untuk alur non-kesehatan, server untuk alur klinis),
 * ditunda sebentar (debounce) dan disimpan segera saat modal ditutup. Draf yang ada dibaca sekali saat dibuka; `siap` menandakan
 * pembacaan selesai (server bersifat asinkron). `hapus` membuang draf dan menghentikan penyimpanan berikutnya (setelah berhasil
 * disimpan ke server atau dibuang pengguna). Adaptor harus stabil antarrender (useMemo).
 */
export function useDrafOtomatis<T>(opsi: { adaptor: AdaptorDraf<T>; nilai: T; awal: T; langkah: number; aktif: boolean }) {
  const { adaptor, nilai, awal, langkah, aktif } = opsi;
  const [bacaAwal] = useState(() => adaptor.baca());
  const sinkron = !(bacaAwal instanceof Promise);
  const [pulihan, setPulihan] = useState<Draf<T> | null>(sinkron ? bacaAwal : null);
  const [siap, setSiap] = useState(sinkron);
  const dihapus = useRef(false);
  const terbaru = useRef({ nilai, langkah, awal, adaptor });
  terbaru.current = { nilai, langkah, awal, adaptor };

  useEffect(() => {
    if (!(bacaAwal instanceof Promise)) return;
    let batal = false;
    bacaAwal.then(
      (d) => {
        if (batal) return;
        setPulihan(d);
        setSiap(true);
      },
      () => !batal && setSiap(true),
    );
    return () => {
      batal = true;
    };
  }, [bacaAwal]);

  useEffect(() => {
    if (!aktif || !adaPerubahan(adaptor.saring(awal), adaptor.saring(nilai))) return;
    const simpan = () => {
      const t = terbaru.current;
      const aman = t.adaptor.saring(t.nilai);
      if (!dihapus.current && adaPerubahan(t.adaptor.saring(t.awal), aman)) void t.adaptor.simpan(t.nilai, t.langkah);
    };
    const t = setTimeout(simpan, TUNDA_MS);
    return () => {
      clearTimeout(t);
      simpan();
    };
  }, [adaptor, nilai, awal, langkah, aktif]);

  const hapus = useCallback(() => {
    dihapus.current = true;
    void adaptor.hapus();
  }, [adaptor]);

  /** Buang draf tersimpan tetapi tetap menyimpan isian berikutnya (mulai baru). */
  const buang = useCallback(() => void adaptor.hapus(), [adaptor]);

  return { pulihan, siap, hapus, buang };
}
