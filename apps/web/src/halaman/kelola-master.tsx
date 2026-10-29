import { useCallback } from 'react';
import { DaftarMaster } from '../komponen/daftar-master';
import { Sebaris } from '../komponen/ui/susunan';
import { token } from '../gaya/token';
import { useNavigasi } from '../util/navigasi';
import { usePengguna } from '../util/konteks-pengguna';
import { halamanDiizinkan } from '../util/penjaga-rute';
import { alamatKembaliMaster, KELOMPOK_MASTER } from '../util/lokasi-master';
import '../komponen/kelola-master.css';

export function HalamanKelolaMaster() {
  const { path, search, pindah, ganti } = useNavigasi();
  const { pengguna } = usePengguna();
  const kelompok = KELOMPOK_MASTER.find(k => k.path === path)!;
  const kembali = alamatKembaliMaster(search, kelompok, pengguna ? halamanDiizinkan(pengguna) : []);
  const ubahAlamat = useCallback((query: string) => {
    const q = new URLSearchParams(query);
    // Alamat pengelolaan tidak memerlukan tab Pengaturan; pertahankan halaman kerja asal.
    q.delete('tab'); q.set('kembali', kembali);
    ganti(`${path}?${q}`);
  }, [path, ganti, kembali]);
  return <>
    <Sebaris tag="header" jarak="md" bungkus>
      <div style={{ flexGrow: 1 }}><p className="kelola-master-induk">{kelompok.halaman}</p><h1 style={{ margin: 0, fontSize: token.huruf.ukuran.halaman }}>{kelompok.judul}</h1><p className="kelola-master-keterangan">{kelompok.keterangan}</p></div>
      <a className="tautan-kelola-master" href={kembali} onClick={e => {
        if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
        e.preventDefault(); pindah(kembali);
      }}>← {kembali.startsWith('/pengaturan') ? 'Kembali ke pengaturan' : `Kembali ke ${kelompok.halaman.toLowerCase()}`}</a>
    </Sebaris>
    <DaftarMaster key={path} search={search} ubahAlamat={ubahAlamat} jenisDaftar={kelompok.jenis} />
  </>;
}
