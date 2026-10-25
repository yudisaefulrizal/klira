import { useMemo, useState } from 'react';
import { PDP, TOMBOL } from '@klira/shared';
import type { HakDto } from '@klira/shared';
import { prosesHak } from '../../api-klien/pdp';
import { GalatApi } from '../../api-klien/klien';
import { ModalBertahap } from '../../komponen/modal-bertahap/modal-bertahap';
import type { LangkahModal } from '../../komponen/modal-bertahap/modal-bertahap';
import { AreaTeks } from '../../komponen/ui/area-teks';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Pilihan } from '../../komponen/ui/pilihan';
import { DaftarRingkasan, Kolom } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { token } from '../../gaya/token';
import { adaPerubahan } from '../../util/draf';
import { formatWaktu } from '../../util/penyaring-tab';
import { awalProsesHak, bentukProsesHak, galatProsesHak, indeksTahapHak } from './keadaan-pdp';
import type { KeadaanProsesHak } from './keadaan-pdp';

const H = PDP.hak;
const kecil = { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil } as const;

/** Modal Proses permintaan hak (3.3, MODAL-BERTAHAP): Tinjau > Keputusan > Pelaksanaan > Notifikasi; hanya tahap berikutnya yang dapat diisi, kirim menyimpan tahap itu. */
export function ProsesHak({ hak, onTutup, onSelesai }: { hak: HakDto; onTutup: () => void; onSelesai: () => void }) {
  const tahap = hak.tahap_berikut;
  const awal = useMemo(awalProsesHak, []);
  const [k, setK] = useState<KeadaanProsesHak>(awal);
  const [indeks, setIndeks] = useState(indeksTahapHak(tahap));
  const [dicoba, setDicoba] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [memproses, setMemproses] = useState(false);
  const [selesai, setSelesai] = useState(false);
  const g = useMemo(() => (tahap ? galatProsesHak(tahap, k) : {}), [tahap, k]);
  const tampil = (b: string) => (dicoba ? g[b] : undefined);
  const set = (b: keyof KeadaanProsesHak) => (e: { target: { value: string } }) => setK({ ...k, [b]: e.target.value });

  async function kirim() {
    setDicoba(true);
    if (!tahap || memproses) return;
    if (Object.keys(g).length) return setIndeks(indeksTahapHak(tahap));
    setMemproses(true);
    setGalat(null);
    try {
      await prosesHak(hak.id, bentukProsesHak(tahap, k));
      setSelesai(true);
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : H.gagalProses);
    } finally {
      setMemproses(false);
    }
  }

  const menunggu = (tahapIni: string, isi: React.ReactNode) => (tahap === tahapIni ? isi : <span style={kecil}>{tahap === null ? H.selesai : H.tahapBerikut[tahap]}</span>);
  const langkah: LangkahModal[] = [
    {
      id: 'tinjau', judul: H.langkahProses.tinjau,
      isi: (
        <Kolom>
          <span style={kecil}>{H.tinjauInfo}</span>
          <DaftarRingkasan bagian={[{
            judul: `${hak.pasien_nama} (${hak.pasien_nomor_rm})`,
            baris: [
              { label: H.jenis, nilai: H.hakLabel[hak.jenis] }, { label: H.pemohon, nilai: `${hak.pemohon_nama} (${H.hubunganLabel[hak.pemohon_hubungan]}) · ${H.saluranLabel[hak.saluran]}` }, { label: H.verifikasi, nilai: hak.verifikasi },
              { label: H.rincian, nilai: hak.rincian ?? '-' }, { label: H.kolom.batas, nilai: `${formatWaktu(hak.batas_waktu)}${hak.sisa_jam !== null ? ` · ${PDP.batas.sisa(hak.sisa_jam)}` : ''}` }, { label: H.kolom.status, nilai: hak.tahap_berikut ? H.tahapBerikut[hak.tahap_berikut] : H.selesai },
            ],
          }]} />
        </Kolom>
      ),
    },
    {
      id: 'keputusan', judul: H.langkahProses.keputusan, selesai: tahap !== 'keputusan',
      isi: menunggu('keputusan', (
        <Kolom>
          <Pilihan id="ph-keputusan" label={H.keputusan} opsi={[{ nilai: '', label: '...' }, { nilai: 'setujui', label: H.setujui }, { nilai: 'tolak', label: H.tolak }]} value={k.keputusan} onChange={set('keputusan')} galat={tampil('keputusan')} />
          {k.keputusan === 'tolak' && (
            <>
              <AreaTeks id="ph-alasan" label={H.alasanTolak} value={k.alasan} maxLength={500} onChange={set('alasan')} aria-invalid={tampil('alasan') ? true : undefined} />
              <span style={kecil}>{tampil('alasan') ?? H.alasanTolakPetunjuk}</span>
            </>
          )}
        </Kolom>
      )),
    },
    {
      id: 'pelaksanaan', judul: H.langkahProses.pelaksanaan, selesai: tahap === 'notifikasi' || tahap === null,
      isi: menunggu('pelaksanaan', (
        <Kolom>
          <AreaTeks id="ph-pelaksanaan" label={H.pelaksanaan} value={k.pelaksanaan} maxLength={1000} onChange={set('pelaksanaan')} aria-invalid={tampil('pelaksanaan') ? true : undefined} />
          {tampil('pelaksanaan') && <Peringatan>{g.pelaksanaan}</Peringatan>}
        </Kolom>
      )),
    },
    {
      id: 'notifikasi', judul: H.langkahProses.notifikasi, selesai: tahap === null,
      isi: menunggu('notifikasi', (
        <Kolom>
          <AreaTeks id="ph-catatan" label={H.notifikasi} value={k.catatan} maxLength={300} onChange={set('catatan')} />
          <span style={kecil}>{H.notifikasiPetunjuk}</span>
        </Kolom>
      )),
    },
  ];

  return (
    <ModalBertahap
      judul={H.prosesJudul} langkah={langkah} indeks={indeks} onIndeks={setIndeks} galat={galat} onTutup={selesai ? onSelesai : onTutup} lindungiTutup={adaPerubahan(awal, k)}
      labelKirim={memproses ? H.memproses : H.simpanProses} onKirim={() => void kirim()} kirimNonaktif={memproses || tahap === null}
      hasil={selesai ? { judul: H.prosesJudul, isi: <p style={{ margin: 0 }}>{H.tahapTersimpan}</p>, aksi: <Tombol type="button" onClick={onSelesai}>{TOMBOL.tutup}</Tombol> } : undefined}
    />
  );
}
