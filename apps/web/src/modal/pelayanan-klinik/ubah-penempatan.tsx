import { useEffect, useMemo, useState } from 'react';
import { INDIKATOR_KELAS, KELAS_RAWAT, RAWAT_INAP, TOMBOL } from '@klira/shared';
import type { OpsiRawatInapDto, RawatInapDto } from '@klira/shared';
import { ambilOpsiRawatInap, ambilRawatInap, ubahPenempatan } from '../../api-klien/rawat-inap';
import { GalatApi } from '../../api-klien/klien';
import { token } from '../../gaya/token';
import { Modal1 } from '../../komponen/modal-1/modal-1';
import { AreaTeks } from '../../komponen/ui/area-teks';
import { KotakCentang } from '../../komponen/ui/kotak-centang';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Pilihan } from '../../komponen/ui/pilihan';
import { Kolom } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { adaPerubahan } from '../../util/draf';
import { formatWaktu } from '../../util/penyaring-tab';
import { KepalaPasien } from './kepala-pasien';
import { rupiah } from './keadaan-order-lab';
import { awalPenempatan, bentukPenempatan, galatPenempatan } from './keadaan-rawat-inap';
import type { KeadaanPenempatan } from './keadaan-rawat-inap';

type Props = { kunjunganId: number; onTutup: () => void; onSelesai: () => void };
const P = RAWAT_INAP.penempatan;
const A = RAWAT_INAP.admisi;
const OPSI_KELAS = KELAS_RAWAT.nilai.map((n) => ({ nilai: n, label: KELAS_RAWAT.label(n) }));
const OPSI_INDIKATOR = INDIKATOR_KELAS.nilai.map((n) => ({ nilai: n, label: INDIKATOR_KELAS.label(n) }));
const kecil = { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil } as const;

/** Modal Ubah penempatan (3.3, MODAL-1): pindah bed atau kelas (alasan wajib) dan/atau ganti DPJP; riwayat penempatan tetap tersimpan. */
export function UbahPenempatan({ kunjunganId, onTutup, onSelesai }: Props) {
  const [data, setData] = useState<RawatInapDto | null>(null);
  const [opsi, setOpsi] = useState<OpsiRawatInapDto | null>(null);
  const [k, setK] = useState<KeadaanPenempatan>(() => awalPenempatan(null));
  const [awal, setAwal] = useState<KeadaanPenempatan>(() => awalPenempatan(null));
  const [dicoba, setDicoba] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [memproses, setMemproses] = useState(false);
  const [tersimpan, setTersimpan] = useState(false);

  useEffect(() => {
    let batal = false;
    Promise.all([ambilRawatInap(kunjunganId), ambilOpsiRawatInap()])
      .then(([d, o]) => {
        if (batal) return;
        const a = awalPenempatan(d);
        setData(d);
        setOpsi(o);
        setAwal(a);
        setK(a);
      })
      .catch((e) => !batal && setGalat(e instanceof GalatApi ? e.message : P.gagal));
    return () => {
      batal = true;
    };
  }, [kunjunganId]);

  const aktif = data?.penempatan.find((x) => !x.selesai) ?? null;
  const g = useMemo(() => {
    const e = galatPenempatan(k);
    const berubah = !!aktif && (k.bed_id !== awal.bed_id || k.kelas !== awal.kelas || k.indikator !== awal.indikator || k.tarif_id !== awal.tarif_id);
    if (berubah && !k.alasan.trim()) e.alasan = RAWAT_INAP.galat.alasanPindah;
    return e;
  }, [k, aktif, awal]);
  const tampil = (b: string) => (dicoba ? g[b] : undefined);
  const set = (b: keyof KeadaanPenempatan) => (e: { target: { value: string } }) => setK({ ...k, [b]: e.target.value });
  const dpjp = (opsi?.dpjp ?? []).map((d) => ({ nilai: String(d.id), label: `${d.nama}${d.profesi ? ` (${d.profesi})` : ''}` }));
  const butuhAlasan = !!aktif && (k.bed_id !== '' || k.kelas !== awal.kelas || k.indikator !== awal.indikator || k.tarif_id !== awal.tarif_id);

  async function simpan() {
    setDicoba(true);
    if (Object.keys(g).length || memproses) return;
    setMemproses(true);
    setGalat(null);
    try {
      await ubahPenempatan(kunjunganId, bentukPenempatan(k));
      setTersimpan(true);
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : P.gagal);
    } finally {
      setMemproses(false);
    }
  }

  if (tersimpan) {
    return (
      <Modal1 judul={P.judul} lebar="modalKecil" onTutup={onSelesai} aksi={<Tombol type="button" onClick={onSelesai}>{TOMBOL.tutup}</Tombol>}>
        <Peringatan nada="biru">{P.tersimpan}</Peringatan>
      </Modal1>
    );
  }

  return (
    <Modal1
      judul={P.judul} lebar="modalBesar" lindungiTutup={adaPerubahan(awal, k)} onTutup={onTutup}
      konteks={data ? <KepalaPasien nama={data.kunjungan.pasien_nama} nomorRm={data.kunjungan.pasien_nomor_rm} /> : undefined}
      aksi={<><Tombol type="button" varian="sekunder" onClick={onTutup}>{TOMBOL.batal}</Tombol><Tombol type="submit" form="bentuk-penempatan" disabled={memproses || !data}>{memproses ? P.menyimpan : P.simpan}</Tombol></>}
    >
      {galat && <Peringatan>{galat}</Peringatan>}
      <Kolom tag="form" id="bentuk-penempatan" noValidate onSubmit={(e) => { e.preventDefault(); void simpan(); }}>
        <span style={kecil}>{aktif ? `${P.sekarang}: ${[aktif.ruang_nama, aktif.bed_nama].filter(Boolean).join(' · ')} · ${KELAS_RAWAT.label(aktif.kelas)}` : P.belumAda}</span>
        <Pilihan id="pn-bed" label={P.bed} opsi={[{ nilai: '', label: aktif ? P.tetap : A.bedMenunggu }, ...(opsi?.bed_kosong ?? []).map((b) => ({ nilai: String(b.id), label: `${b.ruang_nama ? `${b.ruang_nama} · ` : ''}${b.nama}` }))]} value={k.bed_id} onChange={set('bed_id')} galat={tampil('bed_id')} />
        <Pilihan id="pn-kelas" label={A.kelas} opsi={OPSI_KELAS} value={k.kelas} onChange={set('kelas')} galat={tampil('kelas')} />
        <Pilihan id="pn-indikator" label={A.indikator} opsi={OPSI_INDIKATOR} value={k.indikator} onChange={set('indikator')} />
        <Pilihan id="pn-tarif" label={A.tarif} opsi={[{ nilai: '', label: A.tarifTanpa }, ...(opsi?.tarif_kamar ?? []).map((t) => ({ nilai: String(t.id), label: `${t.nama} (${rupiah(t.harga_umum)})` }))]} value={k.tarif_id} onChange={set('tarif_id')} />
        {butuhAlasan && <AreaTeks id="pn-alasan" label={P.alasan} value={k.alasan} maxLength={300} onChange={set('alasan')} aria-invalid={tampil('alasan') ? true : undefined} />}
        {tampil('alasan') && <Peringatan>{g.alasan}</Peringatan>}
        <Pilihan id="pn-dpjp" label={A.dpjpUtama} opsi={dpjp} value={k.dpjp_id} onChange={set('dpjp_id')} galat={tampil('dpjp_id')} />
        <Kolom jarak="xs" role="group" aria-label={A.dpjpBersama}>
          <strong>{A.dpjpBersama}</strong>
          {(opsi?.dpjp ?? []).filter((d) => String(d.id) !== k.dpjp_id).map((d) => (
            <KotakCentang
              key={d.id} id={`pn-bersama-${d.id}`} label={d.nama} checked={k.dpjp_bersama.includes(String(d.id))}
              onChange={(e) => setK({ ...k, dpjp_bersama: e.target.checked ? [...k.dpjp_bersama, String(d.id)] : k.dpjp_bersama.filter((x) => x !== String(d.id)) })}
            />
          ))}
          <span style={kecil}>{P.dpjpPetunjuk}</span>
          {tampil('dpjp_bersama') && <Peringatan>{g.dpjp_bersama}</Peringatan>}
        </Kolom>
        {!!data?.penempatan.length && (
          <Kolom jarak="xs">
            <strong>{P.riwayat}</strong>
            {[...data.penempatan].reverse().map((x) => <span key={x.id} style={kecil}>{[x.ruang_nama, x.bed_nama].filter(Boolean).join(' · ')} · {KELAS_RAWAT.label(x.kelas)} · {INDIKATOR_KELAS.label(x.indikator)} · {formatWaktu(x.mulai)}{x.selesai ? ` - ${formatWaktu(x.selesai)}` : ''}</span>)}
          </Kolom>
        )}
      </Kolom>
    </Modal1>
  );
}
