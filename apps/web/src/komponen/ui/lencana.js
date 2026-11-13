import { h, Fragment } from '../../util/h.js';
                                            
                                                 
import { gayaStatus } from '../../gaya/status.js';
import { token } from '../../gaya/token.js';

/** Lencana kecil berwarna; warna dari nama token status (shared/status.ts). */
export function Lencana({
  warna,
  style,
  ...sisa
}                                     
                     
 ) {
  const w = gayaStatus(warna);
  return h("span", {
    style: {
      display: 'inline-block',
      padding: `${token.jarak.xs} ${token.jarak.sm}`,
      borderRadius: token.radius.pil,
      background: w.latar,
      color: w.teks,
      fontSize: token.huruf.ukuran.kecil,
      fontWeight: token.huruf.berat.tebal,
      ...style
    },
    ...sisa
  });
}