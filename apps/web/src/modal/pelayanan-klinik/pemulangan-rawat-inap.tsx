import { useMemo, useState } from 'react';
import { DISPOSISI_PULANG, RAWAT_INAP, TOMBOL } from '@klira/shared';
import { pulangkanPasien } from '../../api-klien/rawat-inap';
import { GalatApi } from '../../api-klien/klien';
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
import { KepalaPasien } from './kepala-pasien';
import { awalPulang, bentukPulang, galatPulang, langkahBermasalahPulang } from './keadaan-rawat-inap';
import type { KeadaanPulang } from './keadaan-rawat-inap';

type Props = { kunjunganId: number; pasien: { nama: string; nomor_rm: string }; onTutup: () => void; onSelesai: () => void };
const P = RAWAT_INAP.pulang;
const OPSI_DISPOSISI = DISPOSISI_PULANG.nilai.map((n) => ({ nilai: n, label: DISPOSISI_PULANG.label(n) }));
const kecil = { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil } as const;

/** Modal Pemulangan rawat inap (3.3, MODAL-BERTAHAP): Ringkasan > Diagnosis akhir > Kondisi pulang > Tindak lanjut > Resume medis. Bed dikosongkan, biaya kamar ke tagihan, lanjut ke kasir. */
export function PemulanganRawatInap({ kunjunganId, pasien, onTutup, onSelesai }: Props) {
  const awal = useMemo(awalPulang, []);
  const [k, setK] = useState<KeadaanPulang>(awal);
  const [indeks, setIndeks] = useState(0);
  const [dicoba, setDicoba] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [memproses, setMemproses] = useState(false);
  const [hasil, setHasil] = useState<{ kamar: number; resume: boolean } | null>(null);
  const g = useMemo(() => galatPulang(k), [k]);
  const tampil = (b: string) => (dicoba ? g[b] : undefined);
  const set = (b: keyof KeadaanPulang) => (e: { target: { value: string } }) => setK({ ...k, [b]: e.target.value });

  async function kirim() {
    setDicoba(true);
    if (memproses) return;
    const bermasalah = langkahBermasalahPulang(g);
    if (bermasalah >= 0) return setIndeks(bermasalah);
    setMemproses(true);
    setGalat(null);
    try {
      const h = await pulangkanPasien(kunjunganId, bentukPulang(k));
      setHasil({ kamar: h.tagihan_kamar, resume: h.resume_dibuat });
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : P.gagal);
    } finally {
      setMemproses(false);
    }
  }

  const langkah: LangkahModal[] = [
    {
      id: 'ringkasan', judul: P.langkah.ringkasan, selesai: !g.ringkasan,
      isi: (
        <Kolom>
          <AreaTeks id="pul-ringkasan" label={P.ringkasan} value={k.ringkasan} maxLength={3000} onChange={set('ringkasan')} aria-invalid={tampil('ringkasan') ? true : undefined} />
          {tampil('ringkasan') && <Peringatan>{g.ringkasan}</Peringatan>}
          <AreaTeks id="pul-terapi" label={P.terapi} value={k.terapi} maxLength={1000} onChange={set('terapi')} />
        </Kolom>
      ),
    },
    {
      id: 'diagnosis', judul: P.langkah.diagnosis, selesai: !g.diagnosis_akhir,
      isi: <Kolom><Isian id="pul-diagnosis" label={P.diagnosis} value={k.diagnosis_akhir} onChange={set('diagnosis_akhir')} galat={tampil('diagnosis_akhir')} autoComplete="off" /></Kolom>,
    },
    {
      id: 'kondisi', judul: P.langkah.kondisi, selesai: !g.disposisi && !g.kondisi_pulang,
      isi: (
        <Kolom>
          <Pilihan id="pul-disposisi" label={P.disposisi} opsi={OPSI_DISPOSISI} value={k.disposisi} onChange={set('disposisi')} galat={tampil('disposisi')} />
          <Isian id="pul-kondisi" label={P.kondisi} value={k.kondisi_pulang} onChange={set('kondisi_pulang')} galat={tampil('kondisi_pulang')} autoComplete="off" />
        </Kolom>
      ),
    },
    { id: 'tindak', judul: P.langkah.tindak, isi: <Kolom><AreaTeks id="pul-tindak" label={P.tindak} value={k.tindak_lanjut} maxLength={1000} onChange={set('tindak_lanjut')} /></Kolom> },
    {
      id: 'resume', judul: P.langkah.resume,
      isi: (
        <Kolom>
          <KotakCentang id="pul-resume" label={P.buatResume} keterangan={P.buatResumePetunjuk} checked={k.buat_resume} onChange={(e) => setK({ ...k, buat_resume: e.target.checked })} />
          <DaftarRingkasan bagian={[{
            judul: P.judul,
            baris: [
              { label: P.ringkasan, nilai: k.ringkasan || '-' }, { label: P.terapi, nilai: k.terapi || '-' }, { label: P.diagnosis, nilai: k.diagnosis_akhir || '-' },
              { label: P.disposisi, nilai: k.disposisi ? DISPOSISI_PULANG.label(k.disposisi) : '-' }, { label: P.kondisi, nilai: k.kondisi_pulang || '-' }, { label: P.tindak, nilai: k.tindak_lanjut || '-' },
            ],
          }]} />
          <span style={kecil}>{P.info}</span>
        </Kolom>
      ),
    },
  ];

  return (
    <ModalBertahap
      judul={P.judul} langkah={langkah} indeks={indeks} onIndeks={setIndeks} galat={galat} onTutup={hasil ? onSelesai : onTutup} lindungiTutup={adaPerubahan(awal, k)} konteks={<KepalaPasien nama={pasien.nama} nomorRm={pasien.nomor_rm} />}
      labelKirim={memproses ? P.menyimpan : P.simpan} onKirim={() => void kirim()} kirimNonaktif={memproses}
      hasil={hasil ? { judul: P.hasilJudul, isi: <p style={{ margin: 0 }}>{P.hasilPesan(hasil.kamar, hasil.resume)}</p>, aksi: <Tombol type="button" onClick={onSelesai}>{TOMBOL.tutup}</Tombol> } : undefined}
    />
  );
}
