import { useEffect, useState } from 'react';
import { BAGIAN_KLINIS } from '@klira/shared';
import type { KlinisKunjunganDto } from '@klira/shared';
import { ambilKlinis } from '../../api-klien/klinis';
import { GalatApi } from '../../api-klien/klien';
import { InfoPengesahan } from '../../komponen/info-pengesahan/info-pengesahan';
import { DaftarRingkasan, Kolom } from '../../komponen/ui/susunan';
import { Peringatan } from '../../komponen/ui/peringatan';
import { tanggalWaktuPendek } from '../../util/format';
import { LABEL_BAGIAN, keadaanDariServer, ringkasanIsi } from './keadaan-pemeriksaan';
import { HasilPenunjangKunjungan } from './hasil-penunjang-kunjungan';
import { RingkasanOrderKunjungan } from './ringkasan-order-kunjungan';

export function DetailSoapie({ kunjunganId }: { kunjunganId: number }) {
  const [data, setData] = useState<KlinisKunjunganDto | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  useEffect(() => {
    let batal = false;
    setData(null);
    setGalat(null);
    ambilKlinis(kunjunganId).then((d) => { if (!batal) setData(d); })
      .catch((e) => { if (!batal) setGalat(e instanceof GalatApi ? e.message : 'Catatan SOAPIE gagal dimuat.'); });
    return () => { batal = true; };
  }, [kunjunganId]);
  if (galat) return <Peringatan>{galat}</Peringatan>;
  if (!data) return <span>Memuat catatan SOAPIE…</span>;
  return <Kolom>
    <DaftarRingkasan bagian={ringkasanIsi(keadaanDariServer(data.bagian))} />
    <RingkasanOrderKunjungan kunjunganId={kunjunganId} />
    <HasilPenunjangKunjungan kunjunganId={kunjunganId} />
    {BAGIAN_KLINIS.filter((b) => data.bagian[b]?.pengesahan).map((b) => <Kolom key={b} jarak="xs">
      <strong>{LABEL_BAGIAN[b]}</strong>
      <InfoPengesahan bagian={data.bagian[b]} />
      <span>{tanggalWaktuPendek(data.bagian[b].pengesahan!.waktu)}</span>
    </Kolom>)}
  </Kolom>;
}
