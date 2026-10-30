import { useState } from 'react';
import { PENUNJANG, PRIORITAS_ORDER } from '@klira/shared';
import type { MasterPemeriksaanDto } from '@klira/shared';
import { token } from '../../gaya/token';
import { AreaTeks } from '../../komponen/ui/area-teks';
import { Isian } from '../../komponen/ui/isian';
import { KotakCentang } from '../../komponen/ui/kotak-centang';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Kolom, Sebaris } from '../../komponen/ui/susunan';
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
  ringkas?: boolean;
};

const OPSI_PRIORITAS = PRIORITAS_ORDER.nilai.map((n) => ({ nilai: n, label: PRIORITAS_ORDER.label(n) }));

/**
 * Isi formulir Order lab: pilih pemeriksaan (cari nama, kode, atau LOINC), prioritas, catatan. Dipakai bersama oleh modal Order lab (MODAL-1)
 * dan langkah Order penunjang di Pemeriksaan klinis agar kedua tempat selalu sama.
 */
export function FormOrderLab({ awalan, master, k, onUbah, cara, galat, ringkas = false }: Props) {
  const [cari, setCari] = useState('');
  const O = PENUNJANG.order;
  const cocok = saringPemeriksaan(master, cari);
  const daftar = cocok.filter((m) => !k.pemeriksaan.includes(m.id));
  const terpilih = k.pemeriksaan.map((id) => master.find((m) => m.id === id)).filter((m): m is MasterPemeriksaanDto => !!m);
  const biaya = perkiraanBiaya(master, k.pemeriksaan, cara);
  const ketBaris = (m: MasterPemeriksaanDto) => {
    if (ringkas) return undefined;
    const harga = hargaTarif(m.tarif, cara);
    return [m.kode_loinc, harga === null ? O.tarifBelum : rupiah(harga)].filter(Boolean).join(' · ');
  };
  if (!master.some((m) => m.aktif)) return <Peringatan nada="biru">{O.belumAda}</Peringatan>;
  return (
    <Kolom>
      {galat && <Peringatan>{galat}</Peringatan>}
      <Isian id={`${awalan}-cari`} label="Pemeriksaan" placeholder="Cari nama atau kode pemeriksaan…" type="search" value={cari} onChange={(e) => setCari(e.target.value)} autoComplete="off" />
      {!ringkas && !cari.trim() && <small style={{ color: token.warna.teksRedup }}>Ketik nama, kode pemeriksaan, atau LOINC untuk mencari.</small>}
      {cari.trim() && cocok.length === 0 && <span role="status" style={{ color: token.warna.teksRedup }}>{PENUNJANG.galat.sumberBelumAda}</span>}
      {daftar.length > 0 && <Kolom jarak="xs" role="group" aria-label="Hasil pencarian pemeriksaan" style={{ maxHeight: token.ukuran.tinggiDaftar, overflowY: 'auto' }}>
        {daftar.map((m) => (
          <KotakCentang key={m.id} id={`${awalan}-p-${m.id}`} label={m.nama} keterangan={ketBaris(m)} checked={false} onChange={() => onUbah(gantiPilihan(k, m.id))} />
        ))}
      </Kolom>}
      {terpilih.length > 0 && <Kolom jarak="xs" role="group" aria-label="Pemeriksaan terpilih">
        <strong>Pemeriksaan terpilih</strong>
        {terpilih.map((m) => (
          <KotakCentang key={m.id} id={`${awalan}-dipilih-${m.id}`} label={m.nama} keterangan={ketBaris(m)} checked onChange={() => onUbah(gantiPilihan(k, m.id))} />
        ))}
      </Kolom>}
      {!ringkas && <span style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>
        {O.terpilih(k.pemeriksaan.length)}
        {k.pemeriksaan.length > 0 && ` · ${rupiah(biaya.total)}${biaya.tanpaTarif ? ` (${O.tanpaTarifJumlah(biaya.tanpaTarif)})` : ''}`}
      </span>}
      {!ringkas && <fieldset style={{ margin: 0, padding: 0, border: 0, minWidth: 0 }}>
        <legend style={{ padding: 0, fontWeight: token.huruf.berat.sedang }}>{O.prioritas}</legend>
        <Sebaris bungkus jarak="md">
          {OPSI_PRIORITAS.map((o) => <label key={o.nilai} style={{ display: 'inline-flex', alignItems: 'center', gap: token.jarak.xs, minHeight: 44, cursor: 'pointer' }}>
            <input type="radio" name={`${awalan}-prioritas`} value={o.nilai} checked={k.prioritas === o.nilai}
              onChange={() => onUbah({ ...k, prioritas: o.nilai })} style={{ accentColor: token.warna.utama }} />
            {o.label}
          </label>)}
        </Sebaris>
      </fieldset>}
      <AreaTeks id={`${awalan}-catatan`} label={ringkas ? 'Catatan untuk laboratorium (opsional)' : O.catatan} value={k.catatan} maxLength={500} onChange={(e) => onUbah({ ...k, catatan: e.target.value })} />
      {!ringkas && <span style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{O.tagihanInfo}</span>}
    </Kolom>
  );
}
