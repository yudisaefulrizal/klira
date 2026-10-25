import { useMemo, useState } from 'react';
import { PDP, TOMBOL } from '@klira/shared';
import type { RopaDto } from '@klira/shared';
import { simpanRopa } from '../../api-klien/pdp';
import { GalatApi } from '../../api-klien/klien';
import { token } from '../../gaya/token';
import { ModalBertahap } from '../../komponen/modal-bertahap/modal-bertahap';
import type { LangkahModal } from '../../komponen/modal-bertahap/modal-bertahap';
import { AreaTeks } from '../../komponen/ui/area-teks';
import { Isian } from '../../komponen/ui/isian';
import { Pilihan } from '../../komponen/ui/pilihan';
import { DaftarRingkasan, Kolom } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { adaPerubahan } from '../../util/draf';
import { awalRopa, galatRopa, langkahBermasalahRopa } from './keadaan-pdp';
import type { KeadaanRopa } from './keadaan-pdp';

const R = PDP.ropa;
const OPSI_DASAR = [{ nilai: '', label: R.pilih }, ...Object.entries(R.dasarLabel).map(([nilai, label]) => ({ nilai, label }))];

/** Modal ROPA (3.3, MODAL-BERTAHAP): Pihak > Dasar dan data > Akses dan hak > Retensi dan pengamanan > Ringkasan; `ropa` terisi berarti mengubah. */
export function RopaPdp({ ropa = null, onTutup, onSelesai }: { ropa?: RopaDto | null; onTutup: () => void; onSelesai: () => void }) {
  const awal = useMemo(() => awalRopa(ropa), [ropa]);
  const [k, setK] = useState<KeadaanRopa>(awal);
  const [indeks, setIndeks] = useState(0);
  const [dicoba, setDicoba] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [memproses, setMemproses] = useState(false);
  const [selesai, setSelesai] = useState(false);
  const g = useMemo(() => galatRopa(k), [k]);
  const tampil = (b: string) => (dicoba ? g[b] : undefined);
  const set = (b: keyof KeadaanRopa) => (e: { target: { value: string } }) => setK({ ...k, [b]: e.target.value });
  const teks = (b: keyof KeadaanRopa, label: string, panjang = false) =>
    panjang
      ? <AreaTeks key={b} id={`ropa-${b}`} label={label} value={k[b]} maxLength={500} onChange={set(b)} aria-invalid={tampil(b) ? true : undefined} />
      : <Isian key={b} id={`ropa-${b}`} label={label} value={k[b]} onChange={set(b)} galat={tampil(b)} autoComplete="off" />;
  const bagianBermasalah = (...kunci: string[]) => !kunci.some((x) => g[x]);

  async function kirim() {
    setDicoba(true);
    if (memproses) return;
    const m = langkahBermasalahRopa(g);
    if (m >= 0) return setIndeks(m);
    setMemproses(true);
    setGalat(null);
    try {
      await simpanRopa(ropa?.id ?? null, k);
      setSelesai(true);
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : R.gagal);
    } finally {
      setMemproses(false);
    }
  }

  const langkah: LangkahModal[] = [
    { id: 'pihak', judul: R.langkah.pihak, selesai: bagianBermasalah('nama_kegiatan', 'sumber_tujuan'), isi: <Kolom><span style={{ color: token.warna.teksRedup }}>{R.pengendali}</span>{teks('nama_kegiatan', R.namaKegiatan)}{teks('ppdp_nama', R.ppdp)}{teks('sumber_tujuan', R.sumberTujuan, true)}</Kolom> },
    {
      id: 'dasar', judul: R.langkah.dasar, selesai: bagianBermasalah('dasar', 'tujuan', 'jenis_data', 'kategori_subjek'),
      isi: <Kolom><Pilihan id="ropa-dasar" label={R.dasar} opsi={OPSI_DASAR} value={k.dasar} onChange={set('dasar')} galat={tampil('dasar')} />{teks('tujuan', R.tujuan, true)}{teks('jenis_data', R.jenisData, true)}{teks('kategori_subjek', R.kategoriSubjek)}</Kolom>,
    },
    { id: 'akses', judul: R.langkah.akses, selesai: bagianBermasalah('pihak_akses', 'pemenuhan_hak', 'aliran'), isi: <Kolom>{teks('pihak_akses', R.pihakAkses, true)}{teks('pemenuhan_hak', R.pemenuhanHak, true)}{teks('aliran', R.aliran, true)}</Kolom> },
    { id: 'retensi', judul: R.langkah.retensi, selesai: bagianBermasalah('masa_retensi', 'pengamanan', 'transfer'), isi: <Kolom>{teks('masa_retensi', R.masaRetensi)}{teks('pengamanan', R.pengamanan, true)}{teks('transfer', R.transfer)}</Kolom> },
    {
      id: 'ringkasan', judul: R.langkah.ringkasan,
      isi: (
        <DaftarRingkasan bagian={[{
          judul: R.judul,
          baris: [
            ['nama_kegiatan', R.namaKegiatan], ['ppdp_nama', R.ppdp], ['sumber_tujuan', R.sumberTujuan], ['dasar', R.dasar], ['tujuan', R.tujuan], ['jenis_data', R.jenisData], ['kategori_subjek', R.kategoriSubjek], ['pihak_akses', R.pihakAkses],
            ['pemenuhan_hak', R.pemenuhanHak], ['aliran', R.aliran], ['masa_retensi', R.masaRetensi], ['pengamanan', R.pengamanan], ['transfer', R.transfer],
          ].map(([b, label]) => ({ label, nilai: (b === 'dasar' ? R.dasarLabel[k.dasar] : k[b as keyof KeadaanRopa]) || '-' })),
        }]} />
      ),
    },
  ];

  return (
    <ModalBertahap
      judul={R.judul} langkah={langkah} indeks={indeks} onIndeks={setIndeks} galat={galat} onTutup={selesai ? onSelesai : onTutup} lindungiTutup={adaPerubahan(awal, k)}
      labelKirim={memproses ? PDP.menyimpan : R.simpan} onKirim={() => void kirim()} kirimNonaktif={memproses}
      hasil={selesai ? { judul: R.hasilJudul, isi: <p style={{ margin: 0 }}>{R.hasilPesan}</p>, aksi: <Tombol type="button" onClick={onSelesai}>{TOMBOL.tutup}</Tombol> } : undefined}
    />
  );
}
