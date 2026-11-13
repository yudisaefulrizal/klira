import { h, Fragment } from '../../util/h.js';
import { KLINIS, STATUS_PENGESAHAN } from '@klira/shared';
                                                     
import { token } from '../../gaya/token.js';
import { Lencana } from '../ui/lencana.js';
import { Sebaris } from '../ui/susunan.js';

/** Keadaan pengesahan satu bagian catatan: lencana status, pengesah, jenis akun, dan versi (dipakai ulang CPPT dan resume nanti). */
export function InfoPengesahan({
  bagian
}   
                                                                                
 ) {
  if (!bagian?.pengesahan) return null;
  const p = bagian.pengesahan;
  return h(Sebaris, {
    jarak: "sm",
    bungkus: true,
    style: {
      fontSize: token.huruf.ukuran.kecil,
      color: token.warna.teksRedup
    }
  }, h(Lencana, {
    warna: STATUS_PENGESAHAN.warna(bagian.verifikasi)
  }, STATUS_PENGESAHAN.label(bagian.verifikasi)), h("span", null, KLINIS.status.disahkanOleh(p.pengguna_nama, p.jenis_akun)), h("span", null, KLINIS.status.versi(p.versi)));
}