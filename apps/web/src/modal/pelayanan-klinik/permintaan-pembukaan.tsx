import { useMemo, useState } from 'react';
import { REKAM_MEDIS, TOMBOL } from '@klira/shared';
import { ajukanPembukaan } from '../../api-klien/dokumen-rm';
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
import { DaftarRingkasan, Kolom } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { adaPerubahan } from '../../util/draf';
import { awalPembukaan, bentukPembukaan, galatPembukaan, langkahBermasalahPembukaan } from './keadaan-dokumen';
import type { KeadaanPembukaan } from './keadaan-dokumen';

type Props = { onTutup: () => void; onSelesai: () => void };
const P = REKAM_MEDIS.dok.pembukaan;
const OPSI_DASAR = Object.entries(P.dasar).map(([nilai, label]) => ({ nilai, label }));
const OPSI_ALASAN = [{ nilai: '', label: '...' }, ...Object.entries(P.alasan).map(([nilai, label]) => ({ nilai, label }))];
const kecil = { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil } as const;

/** Modal Permintaan pembukaan rekam medis (3.3, MODAL-BERTAHAP, 4.4): Pemohon > Dasar dan cakupan > Ringkasan; keputusan oleh orang lain di tab Permintaan pembukaan. */
export function PermintaanPembukaan({ onTutup, onSelesai }: Props) {
  const awal = useMemo(awalPembukaan, []);
  const [k, setK] = useState<KeadaanPembukaan>(awal);
  const [indeks, setIndeks] = useState(0);
  const [dicoba, setDicoba] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [memproses, setMemproses] = useState(false);
  const [selesai, setSelesai] = useState(false);
  const g = useMemo(() => galatPembukaan(k), [k]);
  const tampil = (b: string) => (dicoba ? g[b] : undefined);
  const set = (b: keyof KeadaanPembukaan) => (e: { target: { value: string } }) => setK({ ...k, [b]: e.target.value });

  async function kirim() {
    setDicoba(true);
    if (memproses) return;
    const bermasalah = langkahBermasalahPembukaan(g);
    if (bermasalah >= 0) return setIndeks(bermasalah);
    setMemproses(true);
    setGalat(null);
    try {
      await ajukanPembukaan(bentukPembukaan(k));
      setSelesai(true);
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : P.gagal);
    } finally {
      setMemproses(false);
    }
  }

  const langkah: LangkahModal[] = [
    {
      id: 'pemohon', judul: P.langkah.pemohon, selesai: !g.pasien_id && !g.pemohon_nama,
      isi: (
        <Kolom>
          <PemilihPasien id="pb-pasien" pasienId={k.pasien_id} onPilih={(id) => setK({ ...k, pasien_id: id })} galat={tampil('pasien_id')} />
          <Isian id="pb-pemohon" label={P.pemohon} value={k.pemohon_nama} onChange={set('pemohon_nama')} galat={tampil('pemohon_nama')} autoComplete="off" />
          <Isian id="pb-instansi" label={P.instansi} value={k.pemohon_instansi} onChange={set('pemohon_instansi')} autoComplete="off" />
        </Kolom>
      ),
    },
    {
      id: 'dasar', judul: P.langkah.dasar, selesai: !g.alasan_hukum && !g.dasar_rinci && !g.cakupan,
      isi: (
        <Kolom>
          <Pilihan id="pb-dasar" label={P.dasarLabel} opsi={OPSI_DASAR} value={k.dasar} onChange={(e) => setK({ ...k, dasar: e.target.value as KeadaanPembukaan['dasar'] })} />
          {k.dasar === 'hukum' && <Pilihan id="pb-alasan" label={P.alasanHukum} opsi={OPSI_ALASAN} value={k.alasan_hukum} onChange={set('alasan_hukum')} galat={tampil('alasan_hukum')} />}
          <AreaTeks id="pb-rinci" label={P.dasarRinci} value={k.dasar_rinci} maxLength={500} onChange={set('dasar_rinci')} aria-invalid={tampil('dasar_rinci') ? true : undefined} />
          {tampil('dasar_rinci') && <Peringatan>{g.dasar_rinci}</Peringatan>}
          <AreaTeks id="pb-cakupan" label={P.cakupan} value={k.cakupan} maxLength={500} onChange={set('cakupan')} aria-invalid={tampil('cakupan') ? true : undefined} />
          {tampil('cakupan') && <Peringatan>{g.cakupan}</Peringatan>}
          <KotakCentang id="pb-samar" label={P.samar} keterangan={P.samarPetunjuk} checked={k.identitas_disamarkan} onChange={(e) => setK({ ...k, identitas_disamarkan: e.target.checked })} />
        </Kolom>
      ),
    },
    {
      id: 'ringkasan', judul: P.langkah.ringkasan,
      isi: (
        <Kolom>
          <DaftarRingkasan bagian={[{
            judul: P.judul,
            baris: [
              { label: P.pemohon, nilai: [k.pemohon_nama, k.pemohon_instansi].filter(Boolean).join(' · ') || '-' }, { label: P.dasarLabel, nilai: `${P.dasar[k.dasar]}${k.dasar === 'hukum' && k.alasan_hukum ? ` · ${P.alasan[k.alasan_hukum]}` : ''}` },
              { label: P.dasarRinci, nilai: k.dasar_rinci || '-' }, { label: P.cakupan, nilai: k.cakupan || '-' }, { label: P.samar, nilai: k.identitas_disamarkan ? P.samarYa : P.samarTidak },
            ],
          }]} />
          <span style={kecil}>{P.info}</span>
        </Kolom>
      ),
    },
  ];

  return (
    <ModalBertahap
      judul={P.judul} langkah={langkah} indeks={indeks} onIndeks={setIndeks} galat={galat} onTutup={selesai ? onSelesai : onTutup} lindungiTutup={adaPerubahan(awal, k)}
      labelKirim={memproses ? P.memproses : P.ajukan} onKirim={() => void kirim()} kirimNonaktif={memproses}
      hasil={selesai ? { judul: P.hasilJudul, isi: <p style={{ margin: 0 }}>{P.hasilPesan}</p>, aksi: <Tombol type="button" onClick={onSelesai}>{TOMBOL.tutup}</Tombol> } : undefined}
    />
  );
}
