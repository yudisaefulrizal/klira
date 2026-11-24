import { h } from '../../util/h.js';
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

/** Catatan untuk seluruh resep (mis. obat dibuat puyer); tidak tampil bila kosong. */
export function CatatanResep({
  catatan
}   
                   
 ) {
  // Fragmen kosong (bukan null): `append(null)` akan menuliskan teks "null" di halaman.
  if (!catatan?.trim()) return document.createDocumentFragment();
  return h(Kolom, {
    jarak: "xs"
  }, h("small", {
    style: {
      color: token.warna.teksRedup
    }
  }, R.catatanResep), h("pre", {
    style: gayaTeks
  }, catatan.trim()));
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

/** Tampilan resep lengkap: obat dengan jumlah dan aturan pakai, lalu catatan seluruh resep. */
export function TampilanResep({
  resep
}   
                                         
 ) {
  return h(Kolom, {
    jarak: "sm"
  }, h(ItemResepFarmasi, {
    item: resep.item
  }), h(CatatanResep, {
    catatan: resep.catatan
  }));
}
