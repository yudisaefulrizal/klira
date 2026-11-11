import { FARMASI } from '@klira/shared';
import { token } from '../../gaya/token';
import { useIzin } from '../../komponen/izin-saja';
import { AreaTeks } from '../../komponen/ui/area-teks';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Kolom } from '../../komponen/ui/susunan';
import { galatResep } from './keadaan-farmasi';

type Props = {
  teks: string;
  onUbah: (teks: string) => void;
  tampilGalat: boolean;
  disabled: boolean;
};
const R = FARMASI.resep;

/**
 * Langkah Resep di Pemeriksaan klinis (P3): dokter menulis resep sebagai teks bebas (merek, racikan). Item obat dari stok diisi apoteker saat telaah.
 * Teks dikelola induk sebagai draf dan diajukan lewat Simpan pemeriksaan.
 */
export function LangkahResep({ teks, onUbah, tampilGalat, disabled }: Props) {
  const boleh = useIzin();
  const bolehResep = boleh('resep', 'input');
  const galat = tampilGalat ? galatResep(teks).teks : undefined;
  return (
    <Kolom>
      {!bolehResep ? <Peringatan nada="biru">{R.tanpaIzin}</Peringatan> : <>
        <AreaTeks id="resep-teks" label={R.label} value={teks} maxLength={2000} rows={6} style={{ height: 'auto', fontFamily: 'inherit' }} disabled={disabled}
          placeholder={R.contoh} onChange={(e) => onUbah(e.target.value)} aria-invalid={galat ? true : undefined} aria-describedby="resep-teks-petunjuk" />
        <small id="resep-teks-petunjuk" style={{ color: token.warna.teksRedup }}>{R.petunjuk} {R.tagihanInfo}</small>
        {galat && <Peringatan>{galat}</Peringatan>}
      </>}
    </Kolom>
  );
}
