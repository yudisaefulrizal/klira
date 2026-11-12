import { useCallback, useEffect, useMemo, useState } from 'react';
import { KASIR, MAKS_BARIS_BAYAR, METODE_BAYAR } from '@klira/shared';
import type { ItemTagihanDto, KasirKunjunganDto, MetodeBayar } from '@klira/shared';
import { catatPembayaran, hapusItemTagihan, kasirKunjungan } from '../../api-klien/kasir';
import { GalatApi } from '../../api-klien/klien';
import { token } from '../../gaya/token';
import { ModalBertahap } from '../../komponen/modal-bertahap/modal-bertahap';
import type { LangkahModal } from '../../komponen/modal-bertahap/modal-bertahap';
import { Isian } from '../../komponen/ui/isian';
import { Bingkai } from '../../komponen/ui/kartu';
import { Lencana } from '../../komponen/ui/lencana';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Pilihan } from '../../komponen/ui/pilihan';
import { DaftarRingkasan, Kolom, Sebaris, Tumbuh } from '../../komponen/ui/susunan';
import { BarisTabel, SelTabel, Tabel } from '../../komponen/ui/tabel';
import { formatWaktu } from '../../util/penyaring-tab';
import { awalBayar, bentukBayar, galatBayar, hapusBaris, hargaDiubah, ringkasBayar, tambahBaris, ubahBaris, ubahHargaTersedia } from './keadaan-kasir';
import type { KeadaanBayar } from './keadaan-kasir';
import { KepalaPasien } from './kepala-pasien';
import { rupiah } from './keadaan-order-lab';
import { LengkapiHarga } from './lengkapi-harga';
import { TambahItemTarif } from './tambah-item-tarif';
import { UbahHarga } from './ubah-harga';
import { useSerahObat } from './serah-terima-obat';
import { Tombol } from '../../komponen/ui/tombol';

type Props = {
  kunjunganId: number;
  pasien: { nama: string; nomor_rm: string };
  /** Izin kasir.input: langkah Tagihan dan Pembayaran. */
  kasir: boolean;
  /** Izin farmasi.input: langkah Serah terima obat (bila kunjungan punya resep). */
  farmasi: boolean;
  onTutup: () => void;
  onSelesai: () => void;
};
const B = KASIR.bayar;
const OPSI_METODE = (['tunai', 'transfer', 'qris'] as const).map((m) => ({ nilai: m, label: METODE_BAYAR.label(m) }));
const KOLOM_TAGIHAN = [{ judul: B.kolom.item }, { judul: B.kolom.jumlah }, { judul: B.kolom.harga }, { judul: B.kolom.subtotal, rataKanan: true }];

/**
 * Pembayaran dan serah terima obat dalam satu modal bertahap. Keduanya tetap proses terpisah (endpoint, izin, dan data sendiri):
 * langkah Tagihan/Pembayaran untuk izin kasir, langkah Serah terima obat untuk izin farmasi bila ada resep.
 */
export function Pembayaran({ kunjunganId, pasien, kasir, farmasi, onTutup, onSelesai }: Props) {
  const [g, setG] = useState<KasirKunjunganDto | null>(null);
  const [indeks, setIndeks] = useState(0);
  const [bayar, setBayar] = useState<KeadaanBayar>(awalBayar());
  const [galat, setGalat] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [dicoba, setDicoba] = useState(false);
  const [memproses, setMemproses] = useState(false);
  const [berubah, setBerubah] = useState(false);
  const [itemUbah, setItemUbah] = useState<ItemTagihanDto | null>(null);
  const serah = useSerahObat(kunjunganId, farmasi);
  const adaSerah = farmasi && !!serah.resep && serah.resep.length > 0;

  const muat = useCallback(async (sesuaikan = false) => {
    const h = await kasirKunjungan(kunjunganId);
    setG(h);
    if (sesuaikan) setBayar(awalBayar(h.syarat.ditanggung_jkn ? 0 : h.tagihan.sisa));
    return h;
  }, [kunjunganId]);

  useEffect(() => {
    if (kasir) muat(true).catch((e) => setGalat(e instanceof GalatApi ? e.message : B.gagal));
  }, [muat, kasir]);

  const t = g?.tagihan;
  /** Gambaran baru dari server (tambah/hapus item, lengkapi harga): jumlah bayar mengikuti sisa terbaru. */
  const terapkan = (h: KasirKunjunganDto) => {
    setG(h);
    setBayar(awalBayar(h.syarat.ditanggung_jkn ? 0 : h.tagihan.sisa));
    setBerubah(true);
  };
  const gb = galatBayar(bayar, t?.sisa);
  const ringkas = useMemo(() => (t ? ringkasBayar(bayar, t.sisa) : null), [bayar, t]);

  async function jalankan(f: () => Promise<void>) {
    if (memproses) return;
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
    if (memproses || Object.keys(gb).length || !t || !g?.shift_terbuka || t.status_tagihan !== 'lengkap' || t.sisa <= 0) return;
    void jalankan(async () => {
      const h = await catatPembayaran(kunjunganId, bentukBayar(bayar));
      setInfo(`${B.tercatat(rupiah(h.diterapkan))}${h.kembalian ? ` ${B.kembalian(rupiah(h.kembalian))}.` : ''}`);
      setDicoba(false);
      setBerubah(true);
      setG((sebelum) => sebelum ? { ...sebelum, tagihan: h.tagihan } : sebelum);
      setBayar(awalBayar(h.tagihan.sisa));
    });
  };

  /** Pasien JKN tidak wajib membayar: tanpa jumlah diisi, tombol utama menjadi Selesai. */
  const perluBayar = !!t && t.sisa > 0 && !(g?.syarat.ditanggung_jkn && bayar.baris.every((b) => !b.jumlah.trim()));

  const langkahKasir: LangkahModal[] = [
    {
      id: 'tagihan', judul: B.langkah.tagihan, selesai: !!t && t.status_tagihan === 'lengkap',
      isi: !t ? <span style={{ color: token.warna.teksRedup }}>{KASIR.memuat}</span> : (
        <Kolom>
          <h3 style={{ margin: 0, fontSize: token.huruf.ukuran.besar }}>{B.tagihanJudul}</h3>
          {g?.syarat.ditanggung_jkn && <Peringatan nada="biru"><strong>{KASIR.jkn.ditanggung}.</strong> {KASIR.jkn.petunjukBayar}</Peringatan>}
          {t.status_tagihan !== 'lengkap' && <Peringatan>{B.tagihanBelum}</Peringatan>}
          {g && t.status_tagihan !== 'lengkap' && <LengkapiHarga kunjunganId={kunjunganId} gambaran={g} onUbah={terapkan} />}
          <Bingkai halus padding="tanpa" arah="kolom" jarak="tanpa" style={{ overflow: 'hidden' }}>
            <Tabel kolom={KOLOM_TAGIHAN} label={B.tagihanJudul}>
              {t.item.map((i) => (
                <BarisTabel key={i.id}>
                  <SelTabel>
                    {i.nama}
                    {i.manual && <span style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}> · {KASIR.tambah.manual}</span>}
                    {i.tindakan_sumber && <span style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}> · {KASIR.tambah.dariTindakan}</span>}
                    {hargaDiubah(i) && <span style={{ display: 'block', color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{KASIR.ubahHarga.diubah}: {i.alasan_ubah_harga}</span>}
                    {g && ubahHargaTersedia(i, g) && (
                      <> · <Tombol type="button" varian="teks" disabled={memproses} aria-label={`${KASIR.ubahHarga.aksi} ${i.nama}`} onClick={() => setItemUbah(i)}>{KASIR.ubahHarga.aksi}</Tombol></>
                    )}
                    {i.manual && g?.kunjungan.tahap_layanan !== 'ditutup' && (
                      <> · <Tombol type="button" varian="teks" disabled={memproses} aria-label={`${KASIR.tambah.hapus} ${i.nama}`} onClick={() => void jalankan(async () => terapkan(await hapusItemTagihan(kunjunganId, i.id)))}>{KASIR.tambah.hapus}</Tombol></>
                    )}
                  </SelTabel>
                  <SelTabel>{i.jumlah}</SelTabel>
                  <SelTabel>
                    {hargaDiubah(i) && <><s style={{ color: token.warna.teksRedup }} aria-label={`${KASIR.ubahHarga.hargaAcuan} ${rupiah(i.harga_acuan ?? 0)}`}>{rupiah(i.harga_acuan ?? 0)}</s>{' '}</>}
                    {i.harga === null ? '-' : rupiah(i.harga)}
                  </SelTabel>
                  <SelTabel style={{ textAlign: 'right' }}>{i.harga === null ? '-' : rupiah(i.harga * i.jumlah)}</SelTabel>
                </BarisTabel>
              ))}
            </Tabel>
          </Bingkai>
          <DaftarRingkasan bagian={[{ judul: '', baris: [{ label: B.total, nilai: rupiah(t.total) }, { label: B.dibayar, nilai: rupiah(t.dibayar) }, { label: B.sisa, nilai: t.sisa === 0 ? B.lunas : g?.syarat.ditanggung_jkn ? `${rupiah(t.sisa)} (${KASIR.jkn.ditanggung})` : rupiah(t.sisa) }] }]} />
          {g && <TambahItemTarif kunjunganId={kunjunganId} gambaran={g} onUbah={terapkan} />}
        </Kolom>
      ),
    },
    {
      id: 'pembayaran', judul: B.langkah.pembayaran, selesai: !!t && t.total > 0 && (t.sisa === 0 || !!g?.syarat.ditanggung_jkn),
      // Bila serah obat menyusul, Catat pembayaran tetap aksi utama langkah ini (bukan Lanjut).
      kirim: adaSerah && perluBayar ? { label: memproses ? B.mencatat : B.catat, onKirim: catat, nonaktif: memproses || !g?.shift_terbuka || t?.status_tagihan !== 'lengkap' } : undefined,
      isi: !t || !g ? <span style={{ color: token.warna.teksRedup }}>{KASIR.memuat}</span> : (
        <Kolom>
          {g.syarat.ditanggung_jkn && <Peringatan nada="biru"><strong>{KASIR.jkn.ditanggung}.</strong> {KASIR.jkn.petunjukBayar}</Peringatan>}
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
            <Kolom>
              <strong>{B.sisa}: {rupiah(t.sisa)}</strong>
              {bayar.baris.map((b, i) => (
                <Sebaris key={i} jarak="md" bungkus sejajar="akhir">
                  <Pilihan id={`bayar-metode-${i}`} label={i === 0 ? B.metode : B.metodeKe(i + 1)} opsi={OPSI_METODE} value={b.metode} disabled={memproses} onChange={(e) => setBayar(ubahBaris(bayar, i, { metode: e.target.value as MetodeBayar }))} galat={dicoba ? gb[`pembayaran.${i}.metode`] : undefined} />
                  <Tumbuh tag="div">
                    <Isian id={`bayar-jumlah-${i}`} label={i === 0 ? B.diterima : B.diterimaKe(i + 1)} inputMode="numeric" value={b.jumlah} disabled={memproses} onChange={(e) => setBayar(ubahBaris(bayar, i, { jumlah: e.target.value }))} galat={dicoba ? gb[`pembayaran.${i}.jumlah`] : undefined} autoComplete="off" />
                  </Tumbuh>
                  {i > 0 && <Tombol type="button" varian="teks" disabled={memproses} aria-label={`${B.hapusMetode} ${B.metodeKe(i + 1)}`} onClick={() => setBayar(hapusBaris(bayar, i))}>{B.hapusMetode}</Tombol>}
                </Sebaris>
              ))}
              {bayar.baris.length < MAKS_BARIS_BAYAR && (
                <Sebaris><Tombol type="button" varian="sekunder" disabled={memproses} onClick={() => setBayar(tambahBaris(bayar, t.sisa))}>{B.tambahMetode}</Tombol></Sebaris>
              )}
              {dicoba && (gb.pembayaran ?? gb['']) && <Peringatan>{gb.pembayaran ?? gb['']}</Peringatan>}
              {ringkas && ringkas.diterima > 0 && (
                <DaftarRingkasan bagian={[{ judul: '', baris: [{ label: B.totalDiterima, nilai: rupiah(ringkas.diterima) }, { label: B.diterapkan, nilai: rupiah(ringkas.diterapkan) }, { label: B.kembalianLabel, nilai: rupiah(ringkas.kembalian) }] }]} />
              )}
            </Kolom>
          ) : t.total > 0 && <Peringatan nada="biru">{B.lunas}</Peringatan>}
        </Kolom>
      ),
    },
  ];
  const langkahSerah: LangkahModal = { id: 'serah', judul: B.langkah.serah, selesai: serah.selesai, isi: serah.isi };
  const langkah = [...(kasir ? langkahKasir : []), ...(adaSerah || !kasir ? [langkahSerah] : [])];
  const diSerah = langkah[Math.min(indeks, langkah.length - 1)]?.id === 'serah';
  const sibuk = memproses || serah.memproses;
  const adaPerubahan = berubah || serah.berubah;
  const selesaiTutup = () => (adaPerubahan ? onSelesai : onTutup)();
  const pesanInfo = diSerah ? serah.info : info;

  return (
    <>
      <ModalBertahap
        judul={kasir ? (adaSerah ? B.judulDenganObat : B.judul) : B.serahJudul}
        langkah={langkah}
        indeks={indeks}
        onIndeks={setIndeks}
        konteks={<KepalaPasien nama={g?.kunjungan.pasien_nama ?? pasien.nama} nomorRm={g?.kunjungan.pasien_nomor_rm ?? pasien.nomor_rm} />}
        catatan={pesanInfo ? <Peringatan nada="biru">{pesanInfo}</Peringatan> : undefined}
        galat={diSerah ? serah.galat : galat}
        onTutup={() => { if (!sibuk) selesaiTutup(); }}
        {...(diSerah
          ? { labelKirim: serah.bisaSerah ? (serah.memproses ? B.menyerahkan : B.serah) : B.selesai, kirimNonaktif: sibuk, onKirim: serah.bisaSerah ? serah.serahkan : selesaiTutup }
          : { labelKirim: perluBayar ? (memproses ? B.mencatat : B.catat) : B.selesai, kirimNonaktif: memproses || (perluBayar && (!g?.shift_terbuka || t?.status_tagihan !== 'lengkap')) || !t, onKirim: perluBayar ? catat : selesaiTutup })}
      />
      {itemUbah && <UbahHarga kunjunganId={kunjunganId} item={itemUbah} onTutup={() => setItemUbah(null)} onUbah={(h) => { setItemUbah(null); terapkan(h); }} />}
    </>
  );
}
