import { h } from '../../util/h.js';
                                                 
import { PENANDA_NORMAL } from '@klira/shared';
import { token } from '../../gaya/token.js';
import { InfoBantuan } from './info-bantuan.js';
import { buatTanggalTiga } from './tanggal-tiga.js';

/** Gaya dasar kontrol formulir; dipakai bersama oleh Isian dan Pilihan. */
export const gayaKontrol = {
  height: token.ukuran.isian,
  padding: `0 ${token.jarak.sm}`,
  border: `${token.ukuran.garis} solid ${token.warna.garis}`,
  borderRadius: token.radius.sedang,
  background: token.warna.permukaan,
  color: token.warna.teks,
  fontFamily: token.huruf.keluarga,
  fontSize: token.huruf.ukuran.dasar
}         ;
                                                      
                
             
                                                                                              
                    
                                                                                           
                   
  

/** Gaya kontrol yang nilainya berbeda dari default keadaan baik (P6–P8). */
export const gayaDiubah = {
  background: token.warna.status.kuning.latar
}         ;

/** Label isian beserta penanda "· diubah"; dipakai bersama Isian, AreaTeks, dan PilihanPil. */
export function LabelIsian({
  htmlFor,
  label,
  diubah,
  tag = 'label'
}   
                   
                
                   
                                    
 ) {
  const Tag = tag;
  return h(Tag, {
    htmlFor: tag === 'label' ? htmlFor : undefined,
    style: {
      fontSize: token.huruf.ukuran.dasar,
      fontWeight: token.huruf.berat.sedang,
      padding: 0
    }
  }, label, diubah && h("span", {
    style: {
      color: token.warna.status.kuning.teks,
      fontWeight: token.huruf.berat.biasa
    }
  }, " \xB7 ", PENANDA_NORMAL.diubah));
}

/** Pesan galat bidang (di bawah kontrol); dipakai bersama Isian dan Pilihan. */
export function PesanGalat({
  id,
  children
}   
             
                   
 ) {
  return h("span", {
    id: id,
    role: "alert",
    style: {
      color: token.warna.status.merah.teks,
      fontSize: token.huruf.ukuran.kecil
    }
  }, children);
}
/** Isian tanggal tiga kolom untuk `type: "date"` (pengganti pemilih tanggal bawaan peramban); `onChange`/`onInput` menerima peristiwa dengan `target.value`. */
function IsianTanggal({ id, label, galat, value, disabled, onChange, onInput }) {
  const el = buatTanggalTiga({ id, nilai: value ?? '', label: typeof label === 'string' ? label : '', galat: !!galat, disabled });
  if (galat) el.setAttribute('aria-describedby', `${id}-galat`);
  for (const f of [onChange, onInput]) if (f) el.addEventListener('input', f);
  return el;
}
export function Isian({
  label,
  id,
  style,
  galat,
  petunjuk,
  diubah,
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
  }, h(LabelIsian, {
    htmlFor: id,
    label: label,
    diubah: diubah
  }), petunjuk && h(InfoBantuan, {
    label: label
  }, petunjuk)), sisa.type === 'date' ? IsianTanggal({
    id,
    label,
    galat,
    ...sisa
  }) : h("input", {
    id: id,
    style: {
      ...gayaKontrol,
      ...(diubah ? gayaDiubah : {}),
      ...(galat ? {
        borderColor: token.warna.status.merah.teks
      } : {}),
      ...style
    },
    "aria-invalid": galat ? true : undefined,
    "aria-describedby": galat ? `${id}-galat` : undefined,
    ...sisa
  }), galat && h(PesanGalat, {
    id: `${id}-galat`
  }, galat));
}