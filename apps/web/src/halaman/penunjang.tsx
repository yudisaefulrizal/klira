import { useEffect } from 'react';
import { PENUNJANG } from '@klira/shared';
import { Tab } from '../komponen/ui/tab';
import { Sebaris } from '../komponen/ui/susunan';
import { token } from '../gaya/token';
import { bacaTabTerakhir, pilihTab, simpanTabTerakhir } from '../util/ingatan-tab';
import { useNavigasi } from '../util/navigasi';
import { TabMasterPemeriksaan } from './penunjang/tab-master-pemeriksaan';
import { TabRekap } from './penunjang/tab-rekap';

const HALAMAN = 'penunjang';
const TAB = [{ id: 'rekap', label: PENUNJANG.tab.rekap }, { id: 'master', label: PENUNJANG.tab.master }] as const;
const IDS = TAB.map((t) => t.id);
const simpanan = () => (typeof sessionStorage === 'undefined' ? null : sessionStorage);

/** Halaman Penunjang (3.1): tab Rekap lab dan Master pemeriksaan; tab dari alamat (?tab=), jika tidak ada dipakai tab terakhir (5.1h). */
export function HalamanPenunjang() {
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
        <h1 style={{ margin: 0, fontSize: token.huruf.ukuran.halaman, fontWeight: token.huruf.berat.tebal, flexGrow: 1 }}>{PENUNJANG.judul}</h1>
        <Tab daftar={TAB} aktif={aktif} label={PENUNJANG.tabLabel} onPilih={(id) => ganti(`/${HALAMAN}?tab=${id}`)} />
      </Sebaris>
      {aktif === 'rekap' && <TabRekap />}
      {aktif === 'master' && <TabMasterPemeriksaan />}
    </>
  );
}
