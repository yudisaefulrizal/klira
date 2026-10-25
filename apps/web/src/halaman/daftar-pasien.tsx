import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CARA_PEMBAYARAN, DAFTAR_PASIEN, JENIS_KUNJUNGAN, NILAI_TAHAP_FILTER, STATUS_ANTREAN, STATUS_IDENTITAS, TAHAP_LAYANAN,
} from '@klira/shared';
import type { AksiAntrean, DaftarPasienDto, PasienBarisDto, TahapFilter } from '@klira/shared';
import { aksiAntrean } from '../api-klien/kunjungan';
import { daftarPasien } from '../api-klien/pasien';
import { GalatApi } from '../api-klien/klien';
import { token } from '../gaya/token';
import { HanyaDenganIzin, useIzin } from '../komponen/izin-saja';
import { Konfirmasi } from '../komponen/konfirmasi/konfirmasi';
import { Paginasi } from '../komponen/paginasi';
import { Isian } from '../komponen/ui/isian';
import { Kartu } from '../komponen/ui/kartu';
import { Lencana } from '../komponen/ui/lencana';
import { Peringatan } from '../komponen/ui/peringatan';
import { BarisTabel, SelTabel, Tabel } from '../komponen/ui/tabel';
import { Tombol } from '../komponen/ui/tombol';
import { AmbilSpesimen } from '../modal/pelayanan-klinik/ambil-spesimen';
import { DetailPasien } from '../modal/pelayanan-klinik/detail-pasien';
import { HasilLab } from '../modal/pelayanan-klinik/hasil-lab';
import { OrderLab } from '../modal/pelayanan-klinik/order-lab';
import { PersetujuanTindakan } from '../modal/pelayanan-klinik/persetujuan-tindakan';
import { PendaftaranKunjungan } from '../modal/pelayanan-klinik/pendaftaran-kunjungan';
import { PanelKeluarga } from '../modal/pelayanan-klinik/panel-keluarga';
import { PanelRiwayat } from '../modal/pelayanan-klinik/panel-riwayat';
import { PemeriksaanKlinis } from '../modal/pelayanan-klinik/pemeriksaan-klinis';
import { RegistrasiPasien } from '../modal/pelayanan-klinik/registrasi-pasien';
import { bacaTabTerakhir, simpanTabTerakhir } from '../util/ingatan-tab';
import { usePengguna } from '../util/konteks-pengguna';
import { useNavigasi } from '../util/navigasi';
import { adalahPintasanCari, aksiBaris, keadaanPasienDariQuery, lamaMenunggu, queryPasien, tahapBawaan, ubahKeadaanPasien } from '../util/penyaring-pasien';
import type { KeadaanPasien } from '../util/penyaring-pasien';
import { Sebaris } from '../komponen/ui/susunan';

const UKURAN = 20;
const INGATAN = 'pasien-tahap';
const TAHAP_CHIP: readonly TahapFilter[] = NILAI_TAHAP_FILTER.filter((t) => t !== 'ditutup');
const KOLOM = [
  { judul: DAFTAR_PASIEN.kolom.antrean }, { judul: DAFTAR_PASIEN.kolom.pasien }, { judul: DAFTAR_PASIEN.kolom.nomorRm }, { judul: DAFTAR_PASIEN.kolom.poliDpjp },
  { judul: DAFTAR_PASIEN.kolom.pembayaran }, { judul: DAFTAR_PASIEN.kolom.tahap }, { judul: DAFTAR_PASIEN.kolom.menunggu }, { judul: DAFTAR_PASIEN.kolom.tindakan, rataKanan: true },
];
const simpanan = () => (typeof sessionStorage === 'undefined' ? null : sessionStorage);

type PasienTerpilih = { id: number; nama: string; nomor_rm: string };
/** Hanya satu modal atau panel pada satu waktu (5.1e); beralih dari registrasi ke kunjungan menutup yang pertama. */
type Terbuka =
  | { jenis: 'registrasi' }
  | { jenis: 'kunjungan'; pasien?: PasienTerpilih }
  | { jenis: 'detail'; pasien: PasienTerpilih }
  | { jenis: 'pemeriksaan'; mode: 'skrining' | 'periksa'; kunjunganId: number; pasien: PasienTerpilih }
  | { jenis: 'persetujuan' | 'spesimen' | 'hasil_lab'; kunjunganId: number; pasien: PasienTerpilih }
  | { jenis: 'order_lab'; kunjunganId: number; pasien: PasienTerpilih; cara: 'umum' | 'jkn' }
  | { jenis: 'riwayat'; pasien: PasienTerpilih }
  | { jenis: 'keluarga'; pasien: PasienTerpilih }
  | { jenis: 'batal-antrean'; baris: PasienBarisDto }
  | null;

const labelAksi = (a: AksiAntrean, status: string): string =>
  a === 'panggil' && status === 'dipanggil' ? DAFTAR_PASIEN.aksi.panggilUlang : DAFTAR_PASIEN.aksi[a === 'batal' ? 'batal' : a];

/**
 * Daftar pasien (3.1), halaman awal akun klinis dan administrasi: pencarian, filter tahap bawaan per pekerjaan (diingat sesi dan
 * di alamat), tindakan per baris sesuai tahap, serta pembuka modal Registrasi pasien baru dan Pendaftaran kunjungan. Setelah
 * modal ditutup halaman tetap pada alamat yang sama sehingga pencarian dan filter tidak berubah (5.1g).
 */
export function HalamanDaftarPasien() {
  const { pengguna } = usePengguna();
  const { search, ganti } = useNavigasi();
  const boleh = useIzin();
  const bawaan = bacaTabTerakhir<TahapFilter>(INGATAN, NILAI_TAHAP_FILTER, simpanan()) ?? tahapBawaan(pengguna?.fitur ?? []);
  const keadaan = keadaanPasienDariQuery(search, bawaan);

  const [cari, setCari] = useState(keadaan.cari);
  const [hasil, setHasil] = useState<DaftarPasienDto | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [terbuka, setTerbuka] = useState<Terbuka>(null);
  const [muatUlang, setMuatUlang] = useState(0);
  const [sekarang, setSekarang] = useState(() => new Date());
  const [memprosesAksi, setMemprosesAksi] = useState(false);
  const kotakCari = useRef<HTMLDivElement>(null);

  const terapkan = useCallback((p: Partial<KeadaanPasien>) => ganti(`/pasien${queryPasien(ubahKeadaanPasien(keadaanPasienDariQuery(search, bawaan), p))}`), [search, bawaan, ganti]);

  // Alamat selalu memuat tahap (5.1k) dan tahap terakhir diingat selama sesi (5.1h).
  const adaTahapDiAlamat = new URLSearchParams(search).has('tahap');
  useEffect(() => {
    simpanTabTerakhir(INGATAN, keadaan.tahap, simpanan());
    if (!adaTahapDiAlamat) ganti(`/pasien${queryPasien(keadaan)}`);
  }, [keadaan.tahap, adaTahapDiAlamat, keadaan, ganti]);

  useEffect(() => setCari(keadaanPasienDariQuery(search, bawaan).cari), [search, bawaan]);
  useEffect(() => {
    if (cari.trim() === keadaan.cari) return;
    const t = setTimeout(() => terapkan({ cari: cari.trim() }), 300);
    return () => clearTimeout(t);
  }, [cari, keadaan.cari, terapkan]);

  // Pintasan "/" memfokuskan pencarian (5.1l).
  useEffect(() => {
    const tekan = (e: KeyboardEvent) => {
      if (!adalahPintasanCari(e) || terbuka) return;
      e.preventDefault();
      kotakCari.current?.querySelector('input')?.focus();
    };
    document.addEventListener('keydown', tekan);
    return () => document.removeEventListener('keydown', tekan);
  }, [terbuka]);

  // Lama menunggu dihitung ulang tiap menit.
  useEffect(() => {
    const t = setInterval(() => setSekarang(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const { cari: cariAktif, tahap: tahapAktif, halaman: halamanAktif } = keadaan;
  useEffect(() => {
    let batal = false;
    daftarPasien({ cari: cariAktif, tahap: tahapAktif, halaman: halamanAktif, ukuran: UKURAN })
      .then((h) => {
        if (batal) return;
        setHasil(h);
        setGalat(null);
      })
      .catch((e) => !batal && setGalat(e instanceof GalatApi ? e.message : DAFTAR_PASIEN.gagalMuat));
    return () => {
      batal = true;
    };
  }, [cariAktif, tahapAktif, halamanAktif, muatUlang]);

  const tutup = () => setTerbuka(null);
  const selesai = () => {
    setTerbuka(null);
    setMuatUlang((n) => n + 1);
  };

  async function jalankanAksi(baris: PasienBarisDto, aksi: AksiAntrean) {
    const antrean = baris.kunjungan?.antrean;
    if (!antrean || memprosesAksi) return;
    setMemprosesAksi(true);
    try {
      await aksiAntrean(antrean.id, aksi);
      setGalat(null);
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : DAFTAR_PASIEN.aksiGagal);
    } finally {
      setMemprosesAksi(false);
      setMuatUlang((n) => n + 1);
    }
  }

  const jumlah = (t: TahapFilter): number | undefined =>
    !hasil ? undefined : t === 'semua' ? TAHAP_CHIP.slice(1).reduce((s, x) => s + hasil.jumlah_tahap[x as Exclude<TahapFilter, 'semua'>], 0) : hasil.jumlah_tahap[t as Exclude<TahapFilter, 'semua'>];
  const pasienDari = (b: PasienBarisDto): PasienTerpilih => ({ id: b.id, nama: b.nama, nomor_rm: b.nomor_rm });

  return (
    <>
      <Sebaris tag="header" jarak="md" bungkus sejajar="akhir">
        <h1 style={{ margin: 0, fontSize: token.huruf.ukuran.halaman, fontWeight: token.huruf.berat.tebal, flexGrow: 1 }}>{DAFTAR_PASIEN.judul}</h1>
        <div ref={kotakCari}>
          <Isian id="cari-pasien" label={DAFTAR_PASIEN.cari} type="search" placeholder={DAFTAR_PASIEN.petunjukCari} value={cari} onChange={(e) => setCari(e.target.value)} autoComplete="off" />
        </div>
        <HanyaDenganIzin fitur="kunjungan" aksi="input">
          <Tombol type="button" varian="sekunder" onClick={() => setTerbuka({ jenis: 'kunjungan' })}>{DAFTAR_PASIEN.daftarkanKunjungan}</Tombol>
        </HanyaDenganIzin>
        <HanyaDenganIzin fitur="pasien" aksi="input">
          <Tombol type="button" onClick={() => setTerbuka({ jenis: 'registrasi' })}>{DAFTAR_PASIEN.registrasi}</Tombol>
        </HanyaDenganIzin>
      </Sebaris>

      <Sebaris jarak="sm" bungkus sejajar="regang" role="group" aria-label={DAFTAR_PASIEN.filterTahap}>
        {TAHAP_CHIP.map((t) => {
          const n = jumlah(t);
          return (
            <Tombol key={t} type="button" varian={keadaan.tahap === t ? 'utama' : 'sekunder'} aria-pressed={keadaan.tahap === t} onClick={() => terapkan({ tahap: t })}>
              {t === 'semua' ? DAFTAR_PASIEN.semua : DAFTAR_PASIEN.tahapPanjang[t]}
              {n !== undefined && <strong style={{ marginLeft: token.jarak.sm }}>{n}</strong>}
            </Tombol>
          );
        })}
      </Sebaris>

      {galat && <Peringatan>{galat}</Peringatan>}
      <Kartu style={{ padding: 0, overflow: 'hidden' }}>
        <Tabel kolom={KOLOM} label={DAFTAR_PASIEN.judul}>
          {hasil?.data.map((b) => {
            const k = b.kunjungan;
            const tunggu = k ? lamaMenunggu(k.mulai, sekarang) : null;
            const aksi = aksiBaris(b, boleh);
            return (
              <BarisTabel key={b.id}>
                <SelTabel style={{ fontWeight: token.huruf.berat.tebal }}>
                  {k?.antrean ? (
                    <span>
                      {k.antrean.kode}
                      <div><Lencana warna={STATUS_ANTREAN.warna(k.antrean.status)}>{STATUS_ANTREAN.label(k.antrean.status)}</Lencana></div>
                    </span>
                  ) : DAFTAR_PASIEN.tanpaAntrean}
                </SelTabel>
                <SelTabel>
                  <div style={{ fontWeight: token.huruf.berat.tebal }}>{b.nama}</div>
                  <div style={{ fontSize: token.huruf.ukuran.kecil, color: token.warna.teksRedup }}>
                    {DAFTAR_PASIEN.jenisKelaminSingkat[b.jenis_kelamin]}, {DAFTAR_PASIEN.umur(b.umur_tahun)}
                    {b.status_identitas === 'sementara' && <> <Lencana warna={STATUS_IDENTITAS.warna('sementara')}>{STATUS_IDENTITAS.label('sementara')}</Lencana></>}
                  </div>
                </SelTabel>
                <SelTabel style={{ color: token.warna.teksMenu }}>{b.nomor_rm}</SelTabel>
                <SelTabel>
                  {k ? (
                    <>
                      <div>{k.poli_nama ?? <Lencana warna={JENIS_KUNJUNGAN.warna(k.jenis)}>{JENIS_KUNJUNGAN.label(k.jenis)}</Lencana>}</div>
                      <div style={{ fontSize: token.huruf.ukuran.kecil, color: token.warna.teksRedup }}>{k.dpjp_nama ?? '-'}</div>
                    </>
                  ) : <span style={{ color: token.warna.teksRedup }}>{DAFTAR_PASIEN.tanpaKunjungan}</span>}
                </SelTabel>
                <SelTabel>{k ? CARA_PEMBAYARAN.label(k.cara_pembayaran) : '-'}</SelTabel>
                <SelTabel>{k ? <Lencana warna={TAHAP_LAYANAN.warna(k.tahap_layanan)}>{TAHAP_LAYANAN.label(k.tahap_layanan)}</Lencana> : '-'}</SelTabel>
                <SelTabel style={{ color: token.warna.teksMenu }}>
                  {tunggu ? (tunggu.jam ? DAFTAR_PASIEN.jamMenit(tunggu.jam, tunggu.menit) : DAFTAR_PASIEN.menit(tunggu.menit)) : '-'}
                </SelTabel>
                <SelTabel style={{ textAlign: 'right' }}>
                  <Sebaris sebaris jarak="sm" bungkus sejajar="regang" sebaran="akhir">
                    {aksi.map(({ jenis }) => {
                      if (jenis === 'buka') return <Tombol key="buka" type="button" varian="teks" onClick={() => setTerbuka({ jenis: 'detail', pasien: pasienDari(b) })}>{DAFTAR_PASIEN.aksi.buka}</Tombol>;
                      if (jenis === 'skrining' || jenis === 'periksa') {
                        return (
                          <Tombol key={jenis} type="button" onClick={() => k && setTerbuka({ jenis: 'pemeriksaan', mode: jenis, kunjunganId: k.id, pasien: pasienDari(b) })}>
                            {DAFTAR_PASIEN.aksi[jenis]}
                          </Tombol>
                        );
                      }
                      if (jenis === 'persetujuan' || jenis === 'spesimen' || jenis === 'hasil_lab') {
                        return <Tombol key={jenis} type="button" varian="sekunder" onClick={() => k && setTerbuka({ jenis, kunjunganId: k.id, pasien: pasienDari(b) })}>{DAFTAR_PASIEN.aksi[jenis]}</Tombol>;
                      }
                      if (jenis === 'order_lab') {
                        return <Tombol key={jenis} type="button" varian="sekunder" onClick={() => k && setTerbuka({ jenis, kunjunganId: k.id, pasien: pasienDari(b), cara: k.cara_pembayaran === 'jkn' ? 'jkn' : 'umum' })}>{DAFTAR_PASIEN.aksi.order_lab}</Tombol>;
                      }
                      if (jenis === 'riwayat' || jenis === 'keluarga') {
                        return <Tombol key={jenis} type="button" varian="teks" onClick={() => setTerbuka({ jenis, pasien: pasienDari(b) })}>{DAFTAR_PASIEN.aksi[jenis]}</Tombol>;
                      }
                      if (jenis === 'daftarkan') return <Tombol key="daftarkan" type="button" varian="sekunder" onClick={() => setTerbuka({ jenis: 'kunjungan', pasien: pasienDari(b) })}>{DAFTAR_PASIEN.aksi.daftarkan}</Tombol>;
                      if (jenis === 'batal') return <Tombol key="batal" type="button" varian="teks" disabled={memprosesAksi} onClick={() => setTerbuka({ jenis: 'batal-antrean', baris: b })}>{DAFTAR_PASIEN.aksi.batal}</Tombol>;
                      return (
                        <Tombol key={jenis} type="button" varian={jenis === 'panggil' && k?.antrean?.status === 'dipanggil' ? 'teks' : 'sekunder'} disabled={memprosesAksi} onClick={() => void jalankanAksi(b, jenis)}>
                          {labelAksi(jenis, k?.antrean?.status ?? '')}
                        </Tombol>
                      );
                    })}
                  </Sebaris>
                </SelTabel>
              </BarisTabel>
            );
          })}
        </Tabel>
        {hasil && hasil.data.length === 0 && (
          <div style={{ padding: token.jarak.md, color: token.warna.teksRedup }}>{keadaan.cari ? DAFTAR_PASIEN.kosong : keadaan.tahap === 'semua' ? DAFTAR_PASIEN.kosong : DAFTAR_PASIEN.kosongTahap}</div>
        )}
        {hasil && <Paginasi halaman={keadaan.halaman} total={hasil.total} ukuran={hasil.ukuran} onPindah={(h) => terapkan({ halaman: h })} />}
      </Kartu>
      <p style={{ margin: 0, fontSize: token.huruf.ukuran.dasar, color: token.warna.teksRedup }}>{DAFTAR_PASIEN.catatan}</p>

      {terbuka?.jenis === 'registrasi' && (
        <RegistrasiPasien onTutup={tutup} onSelesai={selesai} onDaftarkanKunjungan={(p) => setTerbuka({ jenis: 'kunjungan', pasien: p })} />
      )}
      {terbuka?.jenis === 'kunjungan' && <PendaftaranKunjungan pasien={terbuka.pasien} onTutup={tutup} onSelesai={selesai} />}
      {terbuka?.jenis === 'pemeriksaan' && (
        <PemeriksaanKlinis kunjunganId={terbuka.kunjunganId} pasien={terbuka.pasien} mode={terbuka.mode} onTutup={tutup} onSelesai={selesai} />
      )}
      {terbuka?.jenis === 'persetujuan' && <PersetujuanTindakan kunjunganId={terbuka.kunjunganId} pasien={terbuka.pasien} onTutup={tutup} onSelesai={selesai} />}
      {terbuka?.jenis === 'order_lab' && <OrderLab kunjunganId={terbuka.kunjunganId} pasien={terbuka.pasien} cara={terbuka.cara} onTutup={tutup} onSelesai={selesai} />}
      {terbuka?.jenis === 'spesimen' && <AmbilSpesimen kunjunganId={terbuka.kunjunganId} pasien={terbuka.pasien} onTutup={tutup} onSelesai={selesai} />}
      {terbuka?.jenis === 'hasil_lab' && <HasilLab kunjunganId={terbuka.kunjunganId} pasien={terbuka.pasien} onTutup={tutup} onSelesai={selesai} />}
      {terbuka?.jenis === 'riwayat' && <PanelRiwayat pasienId={terbuka.pasien.id} nama={terbuka.pasien.nama} onTutup={tutup} />}
      {terbuka?.jenis === 'keluarga' && <PanelKeluarga pasienId={terbuka.pasien.id} nama={terbuka.pasien.nama} onTutup={tutup} />}
      {terbuka?.jenis === 'detail' && <DetailPasien id={terbuka.pasien.id} nama={terbuka.pasien.nama} onTutup={tutup} />}
      {terbuka?.jenis === 'batal-antrean' && terbuka.baris.kunjungan?.antrean && (
        <Konfirmasi
          judul={DAFTAR_PASIEN.batalJudul}
          pesan={DAFTAR_PASIEN.batalPesan(terbuka.baris.kunjungan.antrean.kode, terbuka.baris.nama)}
          labelYa={DAFTAR_PASIEN.batalYa}
          onTidak={tutup}
          onYa={() => {
            const b = terbuka.baris;
            tutup();
            void jalankanAksi(b, 'batal');
          }}
        />
      )}
    </>
  );
}

