import { useEffect, useMemo, useState } from 'react';
import { PDP, TOMBOL } from '@klira/shared';
import type { PemusnahanDto } from '@klira/shared';
import { opsiProsesor, prosesPemusnahan, rencanaPemusnahan } from '../../api-klien/pdp';
import { GalatApi } from '../../api-klien/klien';
import { token } from '../../gaya/token';
import { ModalBertahap } from '../../komponen/modal-bertahap/modal-bertahap';
import type { LangkahModal } from '../../komponen/modal-bertahap/modal-bertahap';
import { PemilihPasien } from '../../komponen/pemilih-pasien';
import { AreaTeks } from '../../komponen/ui/area-teks';
import { Isian } from '../../komponen/ui/isian';
import { KotakCentang } from '../../komponen/ui/kotak-centang';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Pilihan } from '../../komponen/ui/pilihan';
import { Kolom } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { adaPerubahan } from '../../util/draf';
import { awalProsesMusnah, awalRencanaMusnah, bentukRencanaMusnah, galatProsesMusnah, galatRencanaMusnah, indeksTahapMusnah, bentukProsesMusnah } from './keadaan-pdp';
import type { KeadaanProsesMusnah, KeadaanRencanaMusnah } from './keadaan-pdp';

const M = PDP.retensi;
const kecil = { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil } as const;

/**
 * Modal Pemusnahan (3.3, MODAL-BERTAHAP): Pilih data > Perintah ke prosesor > Pelaksanaan > Berita acara. Tanpa `musnah` membuat rencana; dengan `musnah`
 * hanya tahap berikutnya yang dapat diisi. Aplikasi mencatat prosedur, tidak menghapus data.
 */
export function PemusnahanPdp({ musnah = null, onTutup, onSelesai }: { musnah?: PemusnahanDto | null; onTutup: () => void; onSelesai: () => void }) {
  const tahap = musnah?.tahap_berikut ?? null;
  const awalR = useMemo(awalRencanaMusnah, []);
  const awalP = useMemo(awalProsesMusnah, []);
  const [r, setR] = useState<KeadaanRencanaMusnah>(awalR);
  const [p, setP] = useState<KeadaanProsesMusnah>(awalP);
  const [prosesor, setProsesor] = useState<{ id: number; nama: string }[]>([]);
  const [indeks, setIndeks] = useState(indeksTahapMusnah(tahap));
  const [dicoba, setDicoba] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [memproses, setMemproses] = useState(false);
  const [selesai, setSelesai] = useState(false);
  const baru = !musnah;
  const gR = useMemo(() => galatRencanaMusnah(r), [r]);
  const gP = useMemo(() => (tahap ? galatProsesMusnah(tahap, p, PDP.galat.cadanganWajib) : {}), [tahap, p]);
  const g = baru ? gR : gP;
  const tampil = (b: string) => (dicoba ? g[b] : undefined);
  const setRencana = (b: keyof KeadaanRencanaMusnah) => (e: { target: { value: string } }) => setR({ ...r, [b]: e.target.value });
  const setProses = (b: keyof KeadaanProsesMusnah) => (e: { target: { value: string } }) => setP({ ...p, [b]: e.target.value });

  useEffect(() => {
    let batal = false;
    opsiProsesor().then((o) => !batal && setProsesor(o)).catch(() => undefined);
    return () => {
      batal = true;
    };
  }, []);

  async function kirim() {
    setDicoba(true);
    if (memproses || (!baru && !tahap)) return;
    if (Object.keys(g).length) return setIndeks(baru ? 0 : indeksTahapMusnah(tahap));
    setMemproses(true);
    setGalat(null);
    try {
      if (baru) await rencanaPemusnahan(bentukRencanaMusnah(r));
      else await prosesPemusnahan(musnah.id, bentukProsesMusnah(tahap!, p));
      setSelesai(true);
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : M.gagal);
    } finally {
      setMemproses(false);
    }
  }

  const menunggu = (tahapIni: string, isi: React.ReactNode) => (tahap === tahapIni ? isi : <span style={kecil}>{M.menunggu}</span>);
  const langkah: LangkahModal[] = [
    {
      id: 'data', judul: M.langkah.data, selesai: !baru || !gR.cakupan,
      isi: baru ? (
        <Kolom>
          <span style={kecil}>{M.petunjuk}</span>
          <AreaTeks id="mus-cakupan" label={M.cakupan} value={r.cakupan} maxLength={500} onChange={setRencana('cakupan')} aria-invalid={tampil('cakupan') ? true : undefined} />
          {tampil('cakupan') && <Peringatan>{g.cakupan}</Peringatan>}
          <Pilihan id="mus-dasar" label={M.dasar} opsi={Object.entries(M.dasarLabel).map(([nilai, label]) => ({ nilai, label }))} value={r.dasar} onChange={setRencana('dasar')} galat={tampil('dasar')} />
          {r.dasar === 'permintaan_hak' && <Isian id="mus-hak" label={M.permintaanHak} inputMode="numeric" value={r.permintaan_hak_id} onChange={setRencana('permintaan_hak_id')} autoComplete="off" />}
          <PemilihPasien id="mus-pasien" pasienId={r.pasien_id} onPilih={(id) => setR({ ...r, pasien_id: id })} />
          <Isian id="mus-jadwal" label={M.jadwal} type="date" value={r.jadwal} onChange={setRencana('jadwal')} galat={tampil('jadwal')} />
        </Kolom>
      ) : (
        <Kolom>
          <strong>{musnah.cakupan}</strong>
          <span style={kecil}>{M.dasarLabel[musnah.dasar]}{musnah.pasien_nama ? ` · ${musnah.pasien_nama}` : ''} · {M.jadwal} {musnah.jadwal}</span>
          <span style={kecil}>{M.tahapSekarang}: {M.status[musnah.status]}</span>
        </Kolom>
      ),
    },
    {
      id: 'perintah', judul: M.langkah.perintah, selesai: !baru && tahap !== 'perintah',
      isi: baru ? <span style={kecil}>{M.menunggu}</span> : menunggu('perintah', (
        <Kolom>
          <Pilihan id="mus-prosesor" label={M.prosesor} opsi={[{ nilai: '', label: M.pilihProsesor }, ...prosesor.map((x) => ({ nilai: String(x.id), label: x.nama }))]} value={p.prosesor_id} onChange={setProses('prosesor_id')} galat={tampil('prosesor_id')} />
          <Isian id="mus-nomor" label={M.nomorPerintah} value={p.nomor_perintah} onChange={setProses('nomor_perintah')} galat={tampil('nomor_perintah')} autoComplete="off" />
        </Kolom>
      )),
    },
    {
      id: 'pelaksanaan', judul: M.langkah.pelaksanaan, selesai: !baru && (tahap === 'berita_acara' || tahap === null),
      isi: baru ? <span style={kecil}>{M.menunggu}</span> : menunggu('pelaksanaan', (
        <Kolom>
          <Isian id="mus-pelaksana" label={M.pelaksana} value={p.pelaksana} onChange={setProses('pelaksana')} galat={tampil('pelaksana')} autoComplete="off" />
          <Isian id="mus-metode" label={M.metode} value={p.metode} onChange={setProses('metode')} galat={tampil('metode')} autoComplete="off" />
          <KotakCentang id="mus-cadangan" label={M.cadangan} checked={p.mencakup_cadangan} onChange={(e) => setP({ ...p, mencakup_cadangan: e.target.checked })} />
          {tampil('mencakup_cadangan') && <Peringatan>{g.mencakup_cadangan}</Peringatan>}
          <Isian id="mus-waktu" label={M.pelaksanaanPada} type="datetime-local" value={p.pelaksanaan_pada} onChange={setProses('pelaksanaan_pada')} galat={tampil('pelaksanaan_pada')} />
        </Kolom>
      )),
    },
    {
      id: 'berita', judul: M.langkah.beritaAcara, selesai: !baru && tahap === null,
      isi: baru ? <span style={kecil}>{M.menunggu}</span> : menunggu('berita_acara', (
        <Kolom>
          <AreaTeks id="mus-ba" label={M.beritaAcara} value={p.berita_acara} maxLength={4000} onChange={setProses('berita_acara')} aria-invalid={tampil('berita_acara') ? true : undefined} />
          {tampil('berita_acara') && <Peringatan>{g.berita_acara}</Peringatan>}
        </Kolom>
      )),
    },
  ];

  return (
    <ModalBertahap
      judul={PDP.tab.retensi} langkah={langkah} indeks={indeks} onIndeks={setIndeks} galat={galat} onTutup={selesai ? onSelesai : onTutup} lindungiTutup={adaPerubahan(awalR, r) || adaPerubahan(awalP, p)}
      labelKirim={memproses ? PDP.menyimpan : baru ? M.simpanRencana : M.simpanTahap} onKirim={() => void kirim()} kirimNonaktif={memproses || (!baru && tahap === null)}
      hasil={selesai ? { judul: M.hasilJudul, isi: <p style={{ margin: 0 }}>{M.hasilPesan}</p>, aksi: <Tombol type="button" onClick={onSelesai}>{TOMBOL.tutup}</Tombol> } : undefined}
    />
  );
}
