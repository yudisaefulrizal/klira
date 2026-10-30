import { useEffect, useState } from 'react';
import type { OrderPenunjangDto } from '@klira/shared';
import { ordersKunjungan } from '../../api-klien/penunjang';
import { GalatApi } from '../../api-klien/klien';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Kolom } from '../../komponen/ui/susunan';
import { DaftarOrderLab } from './daftar-order-lab';

/** Hasil dibaca dari modul penunjang; tidak diduplikasi menjadi narasi O. */
export function HasilPenunjangKunjungan({ kunjunganId }: { kunjunganId: number }) {
  const [orders, setOrders] = useState<OrderPenunjangDto[] | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  useEffect(() => {
    let batal = false;
    setOrders(null);
    setGalat(null);
    ordersKunjungan(kunjunganId).then((data) => { if (!batal) setOrders(data.filter((o) => o.hasil)); })
      .catch((e) => { if (!batal) setGalat(e instanceof GalatApi ? e.message : 'Hasil penunjang gagal dimuat.'); });
    return () => { batal = true; };
  }, [kunjunganId]);
  return <Kolom>
    <strong>Hasil penunjang</strong>
    {galat && <Peringatan>{galat}</Peringatan>}
    {!orders && !galat && <span>Memuat hasil penunjang…</span>}
    {orders?.length === 0 && <span>Belum ada hasil penunjang.</span>}
    {orders && <DaftarOrderLab orders={orders} />}
  </Kolom>;
}
