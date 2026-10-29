import { KELOMPOK_MASTER } from '../util/lokasi-master';
import { MASUK, NAVIGASI, halamanMenuDiizinkan } from '@klira/shared';
import { token } from '../gaya/token';
import { usePengguna } from '../util/konteks-pengguna';
import { Tombol } from './ui/tombol';
import { Kolom, Sebaris } from './ui/susunan';
import { Penanda } from './ui/penanda';
import { IkonMenu } from './ikon-menu';

/** Menu samping tetap di kiri: hanya halaman yang diizinkan, penanda aktif, dan kotak pengguna dengan tombol keluar (5.1a). */
export function MenuSamping({
  aktif,
  pindah,
  ringkas = false,
}: {
  ringkas?: boolean;
  aktif: string;
  pindah: (ke: string) => void;
}) {
  const { pengguna, keluar } = usePengguna();
  if (!pengguna) return null;
  const halamanInduk = KELOMPOK_MASTER.find(k => k.path === aktif)?.induk ?? aktif;
  const adaMenuInduk = halamanMenuDiizinkan(pengguna.fitur).some(h => h.path === halamanInduk);
  return (
    <Kolom
      tag="nav"
      className={ringkas ? 'wa-menu-samping' : 'menu-klinik'}
      aria-label={NAVIGASI.menuUtama}
      jarak="xs"
      garis="kanan"
      style={{
        flex: `0 0 ${token.ukuran.menuSamping}`,
        boxSizing: 'border-box',
        padding: `${token.jarak.lg} ${token.jarak.md}`,
        background: token.warna.permukaan,
      }}
    >
      <Sebaris jarak="sm" style={{ padding: `${token.jarak.xs} ${token.jarak.md} ${token.jarak.lg}` }}>
        <Penanda ukuran="logo" bentuk="sudut" aria-hidden="true">
          k
        </Penanda>
        <div style={{ fontWeight: token.huruf.berat.tebal, fontSize: token.huruf.ukuran.judul }}>{MASUK.judul}</div>
      </Sebaris>
      {halamanMenuDiizinkan(pengguna.fitur).map((h) => {
        const on = h.path === halamanInduk || (!adaMenuInduk && h.path === '/pengaturan');
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
              display: 'flex',
              alignItems: 'center',
              gap: token.jarak.sm,
              padding: `${token.jarak.sm} ${token.jarak.md}`,
              borderRadius: token.radius.sedang,
              textDecoration: 'none',
              fontFamily: token.huruf.keluarga,
              fontSize: token.huruf.ukuran.dasar,
              color: on ? token.warna.utamaGelap : token.warna.teksMenu,
              background: on ? token.warna.utamaLatar : 'transparent',
              fontWeight: on ? token.huruf.berat.tebal : token.huruf.berat.biasa,
            }}
          >
            <IkonMenu path={h.path} />
            <span>{h.label}</span>
          </a>
        );
      })}
      <div style={{ flexGrow: 1, minHeight: token.jarak.xl }} />
      <Kolom jarak="xs" padding="md" garis="atas">
        <div style={{ fontWeight: token.huruf.berat.tebal, fontSize: token.huruf.ukuran.dasar }}>{pengguna.nama}</div>
        <div
          title={pengguna.jenis_akun.join(', ')}
          style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}
        >
          {`${pengguna.jenis_akun[0] ?? ''}${pengguna.jenis_akun.length > 1 ? ` · +${pengguna.jenis_akun.length - 1} lainnya` : ''}`}
          {pengguna.jenis_akun.length > 1 && <details className="menu-peran"><summary>Lihat semua peran</summary><p>{pengguna.jenis_akun.join(', ')}</p></details>}
        </div>
        <Tombol varian="sekunder" onClick={() => void keluar()} style={{ marginTop: token.jarak.sm }}>
          {MASUK.keluar}
        </Tombol>
      </Kolom>
    </Kolom>
  );
}
