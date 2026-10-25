import { useEffect, useMemo, useState } from 'react';
import { PENUNJANG, TOMBOL } from '@klira/shared';
import type { HasilBuatOrderDto, MasterPemeriksaanDto } from '@klira/shared';
import { GalatApi } from '../../api-klien/klien';
import { buatOrderLab, daftarMasterPemeriksaan } from '../../api-klien/penunjang';
import { token } from '../../gaya/token';
import { Modal1 } from '../../komponen/modal-1/modal-1';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Daftar, Kolom } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { adaPerubahan } from '../../util/draf';
import { FormOrderLab } from './form-order-lab';
import { KepalaPasien } from './kepala-pasien';
import { awalOrderLab, bentukOrderLab, galatOrderLab, rupiah } from './keadaan-order-lab';
import type { KeadaanOrderLab } from './keadaan-order-lab';

type Props = {
  kunjunganId: number;
  pasien: { id: number; nama: string; nomor_rm: string };
  cara: 'umum' | 'jkn';
  onTutup: () => void;
  /** Dipanggil saat modal ditutup setelah order dipesan (muat ulang daftar). */
  onSelesai: () => void;
};

/**
 * Modal Order lab (3.3, MODAL-1): pemeriksaan, prioritas, catatan. Order dan item tagihannya dibuat bersamaan (biaya lab masuk tagihan
 * saat order). Bentuk draf otomatis tidak dipasang (isian pendek, tidak ada data klinis bebas selain catatan singkat).
 */
export function OrderLab({ kunjunganId, pasien, cara, onTutup, onSelesai }: Props) {
  const awal = useMemo(awalOrderLab, []);
  const [k, setK] = useState<KeadaanOrderLab>(awal);
  const [master, setMaster] = useState<MasterPemeriksaanDto[] | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [dicoba, setDicoba] = useState(false);
  const [memproses, setMemproses] = useState(false);
  const [hasil, setHasil] = useState<HasilBuatOrderDto | null>(null);
  const O = PENUNJANG.order;

  useEffect(() => {
    let batal = false;
    daftarMasterPemeriksaan({ aktif: true })
      .then((m) => !batal && setMaster(m))
      .catch((e) => !batal && setGalat(e instanceof GalatApi ? e.message : PENUNJANG.master.gagalMuat));
    return () => {
      batal = true;
    };
  }, []);

  async function kirim() {
    setDicoba(true);
    if (galatOrderLab(k) || memproses) return;
    setMemproses(true);
    setGalat(null);
    try {
      setHasil(await buatOrderLab(kunjunganId, bentukOrderLab(k)));
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : O.gagal);
    } finally {
      setMemproses(false);
    }
  }

  const kepala = <KepalaPasien nama={pasien.nama} nomorRm={pasien.nomor_rm} />;
  if (hasil) {
    return (
      <Modal1 judul={O.hasilJudul} lebar="modalKecil" konteks={kepala} onTutup={onSelesai} aksi={<Tombol type="button" onClick={onSelesai}>{TOMBOL.tutup}</Tombol>}>
        <p style={{ margin: 0 }}>{O.hasilPesan(hasil.order.length)}</p>
        <Daftar jarak="xs">
          {hasil.order.map((o) => <li key={o.id}>{o.nama}</li>)}
        </Daftar>
        <Kolom jarak="xs">
          <span>{O.tagihanTotal(rupiah(hasil.tagihan.total))}</span>
          {hasil.tagihan.status_tagihan === 'belum_lengkap' && <Peringatan nada="kuning">{O.tagihanBelumLengkap}</Peringatan>}
        </Kolom>
      </Modal1>
    );
  }

  return (
    <Modal1
      judul={PENUNJANG.aksi.order}
      konteks={kepala}
      lindungiTutup={adaPerubahan(awal, k)}
      onTutup={onTutup}
      aksi={
        <>
          <Tombol type="button" varian="sekunder" onClick={onTutup}>{TOMBOL.batal}</Tombol>
          <Tombol type="submit" form="bentuk-order-lab" disabled={memproses || !master}>{memproses ? O.memesan : O.pesan}</Tombol>
        </>
      }
    >
      {galat && <Peringatan>{galat}</Peringatan>}
      {!master && !galat && <span style={{ color: token.warna.teksRedup }}>{PENUNJANG.memuat}</span>}
      {master && (
        <Kolom
          tag="form"
          id="bentuk-order-lab"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void kirim();
          }}
        >
          <FormOrderLab awalan="order-lab" master={master} k={k} onUbah={setK} cara={cara} galat={dicoba ? galatOrderLab(k) : null} />
        </Kolom>
      )}
    </Modal1>
  );
}
