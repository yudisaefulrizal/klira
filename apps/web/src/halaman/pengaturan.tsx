import { useEffect } from 'react';
import { NAVIGASI, PENGGUNA } from '@klira/shared';
import { Tab } from '../komponen/ui/tab';
import { token } from '../gaya/token';
import { usePengguna } from '../util/konteks-pengguna';
import { bacaTabTerakhir, pilihTab, simpanTabTerakhir } from '../util/ingatan-tab';
import { useNavigasi } from '../util/navigasi';
import { tabPengaturanDiizinkan } from '../util/tab-pengaturan';
import type { IdTabPengaturan } from '../util/tab-pengaturan';
import { TabAudit } from './pengaturan/tab-audit';
import { TabJenisAkun } from './pengaturan/tab-jenis-akun';
import { TabKeamanan } from './pengaturan/tab-keamanan';
import { TabPengguna } from './pengaturan/tab-pengguna';
import { TabPeringatan } from './pengaturan/tab-peringatan';

const HALAMAN = 'pengaturan';
/** Tab yang sudah punya isi; sisanya masih menampilkan pesan segera. */
const TAB_SIAP: readonly IdTabPengaturan[] = ['pengguna', 'jenis-akun', 'peringatan', 'keamanan', 'audit'];
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

  const ubahAlamat = (q: string) => ganti(`/${HALAMAN}${q}`);

  return (
    <>
      <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: token.jarak.md }}>
        <h1 style={{ margin: 0, fontSize: token.huruf.ukuran.halaman, fontWeight: token.huruf.berat.tebal, flexGrow: 1 }}>{PENGGUNA.judulHalaman}</h1>
        {aktif && <Tab daftar={tabBoleh} aktif={aktif} label={PENGGUNA.judulHalaman} onPilih={(id) => ganti(`/${HALAMAN}?tab=${id}`)} />}
      </header>
      {aktif === 'pengguna' && <TabPengguna search={dariAlamat === 'pengguna' ? search : ''} ubahAlamat={ubahAlamat} />}
      {aktif === 'jenis-akun' && <TabJenisAkun />}
      {aktif === 'peringatan' && <TabPeringatan search={dariAlamat === 'peringatan' ? search : ''} ubahAlamat={ubahAlamat} />}
      {aktif === 'keamanan' && <TabKeamanan />}
      {aktif === 'audit' && <TabAudit search={dariAlamat === 'audit' ? search : ''} ubahAlamat={ubahAlamat} />}
      {aktif && !TAB_SIAP.includes(aktif) && <p style={{ margin: 0, color: token.warna.teksRedup }}>{NAVIGASI.segera}</p>}
    </>
  );
}
