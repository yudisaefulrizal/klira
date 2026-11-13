import { h, Fragment } from '../../util/h.js';
                                            
import { token } from '../../gaya/token.js';
                                        

/** `baris`: isi disusun sejajar (pesan dan tombol aksi di sampingnya). */
export function Peringatan({
  nada = 'merah',
  baris = false,
  style,
  ...sisa
}                                    
              
                  
 ) {
  const w = token.warna.status[nada];
  return h("div", {
    role: "alert",
    style: {
      background: w.latar,
      color: w.teks,
      padding: token.jarak.sm,
      borderRadius: token.radius.sedang,
      fontSize: token.huruf.ukuran.dasar,
      ...(baris ? {
        display: 'flex',
        alignItems: 'center',
        gap: token.jarak.md
      } : {}),
      ...style
    },
    ...sisa
  });
}