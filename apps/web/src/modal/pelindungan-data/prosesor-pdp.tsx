import { useMemo, useState } from 'react';
import { BUTIR_PERJANJIAN, PDP, TOMBOL } from '@klira/shared';
import type { ProsesorDto } from '@klira/shared';
import { simpanProsesor } from '../../api-klien/pdp';
import { GalatApi } from '../../api-klien/klien';
import { token } from '../../gaya/token';
import { ModalBertahap } from '../../komponen/modal-bertahap/modal-bertahap';
import type { LangkahModal } from '../../komponen/modal-bertahap/modal-bertahap';
import { Bingkai } from '../../komponen/ui/kartu';
import { Isian } from '../../komponen/ui/isian';
import { KotakCentang } from '../../komponen/ui/kotak-centang';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Kolom } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { adaPerubahan } from '../../util/draf';
import { alihButir, awalProsesor, bentukProsesor, galatProsesor, langkahBermasalahProsesor } from './keadaan-pdp';
import type { KeadaanProsesor } from './keadaan-pdp';

const P = PDP.prosesor;
const kecil = { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil } as const;

/** Modal Prosesor (3.3, MODAL-BERTAHAP): Identitas > Perjanjian (11 butir) > Sub-prosesor dan SLA; `prosesor` terisi berarti mengubah. */
export function ProsesorPdp({ prosesor = null, onTutup, onSelesai }: { prosesor?: ProsesorDto | null; onTutup: () => void; onSelesai: () => void }) {
  const awal = useMemo(() => awalProsesor(prosesor), [prosesor]);
  const [k, setK] = useState<KeadaanProsesor>(awal);
  const [indeks, setIndeks] = useState(0);
  const [dicoba, setDicoba] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [memproses, setMemproses] = useState(false);
  const [selesai, setSelesai] = useState(false);
  const g = useMemo(() => galatProsesor(k), [k]);
  const tampil = (b: string) => (dicoba ? g[b] : undefined);
  const set = (b: 'nama' | 'layanan' | 'lokasi_data' | 'nomor_perjanjian' | 'sla') => (e: { target: { value: string } }) => setK({ ...k, [b]: e.target.value });
  const ubahSub = (i: number, b: 'nama' | 'layanan' | 'persetujuan_pada', v: string) => setK({ ...k, sub: k.sub.map((s, j) => (j === i ? { ...s, [b]: v } : s)) });

  async function kirim() {
    setDicoba(true);
    if (memproses) return;
    const m = langkahBermasalahProsesor(g);
    if (m >= 0) return setIndeks(m);
    setMemproses(true);
    setGalat(null);
    try {
      await simpanProsesor(prosesor?.id ?? null, bentukProsesor(k));
      setSelesai(true);
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : P.gagal);
    } finally {
      setMemproses(false);
    }
  }

  const langkah: LangkahModal[] = [
    {
      id: 'identitas', judul: P.langkah.identitas, selesai: !g.nama && !g.layanan && !g.lokasi_data,
      isi: (
        <Kolom>
          <Isian id="pro-nama" label={P.nama} value={k.nama} onChange={set('nama')} galat={tampil('nama')} autoComplete="off" />
          <Isian id="pro-layanan" label={P.layanan} value={k.layanan} onChange={set('layanan')} galat={tampil('layanan')} autoComplete="off" />
          <Isian id="pro-lokasi" label={P.lokasi} value={k.lokasi_data} onChange={set('lokasi_data')} galat={tampil('lokasi_data')} autoComplete="off" />
          <KotakCentang id="pro-aktif" label={P.aktif} checked={k.aktif} onChange={(e) => setK({ ...k, aktif: e.target.checked })} />
        </Kolom>
      ),
    },
    {
      id: 'perjanjian', judul: P.langkah.perjanjian,
      isi: (
        <Kolom>
          <Isian id="pro-perjanjian" label={P.nomorPerjanjian} value={k.nomor_perjanjian} onChange={set('nomor_perjanjian')} autoComplete="off" />
          <strong>{P.butir}</strong>
          {BUTIR_PERJANJIAN.map((b) => <KotakCentang key={b} id={`pro-butir-${b}`} label={P.butirLabel[b]} checked={k.butir.includes(b)} onChange={(e) => setK(alihButir(k, b, e.target.checked))} />)}
          {k.butir.length < BUTIR_PERJANJIAN.length && <span style={kecil}>{P.butirKurang(BUTIR_PERJANJIAN.length - k.butir.length)}</span>}
        </Kolom>
      ),
    },
    {
      id: 'sub', judul: P.langkah.sub, selesai: !Object.keys(g).some((x) => x.startsWith('sub_prosesor') || x === 'sla_lapor_jam'),
      isi: (
        <Kolom>
          <strong>{P.sub}</strong>
          {k.sub.map((s, i) => (
            <Bingkai key={i} arah="kolom" jarak="sm" padding="md">
              <Isian id={`pro-sub-nama-${i}`} label={P.subNama} value={s.nama} onChange={(e) => ubahSub(i, 'nama', e.target.value)} galat={tampil(`sub_prosesor.${i}.nama`)} autoComplete="off" />
              <Isian id={`pro-sub-layanan-${i}`} label={P.subLayanan} value={s.layanan} onChange={(e) => ubahSub(i, 'layanan', e.target.value)} galat={tampil(`sub_prosesor.${i}.layanan`)} autoComplete="off" />
              <Isian id={`pro-sub-tgl-${i}`} label={P.subPersetujuan} type="date" value={s.persetujuan_pada} onChange={(e) => ubahSub(i, 'persetujuan_pada', e.target.value)} galat={tampil(`sub_prosesor.${i}.persetujuan_pada`)} />
              <Tombol type="button" varian="teks" onClick={() => setK({ ...k, sub: k.sub.filter((_, j) => j !== i) })}>{P.buang}</Tombol>
            </Bingkai>
          ))}
          <Tombol type="button" varian="sekunder" onClick={() => setK({ ...k, sub: [...k.sub, { nama: '', layanan: '', persetujuan_pada: '' }] })}>{P.tambahSub}</Tombol>
          <Isian id="pro-sla" label={P.sla} inputMode="numeric" value={k.sla} onChange={set('sla')} galat={tampil('sla_lapor_jam')} autoComplete="off" />
          <span style={kecil}>{P.slaPetunjuk}</span>
          {dicoba && g.sub_prosesor && <Peringatan>{g.sub_prosesor}</Peringatan>}
        </Kolom>
      ),
    },
  ];

  return (
    <ModalBertahap
      judul={P.judul} langkah={langkah} indeks={indeks} onIndeks={setIndeks} galat={galat} onTutup={selesai ? onSelesai : onTutup} lindungiTutup={adaPerubahan(awal, k)}
      labelKirim={memproses ? PDP.menyimpan : P.simpan} onKirim={() => void kirim()} kirimNonaktif={memproses}
      hasil={selesai ? { judul: P.hasilJudul, isi: <p style={{ margin: 0 }}>{P.hasilPesan}</p>, aksi: <Tombol type="button" onClick={onSelesai}>{TOMBOL.tutup}</Tombol> } : undefined}
    />
  );
}
