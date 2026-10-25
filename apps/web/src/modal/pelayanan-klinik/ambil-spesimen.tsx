import { useEffect, useMemo, useRef, useState } from 'react';
import { PENUNJANG, PRIORITAS_ORDER, TOMBOL } from '@klira/shared';
import type { OrderPenunjangDto } from '@klira/shared';
import { GalatApi } from '../../api-klien/klien';
import { ambilSpesimen, ordersKunjungan } from '../../api-klien/penunjang';
import { token } from '../../gaya/token';
import { Modal1 } from '../../komponen/modal-1/modal-1';
import { Isian } from '../../komponen/ui/isian';
import { KotakCentang } from '../../komponen/ui/kotak-centang';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Baris, Kolom } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { adaPerubahan } from '../../util/draf';
import { usePengguna } from '../../util/konteks-pengguna';
import { KepalaPasien } from './kepala-pasien';
import { awalSpesimen, bentukSpesimen, galatSpesimen, gantiOrderSpesimen, menungguSpesimen } from './keadaan-spesimen';
import type { KeadaanSpesimen } from './keadaan-spesimen';

type Props = {
  kunjunganId: number;
  pasien: { id: number; nama: string; nomor_rm: string };
  onTutup: () => void;
  /** Dipanggil saat modal ditutup setelah ada spesimen yang dicatat (muat ulang daftar). */
  onSelesai: () => void;
};

/**
 * Modal Ambil spesimen (3.3, MODAL-1): spesimen (satu pengambilan untuk beberapa pemeriksaan), waktu, petugas. Order bergerak dari dipesan ke
 * spesimen diambil (maju saja). Petugas adalah pengguna yang mencatat.
 */
export function AmbilSpesimen({ kunjunganId, pasien, onTutup, onSelesai }: Props) {
  const { pengguna } = usePengguna();
  const S = PENUNJANG.spesimen;
  const [orders, setOrders] = useState<OrderPenunjangDto[] | null>(null);
  const [k, setK] = useState<KeadaanSpesimen | null>(null);
  const [awal, setAwal] = useState<KeadaanSpesimen | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [dicoba, setDicoba] = useState(false);
  const [memproses, setMemproses] = useState(false);
  const [dicatat, setDicatat] = useState<number | null>(null);
  const adaTercatat = useRef(false);

  useEffect(() => {
    let batal = false;
    ordersKunjungan(kunjunganId)
      .then((o) => {
        if (batal) return;
        const a = awalSpesimen(o);
        setOrders(o);
        setAwal(a);
        setK(a);
      })
      .catch((e) => !batal && setGalat(e instanceof GalatApi ? e.message : PENUNJANG.order.gagalMuat));
    return () => {
      batal = true;
    };
  }, [kunjunganId]);

  const menunggu = useMemo(() => (orders ? menungguSpesimen(orders) : []), [orders]);
  const g = k ? galatSpesimen(k) : {};
  const tampil = (b: string) => (dicoba ? g[b] : undefined);

  async function kirim() {
    if (!k || !orders) return;
    setDicoba(true);
    if (Object.keys(g).length || memproses) return;
    setMemproses(true);
    setGalat(null);
    let selesai = 0;
    try {
      for (const id of k.terpilih) {
        await ambilSpesimen(id, bentukSpesimen(k));
        selesai += 1;
        adaTercatat.current = true;
      }
      setDicatat(selesai);
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : S.gagal);
      // sebagian order mungkin sudah dicatat: muat ulang agar yang tersisa benar
      void ordersKunjungan(kunjunganId).then((o) => {
        setOrders(o);
        setK((lama) => (lama ? { ...awalSpesimen(o), asal: lama.asal, waktu: lama.waktu } : lama));
      }).catch(() => undefined);
    } finally {
      setMemproses(false);
    }
  }

  const tutup = () => (adaTercatat.current ? onSelesai() : onTutup());
  const kepala = <KepalaPasien nama={pasien.nama} nomorRm={pasien.nomor_rm} />;
  if (dicatat !== null) {
    return (
      <Modal1 judul={S.judul} lebar="modalKecil" konteks={kepala} onTutup={onSelesai} aksi={<Tombol type="button" onClick={onSelesai}>{TOMBOL.tutup}</Tombol>}>
        <p style={{ margin: 0 }}>{S.tersimpan(dicatat)}</p>
      </Modal1>
    );
  }

  return (
    <Modal1
      judul={S.judul}
      konteks={kepala}
      lindungiTutup={!!k && !!awal && adaPerubahan(awal, k)}
      onTutup={tutup}
      aksi={
        <>
          <Tombol type="button" varian="sekunder" onClick={tutup}>{TOMBOL.batal}</Tombol>
          <Tombol type="submit" form="bentuk-spesimen" disabled={memproses || !menunggu.length}>{memproses ? S.menyimpan : S.simpan}</Tombol>
        </>
      }
    >
      {galat && <Peringatan>{galat}</Peringatan>}
      {!orders && !galat && <span style={{ color: token.warna.teksRedup }}>{PENUNJANG.memuat}</span>}
      {orders && !menunggu.length && <Peringatan nada="biru">{S.kosong}</Peringatan>}
      {orders && k && menunggu.length > 0 && (
        <Kolom
          tag="form"
          id="bentuk-spesimen"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void kirim();
          }}
        >
          <Kolom jarak="xs" role="group" aria-label={S.pilihOrder}>
            <span style={{ fontWeight: token.huruf.berat.sedang }}>{S.pilihOrder}</span>
            {menunggu.map((o) => (
              <KotakCentang
                key={o.id} id={`spesimen-${o.id}`} label={o.nama} keterangan={[PRIORITAS_ORDER.label(o.prioritas), o.jenis_spesimen].filter(Boolean).join(' · ')}
                checked={k.terpilih.includes(o.id)} onChange={() => setK(gantiOrderSpesimen(k, orders, o.id))}
              />
            ))}
            {tampil('terpilih') && <Peringatan>{g.terpilih}</Peringatan>}
          </Kolom>
          <Isian id="spesimen-asal" label={S.asal} value={k.asal} onChange={(e) => setK({ ...k, asal: e.target.value })} galat={tampil('asal')} autoComplete="off" />
          <span style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{S.asalPetunjuk}</span>
          <Baris>
            <Isian id="spesimen-waktu" label={S.waktu} type="datetime-local" value={k.waktu} onChange={(e) => setK({ ...k, waktu: e.target.value })} galat={tampil('waktu')} />
            <Isian id="spesimen-petugas" label={S.petugas} value={pengguna ? `${pengguna.nama} (${S.petugasSaya})` : S.petugasSaya} readOnly />
          </Baris>
        </Kolom>
      )}
    </Modal1>
  );
}
