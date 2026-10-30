import { useEffect, useMemo, useState } from 'react';
import { GALAT, KUNJUNGAN, TOMBOL } from '@klira/shared';
import type { KunjunganDto, OpsiKunjunganDto, PasienBarisDto } from '@klira/shared';
import { daftarkanKunjungan, opsiKunjungan } from '../../api-klien/kunjungan';
import { daftarPasien } from '../../api-klien/pasien';
import { GalatApi } from '../../api-klien/klien';
import { token } from '../../gaya/token';
import { Modal1 } from '../../komponen/modal-1/modal-1';
import { AreaTeks } from '../../komponen/ui/area-teks';
import { Isian } from '../../komponen/ui/isian';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Pilihan } from '../../komponen/ui/pilihan';
import { Baris, Kolom } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { adaPerubahan } from '../../util/draf';
import { awalKunjungan, bentukKunjungan, galatKunjungan, ubahKunjungan } from './keadaan-kunjungan';
import type { KeadaanKunjungan } from './keadaan-kunjungan';

type Props = {
  /** Pasien yang sudah dipilih (dari baris daftar atau hasil registrasi); tanpa ini pasien dicari di dalam modal. */
  pasien?: { id: number; nama: string; nomor_rm: string };
  onTutup: () => void;
  /** Dipanggil saat modal ditutup setelah kunjungan terdaftar (muat ulang daftar). */
  onSelesai: () => void;
};

/**
 * Modal Pendaftaran kunjungan (3.3, MODAL-1): layanan, poli, cara pembayaran, keluhan singkat. Rawat jalan mendapat
 * nomor antrean otomatis per poli per hari; nomor SEP JKN boleh menyusul. Bentuk draf otomatis tidak dipasang (isian pendek).
 */
export function PendaftaranKunjungan({ pasien, onTutup, onSelesai }: Props) {
  const awal = useMemo(() => awalKunjungan(pasien?.id), [pasien?.id]);
  const [keadaan, setKeadaan] = useState<KeadaanKunjungan>(awal);
  const [opsi, setOpsi] = useState<OpsiKunjunganDto | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [dicoba, setDicoba] = useState(false);
  const [memproses, setMemproses] = useState(false);
  const [hasil, setHasil] = useState<KunjunganDto | null>(null);
  const [kata, setKata] = useState('');
  const [calon, setCalon] = useState<PasienBarisDto[]>([]);
  const [galatPencarian, setGalatPencarian] = useState<string | null>(null);
  const [mencari, setMencari] = useState(false);
  const [hasilTerbuka, setHasilTerbuka] = useState(false);
  const [calonAktif, setCalonAktif] = useState(-1);

  useEffect(() => {
    let batal = false;
    opsiKunjungan()
      .then((o) => !batal && setOpsi(o))
      .catch((e) => !batal && setGalat(e instanceof GalatApi ? e.message : KUNJUNGAN.gagalMuatOpsi));
    return () => {
      batal = true;
    };
  }, []);

  // Pencarian pasien (hanya bila pasien belum ditentukan), ditunda agar tidak memanggil API di tiap ketukan.
  useEffect(() => {
    setCalon([]);
    setGalatPencarian(null);
    setMencari(false);
    if (pasien || keadaan.pasien_id || kata.trim().length < 2) {
      return;
    }
    let batal = false;
    setMencari(true);
    const t = setTimeout(() => {
      daftarPasien({ untuk_kunjungan: true, cari: kata, tahap: 'semua', halaman: 1, ukuran: 20 })
        .then((h) => !batal && setCalon(h.data))
        .catch((e) => !batal && setGalatPencarian(e instanceof GalatApi ? e.message : GALAT.umum))
        .finally(() => !batal && setMencari(false));
    }, 300);
    return () => {
      batal = true;
      clearTimeout(t);
    };
  }, [kata, pasien, keadaan.pasien_id]);

  const ubah = (p: Partial<KeadaanKunjungan>) => setKeadaan((k) => ubahKunjungan(k, p));
  const g = galatKunjungan(keadaan);
  const tampil = (b: string) => (dicoba ? g[b] : undefined);
  const daftarTerbuka = hasilTerbuka && !keadaan.pasien_id && calon.length > 0;
  function pilihPasien(c: PasienBarisDto) {
    ubah({ pasien_id: String(c.id) });
    setKata(`${c.nama} (${c.nomor_rm})`);
    setHasilTerbuka(false);
    setCalonAktif(-1);
    setCalon([]);
  }

  async function simpan() {
    setDicoba(true);
    if (Object.keys(g).length || memproses) return;
    setMemproses(true);
    setGalat(null);
    try {
      setHasil(await daftarkanKunjungan(bentukKunjungan(keadaan)));
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : KUNJUNGAN.gagal);
    } finally {
      setMemproses(false);
    }
  }

  if (hasil) {
    return (
      <Modal1
        judul={KUNJUNGAN.berhasilJudul}
        lebar="modalKecil"
        onTutup={onSelesai}
        aksi={<Tombol type="button" onClick={onSelesai}>{KUNJUNGAN.selesai}</Tombol>}
      >
        <p style={{ margin: 0 }}>{KUNJUNGAN.berhasilPesan}</p>
        {hasil.antrean ? (
          <Kolom jarak="xs">
            <span style={{ color: token.warna.teksRedup }}>{KUNJUNGAN.nomorAntrean}</span>
            <strong style={{ fontSize: token.huruf.ukuran.tajuk }} data-testid="nomor-antrean">{hasil.antrean.kode}</strong>
          </Kolom>
        ) : (
          <Peringatan nada="biru">{KUNJUNGAN.tanpaAntrean}</Peringatan>
        )}
      </Modal1>
    );
  }

  return (
    <Modal1
      judul={KUNJUNGAN.judul}
      lindungiTutup={adaPerubahan(awal, keadaan)}
      onTutup={onTutup}
      aksi={
        <>
          <Tombol type="button" varian="sekunder" onClick={onTutup}>{TOMBOL.batal}</Tombol>
          <Tombol type="submit" form="bentuk-kunjungan" disabled={memproses}>{memproses ? KUNJUNGAN.mendaftar : KUNJUNGAN.daftar}</Tombol>
        </>
      }
    >
      {galat && <Peringatan>{galat}</Peringatan>}
      <form
        id="bentuk-kunjungan"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void simpan();
        }}
      >
        <Kolom>
          {pasien ? (
            <div>
              <div style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{KUNJUNGAN.pasien}</div>
              <strong>{pasien.nama}</strong>
              <span style={{ color: token.warna.teksRedup }}> · {pasien.nomor_rm}</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: token.jarak.xs }}>
              <Isian id="kunjungan-cari" label={KUNJUNGAN.pasien} placeholder={KUNJUNGAN.cariPasien}
                value={kata} autoComplete="off" galat={tampil('pasien_id')}
                role="combobox" aria-autocomplete="list" aria-expanded={daftarTerbuka}
                aria-controls="kunjungan-calon" aria-activedescendant={daftarTerbuka && calonAktif >= 0 ? `kunjungan-calon-${calonAktif}` : undefined}
                onFocus={() => setHasilTerbuka(true)} onBlur={() => setHasilTerbuka(false)}
                onChange={(e) => {
                  setKata(e.target.value);
                  setCalon([]);
                  setCalonAktif(-1);
                  setHasilTerbuka(true);
                  setMencari(e.target.value.trim().length >= 2);
                  setGalatPencarian(null);
                  ubah({ pasien_id: '' });
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape' && hasilTerbuka) {
                    e.preventDefault(); e.stopPropagation(); setHasilTerbuka(false);
                  }
                  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                    e.preventDefault(); setHasilTerbuka(true);
                    setCalonAktif((n) => calon.length ? Math.max(0, Math.min(calon.length - 1, n + (e.key === 'ArrowDown' ? 1 : -1))) : -1);
                  }
                  if (e.key === 'Enter' && !keadaan.pasien_id) {
                    e.preventDefault();
                    if (daftarTerbuka && calon[calonAktif]) pilihPasien(calon[calonAktif]);
                  }
                }} />
              {galatPencarian && <Peringatan>{galatPencarian}</Peringatan>}
              {!keadaan.pasien_id && <small role="status" style={{ color: token.warna.teksRedup }}>
                {kata.trim().length < 2 ? 'Ketik minimal 2 karakter untuk mencari pasien.' : mencari ? KUNJUNGAN.mencari : galatPencarian ? '' : calon.length ? 'Pilih pasien dari hasil pencarian.' : KUNJUNGAN.pasienTidakAda}
              </small>}
              {daftarTerbuka && <ul id="kunjungan-calon" role="listbox" aria-label="Hasil pencarian pasien"
                style={{ margin: 0, padding: 0, listStyle: 'none', maxHeight: 220, overflowY: 'auto', border: `1px solid ${token.warna.garis}`, borderRadius: token.radius.sedang }}>
                {calon.map((c, i) => <li key={c.id} id={`kunjungan-calon-${i}`} role="option" aria-selected={calonAktif === i}
                  onMouseDown={(e) => e.preventDefault()} onClick={() => pilihPasien(c)}
                  style={{ padding: token.jarak.sm, cursor: 'pointer', background: calonAktif === i ? token.warna.latar : token.warna.permukaan }}>
                  <strong>{c.nama}</strong><span style={{ color: token.warna.teksRedup }}> · {c.nomor_rm}</span>
                </li>)}
              </ul>}
            </div>
          )}
          <Baris>
            <Pilihan id="kunjungan-jenis" label={KUNJUNGAN.layanan} value={keadaan.jenis} onChange={(e) => ubah({ jenis: e.target.value as KeadaanKunjungan['jenis'] })} opsi={KUNJUNGAN.layananOpsi} />
            <Pilihan
              id="kunjungan-poli" label={KUNJUNGAN.poli} value={keadaan.lokasi_id} disabled={keadaan.jenis !== 'AMB'} onChange={(e) => ubah({ lokasi_id: e.target.value })} galat={tampil('lokasi_id')}
              opsi={[{ nilai: '', label: KUNJUNGAN.pilih }, ...(opsi?.poli ?? []).map((p) => ({ nilai: String(p.id), label: p.nama }))]}
            />
          </Baris>
          <Pilihan id="kunjungan-bayar" label={KUNJUNGAN.caraBayar} value={keadaan.cara_pembayaran} onChange={(e) => ubah({ cara_pembayaran: e.target.value as KeadaanKunjungan['cara_pembayaran'] })} opsi={KUNJUNGAN.caraBayarOpsi} />
          {keadaan.cara_pembayaran === 'jkn' && (
            <>
              <Isian id="kunjungan-sep" label={KUNJUNGAN.sep} value={keadaan.nomor_sep} onChange={(e) => ubah({ nomor_sep: e.target.value })} galat={tampil('nomor_sep')} autoComplete="off" />
              <span style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{KUNJUNGAN.sepKet}</span>
            </>
          )}
          <AreaTeks id="kunjungan-keluhan" label={KUNJUNGAN.keluhan} value={keadaan.keluhan_singkat} maxLength={500} onChange={(e) => ubah({ keluhan_singkat: e.target.value })} />
        </Kolom>
      </form>
    </Modal1>
  );
}
