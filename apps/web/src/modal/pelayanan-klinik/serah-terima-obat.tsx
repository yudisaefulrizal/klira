import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { KASIR, STATUS_RESEP, TOMBOL } from '@klira/shared';
import type { ResepDto } from '@klira/shared';
import { resepKunjungan, serahkanObat } from '../../api-klien/farmasi';
import { GalatApi } from '../../api-klien/klien';
import { token } from '../../gaya/token';
import { Modal1 } from '../../komponen/modal-1/modal-1';
import { AreaTeks } from '../../komponen/ui/area-teks';
import { Bingkai } from '../../komponen/ui/kartu';
import { KotakCentang } from '../../komponen/ui/kotak-centang';
import { Lencana } from '../../komponen/ui/lencana';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Kolom, Sebaris, Tumbuh } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { awalSerah, bentukSerah, galatSerah } from './keadaan-farmasi';
import { KepalaPasien } from './kepala-pasien';
import { TampilanResep } from './tampilan-resep';

const B = KASIR.bayar;

export type SerahObat = {
  /** null selama resep dimuat (atau bila tidak dimuat karena tanpa izin farmasi). */
  resep: ResepDto[] | null;
  /** Ada resep siap dan tidak ada resep yang masih ditelaah: tombol Serahkan obat aktif. */
  bisaSerah: boolean;
  /** Semua resep sudah diserahkan (atau tidak ada resep). */
  selesai: boolean;
  memproses: boolean;
  berubah: boolean;
  galat: string | null;
  info: string | null;
  serahkan: () => void;
  /** Isi langkah serah terima (daftar resep, stok kurang, alasan); tombol aksi disediakan pemanggil. */
  isi: ReactNode;
};

/**
 * Penyerahan obat oleh farmasi (izin farmasi.input); tidak mencatat pembayaran dan tidak membutuhkan shift kasir.
 * Dipakai sebagai langkah di modal Pembayaran dan sebagai modal tersendiri di halaman Farmasi.
 */
export function useSerahObat(kunjunganId: number, aktif = true): SerahObat {
  const [resep, setResep] = useState<ResepDto[] | null>(null);
  const [serah, setSerah] = useState(awalSerah);
  const [kekurangan, setKekurangan] = useState<string[]>([]);
  const [galat, setGalat] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [dicoba, setDicoba] = useState(false);
  const [memproses, setMemproses] = useState(false);
  const [berubah, setBerubah] = useState(false);
  const muat = useCallback(() => resepKunjungan(kunjunganId).then(setResep), [kunjunganId]);
  useEffect(() => {
    if (aktif) void muat().catch((e) => setGalat(e instanceof GalatApi ? e.message : B.gagal));
  }, [muat, aktif]);
  const resepSiap = (resep ?? []).filter((r) => r.status === 'siap');
  const resepBelumSiap = (resep ?? []).filter((r) => r.status === 'diajukan' || r.status === 'ditelaah');
  const bisaSerah = resepSiap.length > 0 && resepBelumSiap.length === 0;

  const serahkan = () => {
    if (memproses || !bisaSerah) return;
    if (galatSerah(serah)) return setDicoba(true);
    setMemproses(true); setGalat(null); setInfo(null);
    void (async () => {
      try {
        await serahkanObat(kunjunganId, bentukSerah(serah));
        setBerubah(true);
        setKekurangan([]);
        setSerah(awalSerah());
        setDicoba(false);
        setInfo(B.serahTercatat);
        await muat();
      } catch (e) {
        if (e instanceof GalatApi && e.rincian?.length) setKekurangan(e.rincian.map((r) => r.pesan));
        setGalat(e instanceof GalatApi ? e.message : B.gagal);
      } finally {
        setMemproses(false);
      }
    })();
  };

  const isi = !resep ? <span style={{ color: token.warna.teksRedup }}>{KASIR.memuat}</span> : (
    <Kolom>
      {resep.length === 0 && <span style={{ color: token.warna.teksRedup }}>{B.serahKosong}</span>}
      {resep.map((r) => (
        <Bingkai key={r.id} arah="kolom" jarak="xs" padding="md">
          <Sebaris jarak="sm" bungkus>
            <Tumbuh tag="span"><strong>{r.nomor_resep}</strong></Tumbuh>
            <Lencana warna={STATUS_RESEP.warna(r.status)}>{STATUS_RESEP.label(r.status)}</Lencana>
          </Sebaris>
          <TampilanResep resep={r} />
        </Bingkai>
      ))}
      {resepBelumSiap.length > 0 && <Peringatan nada="biru">{B.serahBelumSiap}</Peringatan>}
      {kekurangan.length > 0 && (
        <Peringatan>
          <strong>{B.stokKurangJudul}</strong>
          {kekurangan.map((k) => <div key={k}>{k}</div>)}
        </Peringatan>
      )}
      {resepSiap.length > 0 && (
        <Kolom>
          <span style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{B.serahInfo}</span>
          {kekurangan.length > 0 && (
            <>
              <KotakCentang id="serah-izinkan" label={B.izinkanStokKurang} checked={serah.izinkan} onChange={(e) => setSerah({ ...serah, izinkan: e.target.checked })} />
              {serah.izinkan && <AreaTeks id="serah-alasan" label={B.alasanStok} value={serah.alasan} maxLength={300} onChange={(e) => setSerah({ ...serah, alasan: e.target.value })} aria-invalid={dicoba && galatSerah(serah) ? true : undefined} />}
              {dicoba && galatSerah(serah) && <Peringatan>{galatSerah(serah)}</Peringatan>}
            </>
          )}
        </Kolom>
      )}
      {resep.length > 0 && resepSiap.length === 0 && resepBelumSiap.length === 0 && <Peringatan nada="biru">{B.serahSudah}</Peringatan>}
    </Kolom>
  );

  return { resep, bisaSerah, selesai: !!resep && resepSiap.length === 0 && resepBelumSiap.length === 0, memproses, berubah, galat, info, serahkan, isi };
}

type Props = { kunjunganId: number; pasien: { nama: string; nomor_rm: string }; onTutup: () => void; onSelesai: () => void };

/** Modal serah terima tersendiri untuk halaman Farmasi (Riwayat obat); di Daftar pasien penyerahan menjadi langkah modal Pembayaran. */
export function SerahTerimaObat({ kunjunganId, pasien, onTutup, onSelesai }: Props) {
  const s = useSerahObat(kunjunganId);
  const tutup = () => { if (!s.memproses) (s.berubah ? onSelesai : onTutup)(); };
  return (
    <Modal1 judul={B.serahJudul} lebar="modalBesar" konteks={<KepalaPasien nama={pasien.nama} nomorRm={pasien.nomor_rm} />} onTutup={tutup}
      aksi={
        <>
          <Tombol type="button" varian="sekunder" disabled={s.memproses} onClick={tutup}>{TOMBOL.tutup}</Tombol>
          {s.resep && s.resep.some((r) => r.status === 'siap') && <Tombol type="button" disabled={s.memproses || !s.bisaSerah} onClick={s.serahkan}>{s.memproses ? B.menyerahkan : B.serah}</Tombol>}
        </>
      }>
      {s.galat && <Peringatan>{s.galat}</Peringatan>}
      {s.info && <Peringatan nada="biru">{s.info}</Peringatan>}
      {s.isi}
    </Modal1>
  );
}
