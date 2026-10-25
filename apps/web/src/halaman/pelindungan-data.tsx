import { useEffect } from 'react';
import { PDP, punyaIzin } from '@klira/shared';
import { Tab } from '../komponen/ui/tab';
import { Sebaris } from '../komponen/ui/susunan';
import { token } from '../gaya/token';
import { bacaTabTerakhir, pilihTab, simpanTabTerakhir } from '../util/ingatan-tab';
import { usePengguna } from '../util/konteks-pengguna';
import { useNavigasi } from '../util/navigasi';
import { TABS_PDP } from '../util/tab-pdp';
import { TabDpia } from './pelindungan-data/tab-dpia';
import { TabHak } from './pelindungan-data/tab-hak';
import { TabInsiden } from './pelindungan-data/tab-insiden';
import { TabPersetujuan } from './pelindungan-data/tab-persetujuan';
import { TabProsesor } from './pelindungan-data/tab-prosesor';
import { TabRetensi } from './pelindungan-data/tab-retensi';
import { TabRopa } from './pelindungan-data/tab-ropa';

const HALAMAN = 'pelindungan-data';
const simpanan = () => (typeof sessionStorage === 'undefined' ? null : sessionStorage);

/** Halaman Pelindungan data (3.1): persetujuan dan pemberitahuan, hak pasien, ROPA, DPIA, insiden, retensi dan pemusnahan, prosesor; tab dari alamat (?tab=) atau tab terakhir (5.1h). */
export function HalamanPelindunganData() {
  const { pengguna } = usePengguna();
  const { search, ganti } = useNavigasi();
  const boleh = !!pengguna && punyaIzin(pengguna, 'pdp', 'lihat');
  const ids = boleh ? TABS_PDP.map((t) => t.id) : [];
  const dariAlamat = new URLSearchParams(search).get('tab');
  const aktif = ids.length ? pilihTab(ids, dariAlamat, bacaTabTerakhir(HALAMAN, ids, simpanan())) : undefined;

  useEffect(() => {
    if (!aktif) return;
    simpanTabTerakhir(HALAMAN, aktif, simpanan());
    if (dariAlamat !== aktif) ganti(`/${HALAMAN}?tab=${aktif}`);
  }, [aktif, dariAlamat, ganti]);

  return (
    <>
      <Sebaris tag="header" jarak="md" bungkus>
        <h1 style={{ margin: 0, fontSize: token.huruf.ukuran.halaman, fontWeight: token.huruf.berat.tebal, flexGrow: 1 }}>{PDP.judul}</h1>
        {aktif && <Tab daftar={TABS_PDP} aktif={aktif} label={PDP.tabLabel} onPilih={(id) => ganti(`/${HALAMAN}?tab=${id}`)} />}
      </Sebaris>
      {aktif === 'persetujuan' && <TabPersetujuan />}
      {aktif === 'hak' && <TabHak />}
      {aktif === 'ropa' && <TabRopa />}
      {aktif === 'dpia' && <TabDpia />}
      {aktif === 'insiden' && <TabInsiden />}
      {aktif === 'retensi' && <TabRetensi />}
      {aktif === 'prosesor' && <TabProsesor />}
    </>
  );
}
