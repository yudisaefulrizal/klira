import { useCallback, useEffect, useMemo, useState } from 'react';
import { PENUNJANG } from '@klira/shared';
import type { MasterPemeriksaanDto, OrderPenunjangDto } from '@klira/shared';
import { GalatApi } from '../../api-klien/klien';
import { buatOrderLab, daftarMasterPemeriksaan, ordersKunjungan } from '../../api-klien/penunjang';
import { token } from '../../gaya/token';
import { useIzin } from '../../komponen/izin-saja';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Kolom, Sebaris } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { DaftarOrderLab } from './daftar-order-lab';
import { FormOrderLab } from './form-order-lab';
import { awalOrderLab, bentukOrderLab, galatOrderLab, rupiah } from './keadaan-order-lab';
import type { KeadaanOrderLab } from './keadaan-order-lab';

type Props = {
  kunjunganId: number;
  cara: 'umum' | 'jkn';
  /** Dipanggil setelah order baru dipesan (induk menandai ada perubahan agar daftar dimuat ulang saat ditutup). */
  onOrderDipesan: () => void;
};

/**
 * Langkah Order penunjang di Pemeriksaan klinis: order lab kunjungan ini (status dan hasil) dan formulir Order lab yang sama dengan modalnya.
 * Order tersimpan langsung ke server (bukan bagian catatan yang disahkan), sehingga tidak menunggu tombol Simpan pemeriksaan.
 */
export function LangkahPenunjang({ kunjunganId, cara, onOrderDipesan }: Props) {
  const boleh = useIzin();
  const bolehPesan = boleh('klinis', 'input');
  const O = PENUNJANG.order;
  const [orders, setOrders] = useState<OrderPenunjangDto[] | null>(null);
  const [master, setMaster] = useState<MasterPemeriksaanDto[] | null>(null);
  const [k, setK] = useState<KeadaanOrderLab>(awalOrderLab);
  const [galat, setGalat] = useState<string | null>(null);
  const [dicoba, setDicoba] = useState(false);
  const [memproses, setMemproses] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  const muat = useCallback(() => ordersKunjungan(kunjunganId).then(setOrders), [kunjunganId]);
  useEffect(() => {
    let batal = false;
    Promise.all([ordersKunjungan(kunjunganId), bolehPesan ? daftarMasterPemeriksaan({ aktif: true }) : Promise.resolve([] as MasterPemeriksaanDto[])])
      .then(([o, m]) => {
        if (batal) return;
        setOrders(o);
        setMaster(m);
      })
      .catch((e) => !batal && setGalat(e instanceof GalatApi ? e.message : O.gagalMuat));
    return () => {
      batal = true;
    };
  }, [kunjunganId, bolehPesan, O.gagalMuat]);

  const pesan = useMemo(
    () => async () => {
      setDicoba(true);
      if (galatOrderLab(k) || memproses) return;
      setMemproses(true);
      setGalat(null);
      setInfo(null);
      try {
        const h = await buatOrderLab(kunjunganId, bentukOrderLab(k));
        setInfo(`${O.hasilPesan(h.order.length)} ${O.tagihanTotal(rupiah(h.tagihan.total))}`);
        setK(awalOrderLab());
        setDicoba(false);
        onOrderDipesan();
        await muat();
      } catch (e) {
        setGalat(e instanceof GalatApi ? e.message : O.gagal);
      } finally {
        setMemproses(false);
      }
    },
    [k, memproses, kunjunganId, onOrderDipesan, muat, O],
  );

  return (
    <Kolom>
      <p style={{ margin: 0, color: token.warna.teksRedup }}>{O.langkahPetunjuk}</p>
      {galat && <Peringatan>{galat}</Peringatan>}
      {info && <Peringatan nada="biru">{info}</Peringatan>}
      <Kolom jarak="sm">
        <Sebaris>
          <h4 style={{ margin: 0, fontSize: token.huruf.ukuran.besar, fontWeight: token.huruf.berat.tebal }}>{O.daftarJudul}</h4>
        </Sebaris>
        {!orders && !galat && <span style={{ color: token.warna.teksRedup }}>{PENUNJANG.memuat}</span>}
        {orders?.length === 0 && <span style={{ color: token.warna.teksRedup }}>{O.kosong}</span>}
        {orders && orders.length > 0 && (
          <>
            <span style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{O.hasilSebelumSah}</span>
            <DaftarOrderLab orders={orders} />
          </>
        )}
      </Kolom>
      {bolehPesan && master && (
        <Kolom tag="section" aria-label={PENUNJANG.aksi.order}>
          <FormOrderLab awalan="langkah-lab" master={master} k={k} onUbah={setK} cara={cara} galat={dicoba ? galatOrderLab(k) : null} />
          <div>
            <Tombol type="button" disabled={memproses} onClick={() => void pesan()}>{memproses ? O.memesan : O.pesan}</Tombol>
          </div>
        </Kolom>
      )}
    </Kolom>
  );
}
