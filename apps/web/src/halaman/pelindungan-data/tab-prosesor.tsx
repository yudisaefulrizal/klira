import { useCallback, useState } from 'react';
import { PDP } from '@klira/shared';
import type { ProsesorDto } from '@klira/shared';
import { daftarProsesor } from '../../api-klien/pdp';
import { useIzin } from '../../komponen/izin-saja';
import { Lencana } from '../../komponen/ui/lencana';
import { BarisTabel, SelTabel } from '../../komponen/ui/tabel';
import { Tombol } from '../../komponen/ui/tombol';
import { ProsesorPdp } from '../../modal/pelindungan-data/prosesor-pdp';
import { TabDaftarPdp } from './tab-daftar';

const P = PDP.prosesor;
const KOLOM = [{ judul: P.kolom.nama }, { judul: P.kolom.layanan }, { judul: P.kolom.lokasi }, { judul: P.kolom.perjanjian }, { judul: P.kolom.sla }, { judul: P.kolom.status }, { judul: P.kolom.tindakan, rataKanan: true }];

/** Tab Prosesor (3.1): vendor dan hosting dengan perjanjian, sub-prosesor, dan SLA lapor kegagalan. */
export function TabProsesor() {
  const boleh = useIzin();
  const [versi, setVersi] = useState(0);
  const [modal, setModal] = useState<{ prosesor: ProsesorDto | null } | null>(null);
  const ambil = useCallback((h: number) => daftarProsesor(h), []);
  const selesai = () => {
    setModal(null);
    setVersi((n) => n + 1);
  };
  return (
    <>
      <TabDaftarPdp
        label={PDP.tab.prosesor} kolom={KOLOM} ambil={ambil} versi={versi} kosong={P.kosong}
        aksiAtas={boleh('pdp', 'input') && <Tombol type="button" onClick={() => setModal({ prosesor: null })}>{P.tambah}</Tombol>}
        baris={(p: ProsesorDto) => (
          <BarisTabel key={p.id}>
            <SelTabel>{p.nama}</SelTabel>
            <SelTabel>{p.layanan}</SelTabel>
            <SelTabel>{p.lokasi_data}</SelTabel>
            <SelTabel>{p.nomor_perjanjian ?? '-'} {p.butir_kurang.length > 0 && <Lencana warna="kuning">{P.butirKurang(p.butir_kurang.length)}</Lencana>}</SelTabel>
            <SelTabel>{p.sla_lapor_jam ? `${p.sla_lapor_jam} jam` : '-'}</SelTabel>
            <SelTabel><Lencana warna={p.aktif ? 'hijau' : 'abu'}>{p.aktif ? P.aktifLabel : P.nonaktifLabel}</Lencana></SelTabel>
            <SelTabel style={{ textAlign: 'right' }}>{boleh('pdp', 'perbaikan') && <Tombol type="button" varian="teks" onClick={() => setModal({ prosesor: p })}>{PDP.ubah}</Tombol>}</SelTabel>
          </BarisTabel>
        )}
      />
      {modal && <ProsesorPdp prosesor={modal.prosesor} onTutup={() => setModal(null)} onSelesai={selesai} />}
    </>
  );
}
