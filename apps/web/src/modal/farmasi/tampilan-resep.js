import { h, Fragment } from '../../util/h.js';
import { FARMASI } from '@klira/shared';
                                              
import { token } from '../../gaya/token.js';
import { Kolom } from '../../komponen/ui/susunan.js';
const R = FARMASI.resep;
const gayaTeks = {
  margin: 0,
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
  fontFamily: 'inherit',
  fontSize: token.huruf.ukuran.dasar
}         ;

/** Teks resep dokter apa adanya (baris dan racikan dipertahankan). */
export function TeksResepDokter({
  teks,
  judul = true
}   
               
                  
 ) {
  return h(Kolom, {
    jarak: "xs"
  }, judul && h("small", {
    style: {
      color: token.warna.teksRedup
    }
  }, R.teksDokter), h("pre", {
    style: gayaTeks
  }, teks.trim() || '-'));
}

/** Item obat yang disiapkan farmasi: nama, jumlah dan satuan, aturan pakai, bentuk/rute bila ada. */
export function ItemResepFarmasi({
  item
}   
                         
 ) {
  return h(Kolom, {
    jarak: "xs"
  }, h("small", {
    style: {
      color: token.warna.teksRedup
    }
  }, R.itemFarmasi), item.length === 0 ? h("span", {
    style: {
      color: token.warna.teksRedup
    }
  }, R.belumAdaItem) : item.map(i => h("span", {
    key: i.id
  }, i.nama, ": ", i.jumlah, " ", i.satuan, ", ", i.aturan_pakai, [i.bentuk, i.rute].filter(Boolean).length ? ` (${[i.bentuk, i.rute].filter(Boolean).join(', ')})` : '')));
}

/** Tampilan resep lengkap: teks dokter lalu item yang disiapkan farmasi. */
export function TampilanResep({
  resep
}   
                                         
 ) {
  return h(Kolom, {
    jarak: "sm"
  }, h(TeksResepDokter, {
    teks: resep.teks
  }), h(ItemResepFarmasi, {
    item: resep.item
  }));
}