import { useEffect, useRef, useState } from 'react';
import { FARMASI } from '@klira/shared';
import type { MasterObatDto } from '@klira/shared';
import { daftarMasterObat } from '../../api-klien/farmasi';
import { GalatApi } from '../../api-klien/klien';
import { token } from '../../gaya/token';
import { useIzin } from '../../komponen/izin-saja';
import { Isian } from '../../komponen/ui/isian';
import { Peringatan } from '../../komponen/ui/peringatan';
import { PencarianObatResep } from './pencarian-obat-resep';
import './langkah-resep.css';
import { Kolom, Sebaris } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { barisResepKosong, galatResep, hapusBarisResep, ubahBarisResep } from './keadaan-farmasi';
import type { BarisResep } from './keadaan-farmasi';

type Props = {
  baris: BarisResep[];
  onUbah: (baris: BarisResep[]) => void;
  tampilGalat: boolean;
  disabled: boolean;
};
const R = FARMASI.resep;

/**
 * Langkah Resep di Pemeriksaan klinis (3.3): resep kunjungan ini dan formulir obat (dari master obat klinik, tanpa obat ketik bebas), jumlah, aturan pakai.
 * Pilihan obat dikelola induk sebagai draf dan diajukan lewat Simpan pemeriksaan.
 */
export function LangkahResep({ baris, onUbah, tampilGalat, disabled }: Props) {
  const boleh = useIzin();
  const bolehResep = boleh('resep', 'input');
  const [obat, setObat] = useState<MasterObatDto[] | null>(null);
  const [versiBaris, setVersiBaris] = useState(0);
  const fokusBaru = useRef<number | null>(null);
  useEffect(() => {
    if (fokusBaru.current !== null) {
      document.getElementById(`resep-obat-${fokusBaru.current}`)?.focus();
      fokusBaru.current = null;
    }
  }, [baris.length]);
  const [galat, setGalat] = useState<string | null>(null);

  useEffect(() => {
    let batal = false;
    (bolehResep ? daftarMasterObat({ aktif: true, ukuran: 100 }) : Promise.resolve(null))
      .then(async (o) => {
        if (batal) return;
        const semua = o ? [...o.data] : [];
        if (o) for (let halaman = 2; semua.length < o.total; halaman++) {
          const h = await daftarMasterObat({ aktif: true, ukuran: 100, halaman });
          if (batal) return;
          if (!h.data.length) break;
          semua.push(...h.data);
        }
        if (!batal) setObat(semua);
      })
      .catch((e) => !batal && setGalat(e instanceof GalatApi ? e.message : R.gagalMuat));
    return () => {
      batal = true;
    };
  }, [bolehResep]);

  const g = galatResep(baris);


  return (
    <Kolom>
      {galat && <Peringatan>{galat}</Peringatan>}
      <h4 style={{ margin: 0, fontSize: token.huruf.ukuran.besar, fontWeight: token.huruf.berat.tebal }}>Obat</h4>
      {bolehResep && !obat && !galat && <span style={{ color: token.warna.teksRedup }}>{FARMASI.memuat}</span>}
      {bolehResep && obat && (
        obat.length === 0 ? <Peringatan nada="biru">{R.belumAdaMaster}</Peringatan> : (
          <fieldset disabled={disabled} aria-label="Resep" style={{ margin: 0, padding: 0, border: 0, minWidth: 0 }}>
          <Kolom>
            <div className="resep-baris-daftar">
            {baris.map((b, n) => {
              const dipilih = obat.find((o) => String(o.id) === b.master_obat_id);
              return <div className="resep-baris" key={`${versiBaris}-${n}`}>
                <div className="resep-baris-utama">
                  <PencarianObatResep id={`resep-obat-${n}`} obat={obat} value={b.master_obat_id}
                    onPilih={(o) => onUbah(ubahBarisResep(baris, n, { master_obat_id: o ? String(o.id) : '', bentuk: o?.bentuk_sediaan ?? '', rute: o?.rute ?? '' }))}
                    galat={tampilGalat ? g[`item.${n}.master_obat_id`] : undefined} />
                  <div className="resep-jumlah">
                    <Isian id={`resep-jumlah-${n}`} label={dipilih ? `Jumlah (${dipilih.satuan})` : 'Jumlah'} inputMode="numeric" value={b.jumlah}
                      onChange={(e) => onUbah(ubahBarisResep(baris, n, { jumlah: e.target.value }))} galat={tampilGalat ? g[`item.${n}.jumlah`] : undefined} autoComplete="off" />
                  </div>
                  <Isian id={`resep-aturan-${n}`} label={R.aturan} placeholder={R.aturanPetunjuk} value={b.aturan_pakai}
                    onChange={(e) => onUbah(ubahBarisResep(baris, n, { aturan_pakai: e.target.value }))} galat={tampilGalat ? g[`item.${n}.aturan_pakai`] : undefined} autoComplete="off" />
                  <Tombol type="button" varian="teks" className="resep-hapus" aria-label={`Hapus obat baris ${n + 1}`} title="Hapus obat"
                    onClick={() => { setVersiBaris((v) => v + 1); onUbah(hapusBarisResep(baris, n)); }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" /></svg>
                  </Tombol>
                </div>

              </div>;
            })}
            </div>
            <Sebaris jarak="sm" bungkus>
              <Tombol type="button" varian="sekunder" aria-label="Tambah obat" title="Tambah baris obat" onClick={() => {
                fokusBaru.current = baris.length;
                onUbah([...baris, barisResepKosong()]);
              }}><span aria-hidden="true">＋</span></Tombol>
            </Sebaris>
          </Kolom>
          </fieldset>
        )
      )}
    </Kolom>
  );
}
