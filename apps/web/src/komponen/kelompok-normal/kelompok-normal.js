import { h, Fragment } from '../../util/h.js';
                                       
import { PENANDA_NORMAL } from '@klira/shared';
import { Bingkai } from '../ui/kartu.js';
import { Lencana } from '../ui/lencana.js';
import { Sebaris, Tumbuh } from '../ui/susunan.js';
                      
                                                                                     
                
                                                                                                     
                       
                                                                          
                  
                   
                      
  

/** Kelompok isian pemeriksaan dalam kartu bergaris (P6–P8): satu baris kepala (judul, hitungan "n isian diubah", aksi) di atas isian. */
export function KelompokNormal({
  judul,
  tanpaJudul,
  diubah = 0,
  aksi,
  children
}               ) {
  return h(Bingkai, {
    tag: "div",
    role: "group",
    "aria-label": judul,
    arah: "kolom",
    jarak: "sm",
    padding: "sm"
  }, (!tanpaJudul || aksi || diubah > 0) && h(Sebaris, {
    bungkus: true,
    jarak: "sm"
  }, !tanpaJudul && h("strong", null, judul), diubah > 0 && h(Lencana, {
    warna: "kuning"
  }, PENANDA_NORMAL.jumlahDiubah(diubah)), h(Tumbuh, null), aksi), children);
}