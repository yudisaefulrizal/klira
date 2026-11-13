import { h, Fragment } from '../../util/h.js';
import { token } from '../../gaya/token.js';
                                         
        
                
  

/** Tab bersama untuk semua halaman bertab (3.1, 5.1h); pemilih tab dikendalikan pemanggil. */
export function Tab                  ({
  daftar,
  aktif,
  onPilih,
  label
}   
                                
           
                           
                
 ) {
  return h("div", {
    role: "tablist",
    "aria-label": label,
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: token.jarak.sm
    }
  }, daftar.map(t => {
    const on = t.id === aktif;
    return h("button", {
      key: t.id,
      role: "tab",
      type: "button",
      id: `tab-${t.id}`,
      "aria-selected": on,
      "aria-controls": `panel-${t.id}`,
      onClick: () => onPilih(t.id),
      style: {
        height: token.ukuran.tab,
        padding: `0 ${token.jarak.md}`,
        borderRadius: token.radius.pil,
        cursor: 'pointer',
        border: `${token.ukuran.garis} solid ${on ? token.warna.utama : token.warna.garisIsian}`,
        background: on ? token.warna.utama : token.warna.permukaan,
        color: on ? token.warna.diAtasUtama : token.warna.teks,
        fontFamily: token.huruf.keluarga,
        fontSize: token.huruf.ukuran.dasar,
        fontWeight: on ? token.huruf.berat.tebal : token.huruf.berat.biasa
      }
    }, t.label);
  }));
}