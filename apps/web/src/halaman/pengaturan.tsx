import { useEffect } from 'react';
import { Tab } from '../komponen/ui/tab';
import { token } from '../gaya/token';
import { usePengguna } from '../util/konteks-pengguna';
import { bacaTabTerakhir, pilihTab, simpanTabTerakhir } from '../util/ingatan-tab';
import { useNavigasi } from '../util/navigasi';
import { HALAMAN_PENGATURAN, tabDiizinkan } from '../util/tab-pengaturan';
import type { IdTabAkses, IdTabKlinik } from '../util/tab-pengaturan';
import { TabJenisAkun } from './pengaturan/tab-jenis-akun';
import { TabProfil } from './pengaturan/tab-profil';
import { TabBackup } from './pengaturan/tab-backup';
import { TabKeamanan } from './pengaturan/tab-keamanan';
import { TabPengguna } from './pengaturan/tab-pengguna';
import { TabPeringatan } from './pengaturan/tab-peringatan';
import { Sebaris } from '../komponen/ui/susunan';

const simpanan = () => (typeof sessionStorage === 'undefined' ? null : sessionStorage);

/** Rangka halaman bertab: tab dari alamat (?tab=), jika tidak ada dipakai tab terakhir (5.1h). */
function useTabPengaturan<T extends string>(kunci: 'akses' | 'klinik', daftar: readonly { id: T; label: string }[]) {
  const { search, path, ganti } = useNavigasi();
  const ids = daftar.map((t) => t.id);
  const dariAlamat = new URLSearchParams(search).get('tab');
  const aktif: T | undefined = ids.length ? pilihTab(ids, dariAlamat, bacaTabTerakhir(kunci, ids, simpanan())) : undefined;
  useEffect(() => {
    if (!aktif) return;
    simpanTabTerakhir(kunci, aktif, simpanan());
    if (dariAlamat !== aktif) ganti(`${path}?tab=${aktif}`);
  }, [aktif, dariAlamat, ganti, kunci, path]);
  return { aktif, search, dariAlamat, ubahAlamat: (q: string) => ganti(`${path}${q}`), pilih: (id: T) => ganti(`${path}?tab=${id}`) };
}

function Kepala({ judul, children }: { judul: string; children?: React.ReactNode }) {
  return (
    <Sebaris tag="header" jarak="md" bungkus>
      <h1 style={{ margin: 0, fontSize: token.huruf.ukuran.halaman, fontWeight: token.huruf.berat.tebal, flexGrow: 1 }}>{judul}</h1>
      {children}
    </Sebaris>
  );
}

/** Akses dan keamanan: pengguna, jenis akun, daftar peringatan izin, dan keamanan. */
export function HalamanAkses() {
  const { pengguna } = usePengguna();
  const h = HALAMAN_PENGATURAN.akses;
  const tabBoleh = pengguna ? tabDiizinkan(h.tab, pengguna) : [];
  const { aktif, search, dariAlamat, ubahAlamat, pilih } = useTabPengaturan<IdTabAkses>('akses', tabBoleh);
  return (
    <>
      <Kepala judul={h.judul}>{aktif && <Tab daftar={tabBoleh} aktif={aktif} label={h.judul} onPilih={pilih} />}</Kepala>
      {aktif === 'pengguna' && <TabPengguna search={dariAlamat === 'pengguna' ? search : ''} ubahAlamat={ubahAlamat} />}
      {aktif === 'jenis-akun' && <TabJenisAkun />}
      {aktif === 'peringatan' && <TabPeringatan search={dariAlamat === 'peringatan' ? search : ''} ubahAlamat={ubahAlamat} />}
      {aktif === 'keamanan' && <TabKeamanan />}
    </>
  );
}

/** Pengaturan klinik: profil (termasuk website) dan backup. */
export function HalamanPengaturanKlinik() {
  const { pengguna } = usePengguna();
  const h = HALAMAN_PENGATURAN.klinik;
  const tabBoleh = pengguna ? tabDiizinkan(h.tab, pengguna) : [];
  const { aktif, pilih } = useTabPengaturan<IdTabKlinik>('klinik', tabBoleh);
  return (
    <>
      <Kepala judul={h.judul}>{aktif && <Tab daftar={tabBoleh} aktif={aktif} label={h.judul} onPilih={pilih} />}</Kepala>
      {aktif === 'profil' && <TabProfil />}
      {aktif === 'backup' && <TabBackup />}
    </>
  );
}
