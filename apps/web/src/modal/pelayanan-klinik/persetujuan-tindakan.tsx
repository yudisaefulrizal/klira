import { useEffect, useMemo, useRef, useState } from 'react';
import { LABEL_BENTUK_PERSETUJUAN, PERSETUJUAN_TINDAKAN, TOMBOL } from '@klira/shared';
import type { PersetujuanSiapDto } from '@klira/shared';
import { GalatApi } from '../../api-klien/klien';
import { catatPersetujuanTindakan, siapPersetujuanTindakan } from '../../api-klien/persetujuan';
import { token } from '../../gaya/token';
import { ModalBertahap } from '../../komponen/modal-bertahap/modal-bertahap';
import type { LangkahModal } from '../../komponen/modal-bertahap/modal-bertahap';
import { AreaTeks } from '../../komponen/ui/area-teks';
import { Isian } from '../../komponen/ui/isian';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Pilihan } from '../../komponen/ui/pilihan';
import { DaftarRingkasan, Kolom } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { adaPerubahan } from '../../util/draf';
import { KepalaPasien } from './kepala-pasien';
import {
  PILIHAN_MANUAL, awalPersetujuan, bentukPersetujuan, galatPersetujuan, langkahBermasalahPersetujuan, pilihTindakan,
} from './keadaan-persetujuan';
import type { KeadaanPersetujuan } from './keadaan-persetujuan';

type Props = {
  kunjunganId: number;
  pasien: { id: number; nama: string; nomor_rm: string };
  onTutup: () => void;
  /** Dipanggil saat modal ditutup setelah persetujuan tercatat (muat ulang daftar). */
  onSelesai: () => void;
};

/**
 * Modal Persetujuan tindakan (3.3, MODAL-BERTAHAP): Tindakan > Penjelasan > Persetujuan > Ringkasan. Persetujuan tersimpan sebagai entitas
 * Persetujuan berjenis tindakan dengan versi teks tetap; tidak ada hapus. Tanda tangan basah pasien memakai cara sementara di luar aplikasi.
 */
export function PersetujuanTindakan({ kunjunganId, pasien, onTutup, onSelesai }: Props) {
  const P = PERSETUJUAN_TINDAKAN;
  const [siap, setSiap] = useState<PersetujuanSiapDto | null>(null);
  const [k, setK] = useState<KeadaanPersetujuan>(() => awalPersetujuan(null));
  const [awal, setAwal] = useState<KeadaanPersetujuan>(() => awalPersetujuan(null));
  const [indeks, setIndeks] = useState(0);
  const [dicoba, setDicoba] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [memproses, setMemproses] = useState(false);
  const [hasil, setHasil] = useState<string | null>(null);
  const tercatat = useRef(false);

  useEffect(() => {
    let batal = false;
    siapPersetujuanTindakan(kunjunganId)
      .then((s) => {
        if (batal) return;
        const a = awalPersetujuan(s);
        setSiap(s);
        setAwal(a);
        setK(a);
      })
      .catch((e) => !batal && setGalat(e instanceof GalatApi ? e.message : P.galat.kunjunganTidakAda));
    return () => {
      batal = true;
    };
  }, [kunjunganId, P.galat.kunjunganTidakAda]);

  const g = useMemo(() => galatPersetujuan(k, siap), [k, siap]);
  const tampil = (b: string) => (dicoba ? g[b] : undefined);
  const opsiTindakan = [
    { nilai: '', label: P.tindakan.pilihPlaceholder },
    ...(siap?.tindakan ?? []).map((t) => ({ nilai: t.kode, label: `${t.kode} ${t.nama}` })),
    { nilai: PILIHAN_MANUAL, label: P.tindakan.manual },
  ];
  const opsiBentuk = (['tertulis', 'lisan'] as const).map((b) => ({ nilai: b, label: LABEL_BENTUK_PERSETUJUAN.label(b) }));
  const opsiTtd = [{ nilai: 'pasien', label: pasien.nama }, { nilai: 'wali', label: P.persetujuan.wali }];

  async function kirim() {
    setDicoba(true);
    if (!siap || memproses) return;
    const bermasalah = langkahBermasalahPersetujuan(g);
    if (bermasalah >= 0) {
      setIndeks(bermasalah);
      return;
    }
    setMemproses(true);
    setGalat(null);
    try {
      const r = await catatPersetujuanTindakan(kunjunganId, bentukPersetujuan(k, siap));
      tercatat.current = true;
      setHasil(r.tindakan_nama ?? k.nama);
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : P.galat.kunjunganTidakAda);
    } finally {
      setMemproses(false);
    }
  }

  const langkah: LangkahModal[] = [
    {
      id: 'tindakan', judul: P.langkah.tindakan, selesai: !g.nama && !g.kode,
      isi: (
        <Kolom>
          {siap && !siap.tindakan.length && <Peringatan nada="biru">{P.tindakan.tidakAda}</Peringatan>}
          <Pilihan id="ptd-pilih" label={P.tindakan.pilihLabel} opsi={opsiTindakan} value={k.pilih} onChange={(e) => siap && setK(pilihTindakan(k, siap, e.target.value))} />
          <Isian id="ptd-nama" label={P.tindakan.nama} value={k.nama} onChange={(e) => setK({ ...k, nama: e.target.value })} galat={tampil('nama')} readOnly={!!k.pilih && k.pilih !== PILIHAN_MANUAL} autoComplete="off" />
          {k.pilih === PILIHAN_MANUAL && <Isian id="ptd-kode" label={P.tindakan.kode} value={k.kode} onChange={(e) => setK({ ...k, kode: e.target.value })} galat={tampil('kode')} autoComplete="off" />}
        </Kolom>
      ),
    },
    {
      id: 'penjelasan', judul: P.langkah.penjelasan, selesai: !g.penjelasan,
      isi: (
        <Kolom>
          <span style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{P.penjelasan.petunjuk}</span>
          <AreaTeks id="ptd-penjelasan" label={P.penjelasan.label} value={k.penjelasan} onChange={(e) => setK({ ...k, penjelasan: e.target.value })} aria-invalid={tampil('penjelasan') ? true : undefined} />
          {tampil('penjelasan') && <Peringatan>{g.penjelasan}</Peringatan>}
          {siap?.teks ? (
            <Kolom jarak="xs">
              <strong>{P.penjelasan.teksTitel}</strong>
              <span style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{P.penjelasan.versi(siap.teks.versi)}</span>
              <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{siap.teks.isi}</p>
            </Kolom>
          ) : <Peringatan>{P.penjelasan.teksTidakAda}</Peringatan>}
        </Kolom>
      ),
    },
    {
      id: 'persetujuan', judul: P.langkah.persetujuan, selesai: !g.wali && !g.saksi && !g.penandatangan,
      isi: (
        <Kolom>
          <Pilihan id="ptd-bentuk" label={P.persetujuan.bentuk} opsi={opsiBentuk} value={k.bentuk} onChange={(e) => setK({ ...k, bentuk: e.target.value as KeadaanPersetujuan['bentuk'] })} />
          {siap?.pasien.tidak_cakap && <Peringatan nada="biru">{P.persetujuan.tidakCakap}</Peringatan>}
          <Pilihan id="ptd-ttd" label={P.persetujuan.penandatangan} opsi={opsiTtd} value={k.penandatangan} onChange={(e) => setK({ ...k, penandatangan: e.target.value as KeadaanPersetujuan['penandatangan'] })} galat={tampil('penandatangan')} />
          {k.penandatangan === 'wali' && (
            siap && !siap.wali.length
              ? <Peringatan>{P.persetujuan.tanpaWali}</Peringatan>
              : <Pilihan id="ptd-wali" label={P.persetujuan.wali} opsi={[{ nilai: '', label: P.persetujuan.pilihWali }, ...(siap?.wali ?? []).map((w) => ({ nilai: String(w.id), label: `${w.nama} (${w.hubungan})` }))]} value={k.wali} onChange={(e) => setK({ ...k, wali: e.target.value })} galat={tampil('wali')} />
          )}
          <Pilihan id="ptd-saksi" label={P.persetujuan.saksi} opsi={[{ nilai: '', label: P.persetujuan.pilihSaksi }, ...(siap?.saksi ?? []).map((s) => ({ nilai: String(s.id), label: s.nama }))]} value={k.saksi} onChange={(e) => setK({ ...k, saksi: e.target.value })} galat={tampil('saksi')} />
          <span style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{P.persetujuan.saksiKet}</span>
        </Kolom>
      ),
    },
    {
      id: 'ringkasan', judul: P.langkah.ringkasan,
      isi: (
        <Kolom>
          <h3 style={{ margin: 0, fontSize: token.huruf.ukuran.besar }}>{P.ringkasan.judul}</h3>
          <DaftarRingkasan
            bagian={[{
              judul: P.judul,
              baris: [
                { label: P.ringkasan.tindakan, nilai: [k.kode, k.nama].filter(Boolean).join(' ') || '-' },
                { label: P.ringkasan.bentuk, nilai: LABEL_BENTUK_PERSETUJUAN.label(k.bentuk) },
                { label: P.ringkasan.penandatangan, nilai: k.penandatangan === 'wali' ? (siap?.wali.find((w) => String(w.id) === k.wali)?.nama ?? '-') : pasien.nama },
                { label: P.ringkasan.saksi, nilai: siap?.saksi.find((s) => String(s.id) === k.saksi)?.nama ?? '-' },
                { label: P.ringkasan.penjelasan, nilai: k.penjelasan || '-' },
                { label: P.ringkasan.versi, nilai: siap?.teks ? P.penjelasan.versi(siap.teks.versi) : '-' },
              ],
            }]}
          />
          <span style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{P.ringkasan.catat}</span>
        </Kolom>
      ),
    },
  ];

  return (
    <ModalBertahap
      judul={P.judul}
      langkah={langkah}
      indeks={indeks}
      onIndeks={setIndeks}
      konteks={<KepalaPasien nama={pasien.nama} nomorRm={pasien.nomor_rm} />}
      galat={galat}
      onTutup={tercatat.current ? onSelesai : onTutup}
      lindungiTutup={adaPerubahan(awal, k)}
      labelKirim={memproses ? P.tombol.menyimpan : P.tombol.simpan}
      onKirim={() => void kirim()}
      kirimNonaktif={memproses || !siap}
      hasil={hasil === null ? undefined : {
        judul: P.hasil.judul,
        isi: <p style={{ margin: 0 }}>{P.hasil.pesan(hasil)}</p>,
        aksi: <Tombol type="button" onClick={onSelesai}>{TOMBOL.tutup}</Tombol>,
      }}
    />
  );
}

