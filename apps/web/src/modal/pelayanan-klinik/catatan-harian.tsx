import { useCallback, useEffect, useMemo, useState } from 'react';
import { KLINIS, RAWAT_INAP, TANDA_VITAL, TOMBOL } from '@klira/shared';
import type { CatatanHarianDto } from '@klira/shared';
import { daftarCatatanHarian, tambahCatatanHarian } from '../../api-klien/rawat-inap';
import { GalatApi } from '../../api-klien/klien';
import { token } from '../../gaya/token';
import { Modal1 } from '../../komponen/modal-1/modal-1';
import { AreaTeks } from '../../komponen/ui/area-teks';
import { Bingkai } from '../../komponen/ui/kartu';
import { Isian } from '../../komponen/ui/isian';
import { Lencana } from '../../komponen/ui/lencana';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Kolom, Sebaris } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { adaPerubahan } from '../../util/draf';
import { formatWaktu } from '../../util/penyaring-tab';
import { KepalaPasien } from './kepala-pasien';
import { awalCatatan, bentukCatatan, galatCatatan } from './keadaan-rawat-inap';
import type { KeadaanCatatan } from './keadaan-rawat-inap';

type Props = { kunjunganId: number; pasien: { nama: string; nomor_rm: string }; sudahPulang?: boolean; onTutup: () => void };
const C = RAWAT_INAP.cppt;
const kecil = { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil } as const;

/** Modal Catatan harian (CPPT, 3.3, MODAL-1): tambah catatan SOAP (disahkan saat disimpan) dan baca catatan sebelumnya; catatan tidak diubah atau dihapus. */
export function CatatanHarian({ kunjunganId, pasien, sudahPulang = false, onTutup }: Props) {
  const awal = useMemo(awalCatatan, []);
  const [k, setK] = useState<KeadaanCatatan>(awal);
  const [daftar, setDaftar] = useState<CatatanHarianDto[] | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [dicoba, setDicoba] = useState(false);
  const [memproses, setMemproses] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  const muat = useCallback(() => {
    daftarCatatanHarian(kunjunganId).then(setDaftar).catch((e) => setGalat(e instanceof GalatApi ? e.message : C.gagal));
  }, [kunjunganId]);
  useEffect(muat, [muat]);

  const g = useMemo(() => galatCatatan(k), [k]);
  const tampil = (b: string) => (dicoba ? g[b] : undefined);
  const set = (b: 'subjektif' | 'objektif' | 'asesmen' | 'rencana' | 'instruksi') => (e: { target: { value: string } }) => setK({ ...k, [b]: e.target.value });
  const tv = Object.keys(g).filter((x) => x.startsWith('tanda_vital'));

  async function simpan() {
    setDicoba(true);
    if (Object.keys(g).length || memproses) return;
    setMemproses(true);
    setGalat(null);
    try {
      await tambahCatatanHarian(kunjunganId, bentukCatatan(k));
      setK(awalCatatan());
      setDicoba(false);
      setInfo(C.tersimpan);
      muat();
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : C.gagal);
    } finally {
      setMemproses(false);
    }
  }

  return (
    <Modal1
      judul={C.judul} lebar="modalBesar" lindungiTutup={adaPerubahan(awal, k)} onTutup={onTutup} konteks={<KepalaPasien nama={pasien.nama} nomorRm={pasien.nomor_rm} />}
      aksi={<><Tombol type="button" varian="sekunder" onClick={onTutup}>{TOMBOL.tutup}</Tombol>{!sudahPulang && <Tombol type="submit" form="bentuk-cppt" disabled={memproses}>{memproses ? C.menyimpan : C.simpan}</Tombol>}</>}
    >
      {galat && <Peringatan>{galat}</Peringatan>}
      {info && <Peringatan nada="biru">{info}</Peringatan>}
      {sudahPulang ? <Peringatan nada="biru">{C.ditutup}</Peringatan> : (
        <Kolom tag="form" id="bentuk-cppt" noValidate onSubmit={(e) => { e.preventDefault(); void simpan(); }}>
          <strong>{C.tambah}</strong>
          <AreaTeks id="cppt-s" label={C.subjektif} value={k.subjektif} maxLength={2000} onChange={set('subjektif')} aria-invalid={tampil('subjektif') ? true : undefined} />
          <AreaTeks id="cppt-o" label={C.objektif} value={k.objektif} maxLength={2000} onChange={set('objektif')} aria-invalid={tampil('objektif') ? true : undefined} />
          <AreaTeks id="cppt-a" label={C.asesmen} value={k.asesmen} maxLength={2000} onChange={set('asesmen')} aria-invalid={tampil('asesmen') ? true : undefined} />
          <AreaTeks id="cppt-p" label={C.rencana} value={k.rencana} maxLength={2000} onChange={set('rencana')} aria-invalid={tampil('rencana') ? true : undefined} />
          {dicoba && (g.subjektif || g.objektif || g.asesmen || g.rencana) && <Peringatan>{g.subjektif ?? g.objektif ?? g.asesmen ?? g.rencana}</Peringatan>}
          <AreaTeks id="cppt-i" label={C.instruksi} value={k.instruksi} maxLength={2000} onChange={set('instruksi')} />
          <strong>{C.tandaVital}</strong>
          <Sebaris bungkus jarak="sm">
            {TANDA_VITAL.map((t) => (
              <Isian
                key={t.kunci} id={`cppt-tv-${t.kunci}`} label={`${KLINIS.tandaVital[t.kunci]} (${KLINIS.tandaVital.satuan[t.satuan] ?? t.satuan})`} inputMode="decimal" autoComplete="off"
                value={k.tanda_vital[t.kunci]} onChange={(e) => setK({ ...k, tanda_vital: { ...k.tanda_vital, [t.kunci]: e.target.value } })} galat={dicoba ? g[`tanda_vital.${t.kunci}`] : undefined}
              />
            ))}
          </Sebaris>
          {dicoba && tv.length > 0 && !tv.some((x) => x.includes('.')) && <Peringatan>{g.tanda_vital}</Peringatan>}
        </Kolom>
      )}
      <Kolom>
        <strong>{C.daftar}</strong>
        {daftar && !daftar.length && <span style={kecil}>{C.kosong}</span>}
        {daftar?.map((c) => (
          <Bingkai key={c.id} arah="kolom" jarak="xs" padding="md">
            <Sebaris bungkus jarak="sm"><strong>{formatWaktu(c.waktu)}</strong><span style={kecil}>{c.dibuat_oleh_nama ? C.oleh(c.dibuat_oleh_nama) : ''}</span><Lencana warna={c.verifikasi === 'sah' ? 'hijau' : 'merah'}>{c.verifikasi === 'sah' ? C.sah : C.berubah}</Lencana></Sebaris>
            <span style={{ whiteSpace: 'pre-wrap' }}>S: {c.subjektif}</span>
            <span style={{ whiteSpace: 'pre-wrap' }}>O: {c.objektif}</span>
            <span style={{ whiteSpace: 'pre-wrap' }}>A: {c.asesmen}</span>
            <span style={{ whiteSpace: 'pre-wrap' }}>P: {c.rencana}</span>
            {c.instruksi && <span style={{ whiteSpace: 'pre-wrap' }}>{C.instruksi}: {c.instruksi}</span>}
            {c.tanda_vital && <span style={kecil}>{TANDA_VITAL.filter((t) => c.tanda_vital?.[t.kunci] != null).map((t) => `${KLINIS.tandaVital[t.kunci]} ${c.tanda_vital?.[t.kunci]}`).join(' · ')}</span>}
          </Bingkai>
        ))}
      </Kolom>
    </Modal1>
  );
}
