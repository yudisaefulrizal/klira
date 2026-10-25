import { useEffect, useMemo, useState } from 'react';
import { BERKAS_KLAIM, KLAIM, STATUS_KLAIM, TOMBOL } from '@klira/shared';
import type { KandidatKlaimDto, KlaimDto, KodeKlaim } from '@klira/shared';
import { GalatApi } from '../../api-klien/klien';
import { kandidatKlaim, kodeKlaimKunjungan, siapkanKlaim, ubahBerkasKlaim } from '../../api-klien/klaim';
import { token } from '../../gaya/token';
import { ModalBertahap } from '../../komponen/modal-bertahap/modal-bertahap';
import type { LangkahModal } from '../../komponen/modal-bertahap/modal-bertahap';
import { AreaTeks } from '../../komponen/ui/area-teks';
import { Isian } from '../../komponen/ui/isian';
import { KotakCentang } from '../../komponen/ui/kotak-centang';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Pilihan } from '../../komponen/ui/pilihan';
import { DaftarRingkasan, Kolom } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { adaPerubahan } from '../../util/draf';
import { formatWaktu } from '../../util/penyaring-tab';
import { alihBerkas, awalKlaim, bentukSiapkan, bentukUbahBerkas, galatKlaim, kurangBerkas, langkahBermasalahKlaim, pilihKandidat } from './keadaan-klaim';
import type { KeadaanKlaim } from './keadaan-klaim';

/** `klaim` terisi: mengubah SEP dan berkas klaim yang ada; kosong: menyiapkan klaim baru dari kunjungan JKN yang sudah ditutup. */
type Props = { klaim?: KlaimDto | null; onTutup: () => void; onSelesai: () => void };
const S = KLAIM.siap;
const kecil = { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil } as const;
const teksKode = (x: KodeKlaim[]) => (x.length ? x.map((k) => `${k.kode} ${k.nama}`).join('; ') : S.kosongKode);

/** Modal Penyiapan klaim (3.3, MODAL-BERTAHAP): Kunjungan dan SEP > Diagnosis dan tindakan > Berkas klaim > Ringkasan; kode disalin dari rekam medis. */
export function PenyiapanKlaim({ klaim = null, onTutup, onSelesai }: Props) {
  const ubah = !!klaim;
  const awal = useMemo(() => awalKlaim(klaim), [klaim]);
  const [k, setK] = useState<KeadaanKlaim>(awal);
  const [kandidat, setKandidat] = useState<KandidatKlaimDto[] | null>(ubah ? [] : null);
  const [kode, setKode] = useState<{ diagnosis: KodeKlaim[]; tindakan: KodeKlaim[]; final: boolean } | null>(klaim ? { diagnosis: klaim.diagnosis, tindakan: klaim.tindakan, final: true } : null);
  const [indeks, setIndeks] = useState(0);
  const [dicoba, setDicoba] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [memproses, setMemproses] = useState(false);
  const [hasil, setHasil] = useState<KlaimDto | null>(null);

  useEffect(() => {
    if (ubah) return;
    let batal = false;
    kandidatKlaim().then((d) => !batal && setKandidat(d)).catch((e) => !batal && setGalat(e instanceof GalatApi ? e.message : S.gagal));
    return () => {
      batal = true;
    };
  }, [ubah]);

  useEffect(() => {
    if (ubah || k.kunjungan_id === null) return;
    let batal = false;
    kodeKlaimKunjungan(k.kunjungan_id).then((d) => !batal && setKode(d)).catch(() => !batal && setKode(null));
    return () => {
      batal = true;
    };
  }, [ubah, k.kunjungan_id]);

  const terpilih = kandidat?.find((c) => c.kunjungan_id === k.kunjungan_id);
  const jenis = klaim?.jenis ?? terpilih?.jenis ?? 'AMB';
  const g = useMemo(() => galatKlaim(k, ubah), [k, ubah]);
  const tampil = (b: string) => (dicoba ? g[b] : undefined);
  const kurang = kurangBerkas(jenis, k);
  const resumeAda = klaim?.resume_ada ?? terpilih?.resume_ada ?? false;

  async function kirim() {
    setDicoba(true);
    if (memproses) return;
    const bermasalah = langkahBermasalahKlaim(g);
    if (bermasalah >= 0) return setIndeks(bermasalah);
    setMemproses(true);
    setGalat(null);
    try {
      setHasil(klaim ? await ubahBerkasKlaim(klaim.id, bentukUbahBerkas(k)) : await siapkanKlaim(bentukSiapkan(k)));
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : S.gagal);
    } finally {
      setMemproses(false);
    }
  }

  const langkah: LangkahModal[] = [
    {
      id: 'kunjungan', judul: S.langkah.kunjungan, selesai: !g.kunjungan_id && !g.nomor_sep,
      isi: (
        <Kolom>
          {ubah ? <strong>{klaim.pasien_nama} <span style={kecil}>{klaim.pasien_nomor_rm}</span></strong> : (
            <>
              {kandidat && !kandidat.length && <Peringatan nada="biru">{S.tanpaKandidat}</Peringatan>}
              <Pilihan
                id="klm-kunjungan" label={S.kunjungan} galat={tampil('kunjungan_id')} value={k.kunjungan_id === null ? '' : String(k.kunjungan_id)} onChange={(e) => setK(pilihKandidat(k, kandidat?.find((c) => String(c.kunjungan_id) === e.target.value)))}
                opsi={[{ nilai: '', label: S.pilihKunjungan }, ...(kandidat ?? []).map((c) => ({ nilai: String(c.kunjungan_id), label: `${c.pasien_nama} (${c.pasien_nomor_rm}) · ${formatWaktu(c.waktu_tutup)}${c.jenis === 'IMP' ? ' · rawat inap' : ''}` }))]}
              />
            </>
          )}
          <Isian id="klm-sep" label={S.sep} value={k.nomor_sep} onChange={(e) => setK({ ...k, nomor_sep: e.target.value })} galat={tampil('nomor_sep')} autoComplete="off" />
          <span style={kecil}>{S.sepPetunjuk}</span>
        </Kolom>
      ),
    },
    {
      id: 'kode', judul: S.langkah.kode,
      isi: (
        <Kolom>
          {kode && !kode.final && <Peringatan>{S.kodeBelum}</Peringatan>}
          {klaim?.kode_beda && <Peringatan>{S.kodeBeda}</Peringatan>}
          <DaftarRingkasan bagian={[{ judul: S.kodeSumber, baris: [{ label: S.diagnosis, nilai: kode ? teksKode(kode.diagnosis) : '-' }, { label: S.tindakan, nilai: kode ? teksKode(kode.tindakan) : '-' }] }]} />
        </Kolom>
      ),
    },
    {
      id: 'berkas', judul: S.langkah.berkas, selesai: !g.berkas,
      isi: (
        <Kolom>
          <span style={kecil}>{S.berkasPetunjuk}</span>
          {BERKAS_KLAIM.filter((b) => (b !== 'spri' && b !== 'ringkasan_rm') || jenis === 'IMP').map((b) => (
            <KotakCentang key={b} id={`klm-berkas-${b}`} label={KLAIM.berkasLabel[b]} checked={k.berkas.includes(b)} onChange={(e) => setK(alihBerkas(k, b, e.target.checked, BERKAS_KLAIM))} />
          ))}
          {jenis === 'IMP' && !resumeAda && <Peringatan>{S.resumeBelum}</Peringatan>}
          <AreaTeks id="klm-catatan" label={S.catatan} value={k.catatan} maxLength={300} onChange={(e) => setK({ ...k, catatan: e.target.value })} />
        </Kolom>
      ),
    },
    {
      id: 'ringkasan', judul: S.langkah.ringkasan,
      isi: (
        <Kolom>
          {kurang.length > 0 && <Peringatan nada="biru">{S.kurang(kurang.length)}</Peringatan>}
          <DaftarRingkasan bagian={[{
            judul: S.judul,
            baris: [
              { label: KLAIM.kolom.pasien, nilai: klaim ? klaim.pasien_nama : terpilih ? `${terpilih.pasien_nama} (${terpilih.pasien_nomor_rm})` : '-' }, { label: S.sep, nilai: k.nomor_sep || '-' },
              { label: S.diagnosis, nilai: kode ? teksKode(kode.diagnosis) : '-' }, { label: S.tindakan, nilai: kode ? teksKode(kode.tindakan) : '-' },
              { label: S.langkah.berkas, nilai: k.berkas.map((b) => KLAIM.berkasLabel[b]).join('; ') || '-' }, { label: S.catatan, nilai: k.catatan || '-' },
            ],
          }]} />
        </Kolom>
      ),
    },
  ];

  return (
    <ModalBertahap
      judul={ubah ? S.ubahJudul : S.judul} langkah={langkah} indeks={indeks} onIndeks={setIndeks} galat={galat} onTutup={hasil ? onSelesai : onTutup} lindungiTutup={adaPerubahan(awal, k)}
      labelKirim={memproses ? S.menyimpan : S.simpan} onKirim={() => void kirim()} kirimNonaktif={memproses || (!ubah && kandidat === null)}
      hasil={hasil ? { judul: S.hasilJudul, isi: <p style={{ margin: 0 }}>{S.hasilPesan(STATUS_KLAIM.label(hasil.status))}</p>, aksi: <Tombol type="button" onClick={onSelesai}>{TOMBOL.tutup}</Tombol> } : undefined}
    />
  );
}
