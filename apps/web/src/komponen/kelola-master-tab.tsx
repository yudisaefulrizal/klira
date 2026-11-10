import { useCallback } from 'react';
import type { JenisMaster } from '@klira/shared';
import { DaftarMaster } from './daftar-master';
import { useNavigasi } from '../util/navigasi';

/** Pengelolaan satu jenis master sebagai tab di halaman pemiliknya; id tab = jenis master dan alamat tetap di halaman yang sama (?tab=jenis). */
export function KelolaMasterTab({ jenis }: { jenis: JenisMaster }) {
  const { path, search, ganti } = useNavigasi();
  const daftar = [jenis] as const;
  const ubahAlamat = useCallback((query: string) => {
    const q = new URLSearchParams(query);
    q.delete('jenis');
    q.set('tab', jenis);
    ganti(`${path}?${q}`);
  }, [path, jenis, ganti]);
  return <DaftarMaster key={jenis} search={search} ubahAlamat={ubahAlamat} jenisDaftar={daftar} />;
}
