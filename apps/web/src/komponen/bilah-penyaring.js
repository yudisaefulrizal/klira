import { h, Fragment } from '../util/h.js';
                                                  
import { Tombol } from './ui/tombol.js';
import { Sebaris } from './ui/susunan.js';
              
                      
                        
                         
                         
                          
                         
                     
  

/** Baris penyaring tab: kolom isian di dalam formulir dengan Terapkan dan Atur ulang (Enter menerapkan). */
export function BilahPenyaring({
  children,
  labelTerapkan,
  labelAturUlang,
  onTerapkan,
  onAturUlang,
  tombolLain,
  nonaktif
}       ) {
  const kirim = (e           ) => {
    e.preventDefault();
    if (!nonaktif) onTerapkan();
  };
  return h(Sebaris, {
    tag: "form",
    jarak: "md",
    padding: "md",
    bungkus: true,
    sejajar: "akhir",
    onSubmit: kirim
  }, children, h(Tombol, {
    type: "submit",
    disabled: nonaktif
  }, labelTerapkan), h(Tombol, {
    type: "button",
    varian: "sekunder",
    onClick: onAturUlang
  }, labelAturUlang), tombolLain);
}