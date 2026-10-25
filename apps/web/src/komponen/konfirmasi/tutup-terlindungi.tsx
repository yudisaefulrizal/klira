import { useCallback, useState } from 'react';
import type { ReactNode } from 'react';
import { MODAL } from '@klira/shared';
import { Konfirmasi } from './konfirmasi';

/**
 * Perlindungan tutup tak sengaja (3.2, 5.1d): bila ada isian belum selesai, penutupan (tombol Tutup, Esc, tombol kembali
 * peramban) meminta Konfirmasi dahulu. `mintaTutup` mengembalikan true bila modal langsung ditutup.
 */
export function useTutupTerlindungi(lindungi: boolean, onTutup: () => void): { mintaTutup: () => boolean; konfirmasi: ReactNode } {
  const [tanya, setTanya] = useState(false);
  const mintaTutup = useCallback(() => {
    if (lindungi) {
      setTanya(true);
      return false;
    }
    onTutup();
    return true;
  }, [lindungi, onTutup]);
  const konfirmasi = tanya ? (
    <Konfirmasi
      judul={MODAL.tutupDrafJudul}
      pesan={MODAL.tutupDrafPesan}
      labelYa={MODAL.tutupDrafYa}
      labelTidak={MODAL.tutupDrafTidak}
      onYa={() => {
        setTanya(false);
        onTutup();
      }}
      onTidak={() => setTanya(false)}
    />
  ) : null;
  return { mintaTutup, konfirmasi };
}
