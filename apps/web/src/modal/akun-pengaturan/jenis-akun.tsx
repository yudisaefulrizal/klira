import { useEffect, useMemo, useState } from 'react';
import { JENIS_AKUN } from '@klira/shared';
import { buatJenisAkun, daftarIzin, ubahJenisAkun } from '../../api-klien/izin';
import type { JenisAkunDto } from '../../api-klien/izin';
import { GalatApi } from '../../api-klien/klien';
import { token } from '../../gaya/token';
import { Modal1 } from '../../komponen/modal-1/modal-1';
import { AreaTeks } from '../../komponen/ui/area-teks';
import { Isian } from '../../komponen/ui/isian';
import { KotakCentang } from '../../komponen/ui/kotak-centang';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Tombol } from '../../komponen/ui/tombol';
import type { IzinKatalog } from './keadaan-akun';
import {
  adaPerubahanJenis, alihIzin, awalJenis, bentukBuat, bentukUbah, galatJenis, kelompokkanIzin, labelAksiCakupan, semuaTerpilih, setKelompok,
} from './keadaan-jenis-akun';
import type { FormJenis } from './keadaan-jenis-akun';
import { Kisi, Kolom, Sebaris, Tumbuh } from '../../komponen/ui/susunan';
import { Bingkai } from '../../komponen/ui/kartu';

type Props = {
  /** Tanpa `jenis` = buat baru; dengan `jenis` = ubah (alasan perubahan wajib). */
  jenis?: JenisAkunDto;
  onTutup: () => void;
  /** Dipanggil setelah tersimpan (daftar dimuat ulang). */
  onSelesai: () => void;
};

/**
 * Modal Buat atau ubah jenis akun (3.3, MODAL-1): nama, syarat profesi (dasar peringatan), dan daftar izin paket
 * (fitur x aksi x cakupan) dikelompokkan per fitur. Tanpa hapus permanen; saat ubah, alasan perubahan wajib.
 */
export function ModalJenisAkun({ jenis, onTutup, onSelesai }: Props) {
  const ubah = jenis !== undefined;
  const awal = useMemo(() => awalJenis(jenis), [jenis]);
  const [form, setForm] = useState<FormJenis>(awal);
  const [katalog, setKatalog] = useState<IzinKatalog[] | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [dicoba, setDicoba] = useState(false);
  const [memproses, setMemproses] = useState(false);

  useEffect(() => {
    let batal = false;
    daftarIzin()
      .then((k) => !batal && setKatalog(k))
      .catch((e) => !batal && setGalat(e instanceof GalatApi ? e.message : JENIS_AKUN.gagalMuatKatalog));
    return () => {
      batal = true;
    };
  }, []);

  const kelompok = useMemo(() => kelompokkanIzin(katalog ?? []), [katalog]);
  const galatBidang = galatJenis(form, ubah);
  const berubah = adaPerubahanJenis(awal, form);
  const siap = !Object.keys(galatBidang).length && (!ubah || berubah) && !memproses;

  async function simpan() {
    setDicoba(true);
    if (!siap) return;
    setMemproses(true);
    setGalat(null);
    try {
      if (jenis) await ubahJenisAkun(jenis.id, bentukUbah(awal, form));
      else await buatJenisAkun(bentukBuat(form));
      onSelesai();
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : JENIS_AKUN.gagalSimpan);
      setMemproses(false);
    }
  }

  const tampil = (kunci: string) => (dicoba ? galatBidang[kunci] : undefined);

  return (
    <Modal1
      judul={ubah ? JENIS_AKUN.judulUbah : JENIS_AKUN.judulBuat}
      lebar="modalBesar"
      lindungiTutup={berubah || form.alasan.trim() !== ''}
      onTutup={onTutup}
      aksi={
        <>
          <Tombol type="button" varian="sekunder" onClick={onTutup}>{JENIS_AKUN.batal}</Tombol>
          <Tombol type="button" disabled={memproses || (ubah && !berubah)} onClick={() => void simpan()}>{memproses ? JENIS_AKUN.menyimpan : JENIS_AKUN.simpan}</Tombol>
        </>
      }
    >
      {galat && <Peringatan>{galat}</Peringatan>}
      <Isian id="jenis-nama" label={JENIS_AKUN.nama} value={form.nama} maxLength={150} onChange={(e) => setForm({ ...form, nama: e.target.value })} galat={tampil('nama')} />
      <div>
        <Isian id="jenis-syarat" label={JENIS_AKUN.syarat} value={form.syarat} maxLength={200} onChange={(e) => setForm({ ...form, syarat: e.target.value })} />
        <small style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{JENIS_AKUN.syaratPetunjuk}</small>
      </div>
      <Kolom tag="section" jarak="sm" aria-label={JENIS_AKUN.izinJudul}>
        <Sebaris jarak="md" sejajar="dasar">
          <Tumbuh tag="div"><h3 style={{ margin: 0, fontSize: token.huruf.ukuran.besar, fontWeight: token.huruf.berat.tebal }}>{JENIS_AKUN.izinJudul}</h3></Tumbuh>
          <span style={{ color: token.warna.teksRedup }}>{JENIS_AKUN.izinTerpilih(form.izin.length, katalog?.length ?? 0)}</span>
        </Sebaris>
        <span style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{JENIS_AKUN.izinPetunjuk}</span>
        <Kisi kolom={`repeat(auto-fill, minmax(${token.ukuran.kolomKelompok}, 1fr))`} jarak="sm" style={{ maxHeight: token.ukuran.tinggiDaftar, overflowY: 'auto' }}>
          {kelompok.map((k) => {
            const semua = semuaTerpilih(form.izin, k);
            return (
              <Bingkai tag="fieldset" arah="kolom" jarak="xs" key={k.fitur}>
                <legend style={{ fontWeight: token.huruf.berat.tebal, padding: `0 ${token.jarak.xs}` }}>{JENIS_AKUN.izinFitur(k.label)}</legend>
                <Tombol type="button" varian="teks" style={{ alignSelf: 'flex-start' }} onClick={() => setForm({ ...form, izin: setKelompok(form.izin, k, !semua) })}>
                  {semua ? JENIS_AKUN.lepasSemuaFitur : JENIS_AKUN.pilihSemuaFitur}
                </Tombol>
                {k.izin.map((i) => (
                  <KotakCentang key={i.id} id={`izin-${i.id}`} label={labelAksiCakupan(i)} checked={form.izin.includes(i.id)} onChange={() => setForm({ ...form, izin: alihIzin(form.izin, i.id) })} />
                ))}
              </Bingkai>
            );
          })}
        </Kisi>
      </Kolom>
      <AreaTeks id="jenis-alasan" label={ubah ? JENIS_AKUN.alasan : JENIS_AKUN.alasanBuat} value={form.alasan} maxLength={1000} onChange={(e) => setForm({ ...form, alasan: e.target.value })} aria-required={ubah} />
      {tampil('alasan_perubahan') && <Peringatan>{tampil('alasan_perubahan')}</Peringatan>}
    </Modal1>
  );
}
