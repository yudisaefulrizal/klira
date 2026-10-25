import type { ReactNode } from 'react';
import { token } from '../../gaya/token';
import { useLapisanRiwayat } from '../../util/navigasi';
import { useTutupTerlindungi } from '../konfirmasi/tutup-terlindungi';
import { Dialog, KepalaDialog } from '../ui/dialog';
import { Kolom, Sebaris } from '../ui/susunan';

type Props = {
  judul: string;
  onTutup: () => void;
  /** Ada isian belum disimpan: penutupan tak sengaja dilindungi Konfirmasi. */
  lindungiTutup?: boolean;
  lebar?: keyof typeof token.ukuran;
  /** Tombol aksi di kaki modal (Simpan, Batal, ...). */
  aksi?: ReactNode;
  /** Slot di kepala (ringkasan konteks). */
  konteks?: ReactNode;
  children: ReactNode;
};

/** MODAL-1 (3.2): satu layar, seluruh isian muat tanpa scroll; modal hanya mengisi isi dan aksinya (5.2c). */
export function Modal1({ judul, onTutup, lindungiTutup = false, lebar = 'modalSedang', aksi, konteks, children }: Props) {
  const { mintaTutup, konfirmasi } = useTutupTerlindungi(lindungiTutup, onTutup);
  useLapisanRiwayat(true, mintaTutup);
  return (
    <>
      <Dialog judul={judul} onEsc={() => void mintaTutup()} lebar={lebar}>
        <KepalaDialog judul={judul} onTutup={() => void mintaTutup()}>{konteks}</KepalaDialog>
        <Kolom jarak="md" padding="lg" style={{ overflowY: 'auto' }}>{children}</Kolom>
        {aksi && (
          <Sebaris tag="footer" jarak="sm" padding="md" sejajar="regang" sebaran="akhir" garis="atas">
            {aksi}
          </Sebaris>
        )}
      </Dialog>
      {konfirmasi}
    </>
  );
}
