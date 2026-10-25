import { useMemo, useState } from 'react';
import { REKAM_MEDIS, TOMBOL } from '@klira/shared';
import { catatPenyampaian } from '../../api-klien/dokumen-rm';
import { GalatApi } from '../../api-klien/klien';
import { token } from '../../gaya/token';
import { Modal1 } from '../../komponen/modal-1/modal-1';
import { PemilihPasien } from '../../komponen/pemilih-pasien';
import { AreaTeks } from '../../komponen/ui/area-teks';
import { Isian } from '../../komponen/ui/isian';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Pilihan } from '../../komponen/ui/pilihan';
import { Kolom } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { adaPerubahan } from '../../util/draf';
import { awalPenyampaian, bentukPenyampaian, galatPenyampaian } from './keadaan-dokumen';
import type { KeadaanPenyampaian } from './keadaan-dokumen';

type Props = { onTutup: () => void; onSelesai: () => void };
const P = REKAM_MEDIS.dok.penyampaian;
const opsi = (peta: Record<string, string>) => Object.entries(peta).map(([nilai, label]) => ({ nilai, label }));

/** Modal Penyampaian rekam medis (3.3, MODAL-1, 4.4): mencatat siapa menerima, dalam bentuk apa; keluarga dan pihak lain wajib bukti persetujuan pasien. */
export function PenyampaianRm({ onTutup, onSelesai }: Props) {
  const awal = useMemo(awalPenyampaian, []);
  const [k, setK] = useState<KeadaanPenyampaian>(awal);
  const [dicoba, setDicoba] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [memproses, setMemproses] = useState(false);
  const g = useMemo(() => galatPenyampaian(k), [k]);
  const tampil = (b: string) => (dicoba ? g[b] : undefined);
  const butuhBukti = k.hubungan === 'keluarga' || k.hubungan === 'pihak_lain';

  async function simpan() {
    setDicoba(true);
    if (Object.keys(g).length || memproses) return;
    setMemproses(true);
    setGalat(null);
    try {
      await catatPenyampaian(bentukPenyampaian(k));
      onSelesai();
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : P.gagal);
    } finally {
      setMemproses(false);
    }
  }

  return (
    <Modal1
      judul={P.judul} lindungiTutup={adaPerubahan(awal, k)} onTutup={onTutup}
      aksi={<><Tombol type="button" varian="sekunder" onClick={onTutup}>{TOMBOL.batal}</Tombol><Tombol type="submit" form="bentuk-penyampaian" disabled={memproses}>{memproses ? P.menyimpan : P.simpan}</Tombol></>}
    >
      {galat && <Peringatan>{galat}</Peringatan>}
      <Kolom tag="form" id="bentuk-penyampaian" noValidate onSubmit={(e) => { e.preventDefault(); void simpan(); }}>
        <PemilihPasien id="py-pasien" pasienId={k.pasien_id} onPilih={(id) => setK({ ...k, pasien_id: id })} galat={tampil('pasien_id')} />
        <Isian id="py-penerima" label={P.penerima} value={k.penerima_nama} onChange={(e) => setK({ ...k, penerima_nama: e.target.value })} galat={tampil('penerima_nama')} autoComplete="off" />
        <Pilihan id="py-hubungan" label={P.hubungan} opsi={opsi(P.hubunganLabel)} value={k.hubungan} onChange={(e) => setK({ ...k, hubungan: e.target.value as KeadaanPenyampaian['hubungan'] })} />
        <Pilihan id="py-bentuk" label={P.bentuk} opsi={opsi(P.bentukLabel)} value={k.bentuk} onChange={(e) => setK({ ...k, bentuk: e.target.value as KeadaanPenyampaian['bentuk'] })} />
        {butuhBukti && <Isian id="py-bukti" label={P.bukti} value={k.bukti_persetujuan} onChange={(e) => setK({ ...k, bukti_persetujuan: e.target.value })} galat={tampil('bukti_persetujuan')} autoComplete="off" />}
        {butuhBukti && !tampil('bukti_persetujuan') && <span style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{P.buktiPetunjuk}</span>}
        <AreaTeks id="py-catatan" label={P.catatan} value={k.catatan} maxLength={500} onChange={(e) => setK({ ...k, catatan: e.target.value })} />
      </Kolom>
    </Modal1>
  );
}
