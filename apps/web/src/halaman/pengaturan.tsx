import { useEffect } from 'react';
import { NAVIGASI, PENGGUNA } from '@klira/shared';
import { Tab } from '../komponen/ui/tab';
import { token } from '../gaya/token';
import { usePengguna } from '../util/konteks-pengguna';
import { bacaTabTerakhir, pilihTab, simpanTabTerakhir } from '../util/ingatan-tab';
import { useNavigasi } from '../util/navigasi';
import { tabPengaturanDiizinkan } from '../util/tab-pengaturan';
import type { IdTabPengaturan } from '../util/tab-pengaturan';
import { TabPengguna } from './pengaturan/tab-pengguna';

const HALAMAN = 'pengaturan';
const simpanan = () => (typeof sessionStorage === 'undefined' ? null : sessionStorage);

/** Halaman Pengaturan (3.1): tab dari alamat (?tab=), jika tidak ada dipakai tab terakhir (5.1h). */
export function HalamanPengaturan() {
  const { pengguna } = usePengguna();
  const { search, ganti } = useNavigasi();
  const tabBoleh = pengguna ? tabPengaturanDiizinkan(pengguna) : [];
  const ids = tabBoleh.map((t) => t.id);
  const dariAlamat = new URLSearchParams(search).get('tab');
  const aktif: IdTabPengaturan | undefined = ids.length ? pilihTab(ids, dariAlamat, bacaTabTerakhir(HALAMAN, ids, simpanan())) : undefined;

  useEffect(() => {
    if (!aktif) return;
    simpanTabTerakhir(HALAMAN, aktif, simpanan());
    if (dariAlamat !== aktif) ganti(`/${HALAMAN}?tab=${aktif}`);
  }, [aktif, dariAlamat, ganti]);

  return (
    <>
      <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: token.jarak.md }}>
        <h1 style={{ margin: 0, fontSize: token.huruf.ukuran.halaman, fontWeight: token.huruf.berat.tebal, flexGrow: 1 }}>{PENGGUNA.judulHalaman}</h1>
        {aktif && <Tab daftar={tabBoleh} aktif={aktif} label={PENGGUNA.judulHalaman} onPilih={(id) => ganti(`/${HALAMAN}?tab=${id}`)} />}
      </header>
      {aktif === 'pengguna' && <TabPengguna search={dariAlamat === 'pengguna' ? search : ''} ubahAlamat={(q) => ganti(`/${HALAMAN}${q}`)} />}
      {aktif && aktif !== 'pengguna' && <p style={{ margin: 0, color: token.warna.teksRedup }}>{NAVIGASI.segera}</p>}
    </>
  );
}
