import { MASUK } from '@klira/shared';
import { Tombol } from '../komponen/ui/tombol';
import { token } from '../gaya/token';
import { usePengguna } from '../util/konteks-pengguna';

/** Halaman awal sementara; isi sebenarnya dikerjakan di butir berikutnya. */
export function HalamanSementara({ judul }: { judul: string }) {
  const { pengguna, keluar } = usePengguna();
  return (
    <div style={{ padding: token.jarak.lg, display: 'flex', flexDirection: 'column', gap: token.jarak.md, alignItems: 'flex-start' }}>
      <h1 style={{ margin: 0, fontSize: token.huruf.ukuran.judul }}>{judul}</h1>
      <p style={{ margin: 0 }}>{pengguna?.nama}</p>
      <Tombol onClick={() => void keluar()}>{MASUK.keluar}</Tombol>
    </div>
  );
}
