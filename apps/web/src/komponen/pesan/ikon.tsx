import type { CSSProperties } from 'react';
import { token } from '../../gaya/token';
type Nama =
  | 'chat'
  | 'kirim'
  | 'lampiran'
  | 'kembali'
  | 'perluas'
  | 'minimalkan'
  | 'centang'
  | 'ganda'
  | 'berkas'
  | 'tutup'
  | 'plus'
  | 'cari'
  | 'info'
  | 'tautan'
  | 'menu';
const bentuk: Record<Nama, string> = {
  plus: 'M12 5v14M5 12h14',
  cari: 'M20 20l-5-5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z',
  info: 'M12 11v6M12 7h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  tautan: 'm10 13 4-4M8 16l-2 2a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m2 1 2-2a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0',
  menu: 'M4 6h16M4 12h16M4 18h16',
  chat: 'M21 11.5a8.5 8.5 0 0 1-8.5 8.5 9.5 9.5 0 0 1-4-.9L3 21l1.8-5.5a8.5 8.5 0 1 1 16.2-4ZM8 10h8M8 14h5',
  kirim: 'm21 3-6.5 18-4-7.5L3 9.5 21 3Zm0 0L10.5 13.5',
  lampiran: 'm9 12 5.5-5.5a3 3 0 0 1 4.2 4.2l-8 8a5 5 0 0 1-7-7l8-8a2 2 0 0 1 2.8 2.8L7 13.8a1 1 0 0 0 1.4 1.4L15 8.6',
  kembali: 'm14 5-7 7 7 7M7 12h14',
  perluas: 'M8 3H3v5M3 3l7 7M16 21h5v-5m0 5-7-7',
  minimalkan: 'M5 12h14',
  centang: 'm5 12 4 4L19 6',
  ganda: 'm2 12 4 4L16 6m-4 10 3 3L23 8',
  berkas: 'M14 2H5v20h14V7l-5-5Zm0 0v6h5M8 13h8M8 17h6',
  tutup: 'm6 6 12 12M6 18 18 6',
};
export function IkonPesan({ nama, style }: { nama: Nama; style?: CSSProperties }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: token.ukuran.ikonPesan, height: token.ukuran.ikonPesan, flexShrink: 0, ...style }}
    >
      <path d={bentuk[nama]} />
    </svg>
  );
}
