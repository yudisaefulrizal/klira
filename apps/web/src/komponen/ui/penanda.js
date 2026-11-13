import { h, Fragment } from '../../util/h.js';
                                            
import { token } from '../../gaya/token.js';
                                                
                                             
                                    
                                                           
                             
                                                                                                  
                                         
  

/** Kotak kecil berisi satu karakter atau angka (logo menu, penanda nomor langkah). */
export function Penanda({
  ukuran,
  bentuk = 'bulat',
  isi = 'penuh',
  style,
  ...sisa
}       ) {
  const garis = (warna        ) => `${token.ukuran.garis} solid ${warna}`;
  return h("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      width: token.ukuran[ukuran],
      height: token.ukuran[ukuran],
      borderRadius: bentuk === 'bulat' ? token.radius.pil : token.radius.sedang,
      fontSize: ukuran === 'logo' ? undefined : token.huruf.ukuran.kecil,
      fontWeight: ukuran === 'logo' ? token.huruf.berat.tebal : undefined,
      background: isi === 'penuh' ? token.warna.utama : 'transparent',
      color: isi === 'penuh' ? token.warna.diAtasUtama : 'inherit',
      border: isi === 'penuh' ? 'none' : garis(isi === 'garisUtama' ? token.warna.utama : token.warna.garisIsian),
      ...style
    },
    ...sisa
  });
}

/** Teks kode satu baris yang mudah dipilih (mis. kata sandi awal), berbasis token. */
export function Kode({
  style,
  ...sisa
}                             ) {
  return h("code", {
    style: {
      fontSize: token.huruf.ukuran.judul,
      fontWeight: token.huruf.berat.tebal,
      letterSpacing: token.huruf.jarakHuruf.kode,
      background: token.warna.kepalaTabel,
      padding: `${token.jarak.sm} ${token.jarak.md}`,
      borderRadius: token.radius.sedang,
      border: `${token.ukuran.garis} solid ${token.warna.garis}`,
      userSelect: 'all',
      ...style
    },
    ...sisa
  });
}