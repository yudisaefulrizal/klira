import { useEffect, useMemo, useState } from 'react';
import { PENUNJANG, TOMBOL } from '@klira/shared';
import type { MasterPemeriksaanDto, TarifLabDto } from '@klira/shared';
import { GalatApi } from '../../api-klien/klien';
import { buatMasterPemeriksaan, tarifLab, ubahMasterPemeriksaan } from '../../api-klien/penunjang';
import { Modal1 } from '../../komponen/modal-1/modal-1';
import { Isian } from '../../komponen/ui/isian';
import { KotakCentang } from '../../komponen/ui/kotak-centang';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Pilihan } from '../../komponen/ui/pilihan';
import { Baris, Kolom } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { adaPerubahan } from '../../util/draf';
import { awalMasterPemeriksaan, bentukMasterPemeriksaan, galatMasterPemeriksaan, perubahanMaster } from './keadaan-master-pemeriksaan';
import type { KeadaanMasterPemeriksaan } from './keadaan-master-pemeriksaan';
import { rupiah } from './keadaan-order-lab';

type Props = { master?: MasterPemeriksaanDto; onTutup: () => void; onSelesai: () => void };

/** Modal Tambah atau ubah Master pemeriksaan (MODAL-1, halaman Penunjang). Nilai disimpan lewat skema bersama; tanpa hapus permanen. */
export function MasterPemeriksaan({ master, onTutup, onSelesai }: Props) {
  const M = PENUNJANG.master;
  const awal = useMemo(() => awalMasterPemeriksaan(master), [master]);
  const [k, setK] = useState<KeadaanMasterPemeriksaan>(awal);
  const [tarif, setTarif] = useState<TarifLabDto[]>([]);
  const [galat, setGalat] = useState<string | null>(null);
  const [dicoba, setDicoba] = useState(false);
  const [memproses, setMemproses] = useState(false);

  useEffect(() => {
    let batal = false;
    tarifLab().then((t) => !batal && setTarif(t)).catch(() => undefined);
    return () => {
      batal = true;
    };
  }, []);

  const g = galatMasterPemeriksaan(k);
  const tampil = (b: string) => (dicoba ? g[b] : undefined);
  const opsiTarif = [{ nilai: '', label: M.tanpaTarif }, ...tarif.map((t) => ({ nilai: String(t.id), label: `${t.nama} (${rupiah(t.harga_umum)})` }))];
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
        <Baris>
          <Isian id="mp-loinc" label={M.bidang.kode_loinc} value={k.kode_loinc} onChange={(e) => ubah({ kode_loinc: e.target.value })} galat={tampil('kode_loinc')} autoComplete="off" />
          <Isian id="mp-spesimen" label={M.bidang.jenis_spesimen} value={k.jenis_spesimen} onChange={(e) => ubah({ jenis_spesimen: e.target.value })} galat={tampil('jenis_spesimen')} autoComplete="off" />
        </Baris>
        <span>{M.petunjukLoinc}</span>
        <Baris>
          <Isian id="mp-satuan" label={M.bidang.satuan} value={k.satuan} onChange={(e) => ubah({ satuan: e.target.value })} galat={tampil('satuan')} autoComplete="off" />
          <Isian id="mp-min" label={M.bidang.rujukan_min} inputMode="decimal" value={k.rujukan_min} onChange={(e) => ubah({ rujukan_min: e.target.value })} galat={tampil('rujukan_min')} autoComplete="off" />
          <Isian id="mp-maks" label={M.bidang.rujukan_maks} inputMode="decimal" value={k.rujukan_maks} onChange={(e) => ubah({ rujukan_maks: e.target.value })} galat={tampil('rujukan_maks')} autoComplete="off" />
        </Baris>
        <Isian id="mp-teks" label={M.bidang.rujukan_teks} value={k.rujukan_teks} onChange={(e) => ubah({ rujukan_teks: e.target.value })} galat={tampil('rujukan_teks')} autoComplete="off" />
        <Pilihan id="mp-tarif" label={M.bidang.tarif_layanan_id} opsi={opsiTarif} value={k.tarif_layanan_id} onChange={(e) => ubah({ tarif_layanan_id: e.target.value })} galat={tampil('tarif_layanan_id')} />
        <KotakCentang id="mp-aktif" label={M.bidang.aktif} checked={k.aktif} onChange={(e) => ubah({ aktif: e.target.checked })} />
      </Kolom>
    </Modal1>
  );
}
