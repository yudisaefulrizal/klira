import { token } from '../gaya/token';
import { useNavigasi } from '../util/navigasi';
import { TabAudit } from './pengaturan/tab-audit';

/** Halaman Log audit (3.1, 4.7): menu tersendiri, tabel dengan penyaring dan ekspor. */
export function HalamanLogAudit() {
  const { search, ganti } = useNavigasi();
  return (
    <>
      <h1 style={{ margin: 0, fontSize: token.huruf.ukuran.halaman, fontWeight: token.huruf.berat.tebal }}>Log audit</h1>
      <TabAudit search={search} ubahAlamat={(q) => ganti(`/log-audit${q}`)} />
    </>
  );
}
