import { useEffect, useMemo, useState } from 'react';
import { PDP, TOMBOL } from '@klira/shared';
import type { DpiaDto, RopaDto } from '@klira/shared';
import { daftarRopa, simpanDpia } from '../../api-klien/pdp';
import { GalatApi } from '../../api-klien/klien';
import { token } from '../../gaya/token';
import { ModalBertahap } from '../../komponen/modal-bertahap/modal-bertahap';
import type { LangkahModal } from '../../komponen/modal-bertahap/modal-bertahap';
import { AreaTeks } from '../../komponen/ui/area-teks';
import { Isian } from '../../komponen/ui/isian';
import { KotakCentang } from '../../komponen/ui/kotak-centang';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Pilihan } from '../../komponen/ui/pilihan';
import { Kolom } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { adaPerubahan } from '../../util/draf';
import { awalDpia, bentukDpia, galatDpia, langkahBermasalahDpia } from './keadaan-pdp';
import type { KeadaanDpia } from './keadaan-pdp';

const D = PDP.dpia;
const kecil = { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil } as const;

/** Modal DPIA (3.3, MODAL-BERTAHAP): Risiko > Mitigasi > Saran PPDP > Tinjau ulang; `dpia` terisi berarti mengubah atau meninjau ulang. */
export function DpiaPdp({ dpia = null, onTutup, onSelesai }: { dpia?: DpiaDto | null; onTutup: () => void; onSelesai: () => void }) {
  const awal = useMemo(() => awalDpia(dpia), [dpia]);
  const [k, setK] = useState<KeadaanDpia>(awal);
  const [ropa, setRopa] = useState<RopaDto[]>([]);
  const [indeks, setIndeks] = useState(0);
  const [dicoba, setDicoba] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [memproses, setMemproses] = useState(false);
  const [selesai, setSelesai] = useState(false);
  const g = useMemo(() => galatDpia(k), [k]);
  const tampil = (b: string) => (dicoba ? g[b] : undefined);
  const set = (b: keyof KeadaanDpia) => (e: { target: { value: string } }) => setK({ ...k, [b]: e.target.value });

  useEffect(() => {
    let batal = false;
    daftarRopa(1).then((h) => !batal && setRopa(h.data)).catch(() => undefined);
    return () => {
      batal = true;
    };
  }, []);

  async function kirim() {
    setDicoba(true);
    if (memproses) return;
    const m = langkahBermasalahDpia(g);
    if (m >= 0) return setIndeks(m);
    setMemproses(true);
    setGalat(null);
    try {
      await simpanDpia(dpia?.id ?? null, bentukDpia(k));
      setSelesai(true);
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : D.gagal);
    } finally {
      setMemproses(false);
    }
  }

  const langkah: LangkahModal[] = [
    {
      id: 'risiko', judul: D.langkah.risiko, selesai: !g.pemrosesan && !g.risiko,
      isi: (
        <Kolom>
          <span style={kecil}>{D.petunjuk}</span>
          <Isian id="dpia-pemrosesan" label={D.pemrosesan} value={k.pemrosesan} onChange={set('pemrosesan')} galat={tampil('pemrosesan')} autoComplete="off" />
          <Pilihan id="dpia-ropa" label={D.ropa} opsi={[{ nilai: '', label: D.tanpaRopa }, ...ropa.map((r) => ({ nilai: String(r.id), label: r.nama_kegiatan }))]} value={k.ropa_id} onChange={set('ropa_id')} />
          <AreaTeks id="dpia-risiko" label={D.risiko} value={k.risiko} maxLength={4000} onChange={set('risiko')} aria-invalid={tampil('risiko') ? true : undefined} />
          {tampil('risiko') && <Peringatan>{g.risiko}</Peringatan>}
        </Kolom>
      ),
    },
    {
      id: 'mitigasi', judul: D.langkah.mitigasi, selesai: !g.mitigasi,
      isi: <Kolom><AreaTeks id="dpia-mitigasi" label={D.mitigasi} value={k.mitigasi} maxLength={4000} onChange={set('mitigasi')} aria-invalid={tampil('mitigasi') ? true : undefined} />{tampil('mitigasi') && <Peringatan>{g.mitigasi}</Peringatan>}</Kolom>,
    },
    { id: 'saran', judul: D.langkah.saran, isi: <Kolom><AreaTeks id="dpia-saran" label={D.saran} value={k.saran_ppdp} maxLength={4000} onChange={set('saran_ppdp')} /></Kolom> },
    {
      id: 'tinjau', judul: D.langkah.tinjau, selesai: !g.tinjau_ulang_pada,
      isi: (
        <Kolom>
          <Isian id="dpia-tinjau" label={D.tinjauUlang} type="date" value={k.tinjau_ulang_pada} onChange={set('tinjau_ulang_pada')} galat={tampil('tinjau_ulang_pada')} />
          <KotakCentang id="dpia-ditinjau" label={D.tandaiDitinjau} checked={k.tandai_ditinjau} onChange={(e) => setK({ ...k, tandai_ditinjau: e.target.checked })} />
        </Kolom>
      ),
    },
  ];

  return (
    <ModalBertahap
      judul={D.judul} langkah={langkah} indeks={indeks} onIndeks={setIndeks} galat={galat} onTutup={selesai ? onSelesai : onTutup} lindungiTutup={adaPerubahan(awal, k)}
      labelKirim={memproses ? PDP.menyimpan : D.simpan} onKirim={() => void kirim()} kirimNonaktif={memproses}
      hasil={selesai ? { judul: D.hasilJudul, isi: <p style={{ margin: 0 }}>{D.hasilPesan}</p>, aksi: <Tombol type="button" onClick={onSelesai}>{TOMBOL.tutup}</Tombol> } : undefined}
    />
  );
}
