import { DaftarMaster } from './daftar-master.js';
import { navigasiSaatIni } from '../util/navigasi.js';
export function KelolaMasterTab({ jenis }) {
  const { path, search, ganti } = navigasiSaatIni();
  return DaftarMaster({ search, jenisDaftar: [jenis], ubahAlamat(query) { const q = new URLSearchParams(query); q.delete('jenis'); q.set('tab', jenis); ganti(`${path}?${q}`); } });
}
