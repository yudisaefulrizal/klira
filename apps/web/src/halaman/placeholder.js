import { h, Fragment } from '../util/h.js';
import { NAVIGASI } from '@klira/shared';
import { token } from '../gaya/token.js';

/** Isi halaman sementara; isi sebenarnya dikerjakan di butir berikutnya. Kerangka (menu, keluar) dari TataLetak. */
export function HalamanSementara({
  judul
}   
                
 ) {
  return h(Fragment, null, h("h1", {
    style: {
      margin: 0,
      fontSize: token.huruf.ukuran.halaman,
      fontWeight: token.huruf.berat.tebal
    }
  }, judul), h("p", {
    style: {
      margin: 0,
      color: token.warna.teksRedup
    }
  }, NAVIGASI.segera));
}