import { useEffect, useState } from 'react';
import { STATUS_RESEP, STATUS_ORDER_PENUNJANG } from '@klira/shared';
import type { MasterPemeriksaanDto, OrderPenunjangDto, ResepDto } from '@klira/shared';
import { resepKunjungan } from '../../api-klien/farmasi';
import { daftarMasterPemeriksaan, ordersKunjungan } from '../../api-klien/penunjang';
import { GalatApi } from '../../api-klien/klien';
import { DaftarRingkasan, Kolom } from '../../komponen/ui/susunan';
import type { BagianRingkasan } from '../../komponen/ui/susunan';
import { Peringatan } from '../../komponen/ui/peringatan';
import { adaIsianResep } from './keadaan-farmasi';
import { awalKeadaan } from './keadaan-pemeriksaan';
import type { KeadaanPemeriksaan } from './keadaan-pemeriksaan';
import { TampilanResep } from './tampilan-resep';

const KEADAAN_KOSONG = awalKeadaan();

/** Rincian pilihan saat ini, terpisah dari pelayanan yang sudah tersimpan. */
export function RingkasanOrderKunjungan({ kunjunganId, k = KEADAAN_KOSONG }: { kunjunganId: number; k?: KeadaanPemeriksaan }) {
  const adaResep = adaIsianResep(k.resep);
  const [data, setData] = useState<{ resep: ResepDto[]; order: OrderPenunjangDto[]; lab: MasterPemeriksaanDto[] } | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  useEffect(() => {
    let batal = false;
    setData(null); setGalat(null);
    Promise.all([resepKunjungan(kunjunganId), ordersKunjungan(kunjunganId), k.lab_dipilih ? daftarMasterPemeriksaan({ aktif: true }) : Promise.resolve([])])
      .then(([resep, order, lab]) => { if (!batal) setData({ resep, order, lab }); })
      .catch((e) => { if (!batal) setGalat(e instanceof GalatApi ? e.message : 'Rincian obat dan lab gagal dimuat.'); });
    return () => { batal = true; };
  }, [kunjunganId, k.lab_dipilih]);

  const pilihan: BagianRingkasan[] = [];
  if (adaResep) pilihan.push({ judul: 'Resep', baris: [{ label: 'Resep dokter', nilai: k.resep.trim() }] });
  if (k.lab_dipilih) pilihan.push({ judul: 'Lab', baris: [
    ...k.order_lab.pemeriksaan.map((id) => ({ label: 'Pemeriksaan', nilai: data?.lab.find((m) => m.id === id)?.nama ?? `Pemeriksaan #${id}` })),
    ...(k.order_lab.pemeriksaan.length ? [] : [{ label: 'Pemeriksaan', nilai: 'Belum dipilih' }]),
    ...(k.order_lab.catatan.trim() ? [{ label: 'Catatan untuk laboratorium', nilai: k.order_lab.catatan }] : []),
  ] });

  return <Kolom>
    {galat && <Peringatan>{galat}</Peringatan>}
    {!data && !galat && <span>Memuat rincian obat dan lab…</span>}
    {(data || galat) && <DaftarRingkasan bagian={pilihan} />}
    {data && (data.resep.length > 0 || data.order.length > 0) && <Kolom jarak="sm">
      <strong>Resep dan lab tersimpan</strong>
      {data.resep.map((r) => <Kolom key={r.id} jarak="xs">
        <small>{r.nomor_resep} · {r.status === 'diajukan' ? 'Menunggu farmasi' : STATUS_RESEP.label(r.status)}</small>
        <TampilanResep resep={r} />
      </Kolom>)}
      {data.order.map((o) => <span key={o.id}>{o.nama} · {STATUS_ORDER_PENUNJANG.label(o.status)}{o.hasil ? ` · ${o.hasil.nilai}${o.hasil.satuan ? ` ${o.hasil.satuan}` : ''}` : ''}</span>)}
    </Kolom>}
  </Kolom>;
}
