import { useEffect, useRef, useState } from 'react';
import { FARMASI, rupiahTeks } from '@klira/shared';
import type { MasterObatDto } from '@klira/shared';
import { token } from '../../gaya/token';
import { Isian } from '../../komponen/ui/isian';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Pilihan } from '../../komponen/ui/pilihan';
import { Kolom, Sebaris } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { barisResepKosong, biayaResep, hapusBarisResep, opsiRute, ubahBarisResep } from './keadaan-farmasi';
import type { BarisResep } from './keadaan-farmasi';
import { PencarianObatResep } from './pencarian-obat-resep';
import './langkah-resep.css';

type Props = {
  /** Awalan id unik per resep agar beberapa editor dalam satu modal tidak bentrok. */
  idAwal: string;
  baris: BarisResep[];
  obat: readonly MasterObatDto[];
  onUbah: (baris: BarisResep[]) => void;
  galat: Record<string, string>;
  tampilGalat: boolean;
  disabled: boolean;
};
const I = FARMASI.item;

/**
 * Editor item resep oleh apoteker saat telaah (P3): obat dari master obat klinik, jumlah bulat (unit dari stok), aturan pakai wajib,
 * bentuk dan rute opsional (rute terisi dari master obat saat obat dipilih). Obat yang sama boleh lebih dari sekali (obat tunggal dan bahan racikan).
 */
export function EditorItemResep({ idAwal, baris, obat, onUbah, galat, tampilGalat, disabled }: Props) {
  const [versi, setVersi] = useState(0);
  const fokusBaru = useRef<number | null>(null);
  useEffect(() => {
    if (fokusBaru.current !== null) {
      document.getElementById(`${idAwal}-obat-${fokusBaru.current}`)?.focus();
      fokusBaru.current = null;
    }
  }, [baris.length, idAwal]);
  const g = (n: number, bidang: string) => (tampilGalat ? galat[`item.${n}.${bidang}`] : undefined);
  const biaya = biayaResep(baris, obat);

  return (
    <fieldset disabled={disabled} aria-label={I.judul} style={{ margin: 0, padding: 0, border: 0, minWidth: 0 }}>
      <Kolom jarak="sm">
        <strong>{I.judul}</strong>
        <small style={{ color: token.warna.teksRedup }}>{I.petunjuk}</small>
        {obat.length === 0 && <Peringatan nada="biru">{I.belumAdaMaster}</Peringatan>}
        {baris.length === 0 ? <span style={{ color: token.warna.teksRedup }}>{I.kosong}</span> : (
          <div className="resep-baris-daftar">
            {baris.map((b, n) => {
              const dipilih = obat.find((o) => String(o.id) === b.master_obat_id);
              return <div className="resep-baris" key={`${versi}-${n}`}>
                <div className="resep-baris-utama">
                  <PencarianObatResep id={`${idAwal}-obat-${n}`} obat={obat} value={b.master_obat_id}
                    onPilih={(o) => onUbah(ubahBarisResep(baris, n, { master_obat_id: o ? String(o.id) : '', bentuk: b.bentuk || (o?.bentuk_sediaan ?? ''), rute: o?.rute ?? '' }))}
                    galat={g(n, 'master_obat_id')} />
                  <div className="resep-jumlah">
                    <Isian id={`${idAwal}-jumlah-${n}`} label={dipilih ? I.jumlahSatuan(dipilih.satuan) : I.jumlah} inputMode="numeric" value={b.jumlah}
                      onChange={(e) => onUbah(ubahBarisResep(baris, n, { jumlah: e.target.value }))} galat={g(n, 'jumlah')} autoComplete="off" />
                    {dipilih && <small className="resep-stok" style={{ color: dipilih.stok_total < (Number(b.jumlah) || 0) ? token.warna.status.merah.teks : token.warna.teksRedup }}>{I.stok(dipilih.stok_total, dipilih.satuan)}</small>}
                  </div>
                  <Isian id={`${idAwal}-aturan-${n}`} label={I.aturan} placeholder={I.aturanPetunjuk} value={b.aturan_pakai}
                    onChange={(e) => onUbah(ubahBarisResep(baris, n, { aturan_pakai: e.target.value }))} galat={g(n, 'aturan_pakai')} autoComplete="off" />
                  <Isian id={`${idAwal}-bentuk-${n}`} label={I.bentuk} value={b.bentuk} maxLength={50}
                    onChange={(e) => onUbah(ubahBarisResep(baris, n, { bentuk: e.target.value }))} galat={g(n, 'bentuk')} autoComplete="off" />
                  <Pilihan id={`${idAwal}-rute-${n}`} label={I.rute} value={b.rute} opsi={opsiRute(b.rute)}
                    onChange={(e) => onUbah(ubahBarisResep(baris, n, { rute: e.target.value }))} galat={g(n, 'rute')} />
                  <Tombol type="button" varian="teks" className="resep-hapus" aria-label={I.hapus(n + 1)} title={I.hapus(n + 1)}
                    onClick={() => { setVersi((v) => v + 1); onUbah(hapusBarisResep(baris, n)); }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" /></svg>
                  </Tombol>
                </div>
              </div>;
            })}
          </div>
        )}
        <Sebaris jarak="sm" bungkus>
          <Tombol type="button" varian="sekunder" disabled={obat.length === 0} onClick={() => {
            fokusBaru.current = baris.length;
            onUbah([...baris, barisResepKosong()]);
          }}>{`＋ ${I.tambah}`}</Tombol>
          {biaya > 0 && <small style={{ color: token.warna.teksRedup }}>{I.biaya(rupiahTeks(biaya))}</small>}
        </Sebaris>
      </Kolom>
    </fieldset>
  );
}
