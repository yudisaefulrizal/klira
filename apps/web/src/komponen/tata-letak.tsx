import { TombolPesan as TombolInstagram } from './instagram/pesan';
import { TombolPesan } from './pesan/pesan';
import { useState, type ReactNode, type CSSProperties } from 'react';
import { token } from '../gaya/token';
import { useNavigasi } from '../util/navigasi';
import { Tombol } from './ui/tombol';
import { IkonPesan } from './pesan/ikon';
import { MenuSamping } from './menu-samping';
import { Kolom, Sebaris } from './ui/susunan';

/** Kerangka halaman terautentikasi: menu samping di kiri, isi di kanan (dipakai semua halaman). */
export function TataLetak({ children }: { children: ReactNode }) {
  const { path, pindah } = useNavigasi();
  const pesan = path === '/pesan';
  const [menu, setMenu] = useState(false);
  return (
    <Sebaris
      className={pesan ? 'wa-aplikasi' : undefined}
      data-menu={menu}
      jarak="tanpa"
      bungkus={!pesan}
      sejajar="regang"
      style={
        {
          '--wa-tinggi-tema': token.ukuran.tinggiTema,
          '--wa-lebar-menu': token.ukuran.menuSamping,
          '--wa-lapis-menu': token.lapis.pesan,
          minHeight: pesan ? 0 : token.ukuran.tinggiLayar,
          height: pesan ? `calc(100dvh - ${token.ukuran.tinggiTema})` : undefined,
          background: token.warna.latar,
        } as CSSProperties
      }
    >
      <MenuSamping
        aktif={path}
        ringkas={pesan}
        pindah={(ke) => {
          setMenu(false);
          pindah(ke);
        }}
      />
      <Kolom
        tag="main"
        jarak="md"
        style={{
          flex: `999 1 ${token.ukuran.isiMin}`,
          minWidth: 0,
          boxSizing: 'border-box',
          padding: pesan ? token.jarak.lg : `${token.jarak.lg} ${token.jarak.xl}`,
          overflow: pesan ? 'hidden' : undefined,
        }}
      >
        {pesan && (
          <div className="wa-menu-mobile">
            <Tombol
              className="wa-menu-buka"
              varian="teks"
              aria-label="Menu utama"
              aria-expanded={menu}
              onClick={() => setMenu((v) => !v)}
            >
              <IkonPesan nama={menu ? 'tutup' : 'menu'} />
              {menu ? 'Tutup' : 'Menu'}
            </Tombol>
          </div>
        )}
        {children}
      </Kolom>
      <TombolPesan /><TombolInstagram />
    </Sebaris>
  );
}
