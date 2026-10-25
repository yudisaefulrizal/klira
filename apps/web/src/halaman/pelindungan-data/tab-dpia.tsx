import { useCallback, useState } from 'react';
import { PDP } from '@klira/shared';
import type { DpiaDto } from '@klira/shared';
import { daftarDpia } from '../../api-klien/pdp';
import { useIzin } from '../../komponen/izin-saja';
import { Lencana } from '../../komponen/ui/lencana';
import { BarisTabel, SelTabel } from '../../komponen/ui/tabel';
import { Tombol } from '../../komponen/ui/tombol';
import { DpiaPdp } from '../../modal/pelindungan-data/dpia-pdp';
import { formatWaktu } from '../../util/penyaring-tab';
import { TabDaftarPdp } from './tab-daftar';

const D = PDP.dpia;
const KOLOM = [{ judul: D.kolom.pemrosesan }, { judul: D.kolom.tinjau }, { judul: D.kolom.ditinjau }, { judul: D.kolom.tindakan, rataKanan: true }];

/** Tab DPIA (3.1): penilaian dampak dengan tanggal tinjau ulang; jatuh tempo ditandai. */
export function TabDpia() {
  const boleh = useIzin();
  const [versi, setVersi] = useState(0);
  const [modal, setModal] = useState<{ dpia: DpiaDto | null } | null>(null);
  const ambil = useCallback((h: number) => daftarDpia(h), []);
  const selesai = () => {
    setModal(null);
    setVersi((n) => n + 1);
  };
  return (
    <>
      <TabDaftarPdp
        label={PDP.tab.dpia} kolom={KOLOM} ambil={ambil} versi={versi} kosong={D.kosong}
        aksiAtas={boleh('pdp', 'input') && <Tombol type="button" onClick={() => setModal({ dpia: null })}>{D.tambah}</Tombol>}
        baris={(d: DpiaDto) => (
          <BarisTabel key={d.id}>
            <SelTabel>{d.pemrosesan}{d.ropa_nama && <div style={{ fontSize: 'inherit' }}>{d.ropa_nama}</div>}</SelTabel>
            <SelTabel>{d.tinjau_ulang_pada} {d.jatuh_tempo && <Lencana warna="merah">{D.jatuhTempo}</Lencana>}</SelTabel>
            <SelTabel>{d.ditinjau_pada ? formatWaktu(d.ditinjau_pada) : '-'}</SelTabel>
            <SelTabel style={{ textAlign: 'right' }}>{boleh('pdp', 'perbaikan') && <Tombol type="button" varian="teks" onClick={() => setModal({ dpia: d })}>{PDP.ubah}</Tombol>}</SelTabel>
          </BarisTabel>
        )}
      />
      {modal && <DpiaPdp dpia={modal.dpia} onTutup={() => setModal(null)} onSelesai={selesai} />}
    </>
  );
}
