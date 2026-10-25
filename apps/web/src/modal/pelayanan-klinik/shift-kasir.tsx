import { useMemo, useState } from 'react';
import { KASIR, TOMBOL } from '@klira/shared';
import type { ShiftDto } from '@klira/shared';
import { bukaShift, tutupShift } from '../../api-klien/kasir';
import { GalatApi } from '../../api-klien/klien';
import { token } from '../../gaya/token';
import { Modal1 } from '../../komponen/modal-1/modal-1';
import { AreaTeks } from '../../komponen/ui/area-teks';
import { Isian } from '../../komponen/ui/isian';
import { Peringatan } from '../../komponen/ui/peringatan';
import { DaftarRingkasan, Kolom } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { adaPerubahan } from '../../util/draf';
import { awalShift, galatBukaShift, galatTutupShift, selisihShift } from './keadaan-kasir';
import type { KeadaanShift } from './keadaan-kasir';
import { rupiah } from './keadaan-order-lab';

type Props = { shift: ShiftDto | null; onTutup: () => void; onSelesai: () => void };
const S = KASIR.shift;

/** Modal Buka dan tutup shift kasir (3.3, MODAL-1): buka dengan kas awal; tutup dengan kas akhir hasil hitung, selisih dari kas seharusnya wajib beralasan. */
export function ShiftKasir({ shift, onTutup, onSelesai }: Props) {
  const menutup = !!shift;
  const awal = useMemo(awalShift, []);
  const [k, setK] = useState<KeadaanShift>(awal);
  const [galat, setGalat] = useState<string | null>(null);
  const [dicoba, setDicoba] = useState(false);
  const [memproses, setMemproses] = useState(false);

  const g = menutup ? galatTutupShift(k, shift.kas_seharusnya) : galatBukaShift(k);
  const tampil = (b: string) => (dicoba ? g[b] : undefined);
  const selisih = menutup ? selisihShift(k, shift.kas_seharusnya) : null;

  async function simpan() {
    setDicoba(true);
    if (Object.keys(g).length || memproses) return;
    setMemproses(true);
    setGalat(null);
    try {
      if (menutup) await tutupShift({ kas_akhir: k.kas, alasan_selisih: k.alasan });
      else await bukaShift({ kas_awal: k.kas });
      onSelesai();
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : KASIR.bayar.gagal);
    } finally {
      setMemproses(false);
    }
  }

  return (
    <Modal1
      judul={menutup ? S.tutupJudul : S.bukaJudul}
      lindungiTutup={adaPerubahan(awal, k)}
      onTutup={onTutup}
      aksi={
        <>
          <Tombol type="button" varian="sekunder" onClick={onTutup}>{TOMBOL.batal}</Tombol>
          <Tombol type="submit" form="bentuk-shift" disabled={memproses}>{memproses ? S.menyimpan : menutup ? S.tutupSimpan : S.bukaSimpan}</Tombol>
        </>
      }
    >
      {galat && <Peringatan>{galat}</Peringatan>}
      <Kolom tag="form" id="bentuk-shift" noValidate onSubmit={(e) => { e.preventDefault(); void simpan(); }}>
        {menutup ? (
          <>
            <span style={{ color: token.warna.teksRedup }}>{S.petunjukTutup(rupiah(shift.kas_seharusnya))}</span>
            <DaftarRingkasan bagian={[{ judul: '', baris: [{ label: S.kasAwal, nilai: rupiah(shift.kas_awal) }, { label: S.tunai, nilai: rupiah(shift.tunai) }, { label: S.seharusnya, nilai: rupiah(shift.kas_seharusnya) }] }]} />
          </>
        ) : <span style={{ color: token.warna.teksRedup }}>{S.petunjukBuka}</span>}
        <Isian id="shift-kas" label={menutup ? S.kasAkhir : S.kasAwal} inputMode="numeric" value={k.kas} onChange={(e) => setK({ ...k, kas: e.target.value })} galat={tampil('kas')} autoComplete="off" />
        {selisih !== null && <Peringatan nada={selisih === 0 ? 'biru' : undefined}>{S.ringkasTutup(selisih)}</Peringatan>}
        {menutup && selisih !== null && selisih !== 0 && (
          <AreaTeks id="shift-alasan" label={S.alasanSelisih} value={k.alasan} maxLength={300} onChange={(e) => setK({ ...k, alasan: e.target.value })} aria-invalid={tampil('alasan') ? true : undefined} />
        )}
        {tampil('alasan') && <Peringatan>{g.alasan}</Peringatan>}
      </Kolom>
    </Modal1>
  );
}
