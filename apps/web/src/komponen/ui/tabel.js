import { h, Fragment } from '../../util/h.js';
                                                         
import { token } from '../../gaya/token.js';
                          
                
                      
  

/** Tabel dasar: kepala dari `kolom`, isi berupa BarisTabel. */
export function Tabel({
  kolom,
  children,
  label
}   
                               
                      
                
 ) {
  return h("div", {
    style: {
      overflowX: 'auto'
    }
  }, h("table", {
    "aria-label": label,
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: token.huruf.ukuran.dasar,
      minWidth: token.ukuran.tabelMin
    }
  }, h("thead", null, h("tr", {
    style: {
      background: token.warna.kepalaTabel,
      textAlign: 'left',
      color: token.warna.teksMenu,
      fontSize: token.huruf.ukuran.kecil
    }
  }, kolom.map(k => h("th", {
    key: k.judul,
    scope: "col",
    style: {
      padding: `${token.jarak.sm} ${token.jarak.md}`,
      fontWeight: token.huruf.berat.tebal,
      textAlign: k.rataKanan ? 'right' : 'left'
    }
  }, k.judul)))), h("tbody", null, children)));
}
export function BarisTabel({
  children
}   
                      
 ) {
  return h("tr", {
    style: {
      borderTop: `${token.ukuran.garis} solid ${token.warna.garisHalus}`
    }
  }, children);
}
export function SelTabel({
  style,
  ...sisa
}                                        ) {
  return h("td", {
    style: {
      padding: `${token.jarak.md}`,
      verticalAlign: 'top',
      ...style
    },
    ...sisa
  });
}