import { useState } from 'react';
import { PDP, TOMBOL } from '@klira/shared';
import type { PersetujuanPdpDto } from '@klira/shared';
import { tarikPersetujuan } from '../../api-klien/pdp';
import { GalatApi } from '../../api-klien/klien';
import { token } from '../../gaya/token';
import { Modal1 } from '../../komponen/modal-1/modal-1';
import { AreaTeks } from '../../komponen/ui/area-teks';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Kolom } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { formatWaktu } from '../../util/penyaring-tab';
import { galatTarik } from './keadaan-pdp';

const T = PDP.tarik;

/** Modal Catat tarik persetujuan (3.3, MODAL-1): alasan wajib; pemrosesan dihentikan paling lambat 3x24 jam. */
export function TarikPersetujuan({ persetujuan, onTutup, onSelesai }: { persetujuan: PersetujuanPdpDto; onTutup: () => void; onSelesai: () => void }) {
  const [alasan, setAlasan] = useState('');
  const [dicoba, setDicoba] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [memproses, setMemproses] = useState(false);
  const [batas, setBatas] = useState<string | null>(null);
  const g = galatTarik(persetujuan.id, alasan);

  async function simpan() {
    setDicoba(true);
    if (Object.keys(g).length || memproses) return;
    setMemproses(true);
    setGalat(null);
    try {
      setBatas((await tarikPersetujuan({ persetujuan_id: persetujuan.id, alasan })).batas_henti);
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : T.gagal);
    } finally {
      setMemproses(false);
    }
  }

  if (batas) {
    return (
      <Modal1 judul={T.judul} lebar="modalKecil" onTutup={onSelesai} aksi={<Tombol type="button" onClick={onSelesai}>{TOMBOL.tutup}</Tombol>}>
        <Peringatan nada="biru">{T.tersimpan} {T.batasHenti(formatWaktu(batas))}</Peringatan>
      </Modal1>
    );
  }

  return (
    <Modal1
      judul={T.judul} lindungiTutup={alasan.trim().length > 0} onTutup={onTutup}
      aksi={<><Tombol type="button" varian="sekunder" onClick={onTutup}>{TOMBOL.batal}</Tombol><Tombol type="submit" form="bentuk-tarik" disabled={memproses}>{memproses ? PDP.menyimpan : T.tombol}</Tombol></>}
    >
      {galat && <Peringatan>{galat}</Peringatan>}
      <Kolom tag="form" id="bentuk-tarik" noValidate onSubmit={(e) => { e.preventDefault(); void simpan(); }}>
        <span><strong>{persetujuan.pasien_nama}</strong> <span style={{ color: token.warna.teksRedup }}>{persetujuan.pasien_nomor_rm} · {persetujuan.jenis} v{persetujuan.versi_teks} · {formatWaktu(persetujuan.waktu)}</span></span>
        <AreaTeks id="tarik-alasan" label={T.alasan} value={alasan} maxLength={500} onChange={(e) => setAlasan(e.target.value)} aria-invalid={dicoba && g.alasan ? true : undefined} />
        <span style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{dicoba && g.alasan ? g.alasan : T.petunjuk}</span>
      </Kolom>
    </Modal1>
  );
}
