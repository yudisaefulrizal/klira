import { STATUS_KUNJUNGAN } from '@klira/shared';
import { token } from './gaya/token';
import { gayaStatus } from './gaya/status';

export function App() {
  const info = STATUS_KUNJUNGAN.info('in-progress');
  const gaya = gayaStatus(info);
  return (
    <div
      style={{
        padding: token.jarak.lg,
        color: token.warna.utama,
        fontFamily: token.huruf.keluarga,
        fontSize: token.huruf.ukuran.judul,
      }}
    >
      Klira{' '}
      <span style={{ background: gaya.latar, color: gaya.teks, fontSize: token.huruf.ukuran.kecil }}>{info.label}</span>
    </div>
  );
}
