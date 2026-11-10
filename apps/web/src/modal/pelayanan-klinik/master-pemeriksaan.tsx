import { useMemo, useState } from 'react';
import { PENUNJANG, TOMBOL } from '@klira/shared';
import type { MasterPemeriksaanDto } from '@klira/shared';
import { GalatApi } from '../../api-klien/klien';
import { buatMasterPemeriksaan, ubahMasterPemeriksaan } from '../../api-klien/penunjang';
import { Modal1 } from '../../komponen/modal-1/modal-1';
import { PencarianLoinc } from '../../komponen/pencarian-loinc';
import { Isian } from '../../komponen/ui/isian';
import { KotakCentang } from '../../komponen/ui/kotak-centang';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Baris, Kolom } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { adaPerubahan } from '../../util/draf';
import { awalMasterPemeriksaan, bentukMasterPemeriksaan, galatMasterPemeriksaan, perubahanMaster } from './keadaan-master-pemeriksaan';
import type { KeadaanMasterPemeriksaan } from './keadaan-master-pemeriksaan';

type Props = { master?: MasterPemeriksaanDto; onTutup: () => void; onSelesai: () => void };

/** Modal Tambah atau ubah Master pemeriksaan (MODAL-1, halaman Penunjang). Nilai disimpan lewat skema bersama; tanpa hapus permanen. */
export function MasterPemeriksaan({ master, onTutup, onSelesai }: Props) {
  const M = PENUNJANG.master;
  const awal = useMemo(() => awalMasterPemeriksaan(master), [master]);
  const [k, setK] = useState<KeadaanMasterPemeriksaan>(awal);
  const [galat, setGalat] = useState<string | null>(null);
  const [dicoba, setDicoba] = useState(false);
  const [memproses, setMemproses] = useState(false);

  const g = galatMasterPemeriksaan(k);
  const tampil = (b: string) => (dicoba ? g[b] : undefined);
  const ubah = (p: Partial<KeadaanMasterPemeriksaan>) => setK({ ...k, ...p });

  async function simpan() {
    setDicoba(true);
    if (Object.keys(g).length || memproses) return;
    setMemproses(true);
    setGalat(null);
    try {
      if (master) await ubahMasterPemeriksaan(master.id, perubahanMaster(awal, k));
      else await buatMasterPemeriksaan(bentukMasterPemeriksaan(k));
      onSelesai();
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : PENUNJANG.master.gagalMuat);
    } finally {
      setMemproses(false);
    }
  }

  return (
    <Modal1
      judul={master ? M.judulUbah : M.judulTambah}
      lindungiTutup={adaPerubahan(awal, k)}
      onTutup={onTutup}
      aksi={
        <>
          <Tombol type="button" varian="sekunder" onClick={onTutup}>{TOMBOL.batal}</Tombol>
          <Tombol type="submit" form="bentuk-master-pemeriksaan" disabled={memproses}>{memproses ? PENUNJANG.order.memesan : TOMBOL.simpan}</Tombol>
        </>
      }
    >
      {galat && <Peringatan>{galat}</Peringatan>}
      <Kolom tag="form" id="bentuk-master-pemeriksaan" noValidate onSubmit={(e) => { e.preventDefault(); void simpan(); }}>
        <Baris>
          <Isian id="mp-kode" label={M.bidang.kode} value={k.kode} onChange={(e) => ubah({ kode: e.target.value })} galat={tampil('kode')} autoComplete="off" />
          <Isian id="mp-nama" label={M.bidang.nama} value={k.nama} onChange={(e) => ubah({ nama: e.target.value })} galat={tampil('nama')} autoComplete="off" />
        </Baris>
        <PencarianLoinc id="mp-loinc" label={M.bidang.kode_loinc} petunjuk={M.petunjuk.kode_loinc} value={k.kode_loinc} onChange={(kode) => ubah({ kode_loinc: kode })} galat={tampil('kode_loinc')} />
        <Baris>
          <Isian id="mp-spesimen" label={M.bidang.jenis_spesimen} value={k.jenis_spesimen} onChange={(e) => ubah({ jenis_spesimen: e.target.value })} galat={tampil('jenis_spesimen')} autoComplete="off" />
          <Isian id="mp-satuan" label={M.bidang.satuan} petunjuk={M.petunjuk.satuan} value={k.satuan} onChange={(e) => ubah({ satuan: e.target.value })} galat={tampil('satuan')} autoComplete="off" />
        </Baris>
        <Baris>
          <Isian id="mp-min" label={M.bidang.rujukan_min} petunjuk={M.petunjuk.rujukan_min} inputMode="decimal" value={k.rujukan_min} onChange={(e) => ubah({ rujukan_min: e.target.value })} galat={tampil('rujukan_min')} autoComplete="off" />
          <Isian id="mp-maks" label={M.bidang.rujukan_maks} inputMode="decimal" value={k.rujukan_maks} onChange={(e) => ubah({ rujukan_maks: e.target.value })} galat={tampil('rujukan_maks')} autoComplete="off" />
        </Baris>
        <Isian id="mp-teks" label={M.bidang.rujukan_teks} value={k.rujukan_teks} onChange={(e) => ubah({ rujukan_teks: e.target.value })} galat={tampil('rujukan_teks')} autoComplete="off" />
        <Baris>
          <Isian id="mp-harga" label={M.bidang.harga_umum} petunjuk={M.petunjuk.harga_umum} inputMode="numeric" value={k.harga_umum} onChange={(e) => ubah({ harga_umum: e.target.value })} galat={tampil('harga_umum')} autoComplete="off" />
          <Isian id="mp-harga-jkn" label={M.bidang.harga_jkn} petunjuk={M.petunjuk.harga_jkn} inputMode="numeric" value={k.harga_jkn} onChange={(e) => ubah({ harga_jkn: e.target.value })} galat={tampil('harga_jkn')} autoComplete="off" />
        </Baris>
        <KotakCentang id="mp-aktif" label={M.bidang.aktif} checked={k.aktif} onChange={(e) => ubah({ aktif: e.target.checked })} />
      </Kolom>
    </Modal1>
  );
}
