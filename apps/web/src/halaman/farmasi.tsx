import { useEffect } from 'react';
import { FARMASI } from '@klira/shared';
import { Tab } from '../komponen/ui/tab';
import { Sebaris } from '../komponen/ui/susunan';
import { token } from '../gaya/token';
import { bacaTabTerakhir, pilihTab, simpanTabTerakhir } from '../util/ingatan-tab';
import { useNavigasi } from '../util/navigasi';
import { TabMasterObat } from './farmasi/tab-master-obat';
import { TabRiwayat } from './farmasi/tab-riwayat';

const HALAMAN = 'farmasi';
const TAB = [{ id: 'master', label: FARMASI.tab.master }, { id: 'riwayat', label: FARMASI.tab.riwayat }] as const;
const IDS = TAB.map((t) => t.id);
const simpanan = () => (typeof sessionStorage === 'undefined' ? null : sessionStorage);

/** Halaman Farmasi (3.1): tab Master obat dan stok serta Riwayat obat; tab dari alamat (?tab=), jika tidak ada dipakai tab terakhir (5.1h). */
export function HalamanFarmasi() {
  const { search, ganti } = useNavigasi();
  const dariAlamat = new URLSearchParams(search).get('tab');
  const aktif = pilihTab(IDS, dariAlamat, bacaTabTerakhir(HALAMAN, IDS, simpanan()));

  useEffect(() => {
    simpanTabTerakhir(HALAMAN, aktif, simpanan());
    if (dariAlamat !== aktif) ganti(`/${HALAMAN}?tab=${aktif}`);
  }, [aktif, dariAlamat, ganti]);

  return (
    <>
      <Sebaris tag="header" jarak="md" bungkus>
        <h1 style={{ margin: 0, fontSize: token.huruf.ukuran.halaman, fontWeight: token.huruf.berat.tebal, flexGrow: 1 }}>{FARMASI.judul}</h1>
        <Tab daftar={TAB} aktif={aktif} label={FARMASI.tabLabel} onPilih={(id) => ganti(`/${HALAMAN}?tab=${id}`)} />
      </Sebaris>
      {aktif === 'master' && <TabMasterObat />}
      {aktif === 'riwayat' && <TabRiwayat />}
    </>
  );
}
