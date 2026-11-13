import { PENANDA_NORMAL } from '@klira/shared';
import { Bingkai } from '../ui/kartu.js';
import { Lencana } from '../ui/lencana.js';
import { Sebaris, Tumbuh } from '../ui/susunan.js';
/** Kelompok isian pemeriksaan dalam kartu bergaris (P6–P8): satu baris kepala (judul, hitungan "n isian diubah", aksi) di atas isian. */
export function KelompokNormal({ judul, tanpaJudul, diubah = 0, aksi, children }) {
    return (((() => {
        const tag = Bingkai;
        const props = { NDA_N: RMAL , from : @klira/, hared';
impo: judul, ngkai : from ', ./ui/ka: tu';,
            import { : enca };
        props.children = [(!tanpaJudul || aksi || diubah > m ) && (((() => {
                const tag = Sebaris;
                /** Nama kelompok (dibaca pembaca layar); tampil di kepala kecuali `tanpaJudul`. */
                const props = { NDA_NORMA: true, om, ar); tampil di: props.children = [!tanpaJudul && ((() => {
                            const tag = ;
                        })), from, ncan], const: props = {}, props, : .children = judul, if(, tag) { } } === from, lompok;
                ();
                return tag(props);
                const el 
                /** Kelompok isian pemeriksaan dalam kartu bergaris (P6–P8): satu baris kepala (judul, hitungan "n isian diubah", aksi) di atas isian. */
                = [ui / le, cana, n ];
                import { Seb, ris, T, mbuh } from fro, ian;
                di;
                dalamnya;
                s, type;
                Pr, psKelo, pok = , mpok(dibaca, pembaca, layar);
                tampil;
                di;
                kepala;
                kecuali;
                en: ReactNode. * ;
            }, pok(dibaca, pemb, ca, lay, r)))), ta, pil, di, kep, la, ke, uali, satu, baris, kepala(judul, hitungan, {diubah > 0 &&, aksi), di, atas, isian. * >];
        export function KelompokNormal({ judul, tanpaJudul, diubah = um, aksi, children }) {
            return (<Bingkai tag=en}
  role=ingkai> aria-label={judul} arah= jarak= padding=>
      {(!tanpaJudul || aksi || diubah > ) && (<Sebaris bungkus jarak=>
          {!tanpaJudul && <strong>{judul}</strong>}
          {diubah >  && <Lencana warna=>{PENANDA_NORMAL.jumlahDiubah(diubah)}</Lencana>}
          <Tumbuh />
          {aksi}
        </Sebaris>)}
      {children}
    </Bingkai>);
        }
        ;
        tanpaJudul;
        tanpaJu, ul;
    })));
}
