import type { ReactNode } from 'react';
import { token } from '../../gaya/token';
import { useLapisanRiwayat } from '../../util/navigasi';
import { useTutupTerlindungi } from '../konfirmasi/tutup-terlindungi';
import { Dialog, KepalaDialog } from '../ui/dialog';

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
        <div style={{ padding: token.jarak.lg, display: 'flex', flexDirection: 'column', gap: token.jarak.md, overflowY: 'auto' }}>{children}</div>
        {aksi && (
          <footer style={{ display: 'flex', justifyContent: 'flex-end', gap: token.jarak.sm, padding: token.jarak.md, borderTop: `${token.ukuran.garis} solid ${token.warna.garis}` }}>
            {aksi}
          </footer>
        )}
      </Dialog>
      {konfirmasi}
    </>
  );
}
