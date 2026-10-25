import { useState } from 'react';
import { REKAM_MEDIS, STATUS_PERBAIKAN, TOMBOL } from '@klira/shared';
import type { PembukaanDto } from '@klira/shared';
import { putuskanPembukaan } from '../../api-klien/dokumen-rm';
import { GalatApi } from '../../api-klien/klien';
import { token } from '../../gaya/token';
import { Modal1 } from '../../komponen/modal-1/modal-1';
import { AreaTeks } from '../../komponen/ui/area-teks';
import { Lencana } from '../../komponen/ui/lencana';
import { Peringatan } from '../../komponen/ui/peringatan';
import { DaftarRingkasan, Kolom } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { formatWaktu } from '../../util/penyaring-tab';

type Props = { permintaan: PembukaanDto; bolehPutuskan: boolean; onTutup: () => void; onSelesai: () => void };
const P = REKAM_MEDIS.dok.pembukaan;

/** Modal Tinjau permintaan pembukaan (3.3, MODAL-1, 4.4): setujui atau tolak (catatan wajib bila menolak); penyetuju harus orang lain dari pengaju. */
export function TinjauPembukaan({ permintaan: q, bolehPutuskan, onTutup, onSelesai }: Props) {
  const [catatan, setCatatan] = useState('');
  const [galat, setGalat] = useState<string | null>(null);
  const [dicoba, setDicoba] = useState(false);
  const [memproses, setMemproses] = useState(false);
  const [hasil, setHasil] = useState<'disetujui' | 'ditolak' | null>(null);
  const diputuskan = q.status !== 'diajukan';

  async function putuskan(keputusan: 'setujui' | 'tolak') {
    setDicoba(true);
    if (keputusan === 'tolak' && !catatan.trim()) return;
    setMemproses(true);
    setGalat(null);
    try {
      await putuskanPembukaan(q.id, { keputusan, catatan: catatan.trim() || undefined });
      setHasil(keputusan === 'setujui' ? 'disetujui' : 'ditolak');
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : P.gagal);
    } finally {
      setMemproses(false);
    }
  }

  if (hasil) {
    return (
      <Modal1 judul={P.tinjauJudul} lebar="modalKecil" onTutup={onSelesai} aksi={<Tombol type="button" onClick={onSelesai}>{TOMBOL.tutup}</Tombol>}>
        <Peringatan nada="biru">{hasil === 'disetujui' ? P.disetujui : P.ditolak}</Peringatan>
      </Modal1>
    );
  }

  const bisa = bolehPutuskan && !diputuskan;
  return (
    <Modal1
      judul={P.tinjauJudul} lindungiTutup={catatan.trim().length > 0} onTutup={onTutup}
      aksi={bisa ? (
        <>
          <Tombol type="button" varian="sekunder" onClick={onTutup}>{TOMBOL.batal}</Tombol>
          <Tombol type="button" varian="sekunder" disabled={memproses} onClick={() => void putuskan('tolak')}>{memproses ? P.memproses : P.tolak}</Tombol>
          <Tombol type="button" disabled={memproses} onClick={() => void putuskan('setujui')}>{memproses ? P.memproses : P.setujui}</Tombol>
        </>
      ) : <Tombol type="button" onClick={onTutup}>{TOMBOL.tutup}</Tombol>}
    >
      {galat && <Peringatan>{galat}</Peringatan>}
      <Kolom>
        <span style={{ color: token.warna.teksRedup }}>{q.diminta_oleh_nama ? `${P.diminta(q.diminta_oleh_nama)} · ` : ''}{formatWaktu(q.dibuat_pada)} <Lencana warna={STATUS_PERBAIKAN.warna(q.status)}>{STATUS_PERBAIKAN.label(q.status)}</Lencana></span>
        <DaftarRingkasan bagian={[{
          judul: `${q.pasien_nama} (${q.pasien_nomor_rm})`,
          baris: [
            { label: P.pemohon, nilai: [q.pemohon_nama, q.pemohon_instansi].filter(Boolean).join(' · ') }, { label: P.dasarLabel, nilai: `${P.dasar[q.dasar]}${q.alasan_hukum ? ` · ${P.alasan[q.alasan_hukum]}` : ''}` },
            { label: P.dasarRinci, nilai: q.dasar_rinci }, { label: P.cakupan, nilai: q.cakupan }, { label: P.samar, nilai: q.identitas_disamarkan ? P.samarYa : P.samarTidak },
          ],
        }]} />
        {diputuskan && <Peringatan nada="biru">{q.penyetuju_nama ? `${P.oleh(q.penyetuju_nama)}. ` : ''}{q.catatan_keputusan ?? ''}</Peringatan>}
        {bisa && (
          <>
            <AreaTeks id="tpb-catatan" label={P.catatan} value={catatan} maxLength={500} onChange={(e) => setCatatan(e.target.value)} aria-invalid={dicoba && !catatan.trim() ? true : undefined} />
            <span style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{P.catatanPetunjuk}</span>
          </>
        )}
      </Kolom>
    </Modal1>
  );
}
