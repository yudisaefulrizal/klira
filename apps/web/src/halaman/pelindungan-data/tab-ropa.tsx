import { useCallback, useState } from 'react';
import { PDP } from '@klira/shared';
import type { RopaDto } from '@klira/shared';
import { daftarRopa } from '../../api-klien/pdp';
import { useIzin } from '../../komponen/izin-saja';
import { BarisTabel, SelTabel } from '../../komponen/ui/tabel';
import { Tombol } from '../../komponen/ui/tombol';
import { RopaPdp } from '../../modal/pelindungan-data/ropa-pdp';
import { formatWaktu } from '../../util/penyaring-tab';
import { TabDaftarPdp } from './tab-daftar';

const R = PDP.ropa;
const KOLOM = [{ judul: R.kolom.kegiatan }, { judul: R.kolom.dasar }, { judul: R.kolom.jenis }, { judul: R.kolom.retensi }, { judul: R.kolom.diperbarui }, { judul: R.kolom.tindakan, rataKanan: true }];
type Modal = { ropa: RopaDto | null } | null;

/** Tab ROPA (3.1): rekaman kegiatan pemrosesan; tambah dan ubah lewat modal, ekspor CSV dari alamat API (13 butir). */
export function TabRopa() {
  const boleh = useIzin();
  const [versi, setVersi] = useState(0);
  const [modal, setModal] = useState<Modal>(null);
  const ambil = useCallback((h: number) => daftarRopa(h), []);
  const selesai = () => {
    setModal(null);
    setVersi((n) => n + 1);
  };
  return (
    <>
      <TabDaftarPdp
        label={PDP.tab.ropa} kolom={KOLOM} ambil={ambil} versi={versi} kosong={R.kosong}
        aksiAtas={<><a href="/api/pdp/ropa?format=csv" download>{PDP.ekspor}</a>{boleh('pdp', 'input') && <Tombol type="button" onClick={() => setModal({ ropa: null })}>{R.tambah}</Tombol>}</>}
        baris={(r: RopaDto) => (
          <BarisTabel key={r.id}>
            <SelTabel>{r.nama_kegiatan}</SelTabel>
            <SelTabel>{R.dasarLabel[r.dasar]}</SelTabel>
            <SelTabel>{r.jenis_data}</SelTabel>
            <SelTabel>{r.masa_retensi}</SelTabel>
            <SelTabel>{formatWaktu(r.diperbarui_pada)}</SelTabel>
            <SelTabel style={{ textAlign: 'right' }}>{boleh('pdp', 'perbaikan') && <Tombol type="button" varian="teks" onClick={() => setModal({ ropa: r })}>{PDP.ubah}</Tombol>}</SelTabel>
          </BarisTabel>
        )}
      />
      {modal && <RopaPdp ropa={modal.ropa} onTutup={() => setModal(null)} onSelesai={selesai} />}
    </>
  );
}
