import { useCallback, useEffect, useState } from 'react';
import { PDP } from '@klira/shared';
import type { KebijakanRetensiDto, PemusnahanDto } from '@klira/shared';
import { ambilKebijakan, daftarPemusnahan } from '../../api-klien/pdp';
import { useIzin } from '../../komponen/izin-saja';
import { Kartu } from '../../komponen/ui/kartu';
import { Lencana } from '../../komponen/ui/lencana';
import { Tabel, BarisTabel, SelTabel } from '../../komponen/ui/tabel';
import { Tombol } from '../../komponen/ui/tombol';
import { PemusnahanPdp } from '../../modal/pelindungan-data/pemusnahan-pdp';
import { TabDaftarPdp } from './tab-daftar';

const M = PDP.retensi;
const KOLOM_KEBIJAKAN = [{ judul: M.kolomKebijakan.jenis }, { judul: M.kolomKebijakan.periode }, { judul: M.kolomKebijakan.dasar }, { judul: M.kolomKebijakan.metode }];
const KOLOM = [{ judul: M.kolom.cakupan }, { judul: M.kolom.jadwal }, { judul: M.kolom.status }, { judul: M.kolom.tindakan, rataKanan: true }];

/** Tab Retensi dan pemusnahan (3.1): kebijakan masa retensi dan alur pemusnahan berlangkah. */
export function TabRetensi() {
  const boleh = useIzin();
  const [kebijakan, setKebijakan] = useState<KebijakanRetensiDto[]>([]);
  const [versi, setVersi] = useState(0);
  const [modal, setModal] = useState<{ musnah: PemusnahanDto | null } | null>(null);
  useEffect(() => {
    let batal = false;
    ambilKebijakan().then((k) => !batal && setKebijakan(k)).catch(() => undefined);
    return () => {
      batal = true;
    };
  }, []);
  const ambil = useCallback((h: number) => daftarPemusnahan(h), []);
  const selesai = () => {
    setModal(null);
    setVersi((n) => n + 1);
  };
  return (
    <>
      <Kartu style={{ padding: 0, overflow: 'hidden' }}>
        <Tabel kolom={KOLOM_KEBIJAKAN} label={M.kebijakan}>
          {kebijakan.map((k) => (
            <BarisTabel key={k.id}><SelTabel>{k.jenis_data}</SelTabel><SelTabel>{M.tahun(k.periode_tahun)}</SelTabel><SelTabel>{k.dasar_hukum}</SelTabel><SelTabel>{k.metode_musnah}</SelTabel></BarisTabel>
          ))}
        </Tabel>
      </Kartu>
      <TabDaftarPdp
        label={M.pemusnahan} kolom={KOLOM} ambil={ambil} versi={versi} kosong={M.kosong} catatan={M.petunjuk}
        aksiAtas={boleh('pdp', 'input') && <Tombol type="button" onClick={() => setModal({ musnah: null })}>{M.rencana}</Tombol>}
        baris={(p: PemusnahanDto) => (
          <BarisTabel key={p.id}>
            <SelTabel>{p.cakupan}</SelTabel>
            <SelTabel>{p.jadwal} {p.terlambat && <Lencana warna="merah">{PDP.batas.terlambat}</Lencana>}</SelTabel>
            <SelTabel><Lencana warna={M.warna[p.status]}>{M.status[p.status]}</Lencana></SelTabel>
            <SelTabel style={{ textAlign: 'right' }}><Tombol type="button" varian="teks" onClick={() => setModal({ musnah: boleh('pdp', 'perbaikan') ? p : { ...p, tahap_berikut: null } })}>{p.tahap_berikut && boleh('pdp', 'perbaikan') ? M.proses : PDP.rincian}</Tombol></SelTabel>
          </BarisTabel>
        )}
      />
      {modal && <PemusnahanPdp musnah={modal.musnah} onTutup={() => setModal(null)} onSelesai={selesai} />}
    </>
  );
}
