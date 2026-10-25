import { useMemo, useState } from 'react';
import { PDP, TOMBOL } from '@klira/shared';
import { catatHak } from '../../api-klien/pdp';
import { GalatApi } from '../../api-klien/klien';
import { ModalBertahap } from '../../komponen/modal-bertahap/modal-bertahap';
import type { LangkahModal } from '../../komponen/modal-bertahap/modal-bertahap';
import { PemilihPasien } from '../../komponen/pemilih-pasien';
import { AreaTeks } from '../../komponen/ui/area-teks';
import { Isian } from '../../komponen/ui/isian';
import { Pilihan } from '../../komponen/ui/pilihan';
import { DaftarRingkasan, Kolom } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { token } from '../../gaya/token';
import { adaPerubahan } from '../../util/draf';
import { formatWaktu } from '../../util/penyaring-tab';
import { awalHak, bentukHak, galatHak, langkahBermasalahHak } from './keadaan-pdp';
import type { KeadaanHak } from './keadaan-pdp';

const H = PDP.hak;
const opsi = (peta: Record<string, string>, kosong?: string) => [...(kosong ? [{ nilai: '', label: kosong }] : []), ...Object.entries(peta).map(([nilai, label]) => ({ nilai, label }))];

/** Modal Catat permintaan hak pasien (3.3, MODAL-BERTAHAP): Pemohon > Jenis hak > Ringkasan; batas penyelesaian 3x24 jam dihitung dari pencatatan. */
export function CatatHak({ onTutup, onSelesai }: { onTutup: () => void; onSelesai: () => void }) {
  const awal = useMemo(awalHak, []);
  const [k, setK] = useState<KeadaanHak>(awal);
  const [indeks, setIndeks] = useState(0);
  const [dicoba, setDicoba] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [memproses, setMemproses] = useState(false);
  const [batas, setBatas] = useState<string | null>(null);
  const g = useMemo(() => galatHak(k), [k]);
  const tampil = (b: string) => (dicoba ? g[b] : undefined);
  const set = (b: keyof KeadaanHak) => (e: { target: { value: string } }) => setK({ ...k, [b]: e.target.value });

  async function kirim() {
    setDicoba(true);
    if (memproses) return;
    const m = langkahBermasalahHak(g);
    if (m >= 0) return setIndeks(m);
    setMemproses(true);
    setGalat(null);
    try {
      setBatas((await catatHak(bentukHak(k))).batas_waktu);
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : H.gagal);
    } finally {
      setMemproses(false);
    }
  }

  const langkah: LangkahModal[] = [
    {
      id: 'pemohon', judul: H.langkah.pemohon, selesai: !langkahBermasalahHak(g),
      isi: (
        <Kolom>
          <PemilihPasien id="hak-pasien" pasienId={k.pasien_id} onPilih={(id) => setK({ ...k, pasien_id: id })} galat={tampil('pasien_id')} />
          <Isian id="hak-pemohon" label={H.pemohon} value={k.pemohon_nama} onChange={set('pemohon_nama')} galat={tampil('pemohon_nama')} autoComplete="off" />
          <Pilihan id="hak-hubungan" label={H.hubungan} opsi={opsi(H.hubunganLabel)} value={k.pemohon_hubungan} onChange={set('pemohon_hubungan')} galat={tampil('pemohon_hubungan')} />
          <Pilihan id="hak-saluran" label={H.saluran} opsi={opsi(H.saluranLabel)} value={k.saluran} onChange={set('saluran')} galat={tampil('saluran')} />
          <AreaTeks id="hak-verifikasi" label={H.verifikasi} value={k.verifikasi} maxLength={300} onChange={set('verifikasi')} aria-invalid={tampil('verifikasi') ? true : undefined} />
          <span style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{tampil('verifikasi') ?? H.verifikasiPetunjuk}</span>
        </Kolom>
      ),
    },
    {
      id: 'jenis', judul: H.langkah.jenis, selesai: !g.jenis,
      isi: (
        <Kolom>
          <Pilihan id="hak-jenis" label={H.jenis} opsi={opsi(H.hakLabel, '...')} value={k.jenis} onChange={set('jenis')} galat={tampil('jenis')} />
          <AreaTeks id="hak-rincian" label={H.rincian} value={k.rincian} maxLength={1000} onChange={set('rincian')} />
        </Kolom>
      ),
    },
    {
      id: 'ringkasan', judul: H.langkah.ringkasan,
      isi: (
        <DaftarRingkasan bagian={[{
          judul: H.judul,
          baris: [
            { label: H.pemohon, nilai: `${k.pemohon_nama || '-'} (${H.hubunganLabel[k.pemohon_hubungan] ?? '-'})` }, { label: H.saluran, nilai: H.saluranLabel[k.saluran] ?? '-' }, { label: H.verifikasi, nilai: k.verifikasi || '-' },
            { label: H.jenis, nilai: H.hakLabel[k.jenis] ?? '-' }, { label: H.rincian, nilai: k.rincian || '-' },
          ],
        }]} />
      ),
    },
  ];

  return (
    <ModalBertahap
      judul={H.judul} langkah={langkah} indeks={indeks} onIndeks={setIndeks} galat={galat} onTutup={batas ? onSelesai : onTutup} lindungiTutup={adaPerubahan(awal, k)}
      labelKirim={memproses ? H.mencatat : H.ajukan} onKirim={() => void kirim()} kirimNonaktif={memproses}
      hasil={batas ? { judul: H.hasilJudul, isi: <p style={{ margin: 0 }}>{H.hasilPesan(formatWaktu(batas))}</p>, aksi: <Tombol type="button" onClick={onSelesai}>{TOMBOL.tutup}</Tombol> } : undefined}
    />
  );
}
