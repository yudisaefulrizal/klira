import { useCallback, useEffect } from 'react';
import { MASTER } from '@klira/shared';
import { DaftarMaster } from '../../komponen/daftar-master';
import { Kartu } from '../../komponen/ui/kartu';
import { Kisi, Kolom, Sebaris } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { token } from '../../gaya/token';
import { useNavigasi } from '../../util/navigasi';
import { KELOMPOK_MASTER, tujuanMasterLama } from '../../util/lokasi-master';
import '../../komponen/kelola-master.css';
const WILAYAH = ['wilayah'] as const;

/** Indeks akses master; data operasional dikelola pada halaman pemiliknya. */
export function TabMaster({ search, ubahAlamat }: { search: string; ubahAlamat: (query: string) => void }) {
  const { pindah, ganti } = useNavigasi();
  const ubahWilayah = useCallback((query: string) => {
    const q = new URLSearchParams(query);
    q.set('jenis', 'wilayah');
    ubahAlamat(`?${q}`);
  }, [ubahAlamat]);
  const tujuan = tujuanMasterLama(search);
  useEffect(() => { if (tujuan) ganti(tujuan); }, [tujuan, ganti]);
  if (tujuan) return null;
  const wilayah = new URLSearchParams(search).get('jenis') === 'wilayah';
  return <Kolom tag="section" jarak="md" id="panel-master" role="tabpanel" aria-labelledby="tab-master">
    {wilayah ? <>
      <Sebaris jarak="md" bungkus><h2 style={{ margin: 0, flexGrow: 1, fontSize: token.huruf.ukuran.besar }}>Referensi wilayah</h2><Tombol varian="teks" onClick={() => ubahAlamat('?tab=master')}>← Semua data</Tombol></Sebaris>
      <DaftarMaster search={search} ubahAlamat={ubahWilayah} jenisDaftar={WILAYAH} />
    </> : <>
      <p className="kelola-master-keterangan">Kelola data melalui halaman layanan yang menggunakannya.</p>
      <Kisi kolom="repeat(auto-fit, minmax(min(100%, 260px), 1fr))">
        {KELOMPOK_MASTER.map(k => <Kartu key={k.id}>
          <Kolom jarak="sm"><span className="kelola-master-induk">{k.halaman}</span><h2 style={{ margin: 0, fontSize: token.huruf.ukuran.besar }}>{k.judul}</h2><p className="kelola-master-keterangan">{k.keterangan}</p>
            <Sebaris jarak="sm" bungkus>{k.jenis.map(j => {
              const href = `${k.path}?${new URLSearchParams({ jenis: j, kembali: '/pengaturan?tab=master' })}`;
              return <a className="tautan-kelola-master" key={j} href={href} onClick={e => {
                if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
                e.preventDefault(); pindah(href);
              }}>{MASTER.jenis[j]} →</a>;
            })}</Sebaris>
          </Kolom>
        </Kartu>)}
        <Kartu><Kolom jarak="sm"><span className="kelola-master-induk">Referensi bersama</span><h2 style={{ margin: 0, fontSize: token.huruf.ukuran.besar }}>Wilayah</h2><p className="kelola-master-keterangan">Daftar wilayah administratif sebagai referensi alamat.</p><Tombol varian="sekunder" onClick={() => ubahAlamat('?tab=master&jenis=wilayah')}>Lihat wilayah</Tombol></Kolom></Kartu>
      </Kisi>
    </>}
  </Kolom>;
}
