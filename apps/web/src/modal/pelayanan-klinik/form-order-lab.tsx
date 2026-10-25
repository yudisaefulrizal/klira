import { useState } from 'react';
import { PENUNJANG, PRIORITAS_ORDER } from '@klira/shared';
import type { MasterPemeriksaanDto } from '@klira/shared';
import { token } from '../../gaya/token';
import { AreaTeks } from '../../komponen/ui/area-teks';
import { Isian } from '../../komponen/ui/isian';
import { KotakCentang } from '../../komponen/ui/kotak-centang';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Pilihan } from '../../komponen/ui/pilihan';
import { Kolom } from '../../komponen/ui/susunan';
import { gantiPilihan, perkiraanBiaya, rupiah, saringPemeriksaan } from './keadaan-order-lab';
import type { KeadaanOrderLab } from './keadaan-order-lab';
import { hargaTarif } from '@klira/shared';

type Props = {
  /** Awalan id agar dua formulir tidak berbagi id (modal dan langkah). */
  awalan: string;
  master: readonly MasterPemeriksaanDto[];
  k: KeadaanOrderLab;
  onUbah: (k: KeadaanOrderLab) => void;
  cara: 'umum' | 'jkn';
  galat?: string | null;
};

const OPSI_PRIORITAS = PRIORITAS_ORDER.nilai.map((n) => ({ nilai: n, label: PRIORITAS_ORDER.label(n) }));

/**
 * Isi formulir Order lab: pilih pemeriksaan (cari nama, kode, atau LOINC), prioritas, catatan. Dipakai bersama oleh modal Order lab (MODAL-1)
 * dan langkah Order penunjang di Pemeriksaan klinis agar kedua tempat selalu sama.
 */
export function FormOrderLab({ awalan, master, k, onUbah, cara, galat }: Props) {
  const [cari, setCari] = useState('');
  const O = PENUNJANG.order;
  const daftar = saringPemeriksaan(master, cari);
  const biaya = perkiraanBiaya(master, k.pemeriksaan, cara);
  const ketBaris = (m: MasterPemeriksaanDto) => {
    const harga = hargaTarif(m.tarif, cara);
    return [m.kode_loinc, harga === null ? O.tarifBelum : rupiah(harga)].filter(Boolean).join(' · ');
  };
  if (!master.some((m) => m.aktif)) return <Peringatan nada="biru">{O.belumAda}</Peringatan>;
  return (
    <Kolom>
      {galat && <Peringatan>{galat}</Peringatan>}
      <Isian id={`${awalan}-cari`} label={O.cari} type="search" value={cari} onChange={(e) => setCari(e.target.value)} autoComplete="off" />
      <Kolom jarak="xs" role="group" aria-label={O.pemeriksaan} style={{ maxHeight: token.ukuran.tinggiDaftar, overflowY: 'auto' }}>
        {daftar.length === 0 && <span style={{ color: token.warna.teksRedup }}>{PENUNJANG.galat.sumberBelumAda}</span>}
        {daftar.map((m) => (
          <KotakCentang key={m.id} id={`${awalan}-p-${m.id}`} label={m.nama} keterangan={ketBaris(m)} checked={k.pemeriksaan.includes(m.id)} onChange={() => onUbah(gantiPilihan(k, m.id))} />
        ))}
      </Kolom>
      <span style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>
        {O.terpilih(k.pemeriksaan.length)}
        {k.pemeriksaan.length > 0 && ` · ${rupiah(biaya.total)}${biaya.tanpaTarif ? ` (${O.tanpaTarifJumlah(biaya.tanpaTarif)})` : ''}`}
      </span>
      <Pilihan id={`${awalan}-prioritas`} label={O.prioritas} value={k.prioritas} onChange={(e) => onUbah({ ...k, prioritas: e.target.value as KeadaanOrderLab['prioritas'] })} opsi={OPSI_PRIORITAS} />
      <AreaTeks id={`${awalan}-catatan`} label={O.catatan} value={k.catatan} maxLength={500} onChange={(e) => onUbah({ ...k, catatan: e.target.value })} />
      <span style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{O.tagihanInfo}</span>
    </Kolom>
  );
}
