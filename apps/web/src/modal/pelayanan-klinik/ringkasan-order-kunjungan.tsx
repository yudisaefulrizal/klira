import { useEffect, useState } from 'react';
import { STATUS_RESEP } from '@klira/shared';
import type { OrderPenunjangDto, ResepDto } from '@klira/shared';
import { resepKunjungan } from '../../api-klien/farmasi';
import { ordersKunjungan } from '../../api-klien/penunjang';
import { GalatApi } from '../../api-klien/klien';
import { Kolom } from '../../komponen/ui/susunan';
import { Peringatan } from '../../komponen/ui/peringatan';
import { DaftarOrderLab } from './daftar-order-lab';

/** Ringkasan membaca status terkini dari sumber resep dan order. */
export function RingkasanOrderKunjungan({ kunjunganId }: { kunjunganId: number }) {
  const [data, setData] = useState<{ resep: ResepDto[]; order: OrderPenunjangDto[] } | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  useEffect(() => {
    let batal = false;
    setData(null);
    setGalat(null);
    Promise.all([resepKunjungan(kunjunganId), ordersKunjungan(kunjunganId)])
      .then(([resep, order]) => { if (!batal) setData({ resep, order }); })
      .catch((e) => { if (!batal) setGalat(e instanceof GalatApi ? e.message : 'Resep dan order gagal dimuat.'); });
    return () => { batal = true; };
  }, [kunjunganId]);
  return <Kolom>
    <strong>P — Resep dan order penunjang</strong>
    {galat && <Peringatan>{galat}</Peringatan>}
    {!data && !galat && <span>Memuat resep dan order…</span>}
    {data?.resep.length === 0 && <span>Belum ada resep.</span>}
    {data?.resep.map((r) => <Kolom key={r.id} jarak="xs">
      <strong>{r.nomor_resep} · {STATUS_RESEP.label(r.status)}</strong>
      {r.item.map((i) => <span key={i.id}>{i.nama} · {i.jumlah} {i.satuan} · {i.aturan_pakai}</span>)}
    </Kolom>)}
    {data?.order.length === 0 && <span>Belum ada order penunjang.</span>}
    {data && <DaftarOrderLab orders={data.order} />}
  </Kolom>;
}
