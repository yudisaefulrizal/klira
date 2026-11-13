import { h, Fragment } from '../util/h.js';
import { TombolIkonPasien } from './ikon-pasien.js';
import { KEAMANAN } from '@klira/shared';
import { totalHalaman } from '../util/penyaring-tab.js';
import { Tombol } from './ui/tombol.js';
import { Sebaris } from './ui/susunan.js';
              
                     
                  
                
                 
                                      
  

/** Paginasi sederhana: Sebelumnya, nomor halaman, Berikutnya; tidak tampil bila hanya satu halaman. */
export function Paginasi({
  halaman,
  total,
  ukuran,
  onPindah,
  modeIkon = false
}       ) {
  if (total <= ukuran) return null;
  const jumlah = totalHalaman(total, ukuran);
  return h(Sebaris, {
    tag: "nav",
    jarak: "md",
    padding: "md",
    sebaran: "akhir",
    "aria-label": "Paginasi"
  }, modeIkon ? h(TombolIkonPasien, {
    ikon: "sebelumnya",
    label: KEAMANAN.sebelumnya,
    varian: "sekunder",
    disabled: halaman <= 1,
    onClick: () => onPindah(halaman - 1)
  }) : h(Tombol, {
    varian: "sekunder",
    disabled: halaman <= 1,
    onClick: () => onPindah(halaman - 1)
  }, KEAMANAN.sebelumnya), h("span", null, halaman, " / ", jumlah), modeIkon ? h(TombolIkonPasien, {
    ikon: "berikutnya",
    label: KEAMANAN.berikutnya,
    varian: "sekunder",
    disabled: halaman >= jumlah,
    onClick: () => onPindah(halaman + 1)
  }) : h(Tombol, {
    varian: "sekunder",
    disabled: halaman >= jumlah,
    onClick: () => onPindah(halaman + 1)
  }, KEAMANAN.berikutnya));
}