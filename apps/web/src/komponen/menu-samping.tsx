import { MASUK, NAVIGASI, halamanMenuDiizinkan } from '@klira/shared';
import { token } from '../gaya/token';
import { usePengguna } from '../util/konteks-pengguna';
import { Tombol } from './ui/tombol';

/** Menu samping tetap di kiri: hanya halaman yang diizinkan, penanda aktif, dan kotak pengguna dengan tombol keluar (5.1a). */
export function MenuSamping({ aktif, pindah }: { aktif: string; pindah: (ke: string) => void }) {
  const { pengguna, keluar } = usePengguna();
  if (!pengguna) return null;
  return (
    <nav
      aria-label={NAVIGASI.menuUtama}
      style={{
        flex: `0 0 ${token.ukuran.menuSamping}`, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: token.jarak.xs,
        padding: `${token.jarak.lg} ${token.jarak.md}`, background: token.warna.permukaan,
        borderRight: `${token.ukuran.garis} solid ${token.warna.garis}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: token.jarak.sm, padding: `${token.jarak.xs} ${token.jarak.md} ${token.jarak.lg}` }}>
        <div
          aria-hidden="true"
          style={{
            width: token.ukuran.logo, height: token.ukuran.logo, borderRadius: token.radius.sedang, background: token.warna.utama,
            color: token.warna.permukaan, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: token.huruf.berat.tebal,
          }}
        >
          k
        </div>
        <div style={{ fontWeight: token.huruf.berat.tebal, fontSize: token.huruf.ukuran.judul }}>{MASUK.judul}</div>
      </div>
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
      <div style={{ padding: token.jarak.md, borderTop: `${token.ukuran.garis} solid ${token.warna.garis}`, display: 'flex', flexDirection: 'column', gap: token.jarak.xs }}>
        <div style={{ fontWeight: token.huruf.berat.tebal, fontSize: token.huruf.ukuran.dasar }}>{pengguna.nama}</div>
        <div style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{pengguna.jenis_akun.join(', ')}</div>
        <Tombol varian="sekunder" onClick={() => void keluar()} style={{ marginTop: token.jarak.sm }}>
          {MASUK.keluar}
        </Tombol>
      </div>
    </nav>
  );
}
