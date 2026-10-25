import { useEffect, useMemo, useState } from 'react';
import { REKAM_MEDIS, STATUS_PERAN_DIAGNOSIS, TOMBOL } from '@klira/shared';
import type { PengkodeanDto } from '@klira/shared';
import { cariTerminologi } from '../../api-klien/klinis';
import { GalatApi } from '../../api-klien/klien';
import { ambilPengkodean, simpanPengkodean } from '../../api-klien/rekam-medis';
import { token } from '../../gaya/token';
import { PencarianKode } from '../../komponen/pencarian-kode/pencarian-kode';
import { Modal1 } from '../../komponen/modal-1/modal-1';
import { AreaTeks } from '../../komponen/ui/area-teks';
import { Bingkai } from '../../komponen/ui/kartu';
import { Lencana } from '../../komponen/ui/lencana';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Daftar, Kolom, Sebaris, Tumbuh } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { formatWaktu } from '../../util/penyaring-tab';
import { awalKode, berubahDariFinal, bentukKode, buangKode, buangKodeTindakan, galatKode, jadikanKodeUtama, perluCatatanKode, tambahKode, tambahKodeTindakan } from './keadaan-rm';
import type { KeadaanKode } from './keadaan-rm';
import { KepalaPasien } from './kepala-pasien';

type Props = { kunjunganId: number; onTutup: () => void; onSelesai: () => void };
const K = REKAM_MEDIS.kode;
const cariIcd10 = (q: string) => cariTerminologi('icd10', q);
const cariIcd9 = (q: string) => cariTerminologi('icd9cm', q);

/**
 * Modal Pengkodean ICD (3.3, MODAL-1): Perekam Medis memverifikasi kode dokter (disalin sebagai awal) dan menetapkan kode final setelah kunjungan ditutup.
 * Mengubah kode final butuh catatan dan membentuk versi baru. Arsip mengikuti pengkodean (retensi 25 tahun).
 */
export function PengkodeanIcd({ kunjunganId, onTutup, onSelesai }: Props) {
  const [data, setData] = useState<PengkodeanDto | null>(null);
  const [k, setK] = useState<KeadaanKode | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [dicoba, setDicoba] = useState(false);
  const [memproses, setMemproses] = useState(false);
  const [berubah, setBerubah] = useState(false);

  useEffect(() => {
    let batal = false;
    ambilPengkodean(kunjunganId)
      .then((d) => {
        if (batal) return;
        setData(d);
        setK(awalKode(d));
      })
      .catch((e) => !batal && setGalat(e instanceof GalatApi ? e.message : K.gagalMuat));
    return () => {
      batal = true;
    };
  }, [kunjunganId]);

  const g = useMemo(() => (k ? galatKode(k) : {}), [k]);
  const perluCatatan = !!(k && data && perluCatatanKode(k, data));
  const tidakBerubah = !!(k && data?.final && !berubahDariFinal(k, data));
  const tampil = (b: string) => (dicoba ? g[b] : undefined);

  async function simpan() {
    setDicoba(true);
    if (!k || !data || Object.keys(g).length || perluCatatan || tidakBerubah || memproses) return;
    setMemproses(true);
    setGalat(null);
    setInfo(null);
    try {
      const d = await simpanPengkodean(kunjunganId, bentukKode(k));
      setData(d);
      setK(awalKode(d));
      setInfo(K.tersimpan);
      setBerubah(true);
      setDicoba(false);
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : K.gagal);
    } finally {
      setMemproses(false);
    }
  }

  const tutup = () => (berubah ? onSelesai() : onTutup());
  const ditutup = data?.tahap_layanan === 'ditutup';

  return (
    <Modal1
      judul={K.judul}
      lebar="modalBesar"
      konteks={data ? <KepalaPasien nama={data.pasien_nama} nomorRm={data.pasien_nomor_rm} /> : undefined}
      onTutup={tutup}
      aksi={
        <>
          <Tombol type="button" varian="sekunder" onClick={tutup}>{TOMBOL.tutup}</Tombol>
          <Tombol type="submit" form="bentuk-kode" disabled={memproses || !ditutup || tidakBerubah}>{memproses ? K.menyimpan : K.simpan}</Tombol>
        </>
      }
    >
      {galat && <Peringatan>{galat}</Peringatan>}
      {info && <Peringatan nada="biru">{info}</Peringatan>}
      {!data && !galat && <span style={{ color: token.warna.teksRedup }}>{REKAM_MEDIS.memuat}</span>}
      {data && !ditutup && <Peringatan nada="biru">{K.belumDitutup}</Peringatan>}
      {data?.diarsipkan_pada && data.retensi_sampai && <Peringatan nada="biru">{K.arsipInfo(data.retensi_sampai)}</Peringatan>}
      {data && k && (
        <Kolom tag="form" id="bentuk-kode" noValidate onSubmit={(e) => { e.preventDefault(); void simpan(); }}>
          <Bingkai arah="kolom" jarak="xs" padding="md" halus>
            <Sebaris jarak="sm" bungkus>
              <Tumbuh tag="span"><strong>{K.dokter}</strong></Tumbuh>
              <Tombol type="button" varian="teks" onClick={() => setK({ ...k, diagnosis: data.dokter.diagnosis.map((x) => ({ ...x })), tindakan: data.dokter.tindakan.map((x) => ({ ...x })) })}>{K.salinDokter}</Tombol>
            </Sebaris>
            {data.dokter.diagnosis.map((d) => <span key={d.kode}>{d.kode} {d.nama} ({STATUS_PERAN_DIAGNOSIS.label(d.peran)})</span>)}
            {data.dokter.tindakan.map((t) => <span key={t.kode}>{t.kode} {t.nama}</span>)}
            {data.dokter.diagnosis.length === 0 && data.dokter.tindakan.length === 0 && <span style={{ color: token.warna.teksRedup }}>-</span>}
          </Bingkai>
          {data.final && <span style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{[data.versi ? K.versi(data.versi) : null, data.pengode_nama ? K.oleh(data.pengode_nama) : null, data.diperbarui_pada ? formatWaktu(data.diperbarui_pada) : null].filter(Boolean).join(' · ')}</span>}

          <strong>{K.diagnosis}</strong>
          <PencarianKode id="kode-icd10" label={K.cariKode} petunjuk={K.diagnosis} cari={cariIcd10} onPilih={(x) => setK({ ...k, diagnosis: tambahKode(k.diagnosis, x) })} manual teksManual={{ kode: K.kode, nama: K.nama }} />
          {tampil('diagnosis') && <Peringatan>{g.diagnosis}</Peringatan>}
          <Daftar>
            {k.diagnosis.map((d, n) => (
              <Bingkai tag="li" jarak="md" key={d.kode}>
                <strong style={{ minWidth: token.ukuran.kolomKode }}>{d.kode}</strong>
                <Tumbuh>{d.nama}</Tumbuh>
                <Lencana warna={STATUS_PERAN_DIAGNOSIS.warna(d.peran)}>{STATUS_PERAN_DIAGNOSIS.label(d.peran)}</Lencana>
                {d.peran !== 'utama' && <Tombol type="button" varian="teks" onClick={() => setK({ ...k, diagnosis: jadikanKodeUtama(k.diagnosis, d.kode) })}>{K.utama}</Tombol>}
                <Tombol type="button" varian="teks" onClick={() => setK({ ...k, diagnosis: buangKode(k.diagnosis, d.kode) })}>{K.buang}</Tombol>
                {tampil(`diagnosis.${n}.kode`) && <Peringatan>{g[`diagnosis.${n}.kode`]}</Peringatan>}
              </Bingkai>
            ))}
          </Daftar>

          <strong>{K.tindakan}</strong>
          <PencarianKode id="kode-icd9" label={K.cariKode} petunjuk={K.tindakan} cari={cariIcd9} onPilih={(x) => setK({ ...k, tindakan: tambahKodeTindakan(k.tindakan, x) })} manual teksManual={{ kode: K.kode, nama: K.nama }} />
          {k.tindakan.length === 0 && <span style={{ color: token.warna.teksRedup }}>{K.kosongTindakan}</span>}
          <Daftar>
            {k.tindakan.map((t, n) => (
              <Bingkai tag="li" jarak="md" key={t.kode}>
                <strong style={{ minWidth: token.ukuran.kolomKode }}>{t.kode}</strong>
                <Tumbuh>{t.nama}</Tumbuh>
                <Tombol type="button" varian="teks" onClick={() => setK({ ...k, tindakan: buangKodeTindakan(k.tindakan, t.kode) })}>{K.buang}</Tombol>
                {tampil(`tindakan.${n}.kode`) && <Peringatan>{g[`tindakan.${n}.kode`]}</Peringatan>}
              </Bingkai>
            ))}
          </Daftar>

          <AreaTeks id="kode-catatan" label={K.catatan} value={k.catatan} maxLength={500} onChange={(e) => setK({ ...k, catatan: e.target.value })} aria-invalid={perluCatatan && dicoba ? true : undefined} />
          {perluCatatan && dicoba && <Peringatan>{REKAM_MEDIS.perbaikan.alasanPetunjuk}</Peringatan>}
        </Kolom>
      )}
    </Modal1>
  );
}
