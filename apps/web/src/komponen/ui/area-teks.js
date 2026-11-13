import { h, Fragment } from '../../util/h.js';
                                                    
import { token } from '../../gaya/token.js';
import { gayaDiubah, gayaKontrol, LabelIsian } from './isian.js';
                                                            
                
                                                             
                   
  
export function AreaTeks({
  label,
  id,
  style,
  diubah,
  ...sisa
}       ) {
  return h("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: token.jarak.xs
    }
  }, h(LabelIsian, {
    htmlFor: id,
    label: label,
    diubah: diubah
  }), h("textarea", {
    id: id,
    style: {
      ...gayaKontrol,
      height: token.ukuran.areaTeks,
      padding: token.jarak.sm,
      resize: 'vertical',
      ...(diubah ? gayaDiubah : {}),
      ...style
    },
    ...sisa
  }));
}