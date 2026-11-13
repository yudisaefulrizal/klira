import { h, Fragment } from '../../util/h.js';
                                            
import { token } from '../../gaya/token.js';
                                      

/** `susun`: isi ditumpuk vertikal dengan jarak token. */
export function Kartu({
  susun,
  style,
  ...sisa
}                                    
                
 ) {
  return h("div", {
    style: {
      background: token.warna.permukaan,
      border: `${token.ukuran.garis} solid ${token.warna.garis}`,
      borderRadius: token.radius.besar,
      boxShadow: token.bayangan.kartu,
      padding: token.jarak.lg,
      ...(susun ? {
        display: 'flex',
        flexDirection: 'column',
        gap: token.jarak[susun]
      } : {}),
      ...style
    },
    ...sisa
  });
}
                                                   
                                                                                        
                                         
                                                                  
                           
                        
                          
                             
                            
                                                
                  
  

/** Kotak berbingkai tanpa bayangan untuk butir daftar dan kelompok isian di dalam modal (varian rapat dari Kartu). */
export function Bingkai({
  tag = 'div',
  arah = 'baris',
  jarak = 'sm',
  padding = 'sm',
  halus = false,
  style,
  ...sisa
}              ) {
  return h(tag, {
    style: {
      display: 'flex',
      flexDirection: arah === 'kolom' ? 'column' : 'row',
      alignItems: arah === 'kolom' ? undefined : 'center',
      gap: jarak === 'tanpa' ? undefined : token.jarak[jarak],
      padding: padding === 'tanpa' ? undefined : token.jarak[padding],
      border: `${token.ukuran.garis} solid ${halus ? token.warna.garisHalus : token.warna.garis}`,
      borderRadius: token.radius.sedang,
      ...(tag === 'fieldset' ? {
        margin: 0,
        minWidth: 0
      } : {}),
      ...(tag === 'ul' ? {
        margin: 0,
        listStyle: 'none',
        overflow: 'hidden'
      } : {}),
      ...style
    },
    ...sisa
  });
}