import { TautanKelolaMaster } from '../komponen/tautan-kelola-master';
import { IkonPasien, TombolIkonPasien, type NamaIkonPasien } from '../komponen/ikon-pasien';
import './daftar-pasien.css';
import { EditPasien } from '../modal/pelayanan-klinik/edit-pasien';
import { usePesan } from '../komponen/pesan/konteks-pesan';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  tanggalWib, CARA_PEMBAYARAN, DAFTAR_PASIEN, JENIS_KUNJUNGAN, NILAI_TAHAP_FILTER, STATUS_ANTREAN, STATUS_IDENTITAS, TAHAP_LAYANAN,
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
import { PembayaranSerahTerima } from '../modal/pelayanan-klinik/pembayaran-serah-terima';
import { TelaahResep } from '../modal/pelayanan-klinik/telaah-resep';
import { TutupKunjungan } from '../modal/pelayanan-klinik/tutup-kunjungan';
import { PendaftaranKunjungan } from '../modal/pelayanan-klinik/pendaftaran-kunjungan';
import { PanelKeluarga } from '../modal/pelayanan-klinik/panel-keluarga';
import { PanelRiwayat } from '../modal/pelayanan-klinik/panel-riwayat';
import { PemeriksaanKlinis } from '../modal/pelayanan-klinik/pemeriksaan-klinis';
import { RegistrasiPasien } from '../modal/pelayanan-klinik/registrasi-pasien';
import { bacaTabTerakhir, simpanTabTerakhir } from '../util/ingatan-tab';
import { usePengguna } from '../util/konteks-pengguna';
import { useNavigasi } from '../util/navigasi';
import { adalahPintasanCari, aksiBaris, keadaanPasienDariQuery, lamaMenunggu, queryPasien, tahapBawaan, ubahKeadaanPasien } from '../util/penyaring-pasien';
import type { AksiBaris, KeadaanPasien } from '../util/penyaring-pasien';
import { Sebaris } from '../komponen/ui/susunan';

const UKURAN = 20;
const INGATAN = 'pasien-tahap';
const TAHAP_CHIP: readonly TahapFilter[] = NILAI_TAHAP_FILTER;
const IKON_TAHAP: Record<TahapFilter, NamaIkonPasien> = {
  semua: 'semua', menunggu_skrining: 'skrining', pemeriksaan: 'periksa', resep: 'resep', kasir: 'bayar', ditutup: 'selesai', batal: 'batal',
};
const IKON_AKSI: Record<AksiBaris['jenis'], NamaIkonPasien> = {
  buka: 'buka', daftarkan: 'kunjungan-baru', skrining: 'skrining', periksa: 'periksa', telaah: 'telaah',
  bayar: 'bayar', tutup_kunjungan: 'tutup-kunjungan', persetujuan: 'persetujuan', order_lab: 'order-lab',
  spesimen: 'spesimen', hasil_lab: 'hasil-lab', riwayat: 'riwayat', keluarga: 'keluarga',
  panggil: 'panggil', mulai: 'mulai', selesai: 'selesai', batal: 'batal',
};
const ikonAksi = (jenis: AksiBaris['jenis']): NamaIkonPasien => IKON_AKSI[jenis];
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
  | { jenis: 'detail' | 'edit-pasien'; pasien: PasienTerpilih }
  | { jenis: 'pemeriksaan'; mode: 'skrining' | 'periksa'; kunjunganId: number; pasien: PasienTerpilih }
  | { jenis: 'persetujuan' | 'spesimen' | 'hasil_lab' | 'telaah' | 'bayar' | 'tutup_kunjungan'; kunjunganId: number; pasien: PasienTerpilih }
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
  const pesan = usePesan();
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

  const tanggalAktif = keadaan.tanggal ?? tanggalWib(sekarang);
  const { cari: cariAktif, tahap: tahapAktif, halaman: halamanAktif } = keadaan;
  useEffect(() => {
    let batal = false;
    daftarPasien({ tanggal: tanggalAktif, cari: cariAktif, tahap: tahapAktif, halaman: halamanAktif, ukuran: UKURAN })
      .then((h) => {
        if (batal) return;
        setHasil(h);
        setGalat(null);
      })
      .catch((e) => !batal && setGalat(e instanceof GalatApi ? e.message : DAFTAR_PASIEN.gagalMuat));
    return () => {
      batal = true;
    };
  }, [tanggalAktif, cariAktif, tahapAktif, halamanAktif, muatUlang]);

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
    !hasil ? undefined : t === 'semua' ? TAHAP_CHIP.filter((x) => x !== 'semua' && x !== 'ditutup' && x !== 'batal').reduce((s, x) => s + hasil.jumlah_tahap[x as Exclude<TahapFilter, 'semua'>], 0) : hasil.jumlah_tahap[t as Exclude<TahapFilter, 'semua'>];
  const pasienDari = (b: PasienBarisDto): PasienTerpilih => ({ id: b.id, nama: b.nama, nomor_rm: b.nomor_rm });

  return (
    <section className="halaman-pasien">
      <header className="pasien-header">
        <div className="pasien-toolbar">
          <div className="pasien-pencarian pasien-isian-ikon" ref={kotakCari} title="Cari pasien (/)">
            <IkonPasien nama="cari" />
            <Isian id="cari-pasien" label={DAFTAR_PASIEN.cari} type="search" placeholder={DAFTAR_PASIEN.petunjukCari} value={cari} onChange={(e) => setCari(e.target.value)} autoComplete="off" />
          </div>
          <div className="pasien-tanggal pasien-isian-ikon" title="Tanggal kunjungan">
            <IkonPasien nama="tanggal" />
            <Isian id="tanggal-pasien" label="Tanggal kunjungan" type="date" value={tanggalAktif}
              onChange={(e) => { if (e.target.value) terapkan({ tanggal: e.target.value }); }} />
          </div>
          {keadaan.tanggal && <TombolIkonPasien ikon="hari-ini" label="Hari ini" varian="teks" onClick={() => {
            const q = new URLSearchParams(queryPasien({ ...keadaan, halaman: 1 }));
            q.delete('tanggal');
            ganti(`/pasien?${q}`);
          }} />}
        </div>
        <div className="pasien-aksi-utama">
          <TautanKelolaMaster kelompok="layanan" />
          {pengguna && <a className="pasien-buka-layar" href={`/layar-panggilan/${pengguna.fasyankes_id}`} target="_blank" rel="noopener noreferrer">Layar panggilan ↗</a>}
          <HanyaDenganIzin fitur="kunjungan" aksi="input">
            <TombolIkonPasien ikon="kunjungan-baru" label={DAFTAR_PASIEN.daftarkanKunjungan} varian="sekunder" onClick={() => setTerbuka({ jenis: 'kunjungan' })} />
          </HanyaDenganIzin>
          <HanyaDenganIzin fitur="pasien" aksi="input">
            <TombolIkonPasien ikon="pasien-baru" label={DAFTAR_PASIEN.registrasi} onClick={() => setTerbuka({ jenis: 'registrasi' })} />
          </HanyaDenganIzin>
        </div>
      </header>
      <Sebaris className="pasien-filter" jarak="sm" bungkus sejajar="regang" role="group" aria-label={DAFTAR_PASIEN.filterTahap}>
        {TAHAP_CHIP.map((t) => {
          const n = jumlah(t);
          return (
            <TombolIkonPasien key={t} ikon={IKON_TAHAP[t]} label={`${t === 'semua' ? DAFTAR_PASIEN.semua : DAFTAR_PASIEN.tahapPanjang[t]}${n !== undefined ? ` · ${n} pasien` : ''}`} varian={keadaan.tahap === t ? 'utama' : 'sekunder'} aria-pressed={keadaan.tahap === t} onClick={() => terapkan({ tahap: t })}>
              {n !== undefined && <strong className="pasien-jumlah" aria-hidden="true">{n}</strong>}
            </TombolIkonPasien>
          );
        })}
      </Sebaris>

      {galat && <Peringatan>{galat}</Peringatan>}
      <Kartu className="pasien-tabel" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="pasien-tabel-judul">
          <h2>{keadaan.tahap === 'semua' ? 'Semua pasien' : DAFTAR_PASIEN.tahapPanjang[keadaan.tahap]}</h2>
          <span role="status">{hasil ? `${hasil.total} pasien` : 'Memuat pasien…'}</span>
        </div>
        <Tabel kolom={KOLOM} label={DAFTAR_PASIEN.judul}>
          {hasil?.data.map((b) => {
            const k = b.kunjungan;
            const tunggu = k && k.tahap_layanan !== 'ditutup' && k.antrean?.status !== 'batal' ? lamaMenunggu(k.mulai, sekarang) : null;
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
                  <Tombol type="button" varian="teks" onClick={() => setTerbuka({ jenis: 'edit-pasien', pasien: pasienDari(b) })} aria-label={`Buka data pasien ${b.nama}`} style={{ fontWeight: token.huruf.berat.tebal, padding: 0 }}>{b.nama}</Tombol>
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
                <SelTabel>{k ? <Lencana warna={k.antrean?.status === 'batal' ? 'merah' : TAHAP_LAYANAN.warna(k.tahap_layanan)}>{k.antrean?.status === 'batal' ? 'Batal' : TAHAP_LAYANAN.label(k.tahap_layanan)}</Lencana> : '-'}</SelTabel>
                <SelTabel style={{ color: token.warna.teksMenu }}>
                  {tunggu ? (tunggu.jam ? DAFTAR_PASIEN.jamMenit(tunggu.jam, tunggu.menit) : DAFTAR_PASIEN.menit(tunggu.menit)) : '-'}
                </SelTabel>
                <SelTabel style={{ textAlign: 'right' }}>
                  <Sebaris sebaris jarak="sm" bungkus sejajar="regang" sebaran="akhir">
                    {boleh('whatsapp', 'lihat') && <TombolIkonPasien ikon="whatsapp" label="WhatsApp" varian="teks" onClick={() => pesan.bukaPasien({ id: b.id, nama: b.nama })} />}
                    {aksi.map(({ jenis }) => {
                      if (jenis === 'buka') return <TombolIkonPasien ikon={ikonAksi('buka')} label={DAFTAR_PASIEN.aksi.buka} key="buka" type="button" varian="teks" onClick={() => setTerbuka({ jenis: 'detail', pasien: pasienDari(b) })} />;
                      if (jenis === 'skrining' || jenis === 'periksa') {
                        return (
                          <TombolIkonPasien ikon={ikonAksi(jenis)} label={DAFTAR_PASIEN.aksi[jenis]} key={jenis} type="button" onClick={() => k && setTerbuka({ jenis: 'pemeriksaan', mode: jenis, kunjunganId: k.id, pasien: pasienDari(b) })} />
                        );
                      }
                      if (jenis === 'persetujuan' || jenis === 'spesimen' || jenis === 'hasil_lab' || jenis === 'telaah' || jenis === 'bayar' || jenis === 'tutup_kunjungan') {
                        return <TombolIkonPasien ikon={ikonAksi(jenis)} label={DAFTAR_PASIEN.aksi[jenis]} key={jenis} type="button" varian="sekunder" onClick={() => k && setTerbuka({ jenis, kunjunganId: k.id, pasien: pasienDari(b) })} />;
                      }
                      if (jenis === 'order_lab') {
                        return <TombolIkonPasien ikon={ikonAksi(jenis)} label={DAFTAR_PASIEN.aksi[jenis]} key={jenis} type="button" varian="sekunder" onClick={() => k && setTerbuka({ jenis, kunjunganId: k.id, pasien: pasienDari(b), cara: k.cara_pembayaran === 'jkn' ? 'jkn' : 'umum' })} />;
                      }
                      if (jenis === 'riwayat' || jenis === 'keluarga') {
                        return <TombolIkonPasien ikon={ikonAksi(jenis)} label={DAFTAR_PASIEN.aksi[jenis]} key={jenis} type="button" varian="teks" onClick={() => setTerbuka({ jenis, pasien: pasienDari(b) })} />;
                      }
                      if (jenis === 'daftarkan') return <TombolIkonPasien ikon={ikonAksi('daftarkan')} label={DAFTAR_PASIEN.aksi.daftarkan} key="daftarkan" type="button" varian="sekunder" onClick={() => setTerbuka({ jenis: 'kunjungan', pasien: pasienDari(b) })} />;
                      if (jenis === 'batal') return <TombolIkonPasien ikon={ikonAksi('batal')} label={DAFTAR_PASIEN.aksi.batal} key="batal" type="button" varian="teks" disabled={memprosesAksi} onClick={() => setTerbuka({ jenis: 'batal-antrean', baris: b })} />;
                      return (
                        <TombolIkonPasien ikon={jenis === 'panggil' && k?.antrean?.status === 'dipanggil' ? 'panggil-ulang' : ikonAksi(jenis)} label={labelAksi(jenis, k?.antrean?.status ?? '')} key={jenis} type="button" varian={jenis === 'panggil' && k?.antrean?.status === 'dipanggil' ? 'teks' : 'sekunder'} disabled={memprosesAksi} onClick={() => void jalankanAksi(b, jenis)} />
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
        {hasil && <Paginasi modeIkon halaman={keadaan.halaman} total={hasil.total} ukuran={hasil.ukuran} onPindah={(h) => terapkan({ halaman: h })} />}
      </Kartu>

      {terbuka?.jenis === 'registrasi' && (
        <RegistrasiPasien onTutup={tutup} onSelesai={selesai} onDaftarkanKunjungan={(p) => setTerbuka({ jenis: 'kunjungan', pasien: p })} />
      )}
      {terbuka?.jenis === 'kunjungan' && <PendaftaranKunjungan pasien={terbuka.pasien} onTutup={tutup} onSelesai={selesai} />}
      {terbuka?.jenis === 'pemeriksaan' && (
        <PemeriksaanKlinis kunjunganId={terbuka.kunjunganId} pasien={terbuka.pasien} mode={terbuka.mode} onTutup={tutup} onSelesai={selesai} />
      )}
      {terbuka?.jenis === 'persetujuan' && <PersetujuanTindakan kunjunganId={terbuka.kunjunganId} pasien={terbuka.pasien} onTutup={tutup} onSelesai={selesai} />}
      {terbuka?.jenis === 'bayar' && <PembayaranSerahTerima kunjunganId={terbuka.kunjunganId} onTutup={tutup} onSelesai={selesai} />}
      {terbuka?.jenis === 'tutup_kunjungan' && <TutupKunjungan kunjunganId={terbuka.kunjunganId} onTutup={tutup} onSelesai={selesai} />}
      {terbuka?.jenis === 'telaah' && <TelaahResep kunjunganId={terbuka.kunjunganId} pasien={terbuka.pasien} onTutup={tutup} onSelesai={selesai} />}
      {terbuka?.jenis === 'order_lab' && <OrderLab kunjunganId={terbuka.kunjunganId} pasien={terbuka.pasien} cara={terbuka.cara} onTutup={tutup} onSelesai={selesai} />}
      {terbuka?.jenis === 'spesimen' && <AmbilSpesimen kunjunganId={terbuka.kunjunganId} pasien={terbuka.pasien} onTutup={tutup} onSelesai={selesai} />}
      {terbuka?.jenis === 'hasil_lab' && <HasilLab kunjunganId={terbuka.kunjunganId} pasien={terbuka.pasien} onTutup={tutup} onSelesai={selesai} />}
      {terbuka?.jenis === 'riwayat' && <PanelRiwayat pasienId={terbuka.pasien.id} nama={terbuka.pasien.nama} onTutup={tutup} />}
      {terbuka?.jenis === 'keluarga' && <PanelKeluarga pasienId={terbuka.pasien.id} nama={terbuka.pasien.nama} onTutup={tutup} />}
      {terbuka?.jenis === 'edit-pasien' && <EditPasien id={terbuka.pasien.id} nama={terbuka.pasien.nama} onTutup={tutup} onSelesai={selesai} />}
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
    </section>
  );
}

