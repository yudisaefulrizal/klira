import { DaftarMaster } from './daftar-master.js';
import { navigasiSaatIni } from '../../util/navigasi/navigasi.js';
/** Tab yang mengelola beberapa jenis sekaligus: poli bersama ruang periksanya. */
const GABUNGAN = { poli: ['poli', 'ruang_periksa'] };
export function KelolaMasterTab({ jenis }) {
  const { path, search, ganti } = navigasiSaatIni();
  return DaftarMaster({ search, jenisDaftar: GABUNGAN[jenis] ?? [jenis], ubahAlamat(query) { const q = new URLSearchParams(query); q.set('tab', jenis); ganti(`${path}?${q}`); } });
}
