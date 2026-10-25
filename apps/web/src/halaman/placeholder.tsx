import { NAVIGASI } from '@klira/shared';
import { token } from '../gaya/token';

/** Isi halaman sementara; isi sebenarnya dikerjakan di butir berikutnya. Kerangka (menu, keluar) dari TataLetak. */
export function HalamanSementara({ judul }: { judul: string }) {
  return (
    <>
      <h1 style={{ margin: 0, fontSize: token.huruf.ukuran.halaman, fontWeight: token.huruf.berat.tebal }}>{judul}</h1>
      <p style={{ margin: 0, color: token.warna.teksRedup }}>{NAVIGASI.segera}</p>
    </>
  );
}
