import { halamanMenuDiizinkan } from '@klira/shared';
import { token } from '../gaya/token';
import { usePengguna } from '../util/konteks-pengguna';

/** Menu samping tetap di kiri: hanya memuat halaman yang diizinkan (5.1a). */
export function MenuSamping({ aktif, pindah }: { aktif: string; pindah: (ke: string) => void }) {
  const { pengguna } = usePengguna();
  if (!pengguna) return null;
  return (
    <nav
      style={{
        display: 'flex', flexDirection: 'column', gap: token.jarak.xs, padding: token.jarak.md,
        background: token.warna.permukaan, borderRight: `${token.ukuran.garis} solid ${token.warna.garis}`,
      }}
    >
      {halamanMenuDiizinkan(pengguna.fitur).map((h) => (
        <a
          key={h.path}
          href={h.path}
          aria-current={h.path === aktif ? 'page' : undefined}
          onClick={(e) => {
            e.preventDefault();
            pindah(h.path);
          }}
          style={{
            padding: `${token.jarak.sm} ${token.jarak.md}`, borderRadius: token.radius.sedang, textDecoration: 'none',
            fontFamily: token.huruf.keluarga, fontSize: token.huruf.ukuran.dasar,
            color: h.path === aktif ? token.warna.permukaan : token.warna.teks,
            background: h.path === aktif ? token.warna.utama : 'transparent',
          }}
        >
          {h.label}
        </a>
      ))}
    </nav>
  );
}
