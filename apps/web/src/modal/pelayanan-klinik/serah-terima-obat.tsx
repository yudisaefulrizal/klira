import { useCallback, useEffect, useState } from 'react';
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

const B = KASIR.bayar;
type Props = { kunjunganId: number; pasien: { nama: string; nomor_rm: string }; onTutup: () => void; onSelesai: () => void };

/** Penyerahan oleh farmasi; tidak mencatat pembayaran dan tidak membutuhkan shift kasir. */
export function SerahTerimaObat({ kunjunganId, pasien, onTutup, onSelesai }: Props) {
  const [resep, setResep] = useState<ResepDto[] | null>(null);
  const [serah, setSerah] = useState(awalSerah);
  const [kekurangan, setKekurangan] = useState<string[]>([]);
  const [galat, setGalat] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [dicoba, setDicoba] = useState(false);
  const [memproses, setMemproses] = useState(false);
  const [berubah, setBerubah] = useState(false);
  const muat = useCallback(() => resepKunjungan(kunjunganId).then(setResep), [kunjunganId]);
  useEffect(() => { void muat().catch((e) => setGalat(e instanceof GalatApi ? e.message : B.gagal)); }, [muat]);
  const resepSiap = (resep ?? []).filter((r) => r.status === 'siap');
  const resepBelumSiap = (resep ?? []).filter((r) => r.status === 'diajukan' || r.status === 'ditelaah');
  async function jalankan(f: () => Promise<void>) {
    if (memproses) return;
    setMemproses(true); setGalat(null); setInfo(null);
    try { await f(); } catch (e) { setGalat(e instanceof GalatApi ? e.message : B.gagal); }
    finally { setMemproses(false); }
  }
  const serahkan = () => {
    if (galatSerah(serah)) return setDicoba(true);
    void jalankan(async () => {
      try {
        await serahkanObat(kunjunganId, bentukSerah(serah));
        setBerubah(true);
        setKekurangan([]);
        setSerah(awalSerah());
        setInfo(B.serahTercatat);
        await muat();
      } catch (e) {
        if (e instanceof GalatApi && e.rincian?.length) setKekurangan(e.rincian.map((r) => r.pesan));
        throw e;
      }
    });
  };

  const tutup = () => { if (!memproses) (berubah ? onSelesai : onTutup)(); };
  return (
    <Modal1 judul={B.serahJudul} lebar="modalBesar" konteks={<KepalaPasien nama={pasien.nama} nomorRm={pasien.nomor_rm} />} onTutup={tutup}
      aksi={<Tombol type="button" disabled={memproses} onClick={tutup}>{TOMBOL.tutup}</Tombol>}>
      {galat && <Peringatan>{galat}</Peringatan>}
      {info && <Peringatan nada="biru">{info}</Peringatan>}
      {!resep ? <span style={{ color: token.warna.teksRedup }}>{KASIR.memuat}</span> : (
        <Kolom>
          <h3 style={{ margin: 0, fontSize: token.huruf.ukuran.besar }}>{B.serahJudul}</h3>
          {resep.length === 0 && <span style={{ color: token.warna.teksRedup }}>{B.serahKosong}</span>}
          {resep.map((r) => (
            <Bingkai key={r.id} arah="kolom" jarak="xs" padding="md">
              <Sebaris jarak="sm" bungkus>
                <Tumbuh tag="span"><strong>{r.nomor_resep}</strong></Tumbuh>
                <Lencana warna={STATUS_RESEP.warna(r.status)}>{STATUS_RESEP.label(r.status)}</Lencana>
              </Sebaris>
              {r.item.map((i) => <span key={i.id}>{i.nama}: {i.jumlah} {i.satuan}, {i.aturan_pakai}</span>)}
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
              <div><Tombol type="button" disabled={memproses || resepBelumSiap.length > 0} onClick={serahkan}>{memproses ? B.menyerahkan : B.serah}</Tombol></div>
            </Kolom>
          )}
          {resep.length > 0 && resepSiap.length === 0 && resepBelumSiap.length === 0 && <Peringatan nada="biru">{B.serahSudah}</Peringatan>}
          <span style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{B.penjelasanTutup}</span>
        </Kolom>
      )}
    </Modal1>
  );
}
