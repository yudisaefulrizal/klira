import { h, Fragment } from '../../util/h.js';
                                                  
import { token } from '../../gaya/token.js';
import { InfoBantuan } from './info-bantuan.js';
import { PesanGalat, gayaKontrol } from './isian.js';
             
                
                
  
                                                                          
                
             
                        
                 
                    
  
export function Pilihan({
  label,
  id,
  opsi,
  style,
  galat,
  petunjuk,
  ...sisa
}       ) {
  return h("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: token.jarak.xs
    }
  }, h("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: token.jarak.xs
    }
  }, h("label", {
    htmlFor: id,
    style: {
      fontSize: token.huruf.ukuran.dasar,
      fontWeight: token.huruf.berat.sedang
    }
  }, label), petunjuk && h(InfoBantuan, {
    label: label
  }, petunjuk)), h("select", {
    id: id,
    style: {
      ...gayaKontrol,
      ...(galat ? {
        borderColor: token.warna.status.merah.teks
      } : {}),
      ...style
    },
    "aria-invalid": galat ? true : undefined,
    "aria-describedby": galat ? `${id}-galat` : undefined,
    ...sisa
  }, opsi.map(o => h("option", {
    key: o.nilai,
    value: o.nilai
  }, o.label))), galat && h(PesanGalat, {
    id: `${id}-galat`
  }, galat));
}