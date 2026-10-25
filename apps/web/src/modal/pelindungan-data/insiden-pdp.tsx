import { useMemo, useState } from 'react';
import { PDP, TOMBOL } from '@klira/shared';
import type { InsidenDto } from '@klira/shared';
import { detailPasien } from '../../api-klien/pasien';
import { simpanInsiden } from '../../api-klien/pdp';
import { GalatApi } from '../../api-klien/klien';
import { token } from '../../gaya/token';
import { ModalBertahap } from '../../komponen/modal-bertahap/modal-bertahap';
import type { LangkahModal } from '../../komponen/modal-bertahap/modal-bertahap';
import { PemilihPasien } from '../../komponen/pemilih-pasien';
import { AreaTeks } from '../../komponen/ui/area-teks';
import { Isian } from '../../komponen/ui/isian';
import { KotakCentang } from '../../komponen/ui/kotak-centang';
import { Peringatan } from '../../komponen/ui/peringatan';
import { DaftarRingkasan, Kolom, Sebaris } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { adaPerubahan } from '../../util/draf';
import { formatWaktu } from '../../util/penyaring-tab';
import { awalInsiden, bentukInsiden, buangPasienTerdampak, galatInsiden, langkahBermasalahInsiden, tambahPasienTerdampak } from './keadaan-pdp';
import type { KeadaanInsiden } from './keadaan-pdp';

const I = PDP.insiden;
const kecil = { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil } as const;
const batasDari = (diketahui: string): string => (diketahui ? new Date(new Date(`${diketahui}:00+07:00`).getTime() + 72 * 3_600_000).toISOString() : '');

/** Modal Insiden kebocoran (3.3, MODAL-BERTAHAP): Kejadian > Dampak > Penanganan dan pemulihan > Notifikasi; `insiden` terisi berarti memperbarui (daftar pasien terdampak hanya bertambah). */
export function InsidenPdp({ insiden = null, onTutup, onSelesai }: { insiden?: InsidenDto | null; onTutup: () => void; onSelesai: () => void }) {
  const awal = useMemo(() => awalInsiden(insiden), [insiden]);
  const [k, setK] = useState<KeadaanInsiden>(awal);
  const [pilih, setPilih] = useState<number | null>(null);
  const [indeks, setIndeks] = useState(0);
  const [dicoba, setDicoba] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [memproses, setMemproses] = useState(false);
  const [selesai, setSelesai] = useState(false);
  const g = useMemo(() => galatInsiden(k), [k]);
  const tampil = (b: string) => (dicoba ? g[b] : undefined);
  const set = (b: keyof KeadaanInsiden) => (e: { target: { value: string } }) => setK({ ...k, [b]: e.target.value });
  const terkunci = (id: number) => !!insiden?.pasien.some((p) => p.id === id);

  async function tambahPasien() {
    if (pilih === null) return;
    try {
      const p = await detailPasien(pilih);
      setK((s) => tambahPasienTerdampak(s, { id: p.id, nama: p.nama, nomor_rm: p.nomor_rm }));
      setPilih(null);
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : I.gagal);
    }
  }

  async function kirim() {
    setDicoba(true);
    if (memproses) return;
    const m = langkahBermasalahInsiden(g);
    if (m >= 0) return setIndeks(m);
    setMemproses(true);
    setGalat(null);
    try {
      await simpanInsiden(insiden?.id ?? null, bentukInsiden(k));
      setSelesai(true);
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : I.gagal);
    } finally {
      setMemproses(false);
    }
  }

  const langkah: LangkahModal[] = [
    {
      id: 'kejadian', judul: I.langkah.kejadian, selesai: !g.waktu_kejadian && !g.waktu_diketahui && !g.uraian,
      isi: (
        <Kolom>
          <Isian id="ins-kejadian" label={I.waktuKejadian} type="datetime-local" value={k.waktu_kejadian} onChange={set('waktu_kejadian')} galat={tampil('waktu_kejadian')} />
          <Isian id="ins-diketahui" label={I.waktuDiketahui} type="datetime-local" value={k.waktu_diketahui} onChange={set('waktu_diketahui')} galat={tampil('waktu_diketahui')} />
          {k.waktu_diketahui && <span style={kecil}>{I.batas(formatWaktu(batasDari(k.waktu_diketahui)))}</span>}
          <KotakCentang id="ins-siber" label={I.siber} checked={k.siber} onChange={(e) => setK({ ...k, siber: e.target.checked })} />
          <AreaTeks id="ins-uraian" label={I.uraian} value={k.uraian} maxLength={4000} onChange={set('uraian')} aria-invalid={tampil('uraian') ? true : undefined} />
          {tampil('uraian') && <Peringatan>{g.uraian}</Peringatan>}
        </Kolom>
      ),
    },
    {
      id: 'dampak', judul: I.langkah.dampak, selesai: !g.data_terungkap && !g.pasien_ids,
      isi: (
        <Kolom>
          <AreaTeks id="ins-data" label={I.dataTerungkap} value={k.data_terungkap} maxLength={1000} onChange={set('data_terungkap')} aria-invalid={tampil('data_terungkap') ? true : undefined} />
          {tampil('data_terungkap') && <Peringatan>{g.data_terungkap}</Peringatan>}
          <strong>{I.pasienTerdampak} ({k.pasien.length})</strong>
          {!k.pasien.length && <span style={kecil}>{I.kosongPasien}</span>}
          {k.pasien.map((p) => (
            <Sebaris key={p.id} jarak="sm">
              <span style={{ flexGrow: 1 }}>{p.nama} <span style={kecil}>{p.nomor_rm}</span></span>
              {!terkunci(p.id) && <Tombol type="button" varian="teks" onClick={() => setK(buangPasienTerdampak(k, p.id))}>{I.buang}</Tombol>}
            </Sebaris>
          ))}
          <PemilihPasien id="ins-pasien" pasienId={pilih} onPilih={setPilih} />
          <Tombol type="button" varian="sekunder" disabled={pilih === null} onClick={() => void tambahPasien()}>{I.tambahPasien}</Tombol>
        </Kolom>
      ),
    },
    {
      id: 'penanganan', judul: I.langkah.penanganan,
      isi: (
        <Kolom>
          <AreaTeks id="ins-penanganan" label={I.penanganan} value={k.penanganan} maxLength={4000} onChange={set('penanganan')} />
          <AreaTeks id="ins-pemulihan" label={I.pemulihan} value={k.pemulihan} maxLength={4000} onChange={set('pemulihan')} />
          <Isian id="ins-kontak" label={I.kontak} value={k.kontak_ppdp} onChange={set('kontak_ppdp')} autoComplete="off" />
        </Kolom>
      ),
    },
    {
      id: 'notifikasi', judul: I.langkah.notifikasi, selesai: !g.notifikasi_pasien_pada && !g.notifikasi_lembaga_pada,
      isi: (
        <Kolom>
          {k.waktu_diketahui && <Peringatan nada="biru">{I.batas(formatWaktu(batasDari(k.waktu_diketahui)))}</Peringatan>}
          <Isian id="ins-notif-pasien" label={I.notifPasien} type="datetime-local" value={k.notifikasi_pasien_pada} onChange={set('notifikasi_pasien_pada')} galat={tampil('notifikasi_pasien_pada')} />
          <Isian id="ins-notif-lembaga" label={I.notifLembaga} type="datetime-local" value={k.notifikasi_lembaga_pada} onChange={set('notifikasi_lembaga_pada')} galat={tampil('notifikasi_lembaga_pada')} />
          <DaftarRingkasan bagian={[{ judul: I.judul, baris: [{ label: I.uraian, nilai: k.uraian || '-' }, { label: I.dataTerungkap, nilai: k.data_terungkap || '-' }, { label: I.pasienTerdampak, nilai: I.terdampak(k.pasien.length) }, { label: I.penanganan, nilai: k.penanganan || '-' }] }]} />
        </Kolom>
      ),
    },
  ];

  return (
    <ModalBertahap
      judul={I.judul} langkah={langkah} indeks={indeks} onIndeks={setIndeks} galat={galat} onTutup={selesai ? onSelesai : onTutup} lindungiTutup={adaPerubahan(awal, k)}
      labelKirim={memproses ? PDP.menyimpan : I.simpan} onKirim={() => void kirim()} kirimNonaktif={memproses}
      hasil={selesai ? { judul: I.hasilJudul, isi: <p style={{ margin: 0 }}>{I.hasilPesan}</p>, aksi: <Tombol type="button" onClick={onSelesai}>{TOMBOL.tutup}</Tombol> } : undefined}
    />
  );
}
