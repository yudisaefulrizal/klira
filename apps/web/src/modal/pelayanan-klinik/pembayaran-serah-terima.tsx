import { useCallback, useEffect, useMemo, useState } from 'react';
import { KASIR, METODE_BAYAR, STATUS_RESEP } from '@klira/shared';
import type { KasirKunjunganDto, MetodeBayar } from '@klira/shared';
import { catatPembayaran, kasirKunjungan, serahkanObat } from '../../api-klien/kasir';
import { GalatApi } from '../../api-klien/klien';
import { token } from '../../gaya/token';
import { ModalBertahap } from '../../komponen/modal-bertahap/modal-bertahap';
import type { LangkahModal } from '../../komponen/modal-bertahap/modal-bertahap';
import { AreaTeks } from '../../komponen/ui/area-teks';
import { Isian } from '../../komponen/ui/isian';
import { Bingkai } from '../../komponen/ui/kartu';
import { KotakCentang } from '../../komponen/ui/kotak-centang';
import { Lencana } from '../../komponen/ui/lencana';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Pilihan } from '../../komponen/ui/pilihan';
import { DaftarRingkasan, Kolom, Sebaris, Tumbuh } from '../../komponen/ui/susunan';
import { BarisTabel, SelTabel, Tabel } from '../../komponen/ui/tabel';
import { Tombol } from '../../komponen/ui/tombol';
import { formatWaktu } from '../../util/penyaring-tab';
import { awalBayar, awalSerah, bentukBayar, bentukSerah, diterapkan, galatBayar, galatSerah, kembalian } from './keadaan-kasir';
import type { KeadaanBayar, KeadaanSerah } from './keadaan-kasir';
import { KepalaPasien } from './kepala-pasien';
import { rupiah } from './keadaan-order-lab';

type Props = { kunjunganId: number; onTutup: () => void; onSelesai: () => void };
const B = KASIR.bayar;
const OPSI_METODE = (['tunai', 'transfer', 'qris'] as const).map((m) => ({ nilai: m, label: METODE_BAYAR.label(m) }));
const KOLOM_TAGIHAN = [{ judul: B.kolom.item }, { judul: B.kolom.jumlah }, { judul: B.kolom.harga }, { judul: B.kolom.subtotal, rataKanan: true }];

/**
 * Modal Pembayaran dan serah terima obat (3.3, MODAL-BERTAHAP): Tagihan > Pembayaran > Serah terima obat. Pembayaran dan serah terima adalah dua proses
 * terpisah (alur dan data) yang berbagi satu modal; keduanya dicatat sendiri-sendiri dan tidak dapat dibatalkan. Tutup kunjungan ada di modal lain.
 */
export function PembayaranSerahTerima({ kunjunganId, onTutup, onSelesai }: Props) {
  const [g, setG] = useState<KasirKunjunganDto | null>(null);
  const [indeks, setIndeks] = useState(0);
  const [bayar, setBayar] = useState<KeadaanBayar>(awalBayar());
  const [serah, setSerah] = useState<KeadaanSerah>(awalSerah());
  const [kekurangan, setKekurangan] = useState<string[]>([]);
  const [galat, setGalat] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [dicoba, setDicoba] = useState(false);
  const [memproses, setMemproses] = useState(false);
  const [berubah, setBerubah] = useState(false);

  const muat = useCallback(async (sesuaikan = false) => {
    const h = await kasirKunjungan(kunjunganId);
    setG(h);
    if (sesuaikan) setBayar((k) => ({ ...k, jumlah: h.tagihan.sisa > 0 ? String(h.tagihan.sisa) : '' }));
    return h;
  }, [kunjunganId]);

  useEffect(() => {
    muat(true).catch((e) => setGalat(e instanceof GalatApi ? e.message : B.gagal));
  }, [muat]);

  const t = g?.tagihan;
  const resepSiap = (g?.resep ?? []).filter((r) => r.status === 'siap');
  const resepBelumSiap = (g?.resep ?? []).filter((r) => r.status === 'diajukan' || r.status === 'ditelaah');
  const gb = galatBayar(bayar);
  const kemb = useMemo(() => (t ? kembalian(bayar, t.sisa) : 0), [bayar, t]);

  async function jalankan(f: () => Promise<void>) {
    setMemproses(true);
    setGalat(null);
    setInfo(null);
    try {
      await f();
      setBerubah(true);
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : B.gagal);
    } finally {
      setMemproses(false);
    }
  }

  const catat = () => {
    setDicoba(true);
    if (Object.keys(gb).length || !t) return;
    void jalankan(async () => {
      const h = await catatPembayaran(kunjunganId, bentukBayar(bayar));
      setInfo(`${B.tercatat(rupiah(h.pembayaran.jumlah))}${h.kembalian ? ` ${B.kembalian(rupiah(h.kembalian))}.` : ''}`);
      setDicoba(false);
      await muat(true);
    });
  };

  const serahkan = () => {
    if (galatSerah(serah)) return setDicoba(true);
    void jalankan(async () => {
      try {
        await serahkanObat(kunjunganId, bentukSerah(serah));
        setKekurangan([]);
        setSerah(awalSerah());
        setInfo(B.serahTercatat);
        await muat();
      } catch (e) {
        if (e instanceof GalatApi && e.rincian?.length) setKekurangan(e.rincian.map((r) => r.pesan));
        throw e;
      }
    });
  };

  const langkah: LangkahModal[] = [
    {
      id: 'tagihan', judul: B.langkah.tagihan, selesai: !!t && t.status_tagihan === 'lengkap',
      isi: !t ? <span style={{ color: token.warna.teksRedup }}>{KASIR.memuat}</span> : (
        <Kolom>
          <h3 style={{ margin: 0, fontSize: token.huruf.ukuran.besar }}>{B.tagihanJudul}</h3>
          {t.status_tagihan !== 'lengkap' && <Peringatan>{B.tagihanBelum}</Peringatan>}
          <Bingkai halus padding="tanpa" arah="kolom" jarak="tanpa" style={{ overflow: 'hidden' }}>
            <Tabel kolom={KOLOM_TAGIHAN} label={B.tagihanJudul}>
              {t.item.map((i) => (
                <BarisTabel key={i.id}>
                  <SelTabel>{i.nama}</SelTabel>
                  <SelTabel>{i.jumlah}</SelTabel>
                  <SelTabel>{i.harga === null ? '-' : rupiah(i.harga)}</SelTabel>
                  <SelTabel style={{ textAlign: 'right' }}>{i.harga === null ? '-' : rupiah(i.harga * i.jumlah)}</SelTabel>
                </BarisTabel>
              ))}
            </Tabel>
          </Bingkai>
          <DaftarRingkasan bagian={[{ judul: '', baris: [{ label: B.total, nilai: rupiah(t.total) }, { label: B.dibayar, nilai: rupiah(t.dibayar) }, { label: B.sisa, nilai: t.sisa === 0 ? B.lunas : rupiah(t.sisa) }] }]} />
        </Kolom>
      ),
    },
    {
      id: 'pembayaran', judul: B.langkah.pembayaran, selesai: !!t && t.sisa === 0 && t.total > 0,
      isi: !t || !g ? <span style={{ color: token.warna.teksRedup }}>{KASIR.memuat}</span> : (
        <Kolom>
          {!g.shift_terbuka && <Peringatan>{B.tanpaShift}</Peringatan>}
          {t.status_tagihan !== 'lengkap' && <Peringatan>{B.tagihanBelum}</Peringatan>}
          <h3 style={{ margin: 0, fontSize: token.huruf.ukuran.besar }}>{B.pembayaranJudul}</h3>
          {t.pembayaran.length === 0 && <span style={{ color: token.warna.teksRedup }}>{B.tanpaPembayaran}</span>}
          {t.pembayaran.map((p) => (
            <Sebaris key={p.id} jarak="sm" bungkus>
              <Lencana warna={METODE_BAYAR.warna(p.metode)}>{METODE_BAYAR.label(p.metode)}</Lencana>
              <Tumbuh tag="span">{rupiah(p.jumlah)}</Tumbuh>
              <span style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{p.kasir_nama ?? '-'} · {formatWaktu(p.waktu)}</span>
            </Sebaris>
          ))}
          {t.sisa > 0 && t.total > 0 ? (
            <Kolom tag="form" noValidate onSubmit={(e) => { e.preventDefault(); catat(); }}>
              <strong>{B.sisa}: {rupiah(t.sisa)}</strong>
              <Pilihan id="bayar-metode" label={B.metode} opsi={OPSI_METODE} value={bayar.metode} onChange={(e) => setBayar({ ...bayar, metode: e.target.value as MetodeBayar })} />
              <Isian id="bayar-jumlah" label={B.diterima} inputMode="numeric" value={bayar.jumlah} onChange={(e) => setBayar({ ...bayar, jumlah: e.target.value })} galat={dicoba ? gb.jumlah : undefined} autoComplete="off" />
              {kemb > 0 && <Peringatan nada="biru">{B.kembalian(rupiah(kemb))}. {B.tercatat(rupiah(diterapkan(bayar, t.sisa)))}</Peringatan>}
              <div><Tombol type="submit" disabled={memproses || !g.shift_terbuka || t.status_tagihan !== 'lengkap'}>{memproses ? B.mencatat : B.catat}</Tombol></div>
            </Kolom>
          ) : t.total > 0 && <Peringatan nada="biru">{B.lunas}</Peringatan>}
        </Kolom>
      ),
    },
    {
      id: 'serah', judul: B.langkah.serah,
      isi: !g ? <span style={{ color: token.warna.teksRedup }}>{KASIR.memuat}</span> : (
        <Kolom>
          <h3 style={{ margin: 0, fontSize: token.huruf.ukuran.besar }}>{B.serahJudul}</h3>
          {g.resep.length === 0 && <span style={{ color: token.warna.teksRedup }}>{B.serahKosong}</span>}
          {g.resep.map((r) => (
            <Bingkai key={r.id} arah="kolom" jarak="xs" padding="md">
              <Sebaris jarak="sm" bungkus>
                <Tumbuh tag="span"><strong>{r.nomor_resep}</strong></Tumbuh>
                <Lencana warna={STATUS_RESEP.warna(r.status)}>{STATUS_RESEP.label(r.status)}</Lencana>
              </Sebaris>
              {r.item.map((i) => <span key={i.id}>{i.nama}: {i.jumlah} {i.satuan}, {i.aturan_pakai}</span>)}
            </Bingkai>
          ))}
          {resepBelumSiap.length > 0 && <Peringatan nada="biru">{B.serahBelumSiap}</Peringatan>}
          {kekurangan.length > 0 && (
            <Peringatan>
              <strong>{B.stokKurangJudul}</strong>
              {kekurangan.map((k) => <div key={k}>{k}</div>)}
            </Peringatan>
          )}
          {resepSiap.length > 0 && (
            <Kolom>
              <span style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{B.serahInfo}</span>
              {kekurangan.length > 0 && (
                <>
                  <KotakCentang id="serah-izinkan" label={B.izinkanStokKurang} checked={serah.izinkan} onChange={(e) => setSerah({ ...serah, izinkan: e.target.checked })} />
                  {serah.izinkan && <AreaTeks id="serah-alasan" label={B.alasanStok} value={serah.alasan} maxLength={300} onChange={(e) => setSerah({ ...serah, alasan: e.target.value })} aria-invalid={dicoba && galatSerah(serah) ? true : undefined} />}
                  {dicoba && galatSerah(serah) && <Peringatan>{galatSerah(serah)}</Peringatan>}
                </>
              )}
              <div><Tombol type="button" disabled={memproses} onClick={serahkan}>{memproses ? B.menyerahkan : B.serah}</Tombol></div>
            </Kolom>
          )}
          {g.resep.length > 0 && resepSiap.length === 0 && resepBelumSiap.length === 0 && <Peringatan nada="biru">{B.serahSudah}</Peringatan>}
          <span style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{B.penjelasanTutup}</span>
        </Kolom>
      ),
    },
  ];

  return (
    <ModalBertahap
      judul={B.judul}
      langkah={langkah}
      indeks={indeks}
      onIndeks={setIndeks}
      konteks={g ? <KepalaPasien nama={g.kunjungan.pasien_nama} nomorRm={g.kunjungan.pasien_nomor_rm} /> : undefined}
      catatan={info ? <Peringatan nada="biru">{info}</Peringatan> : undefined}
      galat={galat}
      onTutup={berubah ? onSelesai : onTutup}
      labelKirim={B.selesai}
      onKirim={berubah ? onSelesai : onTutup}
    />
  );
}
