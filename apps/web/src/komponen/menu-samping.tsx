import { MASUK, NAVIGASI, halamanMenuDiizinkan } from '@klira/shared';
import { token } from '../gaya/token';
import { usePengguna } from '../util/konteks-pengguna';
import { Tombol } from './ui/tombol';
import { Kolom, Sebaris } from './ui/susunan';
import { Penanda } from './ui/penanda';

/** Menu samping tetap di kiri: hanya halaman yang diizinkan, penanda aktif, dan kotak pengguna dengan tombol keluar (5.1a). */
export function MenuSamping({ aktif, pindah }: { aktif: string; pindah: (ke: string) => void }) {
  const { pengguna, keluar } = usePengguna();
  if (!pengguna) return null;
  return (
    <Kolom
      tag="nav"
      aria-label={NAVIGASI.menuUtama}
      jarak="xs"
      garis="kanan"
      style={{ flex: `0 0 ${token.ukuran.menuSamping}`, boxSizing: 'border-box', padding: `${token.jarak.lg} ${token.jarak.md}`, background: token.warna.permukaan }}
    >
      <Sebaris jarak="sm" style={{ padding: `${token.jarak.xs} ${token.jarak.md} ${token.jarak.lg}` }}>
        <Penanda ukuran="logo" bentuk="sudut" aria-hidden="true">k</Penanda>
        <div style={{ fontWeight: token.huruf.berat.tebal, fontSize: token.huruf.ukuran.judul }}>{MASUK.judul}</div>
      </Sebaris>
      {halamanMenuDiizinkan(pengguna.fitur).map((h) => {
        const on = h.path === aktif;
        return (
          <a
            key={h.path}
            href={h.path}
            aria-current={on ? 'page' : undefined}
            onClick={(e) => {
              e.preventDefault();
              pindah(h.path);
            }}
            style={{
              display: 'block', padding: `${token.jarak.sm} ${token.jarak.md}`, borderRadius: token.radius.sedang, textDecoration: 'none',
              fontFamily: token.huruf.keluarga, fontSize: token.huruf.ukuran.dasar,
              color: on ? token.warna.utamaGelap : token.warna.teksMenu,
              background: on ? token.warna.utamaLatar : 'transparent',
              fontWeight: on ? token.huruf.berat.tebal : token.huruf.berat.biasa,
            }}
          >
            {h.label}
          </a>
        );
      })}
      <div style={{ flexGrow: 1, minHeight: token.jarak.xl }} />
      <Kolom jarak="xs" padding="md" garis="atas">
        <div style={{ fontWeight: token.huruf.berat.tebal, fontSize: token.huruf.ukuran.dasar }}>{pengguna.nama}</div>
        <div style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{pengguna.jenis_akun.join(', ')}</div>
        <Tombol varian="sekunder" onClick={() => void keluar()} style={{ marginTop: token.jarak.sm }}>
          {MASUK.keluar}
        </Tombol>
      </Kolom>
    </Kolom>
  );
}
