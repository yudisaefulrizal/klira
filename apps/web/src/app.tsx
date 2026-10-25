import { token } from './gaya/token';

export function App() {
  return (
    <div
      style={{
        padding: token.jarak.lg,
        color: token.warna.utama,
        fontFamily: token.huruf.keluarga,
        fontSize: token.huruf.ukuran.judul,
      }}
    >
      Klira
    </div>
  );
}
