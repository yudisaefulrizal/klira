import { h, Fragment } from '../../util/h.js';
import { FARMASI } from '@klira/shared';
import { token } from '../../gaya/token.js';
import { izinSaatIni } from '../../komponen/izin/izin-saja.js';
import { AreaTeks } from '../../komponen/ui/area-teks.js';
import { Peringatan } from '../../komponen/ui/peringatan.js';
import { Kolom } from '../../komponen/ui/susunan.js';
import { galatResep } from './keadaan-farmasi.js';
              
               
                                 
                       
                    
  
const R = FARMASI.resep;

/**
 * Langkah Resep di Pemeriksaan klinis (P3): dokter menulis resep sebagai teks bebas (merek, racikan). Item obat dari stok diisi apoteker saat telaah.
 * Teks dikelola induk sebagai draf dan diajukan lewat Simpan pemeriksaan.
 */
export function LangkahResep({
  teks,
  onUbah,
  tampilGalat,
  disabled
}       ) {
  const boleh = izinSaatIni();
  const bolehResep = boleh('resep', 'input');
  const galat = tampilGalat ? galatResep(teks).teks : undefined;
  return h(Kolom, null, !bolehResep ? h(Peringatan, {
    nada: "biru"
  }, R.tanpaIzin) : h(Fragment, null, h(AreaTeks, {
    id: "resep-teks",
    label: R.label,
    value: teks,
    maxLength: 2000,
    rows: 6,
    style: {
      height: 'auto',
      fontFamily: 'inherit'
    },
    disabled: disabled,
    placeholder: R.contoh,
    onChange: e => onUbah(e.target.value),
    "aria-invalid": galat ? true : undefined,
    "aria-describedby": "resep-teks-petunjuk"
  }), h("small", {
    id: "resep-teks-petunjuk",
    style: {
      color: token.warna.teksRedup
    }
  }, R.petunjuk, " ", R.tagihanInfo), galat && h(Peringatan, null, galat)));
}