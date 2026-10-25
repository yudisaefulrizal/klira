import { useMemo, useState } from 'react';
import { PDP, TOMBOL } from '@klira/shared';
import type { TeksPemberitahuanDto } from '@klira/shared';
import { buatPemberitahuan } from '../../api-klien/pdp';
import { GalatApi } from '../../api-klien/klien';
import { token } from '../../gaya/token';
import { Modal1 } from '../../komponen/modal-1/modal-1';
import { AreaTeks } from '../../komponen/ui/area-teks';
import { Isian } from '../../komponen/ui/isian';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Kolom } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { adaPerubahan } from '../../util/draf';
import { awalPemberitahuan, galatPemberitahuan } from './keadaan-pdp';
import type { KeadaanPemberitahuan } from './keadaan-pdp';

const P = PDP.pemberitahuan;

/** Modal Versi teks pemberitahuan (3.3, MODAL-1): versi baru menggantikan yang berlaku; isian awal dari versi berlaku. */
export function VersiPemberitahuan({ berlaku, onTutup, onSelesai }: { berlaku: TeksPemberitahuanDto | null; onTutup: () => void; onSelesai: () => void }) {
  const awal = useMemo(() => awalPemberitahuan(berlaku), [berlaku]);
  const [k, setK] = useState<KeadaanPemberitahuan>(awal);
  const [dicoba, setDicoba] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [memproses, setMemproses] = useState(false);
  const g = galatPemberitahuan(k);
  const tampil = (b: string) => (dicoba ? g[b] : undefined);

  async function simpan() {
    setDicoba(true);
    if (Object.keys(g).length || memproses) return;
    setMemproses(true);
    setGalat(null);
    try {
      await buatPemberitahuan(k);
      onSelesai();
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : P.gagal);
    } finally {
      setMemproses(false);
    }
  }

  return (
    <Modal1
      judul={P.judul} lebar="modalBesar" lindungiTutup={adaPerubahan(awal, k)} onTutup={onTutup}
      aksi={<><Tombol type="button" varian="sekunder" onClick={onTutup}>{TOMBOL.batal}</Tombol><Tombol type="submit" form="bentuk-pemberitahuan" disabled={memproses}>{memproses ? PDP.menyimpan : PDP.simpan}</Tombol></>}
    >
      {galat && <Peringatan>{galat}</Peringatan>}
      <Kolom tag="form" id="bentuk-pemberitahuan" noValidate onSubmit={(e) => { e.preventDefault(); void simpan(); }}>
        <span style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{P.petunjuk}</span>
        <Isian id="pb-judul" label={P.judulIsian} value={k.judul} onChange={(e) => setK({ ...k, judul: e.target.value })} galat={tampil('judul')} autoComplete="off" />
        <Isian id="pb-tujuan" label={P.tujuan} value={k.tujuan} onChange={(e) => setK({ ...k, tujuan: e.target.value })} galat={tampil('tujuan')} autoComplete="off" />
        <AreaTeks id="pb-isi" label={P.isi} value={k.isi} maxLength={20000} onChange={(e) => setK({ ...k, isi: e.target.value })} aria-invalid={tampil('isi') ? true : undefined} />
        {tampil('isi') && <Peringatan>{g.isi}</Peringatan>}
      </Kolom>
    </Modal1>
  );
}
