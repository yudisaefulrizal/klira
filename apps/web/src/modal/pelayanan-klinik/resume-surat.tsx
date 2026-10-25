import { useEffect, useMemo, useRef, useState } from 'react';
import { REKAM_MEDIS, TOMBOL } from '@klira/shared';
import type { DokumenKunjunganDto } from '@klira/shared';
import { buatSurat, ambilDokumen, simpanResume } from '../../api-klien/dokumen-rm';
import { GalatApi } from '../../api-klien/klien';
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
import { formatWaktu } from '../../util/penyaring-tab';
import { KepalaPasien } from './kepala-pasien';
import { adaSuratBaru, awalResume, bentukResume, bentukSurat, galatResume, langkahBermasalahResume, resumeSama } from './keadaan-dokumen';
import type { KeadaanResume } from './keadaan-dokumen';

type Props = { kunjunganId: number; onTutup: () => void; onSelesai: () => void };
const R = REKAM_MEDIS.dok.resume;
const OPSI_JENIS = Object.entries(R.jenisSurat).map(([nilai, label]) => ({ nilai, label }));
const kecil = { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil } as const;

/**
 * Modal Resume medis dan surat (3.3, MODAL-BERTAHAP): Resume > Kondisi pulang > Surat > Ringkasan. Resume tersimpan sebagai catatan tersahkan berversi
 * (ubah butuh alasan); surat rujukan atau keterangan dibuat bernomor bila isinya diisi.
 */
export function ResumeSurat({ kunjunganId, onTutup, onSelesai }: Props) {
  const [dok, setDok] = useState<DokumenKunjunganDto | null>(null);
  const [k, setK] = useState<KeadaanResume>(() => awalResume(null));
  const [awal, setAwal] = useState<KeadaanResume>(() => awalResume(null));
  const [indeks, setIndeks] = useState(0);
  const [dicoba, setDicoba] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [memproses, setMemproses] = useState(false);
  const [hasil, setHasil] = useState<string | null | undefined>(undefined);
  const tersimpan = useRef(false);

  useEffect(() => {
    let batal = false;
    ambilDokumen(kunjunganId)
      .then((d) => {
        if (batal) return;
        const a = awalResume(d);
        setDok(d);
        setAwal(a);
        setK(a);
      })
      .catch((e) => !batal && setGalat(e instanceof GalatApi ? e.message : REKAM_MEDIS.dok.gagalMuat));
    return () => {
      batal = true;
    };
  }, [kunjunganId]);

  const g = useMemo(() => galatResume(k, dok), [k, dok]);
  const tampil = (b: string) => (dicoba ? g[b] : undefined);
  const ada = !!dok?.resume;
  const ubah = ada && !resumeSama(k, dok);
  const set = (b: keyof KeadaanResume) => (e: { target: { value: string } }) => setK({ ...k, [b]: e.target.value });

  async function kirim() {
    setDicoba(true);
    if (!dok || memproses) return;
    const bermasalah = langkahBermasalahResume(g);
    if (bermasalah >= 0) return setIndeks(bermasalah);
    setMemproses(true);
    setGalat(null);
    try {
      let nomor: string | null = null;
      if (!ada || ubah) {
        await simpanResume(kunjunganId, bentukResume(k, ada));
        tersimpan.current = true;
      }
      if (adaSuratBaru(k)) {
        nomor = (await buatSurat(kunjunganId, bentukSurat(k))).nomor_surat;
        tersimpan.current = true;
      }
      setHasil(nomor);
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : R.gagal);
    } finally {
      setMemproses(false);
    }
  }

  const langkah: LangkahModal[] = [
    {
      id: 'resume', judul: R.langkah.resume, selesai: !g.ringkasan && !g.diagnosis_akhir && !g.terapi,
      isi: (
        <Kolom>
          {!ada && <span style={kecil}>{R.saran}</span>}
          <AreaTeks id="rs-ringkasan" label={R.ringkasan} value={k.ringkasan} maxLength={3000} onChange={set('ringkasan')} aria-invalid={tampil('ringkasan') ? true : undefined} />
          {tampil('ringkasan') && <Peringatan>{g.ringkasan}</Peringatan>}
          <Isian id="rs-diagnosis" label={R.diagnosis} value={k.diagnosis_akhir} onChange={set('diagnosis_akhir')} galat={tampil('diagnosis_akhir')} autoComplete="off" />
          <AreaTeks id="rs-terapi" label={R.terapi} value={k.terapi} maxLength={1000} onChange={set('terapi')} />
        </Kolom>
      ),
    },
    {
      id: 'pulang', judul: R.langkah.pulang, selesai: !g.kondisi_pulang && !g.alasan,
      isi: (
        <Kolom>
          <Isian id="rs-kondisi" label={R.kondisi} value={k.kondisi_pulang} onChange={set('kondisi_pulang')} galat={tampil('kondisi_pulang')} autoComplete="off" />
          <AreaTeks id="rs-anjuran" label={R.anjuran} value={k.anjuran} maxLength={1000} onChange={set('anjuran')} />
          {ubah && (
            <>
              <AreaTeks id="rs-alasan" label={R.alasan} value={k.alasan} maxLength={500} onChange={set('alasan')} aria-invalid={tampil('alasan') ? true : undefined} />
              <span style={kecil}>{R.alasanPetunjuk}</span>
              {tampil('alasan') && <Peringatan>{g.alasan}</Peringatan>}
            </>
          )}
        </Kolom>
      ),
    },
    {
      id: 'surat', judul: R.langkah.surat, selesai: !g.surat_tujuan && !g.surat_isi,
      isi: (
        <Kolom>
          <strong>{R.suratSudah}</strong>
          {dok && !dok.surat.length && <span style={kecil}>{R.suratTanpa}</span>}
          {dok?.surat.map((s) => <span key={s.id} style={kecil}>{s.nomor_surat} · {R.jenisSurat[s.jenis]}{s.tujuan ? ` · ${s.tujuan}` : ''} · {formatWaktu(s.dibuat_pada)}</span>)}
          <strong>{R.suratBaru}</strong>
          <Pilihan id="rs-jenis" label={R.suratJenis} opsi={OPSI_JENIS} value={k.surat_jenis} onChange={(e) => setK({ ...k, surat_jenis: e.target.value as KeadaanResume['surat_jenis'] })} />
          <Isian id="rs-tujuan" label={R.suratTujuan} value={k.surat_tujuan} onChange={set('surat_tujuan')} galat={tampil('surat_tujuan')} autoComplete="off" />
          <AreaTeks id="rs-isi" label={R.suratIsi} value={k.surat_isi} maxLength={3000} onChange={set('surat_isi')} />
          {tampil('surat_isi') && <Peringatan>{g.surat_isi}</Peringatan>}
        </Kolom>
      ),
    },
    {
      id: 'ringkasan', judul: R.langkah.ringkasan,
      isi: (
        <Kolom>
          {dok?.resume && <span style={kecil}>{R.versi(dok.resume.versi)} · {dok.resume.verifikasi === 'sah' ? R.sah : R.berubah}</span>}
          <DaftarRingkasan bagian={[{
            judul: R.judul,
            baris: [
              { label: R.ringkasan, nilai: k.ringkasan || '-' }, { label: R.diagnosis, nilai: k.diagnosis_akhir || '-' }, { label: R.terapi, nilai: k.terapi || '-' },
              { label: R.kondisi, nilai: k.kondisi_pulang || '-' }, { label: R.anjuran, nilai: k.anjuran || '-' },
              { label: R.langkah.surat, nilai: adaSuratBaru(k) ? `${R.jenisSurat[k.surat_jenis]}${k.surat_tujuan ? ` · ${k.surat_tujuan}` : ''}` : R.ringkasanTanpa },
            ],
          }]} />
        </Kolom>
      ),
    },
  ];

  return (
    <ModalBertahap
      judul={R.judul} langkah={langkah} indeks={indeks} onIndeks={setIndeks} galat={galat} onTutup={tersimpan.current ? onSelesai : onTutup} lindungiTutup={adaPerubahan(awal, k)}
      konteks={dok ? <KepalaPasien nama={dok.kunjungan.pasien_nama} nomorRm={dok.kunjungan.pasien_nomor_rm} /> : undefined}
      labelKirim={memproses ? R.menyimpan : R.simpan} onKirim={() => void kirim()} kirimNonaktif={memproses || !dok || dok.kunjungan.tahap_layanan !== 'ditutup'}
      hasil={hasil === undefined ? undefined : { judul: R.hasilJudul, isi: <p style={{ margin: 0 }}>{R.hasilPesan(hasil)}</p>, aksi: <Tombol type="button" onClick={onSelesai}>{TOMBOL.tutup}</Tombol> }}
      catatan={dok && dok.kunjungan.tahap_layanan !== 'ditutup' ? <Peringatan>{R.belumDitutup}</Peringatan> : undefined}
    />
  );
}
