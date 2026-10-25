import { useEffect } from 'react';
import { REKAM_MEDIS } from '@klira/shared';
import { Tab } from '../komponen/ui/tab';
import { Sebaris } from '../komponen/ui/susunan';
import { token } from '../gaya/token';
import { bacaTabTerakhir, pilihTab, simpanTabTerakhir } from '../util/ingatan-tab';
import { usePengguna } from '../util/konteks-pengguna';
import { useNavigasi } from '../util/navigasi';
import { tabRekamMedisDiizinkan } from '../util/tab-rekam-medis';
import type { IdTabRekamMedis } from '../util/tab-rekam-medis';
import { TabBerkas } from './rekam-medis/tab-berkas';
import { TabPerbaikan } from './rekam-medis/tab-perbaikan';

const HALAMAN = 'rekam-medis';
const simpanan = () => (typeof sessionStorage === 'undefined' ? null : sessionStorage);

/** Halaman Rekam medis (3.1): berkas pasien, pengkodean, dan antrean perbaikan; tab menurut izin, dari alamat (?tab=) atau tab terakhir (5.1h). */
export function HalamanRekamMedis() {
  const { pengguna } = usePengguna();
  const { search, ganti } = useNavigasi();
  const tabBoleh = pengguna ? tabRekamMedisDiizinkan(pengguna) : [];
  const ids = tabBoleh.map((t) => t.id);
  const dariAlamat = new URLSearchParams(search).get('tab');
  const aktif: IdTabRekamMedis | undefined = ids.length ? pilihTab(ids, dariAlamat, bacaTabTerakhir(HALAMAN, ids, simpanan())) : undefined;

  useEffect(() => {
    if (!aktif) return;
    simpanTabTerakhir(HALAMAN, aktif, simpanan());
    if (dariAlamat !== aktif) ganti(`/${HALAMAN}?tab=${aktif}`);
  }, [aktif, dariAlamat, ganti]);

  return (
    <>
      <Sebaris tag="header" jarak="md" bungkus>
        <h1 style={{ margin: 0, fontSize: token.huruf.ukuran.halaman, fontWeight: token.huruf.berat.tebal, flexGrow: 1 }}>{REKAM_MEDIS.judul}</h1>
        {aktif && <Tab daftar={tabBoleh} aktif={aktif} label={REKAM_MEDIS.tabLabel} onPilih={(id) => ganti(`/${HALAMAN}?tab=${id}`)} />}
      </Sebaris>
      {aktif === 'berkas' && <TabBerkas />}
      {aktif === 'pengkodean' && <TabBerkas judulDaftar={REKAM_MEDIS.tab.pengkodean} kodeAwal="belum" />}
      {aktif === 'perbaikan' && <TabPerbaikan />}
    </>
  );
}
