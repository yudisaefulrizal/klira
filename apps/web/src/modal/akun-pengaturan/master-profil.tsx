import { useEffect, useMemo, useState } from 'react';
import { MASTER } from '@klira/shared';
import type { BarisMaster, BidangMaster, JenisMasterUbah, OpsiMasterDto, SumberOpsiMaster } from '@klira/shared';
import { buatMaster, opsiMaster, ubahMaster } from '../../api-klien/master';
import { GalatApi } from '../../api-klien/klien';
import { Kisi } from '../../komponen/ui/susunan';
import { Modal1 } from '../../komponen/modal-1/modal-1';
import { Isian } from '../../komponen/ui/isian';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Pilihan } from '../../komponen/ui/pilihan';
import { Tombol } from '../../komponen/ui/tombol';
import { awalMaster, bentukMasukan, bidangTampil, galatMaster, masterBerubah, opsiDenganNilaiSaatIni } from './keadaan-master';
import type { NilaiMaster } from './keadaan-master';

type Props = {
  jenis: JenisMasterUbah;
  /** Tanpa `baris` = tambah; dengan `baris` = ubah. */
  baris?: BarisMaster;
  onTutup: () => void;
  /** Dipanggil setelah tersimpan (daftar dimuat ulang). */
  onSelesai: () => void;
};

const JENIS_ISIAN = { teks: 'text', angka: 'number', tanggal: 'date', waktu: 'time' } as const;

/**
 * Modal Tambah atau ubah master/profil (3.3, MODAL-1): satu bentuk generik; bidangnya dari definisi per jenis di
 * packages/shared (poli, ruang, bed, praktisi/SIP, jadwal praktik, tarif) dan divalidasi dengan skema Zod bersama.
 */
export function ModalMasterProfil({ jenis, baris, onTutup, onSelesai }: Props) {
  const ubah = baris !== undefined;
  const bidang = useMemo(() => bidangTampil(jenis, ubah), [jenis, ubah]);
  const awal = useMemo(() => awalMaster(jenis, baris), [jenis, baris]);
  const [nilai, setNilai] = useState<NilaiMaster>(awal);
  const [opsi, setOpsi] = useState<Partial<Record<SumberOpsiMaster, OpsiMasterDto[]>>>({});
  const [galat, setGalat] = useState<string | null>(null);
  const [dicoba, setDicoba] = useState(false);
  const [memproses, setMemproses] = useState(false);
  const judulJenis = MASTER.jenis[jenis];

  useEffect(() => {
    let batal = false;
    const sumber = [...new Set(bidang.flatMap((b) => (b.rujukan ? [b.rujukan] : [])))];
    sumber.forEach((s) => {
      opsiMaster(s)
        .then((o) => !batal && setOpsi((lama) => ({ ...lama, [s]: o })))
        .catch((e) => !batal && setGalat(e instanceof GalatApi ? e.message : MASTER.gagalMuatPilihan));
    });
    return () => {
      batal = true;
    };
  }, [bidang]);

  const galatBidang = galatMaster(jenis, nilai, ubah);
  const berubah = masterBerubah(awal, nilai);
  const siap = !Object.keys(galatBidang).length && (!ubah || berubah) && !memproses;

  async function simpan() {
    setDicoba(true);
    if (!siap) return;
    setMemproses(true);
    setGalat(null);
    try {
      const masukan = bentukMasukan(jenis, nilai, ubah);
      if (baris) await ubahMaster(jenis, baris.id, masukan);
      else await buatMaster(jenis, masukan);
      onSelesai();
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : MASTER.gagalSimpan);
      setMemproses(false);
    }
  }

  const atur = (kunci: string, v: string) => setNilai({ ...nilai, [kunci]: v });

  function kontrol(b: BidangMaster) {
    const id = `master-${b.kunci}`;
    const tampilGalat = dicoba ? galatBidang[b.kunci] : undefined;
    if (b.tipe === 'pilihan' || b.tipe === 'rujukan') {
      const dasar = b.tipe === 'pilihan' ? [...(b.opsi ?? [])] : opsiDenganNilaiSaatIni(opsi[b.rujukan as SumberOpsiMaster] ?? [], b.kunci, baris);
      const semua = b.tipe === 'rujukan' ? [{ nilai: '', label: b.wajib ? MASTER.pilih : MASTER.tanpaPilihan }, ...dasar] : dasar;
      return <Pilihan key={b.kunci} id={id} label={b.label} value={nilai[b.kunci] ?? ''} opsi={semua} onChange={(e) => atur(b.kunci, e.target.value)} galat={tampilGalat} aria-required={b.wajib} />;
    }
    return (
      <Isian
        key={b.kunci} id={id} label={b.label} type={JENIS_ISIAN[b.tipe]} value={nilai[b.kunci] ?? ''} maxLength={b.maks}
        {...(b.tipe === 'angka' ? { min: 0, step: 1, inputMode: 'numeric' as const } : {})}
        onChange={(e) => atur(b.kunci, e.target.value)} galat={tampilGalat} aria-required={b.wajib}
      />
    );
  }

  return (
    <Modal1
      judul={ubah ? MASTER.judulUbah(judulJenis) : MASTER.judulTambah(judulJenis)}
      lebar="modalSedang"
      lindungiTutup={berubah}
      onTutup={onTutup}
      aksi={
        <>
          <Tombol type="button" varian="sekunder" onClick={onTutup}>{MASTER.batal}</Tombol>
          <Tombol type="submit" form="bentuk-master" disabled={memproses || (ubah && !berubah)}>{memproses ? MASTER.menyimpan : MASTER.simpan}</Tombol>
        </>
      }
    >
      {galat && <Peringatan>{galat}</Peringatan>}
      <Kisi
        tag="form"
        kolom="1fr 1fr"
        id="bentuk-master"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void simpan();
        }}
      >
        {bidang.map(kontrol)}
      </Kisi>
    </Modal1>
  );
}
