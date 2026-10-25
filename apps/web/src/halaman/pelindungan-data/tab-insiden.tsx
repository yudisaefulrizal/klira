import { useCallback, useState } from 'react';
import { PDP } from '@klira/shared';
import type { InsidenDto } from '@klira/shared';
import { daftarInsiden } from '../../api-klien/pdp';
import { useIzin } from '../../komponen/izin-saja';
import { Lencana } from '../../komponen/ui/lencana';
import { BarisTabel, SelTabel } from '../../komponen/ui/tabel';
import { Tombol } from '../../komponen/ui/tombol';
import { InsidenPdp } from '../../modal/pelindungan-data/insiden-pdp';
import { formatWaktu } from '../../util/penyaring-tab';
import { TabDaftarPdp } from './tab-daftar';

const I = PDP.insiden;
const KOLOM = [{ judul: I.kolom.waktu }, { judul: I.kolom.jenis }, { judul: I.kolom.data }, { judul: I.kolom.terdampak }, { judul: I.kolom.notifikasi }, { judul: I.kolom.tindakan, rataKanan: true }];

/** Tab Insiden (3.1): insiden kebocoran dengan batas notifikasi 3x24 jam dan pasien terdampak. */
export function TabInsiden() {
  const boleh = useIzin();
  const [versi, setVersi] = useState(0);
  const [modal, setModal] = useState<{ insiden: InsidenDto | null } | null>(null);
  const ambil = useCallback((h: number) => daftarInsiden(h), []);
  const selesai = () => {
    setModal(null);
    setVersi((n) => n + 1);
  };
  return (
    <>
      <TabDaftarPdp
        label={PDP.tab.insiden} kolom={KOLOM} ambil={ambil} versi={versi} kosong={I.kosong}
        aksiAtas={boleh('pdp', 'input') && <Tombol type="button" onClick={() => setModal({ insiden: null })}>{I.catat}</Tombol>}
        baris={(i: InsidenDto) => (
          <BarisTabel key={i.id}>
            <SelTabel>{formatWaktu(i.waktu_diketahui)}</SelTabel>
            <SelTabel>{i.siber ? I.jenisSiber : I.jenisLain}</SelTabel>
            <SelTabel>{i.data_terungkap}</SelTabel>
            <SelTabel>{I.terdampak(i.jumlah_terdampak)}</SelTabel>
            <SelTabel>
              {i.sisa_jam === null ? <Lencana warna="hijau">{formatWaktu(i.notifikasi_lembaga_pada ?? i.notifikasi_pasien_pada ?? i.batas_notifikasi)}</Lencana> : <Lencana warna={i.terlambat ? 'merah' : 'kuning'}>{PDP.batas.sisa(i.sisa_jam)}</Lencana>}
            </SelTabel>
            <SelTabel style={{ textAlign: 'right' }}>{boleh('pdp', 'perbaikan') && <Tombol type="button" varian="teks" onClick={() => setModal({ insiden: i })}>{I.ubah}</Tombol>}</SelTabel>
          </BarisTabel>
        )}
      />
      {modal && <InsidenPdp insiden={modal.insiden} onTutup={() => setModal(null)} onSelesai={selesai} />}
    </>
  );
}
