import { useState } from 'react';
import { REKAM_MEDIS, STATUS_PERBAIKAN, TOMBOL } from '@klira/shared';
import type { PermintaanPerbaikanDto } from '@klira/shared';
import { GalatApi } from '../../api-klien/klien';
import { putuskanPerbaikan } from '../../api-klien/rekam-medis';
import { token } from '../../gaya/token';
import { Modal1 } from '../../komponen/modal-1/modal-1';
import { AreaTeks } from '../../komponen/ui/area-teks';
import { Bingkai } from '../../komponen/ui/kartu';
import { Lencana } from '../../komponen/ui/lencana';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Baris, Kolom } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { formatWaktu } from '../../util/penyaring-tab';
import { ringkasIsi, selisihBaris } from './keadaan-rm';

type Props = { permintaan: PermintaanPerbaikanDto; onTutup: () => void; onSelesai: () => void };
const T = REKAM_MEDIS.tinjau;

function Kolom2({ judul, baris }: { judul: string; baris: { teks: string; beda: boolean }[] }) {
  return (
    <Bingkai arah="kolom" jarak="xs" padding="md">
      <strong>{judul}</strong>
      {baris.length === 0 && <span style={{ color: token.warna.teksRedup }}>-</span>}
      {baris.map((b, i) => (
        <span key={i} style={{ whiteSpace: 'pre-wrap', fontWeight: b.beda ? token.huruf.berat.tebal : undefined, color: b.beda ? token.warna.status.kuning.teks : undefined }}>{b.teks}</span>
      ))}
    </Bingkai>
  );
}

/** Modal Tinjau permintaan perbaikan (3.3, MODAL-1): bandingkan isi sekarang dan usulan, lalu setujui (diterapkan sebagai versi baru) atau tolak dengan catatan. */
export function TinjauPerbaikan({ permintaan, onTutup, onSelesai }: Props) {
  const [catatan, setCatatan] = useState('');
  const [galat, setGalat] = useState<string | null>(null);
  const [dicoba, setDicoba] = useState(false);
  const [memproses, setMemproses] = useState(false);
  const [hasil, setHasil] = useState<'disetujui' | 'ditolak' | null>(null);
  const diputuskan = permintaan.status !== 'diajukan';
  const s = selisihBaris(ringkasIsi(permintaan.isi_sekarang), ringkasIsi(permintaan.isi_baru));

  async function putuskan(keputusan: 'setujui' | 'tolak') {
    setDicoba(true);
    if (keputusan === 'tolak' && !catatan.trim()) return;
    setMemproses(true);
    setGalat(null);
    try {
      await putuskanPerbaikan(permintaan.id, { keputusan, catatan: catatan.trim() || undefined });
      setHasil(keputusan === 'setujui' ? 'disetujui' : 'ditolak');
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : T.gagal);
    } finally {
      setMemproses(false);
    }
  }

  if (hasil) {
    return (
      <Modal1 judul={T.judul} lebar="modalKecil" onTutup={onSelesai} aksi={<Tombol type="button" onClick={onSelesai}>{TOMBOL.tutup}</Tombol>}>
        <Peringatan nada="biru">{hasil === 'disetujui' ? T.disetujui : T.ditolak}</Peringatan>
      </Modal1>
    );
  }

  return (
    <Modal1
      judul={T.judul}
      lebar="modalBesar"
      lindungiTutup={catatan.trim().length > 0}
      onTutup={onTutup}
      aksi={
        diputuskan ? <Tombol type="button" onClick={onTutup}>{TOMBOL.tutup}</Tombol> : (
          <>
            <Tombol type="button" varian="sekunder" onClick={onTutup}>{TOMBOL.batal}</Tombol>
            <Tombol type="button" varian="sekunder" disabled={memproses} onClick={() => void putuskan('tolak')}>{memproses ? T.memproses : T.tolak}</Tombol>
            <Tombol type="button" disabled={memproses} onClick={() => void putuskan('setujui')}>{memproses ? T.memproses : T.setujui}</Tombol>
          </>
        )
      }
    >
      {galat && <Peringatan>{galat}</Peringatan>}
      <Kolom>
        <strong>{permintaan.pasien_nama} ({permintaan.pasien_nomor_rm}) · {REKAM_MEDIS.perbaikan.bagianLabel[permintaan.bagian]}</strong>
        <span style={{ color: token.warna.teksRedup }}>{T.kolom.pemohon}: {permintaan.pemohon_nama ?? '-'} · {formatWaktu(permintaan.dibuat_pada)} <Lencana warna={STATUS_PERBAIKAN.warna(permintaan.status)}>{STATUS_PERBAIKAN.label(permintaan.status)}</Lencana></span>
        <Bingkai arah="kolom" jarak="xs" padding="md" halus><strong>{T.kolom.alasan}</strong><span>{permintaan.alasan}</span></Bingkai>
        <Baris>
          <Kolom2 judul={T.sekarang} baris={s.sekarang} />
          <Kolom2 judul={T.usulan} baris={s.usulan} />
        </Baris>
        {diputuskan && (
          <Peringatan nada="biru">
            {T.sudahDiputuskan} {permintaan.penyetuju_nama ? `Oleh ${permintaan.penyetuju_nama}. ` : ''}{permintaan.catatan_keputusan ?? ''}
          </Peringatan>
        )}
        {!diputuskan && (
          <>
            <AreaTeks id="tinjau-catatan" label={T.catatan} value={catatan} maxLength={500} onChange={(e) => setCatatan(e.target.value)} aria-invalid={dicoba && !catatan.trim() ? true : undefined} />
            <span style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{T.catatanTolakPetunjuk}</span>
          </>
        )}
      </Kolom>
    </Modal1>
  );
}
