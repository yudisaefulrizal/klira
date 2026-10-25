import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GALAT, INTERPRETASI_HASIL, MODAL, PENUNJANG, TOMBOL } from '@klira/shared';
import type { OrderPenunjangDto } from '@klira/shared';
import { adaptorDrafServer } from '../../api-klien/draf-klinis';
import { GalatApi } from '../../api-klien/klien';
import { isiHasilLab, ordersKunjungan, validasiHasilLab } from '../../api-klien/penunjang';
import { token } from '../../gaya/token';
import { ModalBertahap } from '../../komponen/modal-bertahap/modal-bertahap';
import type { LangkahModal } from '../../komponen/modal-bertahap/modal-bertahap';
import { Bingkai } from '../../komponen/ui/kartu';
import { Isian } from '../../komponen/ui/isian';
import { KotakCentang } from '../../komponen/ui/kotak-centang';
import { Lencana } from '../../komponen/ui/lencana';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Pilihan } from '../../komponen/ui/pilihan';
import { Daftar, Kolom, Sebaris, Tumbuh } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { adaPerubahan } from '../../util/draf';
import { useDrafOtomatis } from '../../util/draf-otomatis';
import { KepalaPasien } from './kepala-pasien';
import {
  awalHasilLab, galatHasilLab, langkahBermasalahHasil, menungguHasil, pulihkanHasilLab, rencanaHasil, saranUntuk, terapkanSaran, ubahIsian,
} from './keadaan-hasil-lab';
import type { KeadaanHasilLab } from './keadaan-hasil-lab';

export const ALUR_HASIL_LAB = 'hasil-lab';
const OPSI_INTERPRETASI = [{ nilai: '', label: PENUNJANG.hasil.pilihInterpretasi }, ...INTERPRETASI_HASIL.nilai.map((n) => ({ nilai: n, label: INTERPRETASI_HASIL.label(n) }))];
const redup = { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil } as const;

type Props = {
  kunjunganId: number;
  pasien: { id: number; nama: string; nomor_rm: string };
  onTutup: () => void;
  /** Dipanggil saat modal ditutup setelah ada hasil yang tersimpan (muat ulang daftar). */
  onSelesai: () => void;
};

type Ringkas = { disimpan: number; divalidasi: number; addendum: number };

/**
 * Modal Hasil lab (3.3, MODAL-BERTAHAP): Hasil > Interpretasi > Validasi. Nilai diisi per pemeriksaan, interpretasi dipilih (saran dari rentang
 * rujukan), lalu hasil disimpan dan divalidasi (pengesahan atas nama analis). Hasil yang divalidasi setelah catatan disahkan menjadi addendum di
 * server. Draf otomatis disimpan di server per pengguna dan kunjungan.
 */
export function HasilLab({ kunjunganId, pasien, onTutup, onSelesai }: Props) {
  const H = PENUNJANG.hasil;
  const adaptor = useMemo(() => adaptorDrafServer<KeadaanHasilLab>(kunjunganId, ALUR_HASIL_LAB), [kunjunganId]);
  const [orders, setOrders] = useState<OrderPenunjangDto[] | null>(null);
  const [galatMuat, setGalatMuat] = useState<string | null>(null);
  const [k, setK] = useState<KeadaanHasilLab>(() => awalHasilLab([]));
  const [indeks, setIndeks] = useState(0);
  const [galat, setGalat] = useState<string | null>(null);
  const [memproses, setMemproses] = useState(false);
  const [formSiap, setFormSiap] = useState(false);
  const [drafDipulihkan, setDrafDipulihkan] = useState(false);
  const [hasil, setHasil] = useState<Ringkas | null>(null);
  const adaTersimpan = useRef(false);

  const awal = useMemo(() => awalHasilLab(orders ?? []), [orders]);
  const { pulihan, siap: drafSiap, hapus, buang } = useDrafOtomatis<KeadaanHasilLab>({ adaptor, nilai: k, awal, langkah: indeks, aktif: formSiap && !hasil });

  useEffect(() => {
    let batal = false;
    ordersKunjungan(kunjunganId)
      .then((o) => !batal && setOrders(o))
      .catch((e) => !batal && setGalatMuat(e instanceof GalatApi ? e.message : PENUNJANG.order.gagalMuat));
    return () => {
      batal = true;
    };
  }, [kunjunganId]);

  // Setelah order dan draf server sama-sama terbaca: draf menimpa isian awal, sekali saja.
  useEffect(() => {
    if (!orders || !drafSiap || formSiap) return;
    if (pulihan) {
      setK(pulihkanHasilLab(awal, pulihan.nilai));
      setIndeks(Math.min(pulihan.langkah, 2));
      setDrafDipulihkan(true);
    } else setK(awal);
    setFormSiap(true);
  }, [orders, drafSiap, formSiap, pulihan, awal]);

  const menunggu = useMemo(() => (orders ? menungguHasil(orders) : []), [orders]);
  const galatPer = useMemo(() => (orders ? galatHasilLab(k, orders) : {}), [k, orders]);
  const rencana = useMemo(() => (orders ? rencanaHasil(k, orders) : []), [k, orders]);
  const ubah = useCallback((bidang: 'nilai' | 'interpretasi' | 'catatan', id: number, v: string) => setK((lama) => ubahIsian(lama, bidang, id, v)), []);

  const pindah = (n: number) => {
    if (orders && n >= 1 && indeks === 0) setK((lama) => terapkanSaran(lama, orders));
    setIndeks(n);
  };

  async function kirim() {
    if (!orders || memproses) return;
    const masalah = langkahBermasalahHasil(k, orders);
    if (masalah >= 0) {
      setGalat(masalah === 0 ? H.langkahSebelumnya : (Object.values(galatPer)[0] ?? H.langkahSebelumnya));
      setIndeks(masalah);
      return;
    }
    setGalat(null);
    setMemproses(true);
    const r: Ringkas = { disimpan: 0, divalidasi: 0, addendum: 0 };
    let berjalan = '';
    try {
      for (const x of rencana) {
        berjalan = x.order.nama;
        await isiHasilLab(x.order.id, { nilai: x.nilai, interpretasi: x.interpretasi, catatan: x.catatan });
        r.disimpan += 1;
        adaTersimpan.current = true;
        if (k.validasi) {
          const v = await validasiHasilLab(x.order.id);
          r.divalidasi += 1;
          if (v.addendum.length) r.addendum += 1;
        }
      }
      hapus();
      setHasil(r);
    } catch (e) {
      const pesan = e instanceof GalatApi ? e.message : GALAT.umum;
      setGalat(`${H.gagalSebagian(berjalan)} ${pesan}`);
      void ordersKunjungan(kunjunganId).then(setOrders).catch(() => undefined);
    } finally {
      setMemproses(false);
    }
  }

  const tampilOrder = (o: OrderPenunjangDto, isi: React.ReactNode) => (
    <Bingkai key={o.id} arah="kolom" padding="md">
      <Sebaris bungkus>
        <strong>{o.nama}</strong>
        <Tumbuh />
        <span style={redup}>{o.rujukan_teks ? `${H.rujukan}: ${o.rujukan_teks}` : H.rujukanTidakAda}</span>
      </Sebaris>
      {isi}
    </Bingkai>
  );

  const langkahHasil = (
    <Kolom>
      <p style={{ margin: 0, color: token.warna.teksRedup }}>{H.petunjukHasil}</p>
      {menunggu.map((o) =>
        tampilOrder(
          o,
          <Isian
            id={`hasil-nilai-${o.id}`} label={o.satuan ? `${H.nilai} (${o.satuan})` : H.nilai} value={k.nilai[o.id] ?? ''} maxLength={200} autoComplete="off"
            onChange={(e) => ubah('nilai', o.id, e.target.value)}
          />,
        ),
      )}
    </Kolom>
  );

  const langkahInterpretasi = (
    <Kolom>
      <p style={{ margin: 0, color: token.warna.teksRedup }}>{H.petunjukInterpretasi}</p>
      {menunggu.map((o) => {
        const nilai = (k.nilai[o.id] ?? '').trim();
        if (!nilai) return tampilOrder(o, <span style={redup}>{H.belumDiisi}</span>);
        const saran = saranUntuk(o, nilai);
        return tampilOrder(
          o,
          <Kolom jarak="sm">
            <span>{`${H.nilai}: ${nilai}${o.satuan ? ` ${o.satuan}` : ''}`}</span>
            <Pilihan id={`hasil-interpretasi-${o.id}`} label={H.interpretasi} value={k.interpretasi[o.id] ?? ''} opsi={OPSI_INTERPRETASI} galat={galatPer[o.id]} onChange={(e) => ubah('interpretasi', o.id, e.target.value)} />
            {saran && <span style={redup}>{H.saran(INTERPRETASI_HASIL.label(saran))}</span>}
            <Isian id={`hasil-catatan-${o.id}`} label={H.catatan} value={k.catatan[o.id] ?? ''} maxLength={1000} autoComplete="off" onChange={(e) => ubah('catatan', o.id, e.target.value)} />
          </Kolom>,
        );
      })}
    </Kolom>
  );

  const langkahValidasi = (
    <Kolom>
      <p style={{ margin: 0 }}>{H.petunjukValidasi}</p>
      <strong>{H.ringkasanHasil}</strong>
      {rencana.length === 0 && <Peringatan nada="kuning">{H.ringkasanKosong}</Peringatan>}
      <Daftar jarak="xs">
        {rencana.map((x) => (
          <Sebaris tag="li" jarak="md" bungkus key={x.order.id}>
            <Tumbuh>{x.order.nama}</Tumbuh>
            <strong>{`${x.nilai}${x.order.satuan ? ` ${x.order.satuan}` : ''}`}</strong>
            <Lencana warna={INTERPRETASI_HASIL.warna(x.interpretasi)}>{INTERPRETASI_HASIL.label(x.interpretasi)}</Lencana>
          </Sebaris>
        ))}
      </Daftar>
      <KotakCentang id="hasil-validasi" label={H.validasiSekarang} keterangan={H.validasiKet} checked={k.validasi} onChange={(e) => setK({ ...k, validasi: e.target.checked })} />
      <Peringatan nada="biru">{H.addendumInfo}</Peringatan>
    </Kolom>
  );

  const kosong = orders && menunggu.length === 0;
  const isiAman = (isi: React.ReactNode) =>
    !orders || !formSiap ? (galatMuat ? <Peringatan>{galatMuat}</Peringatan> : <span style={{ color: token.warna.teksRedup }}>{PENUNJANG.memuat}</span>) : kosong ? <Peringatan nada="biru">{H.kosong}</Peringatan> : isi;

  const langkah: LangkahModal[] = [
    { id: 'hasil', judul: H.langkah.hasil, isi: isiAman(langkahHasil), selesai: rencana.length > 0 && indeks > 0 },
    { id: 'interpretasi', judul: H.langkah.interpretasi, isi: isiAman(langkahInterpretasi), selesai: rencana.length > 0 && indeks > 1 },
    { id: 'validasi', judul: H.langkah.validasi, isi: isiAman(langkahValidasi) },
  ];

  return (
    <ModalBertahap
      judul={H.judul}
      langkah={langkah}
      indeks={indeks}
      onIndeks={(n) => {
        setGalat(null);
        pindah(n);
      }}
      konteks={<KepalaPasien nama={pasien.nama} nomorRm={pasien.nomor_rm} />}
      catatan={
        drafDipulihkan ? (
          <Peringatan nada="biru" baris>
            <Tumbuh>{MODAL.drafDipulihkan}</Tumbuh>
            <Tombol
              type="button"
              varian="teks"
              onClick={() => {
                buang();
                setK(awal);
                setIndeks(0);
                setDrafDipulihkan(false);
              }}
            >
              {MODAL.buangDraf}
            </Tombol>
          </Peringatan>
        ) : undefined
      }
      galat={galat}
      onTutup={adaTersimpan.current ? onSelesai : onTutup}
      lindungiTutup={formSiap && adaPerubahan(awal, k)}
      onLanjut={(dari) => {
        if (!orders) return false;
        if (dari === 0 && !menunggu.some((o) => (k.nilai[o.id] ?? '').trim())) {
          setGalat(H.langkahSebelumnya);
          return false;
        }
        const diterapkan = dari === 0 ? terapkanSaran(k, orders) : k;
        if (dari === 0) setK(diterapkan);
        if (dari === 1 && Object.keys(galatPer).length) {
          setGalat(Object.values(galatPer)[0]);
          return false;
        }
        setGalat(null);
        return true;
      }}
      labelKirim={memproses ? H.memproses : k.validasi ? H.kirimValidasi : H.kirim}
      onKirim={() => void kirim()}
      kirimNonaktif={memproses || !formSiap || !!kosong || rencana.length === 0}
      hasil={
        hasil
          ? {
              judul: H.selesaiJudul,
              isi: (
                <Kolom>
                  <p style={{ margin: 0 }}>{H.selesaiPesan(hasil.disimpan, hasil.divalidasi)}</p>
                  {hasil.addendum > 0 && <Peringatan nada="biru">{H.addendumDibuat(hasil.addendum)}</Peringatan>}
                </Kolom>
              ),
              aksi: <Tombol type="button" onClick={onSelesai}>{TOMBOL.tutup}</Tombol>,
            }
          : undefined
      }
    />
  );
}
