import { useEffect, useState } from 'react';
import { STATUS_RESEP, STATUS_ORDER_PENUNJANG } from '@klira/shared';
import type { MasterObatDto, MasterPemeriksaanDto, OrderPenunjangDto, ResepDto } from '@klira/shared';
import { daftarMasterObat, resepKunjungan } from '../../api-klien/farmasi';
import { daftarMasterPemeriksaan, ordersKunjungan } from '../../api-klien/penunjang';
import { GalatApi } from '../../api-klien/klien';
import { DaftarRingkasan, Kolom } from '../../komponen/ui/susunan';
import type { BagianRingkasan } from '../../komponen/ui/susunan';
import { Peringatan } from '../../komponen/ui/peringatan';
import { adaIsianResep } from './keadaan-farmasi';
import { awalKeadaan } from './keadaan-pemeriksaan';
import type { KeadaanPemeriksaan } from './keadaan-pemeriksaan';

const KEADAAN_KOSONG = awalKeadaan();

/** Rincian pilihan saat ini, terpisah dari pelayanan yang sudah tersimpan. */
export function RingkasanOrderKunjungan({ kunjunganId, k = KEADAAN_KOSONG }: { kunjunganId: number; k?: KeadaanPemeriksaan }) {
  const adaResep = adaIsianResep(k.resep);
  const [data, setData] = useState<{ resep: ResepDto[]; order: OrderPenunjangDto[]; obat: MasterObatDto[]; lab: MasterPemeriksaanDto[] } | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  useEffect(() => {
    let batal = false;
    setData(null); setGalat(null);
    const muatObat = async () => {
      if (!adaResep) return [];
      const awal = await daftarMasterObat({ aktif: true, ukuran: 100 });
      const hasil = [...awal.data];
      for (let halaman = 2; hasil.length < awal.total && !batal; halaman++) {
        const h = await daftarMasterObat({ aktif: true, ukuran: 100, halaman });
        if (!h.data.length) break;
        hasil.push(...h.data);
      }
      return hasil;
    };
    Promise.all([resepKunjungan(kunjunganId), ordersKunjungan(kunjunganId), muatObat(), k.lab_dipilih ? daftarMasterPemeriksaan({ aktif: true }) : Promise.resolve([])])
      .then(([resep, order, obat, lab]) => { if (!batal) setData({ resep, order, obat, lab }); })
      .catch((e) => { if (!batal) setGalat(e instanceof GalatApi ? e.message : 'Rincian obat dan lab gagal dimuat.'); });
    return () => { batal = true; };
  }, [kunjunganId, adaResep, k.lab_dipilih]);

  const pilihan: BagianRingkasan[] = [];
  if (adaResep) pilihan.push({ judul: 'Obat', baris: k.resep.map((b) => {
    const obat = data?.obat.find((o) => String(o.id) === b.master_obat_id);
    return { label: obat?.nama_tampil ?? (b.master_obat_id ? `Obat #${b.master_obat_id}` : 'Obat belum dipilih'), nilai: `${b.jumlah || 'Jumlah belum diisi'}${obat ? ` ${obat.satuan}` : ''} · ${b.aturan_pakai.trim() || 'Aturan pakai belum diisi'}` };
  }) });
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
        {r.item.map((i) => <span key={i.id}>{i.nama} · {i.jumlah} {i.satuan} · {i.aturan_pakai}</span>)}
      </Kolom>)}
      {data.order.map((o) => <span key={o.id}>{o.nama} · {STATUS_ORDER_PENUNJANG.label(o.status)}{o.hasil ? ` · ${o.hasil.nilai}${o.hasil.satuan ? ` ${o.hasil.satuan}` : ''}` : ''}</span>)}
    </Kolom>}
  </Kolom>;
}
