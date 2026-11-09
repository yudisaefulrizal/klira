import { useEffect, useRef, useState } from 'react';
import { FARMASI, STATUS_RESEP, TOMBOL } from '@klira/shared';
import type { HasilSiapDto, KonteksKlinisDto, ResepDto } from '@klira/shared';
import { resepKunjungan, siapkanResep, telaahResep } from '../../api-klien/farmasi';
import { ambilKonteksKlinis } from '../../api-klien/klinis';
import { GalatApi } from '../../api-klien/klien';
import { token } from '../../gaya/token';
import { Modal1 } from '../../komponen/modal-1/modal-1';
import { AreaTeks } from '../../komponen/ui/area-teks';
import { Bingkai } from '../../komponen/ui/kartu';
import { KotakCentang } from '../../komponen/ui/kotak-centang';
import { Lencana } from '../../komponen/ui/lencana';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Kolom, Sebaris, Tumbuh } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { KepalaPasien } from './kepala-pasien';
import { awalTelaah, galatTelaah, telaahLengkap } from './keadaan-farmasi';
import { resepTerkunci as terkunci, simpanSeluruhTelaah } from './simpan-telaah';
import type { IsianTelaah } from './simpan-telaah';

type Props = { kunjunganId: number; pasien: { id: number; nama: string; nomor_rm: string }; onTutup: () => void; onSelesai: () => void };
type Isian = IsianTelaah;
const T = FARMASI.telaah;

function KartuResep({ resep, k, ubah, memproses, dicoba }: { resep: ResepDto; k: Isian; ubah: (k: Isian) => void; memproses: boolean; dicoba: boolean }) {
  const g = galatTelaah(k);
  const dikunci = terkunci(resep) || memproses;
  return <Bingkai arah="kolom" jarak="sm" padding="md">
    <Sebaris jarak="sm" bungkus>
      <Tumbuh tag="span"><strong>{T.resep(resep.nomor_resep)}</strong></Tumbuh>
      <Lencana warna={STATUS_RESEP.warna(resep.status)}>{STATUS_RESEP.label(resep.status)}</Lencana>
    </Sebaris>
    <small style={{ color: token.warna.teksRedup }}>Dokter: {resep.dpjp_nama ?? 'Belum tercatat'} · {new Date(resep.dibuat_pada).toLocaleString('id-ID')}</small>
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }} aria-label={FARMASI.resep.daftarObat}>
        <thead><tr>{['Obat', 'Jumlah', 'Aturan pakai', 'Stok'].map((h) => <th key={h} style={{ padding: 8 }}>{h}</th>)}</tr></thead>
        <tbody>{resep.item.map((i) => <tr key={i.id}>
          <td style={{ padding: 8 }}><strong>{i.nama}</strong>{i.bentuk && <small style={{ display: 'block' }}>{i.bentuk}</small>}</td>
          <td style={{ padding: 8 }}>{i.jumlah} {i.satuan}</td>
          <td style={{ padding: 8 }}>{i.aturan_pakai}{i.rute && <small style={{ display: 'block' }}>Cara pemberian: {i.rute}</small>}</td>
          <td style={{ padding: 8, color: i.stok_tersedia < i.jumlah ? token.warna.status.merah.teks : undefined }}>{i.stok_tersedia} {i.satuan}</td>
        </tr>)}</tbody>
      </table>
    </div>
    <Kolom jarak="xs" role="group" aria-label={`Hasil telaah ${resep.nomor_resep}`}>
      <KotakCentang id={`tel-adm-${resep.id}`} label={T.administratif} checked={k.administratif} disabled={dikunci} onChange={(e) => ubah({ ...k, administratif: e.target.checked })} />
      <KotakCentang id={`tel-far-${resep.id}`} label={T.farmasetik} checked={k.farmasetik} disabled={dikunci} onChange={(e) => ubah({ ...k, farmasetik: e.target.checked })} />
      <KotakCentang id={`tel-kli-${resep.id}`} label={T.klinis} checked={k.klinis} disabled={dikunci} onChange={(e) => ubah({ ...k, klinis: e.target.checked })} />
      <AreaTeks id={`tel-cat-${resep.id}`} label={T.catatan} rows={2} style={{ height: 'auto' }} value={k.catatan} maxLength={1000} disabled={dikunci} onChange={(e) => ubah({ ...k, catatan: e.target.value })} aria-invalid={dicoba && g.catatan ? true : undefined} />
      {dicoba && g.catatan && <Peringatan>{g.catatan}</Peringatan>}
      <KotakCentang id={`tel-siap-${resep.id}`} label="Obat selesai disiapkan" checked={k.siap} disabled={dikunci} onChange={(e) => ubah({ ...k, siap: e.target.checked })} />
      {dicoba && k.siap && !telaahLengkap(k) && <Peringatan>Lengkapi ketiga telaah sebelum menandai obat selesai disiapkan.</Peringatan>}
    </Kolom>
    {resep.telaah && <small style={{ color: token.warna.teksRedup }}>{T.oleh(resep.telaah.apoteker_nama ?? '-')}</small>}
  </Bingkai>;
}

export function TelaahResep({ kunjunganId, pasien, onTutup, onSelesai }: Props) {
  const [daftar, setDaftar] = useState<ResepDto[] | null>(null);
  const [isian, setIsian] = useState<Record<number, Isian>>({});
  const [konteks, setKonteks] = useState<KonteksKlinisDto | null>(null);
  const [galatKonteks, setGalatKonteks] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [kekurangan, setKekurangan] = useState<HasilSiapDto['kekurangan']>([]);
  const [memproses, setMemproses] = useState(false);
  const [berubah, setBerubah] = useState(false);
  const [dicoba, setDicoba] = useState(false);
  const menyimpan = useRef(false);
  useEffect(() => {
    let batal = false;
    resepKunjungan(kunjunganId).then((data) => {
      if (batal) return;
      setDaftar(data);
      setIsian(Object.fromEntries(data.map((r) => [r.id, { ...awalTelaah(r.telaah), siap: terkunci(r) }])));
    }).catch((e) => { if (!batal) setGalat(e instanceof GalatApi ? e.message : FARMASI.resep.gagalMuat); });
    ambilKonteksKlinis(kunjunganId).then((k) => { if (!batal) setKonteks(k); }).catch(() => { if (!batal) setGalatKonteks(true); });
    return () => { batal = true; };
  }, [kunjunganId]);
  async function simpan() {
    if (menyimpan.current || !daftar) return;
    setDicoba(true);
    const aktif = daftar.filter((r) => !terkunci(r));
    if (aktif.some((r) => Object.keys(galatTelaah(isian[r.id])).length || (isian[r.id].siap && !telaahLengkap(isian[r.id])))) {
      setGalat('Periksa hasil telaah pada setiap resep.'); return;
    }
    menyimpan.current = true; setMemproses(true); setGalat(null); setInfo(null);
    const kurang: HasilSiapDto['kekurangan'] = [];
    let tersimpan = 0;
    try {
      await simpanSeluruhTelaah(daftar, isian, {
        telaah: telaahResep, siapkan: siapkanResep,
        tersimpan: (baru) => {
          setBerubah(true);
          setDaftar((lama) => lama?.map((x) => x.id === baru.id ? baru : x) ?? null);
        },
        kekurangan: (hasil) => kurang.push(...hasil),
        selesaiResep: () => { tersimpan++; },
      });
      setInfo('Seluruh hasil telaah dan status penyiapan telah disimpan.');
    } catch (e) {
      setGalat(`${tersimpan ? `${tersimpan} resep sudah disimpan. ` : ''}${e instanceof GalatApi ? e.message : T.gagal} Isian tetap tersedia; simpan kembali untuk melanjutkan.`);
    } finally {
      setKekurangan(kurang); menyimpan.current = false; setMemproses(false);
    }
  }
  const tutup = () => { if (!menyimpan.current) (berubah ? onSelesai : onTutup)(); };
  return <Modal1 judul={T.judul} lebar="modalBesar" konteks={<KepalaPasien nama={pasien.nama} nomorRm={pasien.nomor_rm} />} onTutup={tutup}
    aksi={<Sebaris jarak="sm"><Tombol type="button" varian="sekunder" disabled={memproses} onClick={tutup}>{TOMBOL.tutup}</Tombol><Tombol type="button" disabled={memproses || !daftar?.some((r) => !terkunci(r))} onClick={() => void simpan()}>{memproses ? 'Menyimpan…' : 'Simpan'}</Tombol></Sebaris>}>
    {galat && <Peringatan>{galat}</Peringatan>}
    {info && <Peringatan nada="biru">{info}</Peringatan>}
    <Bingkai arah="kolom" jarak="sm" padding="md">
      <strong>Ringkasan klinis</strong>
      {konteks ? <>
        <span>{konteks.pasien.umur_tahun} tahun · {konteks.pasien.jenis_kelamin === 'perempuan' ? 'Perempuan' : 'Laki-laki'} · Berat badan: {konteks.tanda_vital_terakhir?.berat_badan != null ? `${konteks.tanda_vital_terakhir.berat_badan} kg` : 'Belum tercatat'}</span>
        <span>Diagnosis: {konteks.diagnosis_aktif.map((d) => `${d.kode} — ${d.nama}`).join('; ') || 'Belum tercatat'}</span>
        <Peringatan nada="biru">Alergi: {konteks.alergi?.trim() || 'Alergi belum dikaji'}</Peringatan>
      </> : <Peringatan nada="biru">{galatKonteks ? 'Ringkasan klinis gagal dimuat. Periksa informasi pasien sebelum menyelesaikan telaah.' : 'Memuat informasi pasien…'}</Peringatan>}
    </Bingkai>
    {kekurangan.length > 0 && <Peringatan><strong>{T.stokKurangJudul}</strong>{kekurangan.map((x, n) => <div key={n}>{T.stokKurang(x.nama, x.butuh, x.tersedia)}</div>)}</Peringatan>}
    {!daftar && !galat && <span>{FARMASI.memuat}</span>}
    {daftar?.length === 0 && <span>{T.kosong}</span>}
    <Kolom>{daftar?.map((r) => <KartuResep key={r.id} resep={r} k={isian[r.id]} dicoba={dicoba} memproses={memproses} ubah={(k) => { setIsian((lama) => ({ ...lama, [r.id]: k })); setInfo(null); }} />)}</Kolom>
  </Modal1>;
}
