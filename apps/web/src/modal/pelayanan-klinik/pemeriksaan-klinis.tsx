import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BAGIAN_KLINIS, GALAT, KLINIS, MODAL, TAHAP_LAYANAN } from '@klira/shared';
import type { BagianKlinis, FavoritDto, JenisFavorit, KlinisKunjunganDto, KonteksKlinisDto, KunjunganDto, SalinanKunjunganDto, TemplatDto } from '@klira/shared';
import { GalatApi } from '../../api-klien/klien';
import { ambilKlinis, ambilKonteksKlinis, daftarFavorit, selesaikanPemeriksaan, simpanBagian } from '../../api-klien/klinis';
import { token } from '../../gaya/token';
import { HanyaDenganIzin } from '../../komponen/izin-saja';
import { ModalBertahap } from '../../komponen/modal-bertahap/modal-bertahap';
import type { LangkahModal } from '../../komponen/modal-bertahap/modal-bertahap';
import { Lencana } from '../../komponen/ui/lencana';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Kolom } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { adaPerubahan, kunciDraf } from '../../util/draf';
import { useDrafOtomatis } from '../../util/draf-otomatis';
import { usePengguna } from '../../util/konteks-pengguna';
import { batasi } from '../../util/langkah';
import { KonteksKlinis } from './konteks-klinis';
import {
  awalKeadaan, bagianDiModal, BIDANG_SENSITIF_PEMERIKSAAN, daftarLangkah, disahkanDari, isiBagian, keadaanDariServer, LABEL_BAGIAN, pakaiTemplat, perluAlasan, rencanaSimpan, salinKeKeadaan, statusRingkasan,
  syaratSelesaiTerpenuhi, tambahDiagnosis, tambahTindakan,
} from './keadaan-pemeriksaan';
import type { BagianSalinan, KeadaanPemeriksaan, ModePemeriksaan } from './keadaan-pemeriksaan';
import {
  LangkahAnamnesis, LangkahDiagnosis, LangkahMenyusul, LangkahPemeriksaan, LangkahRingkasan, LangkahTandaVital, LangkahTindakan, LangkahTindakLanjut,
} from './langkah-pemeriksaan';
import { PanelFavorit } from './panel-favorit';
import { PanelKeluarga } from './panel-keluarga';
import { PanelRiwayat } from './panel-riwayat';
import { PanelSalin } from './panel-salin';

export const ALUR_PEMERIKSAAN = 'pemeriksaan-klinis';
export const ALUR_SKRINING = 'skrining';

type PanelTerbuka = 'riwayat' | 'salin' | 'favorit' | 'keluarga' | null;
type Props = {
  kunjunganId: number;
  pasien: { id: number; nama: string; nomor_rm: string };
  mode: ModePemeriksaan;
  onTutup: () => void;
  /** Dipanggil saat modal ditutup setelah ada catatan yang tersimpan (muat ulang daftar). */
  onSelesai: () => void;
};

const labelBagian = LABEL_BAGIAN;

/**
 * Modal Pemeriksaan klinis (3.3, MODAL-BERTAHAP): Anamnesis > Tanda vital > Pemeriksaan > Diagnosis > Tindakan > Resep > Order penunjang >
 * Rencana tindak lanjut > Ringkasan. Daftar langkah dari konfigurasi (keadaan-pemeriksaan). Perawat memakai mode skrining (tanda vital saja).
 * Simpan = pengesahan catatan per bagian yang berubah; draf otomatis dengan bidang sensitif dikecualikan dan kedaluwarsa, dihapus saat selesai.
 */
export function PemeriksaanKlinis({ kunjunganId, pasien, mode, onTutup, onSelesai }: Props) {
  const { pengguna: saya } = usePengguna();
  const konfig = useMemo(() => daftarLangkah(mode), [mode]);
  const kunci = kunciDraf(`${mode === 'skrining' ? ALUR_SKRINING : ALUR_PEMERIKSAAN}-${kunjunganId}`, saya?.id);

  const [klinis, setKlinis] = useState<KlinisKunjunganDto | null>(null);
  const [konteks, setKonteks] = useState<KonteksKlinisDto | null>(null);
  const [galatMuat, setGalatMuat] = useState<string | null>(null);
  const [keadaan, setKeadaan] = useState<KeadaanPemeriksaan>(awalKeadaan);
  const [indeks, setIndeks] = useState(0);
  const [dikunjungi, setDikunjungi] = useState<number[]>([0]);
  const [tampilGalat, setTampilGalat] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [memproses, setMemproses] = useState(false);
  const [selesaiDipilih, setSelesaiDipilih] = useState(true);
  const [hasil, setHasil] = useState<{ jumlah: number; kunjungan: KunjunganDto } | null>(null);
  const [panel, setPanel] = useState<PanelTerbuka>(null);
  const [favorit, setFavorit] = useState<FavoritDto[]>([]);
  const [drafDipulihkan, setDrafDipulihkan] = useState(false);
  const adaTersimpan = useRef(false);

  const server = useMemo(() => (klinis ? keadaanDariServer(klinis.bagian) : awalKeadaan()), [klinis]);
  const disahkan = useMemo(() => (klinis ? disahkanDari(klinis.bagian) : ({} as Record<BagianKlinis, boolean>)), [klinis]);

  const { pulihan, hapus, buang } = useDrafOtomatis<KeadaanPemeriksaan>({
    kunci, nilai: keadaan, awal: server, langkah: indeks, aktif: !!klinis && !hasil, sensitif: BIDANG_SENSITIF_PEMERIKSAAN,
  });

  // Muat catatan tersimpan, ringkasan pasien, dan favorit; draf yang ada menimpa isian server hanya untuk bidang tidak sensitif.
  const dimuat = useRef(false);
  useEffect(() => {
    let batal = false;
    Promise.all([ambilKlinis(kunjunganId), ambilKonteksKlinis(kunjunganId), daftarFavorit().catch(() => [] as FavoritDto[])])
      .then(([k, c, f]) => {
        if (batal) return;
        setKlinis(k);
        setKonteks(c);
        setFavorit(f);
        const dasar = keadaanDariServer(k.bagian);
        if (pulihan && !dimuat.current) {
          const n = batasi(pulihan.langkah, konfig.length);
          setKeadaan({ ...dasar, ...pulihan.nilai });
          setIndeks(n);
          setDikunjungi(Array.from({ length: n + 1 }, (_x, i) => i));
          setDrafDipulihkan(true);
        } else setKeadaan(dasar);
        dimuat.current = true;
      })
      .catch((e) => !batal && setGalatMuat(e instanceof GalatApi ? e.message : KLINIS.konteks.gagal));
    return () => {
      batal = true;
    };
    // hanya sekali saat dibuka
  }, [kunjunganId]);

  const ubah = useCallback((p: Partial<KeadaanPemeriksaan>) => setKeadaan((k) => ({ ...k, ...p })), []);
  const pindah = (n: number) => {
    const t = batasi(n, konfig.length);
    setIndeks(t);
    setDikunjungi((d) => (d.includes(t) ? d : [...d, t]));
  };

  const rencana = useMemo(() => rencanaSimpan(mode, keadaan, server, disahkan), [mode, keadaan, server, disahkan]);
  const galatDi = (bagian?: BagianKlinis) => (tampilGalat && bagian ? rencana.find((r) => r.bagian === bagian)?.galat ?? null : null);
  const alasanPerlu = perluAlasan(rencana, disahkan);
  const bisaSelesai = mode === 'periksa' && !!klinis && klinis.kunjungan.tahap_layanan === 'pemeriksaan' && syaratSelesaiTerpenuhi(disahkan, rencana);
  const pilihSelesai = selesaiDipilih && bisaSelesai;
  const adaYangDikirim = rencana.length > 0 || pilihSelesai;
  const statusBagian = Object.fromEntries(BAGIAN_KLINIS.map((b) => [b, statusRingkasan(b, keadaan, server, !!disahkan[b])])) as Parameters<typeof LangkahRingkasan>[0]['status'];

  const infoServer = (b?: BagianKlinis) => (b && klinis ? klinis.bagian[b] : null);
  const dasar = (b?: BagianKlinis) => ({ k: keadaan, ubah, galat: galatDi(b), server: infoServer(b) });
  const favoritDari = (j: JenisFavorit) => favorit.filter((f) => f.jenis === j);
  const berikut = () => pindah(indeks + 1);

  const isiLangkah = (l: (typeof konfig)[number]) => {
    if (!klinis) return galatMuat ? <Peringatan>{galatMuat}</Peringatan> : <span style={{ color: token.warna.teksRedup }}>{KLINIS.konteks.memuat}</span>;
    if (!l.aktif) return <LangkahMenyusul langkah={l} onLewati={berikut} />;
    switch (l.id) {
      case 'anamnesis': return <LangkahAnamnesis {...dasar(l.bagian)} />;
      case 'tanda_vital': return <LangkahTandaVital {...dasar(l.bagian)} />;
      case 'pemeriksaan': return <LangkahPemeriksaan {...dasar(l.bagian)} />;
      case 'diagnosis': return <LangkahDiagnosis {...dasar(l.bagian)} favorit={favoritDari('diagnosis')} />;
      case 'tindakan': return <LangkahTindakan {...dasar(l.bagian)} favorit={favoritDari('tindakan')} />;
      case 'tindak_lanjut': return <LangkahTindakLanjut {...dasar(l.bagian)} />;
      default:
        return (
          <LangkahRingkasan
            k={keadaan} ubah={ubah} rencana={rencana} status={statusBagian} bagian={bagianDiModal(mode)} labelBagian={labelBagian} perluAlasan={alasanPerlu}
            bisaSelesai={bisaSelesai} tampilSelesai={mode === 'periksa'} selesai={selesaiDipilih} onSelesai={setSelesaiDipilih}
          />
        );
    }
  };

  const langkah: LangkahModal[] = konfig.map((l, n) => ({
    id: l.id, judul: l.judul, isi: isiLangkah(l),
    selesai: !!l.bagian && !!disahkan[l.bagian] && dikunjungi.includes(n) && indeks !== n && !galatDi(l.bagian),
  }));

  async function kirim() {
    const masalah = rencana.findIndex((r) => r.galat);
    if (masalah >= 0) {
      setTampilGalat(true);
      setGalat(rencana[masalah].galat);
      const n = konfig.findIndex((l) => l.bagian === rencana[masalah].bagian);
      pindah(n >= 0 ? n : konfig.length - 1);
      return;
    }
    if (alasanPerlu && !keadaan.alasan.trim()) {
      setGalat(KLINIS.galat.alasanPerbaikan);
      return;
    }
    setGalat(null);
    setMemproses(true);
    let disimpan = 0;
    let bagianBerjalan: BagianKlinis | null = null;
    try {
      for (const r of rencana) {
        bagianBerjalan = r.bagian;
        const h = await simpanBagian(kunjunganId, r.bagian, isiBagian(r.bagian, keadaan), disahkan[r.bagian] ? keadaan.alasan : undefined);
        if (h.tersimpan) disimpan += 1;
        adaTersimpan.current = adaTersimpan.current || h.tersimpan;
      }
      bagianBerjalan = null;
      let kunjungan = (await ambilKlinis(kunjunganId)).kunjungan;
      if (pilihSelesai) {
        kunjungan = await selesaikanPemeriksaan(kunjunganId, 'kasir');
        adaTersimpan.current = true;
      }
      hapus();
      setHasil({ jumlah: disimpan, kunjungan });
    } catch (e) {
      const pesan = e instanceof GalatApi ? e.message : GALAT.umum;
      setGalat(bagianBerjalan ? `${KLINIS.gagalSebagian(labelBagian[bagianBerjalan])} ${pesan}` : pesan);
      // sebagian bagian mungkin sudah tersimpan: muat ulang agar keadaan pengesahan tampil benar
      void ambilKlinis(kunjunganId).then(setKlinis).catch(() => undefined);
      setTampilGalat(true);
    } finally {
      setMemproses(false);
    }
  }

  const salin = (s: SalinanKunjunganDto, pilih: readonly BagianSalinan[]): number => {
    const { keadaan: baru, jumlah } = salinKeKeadaan(keadaan, s, pilih, new Date());
    setKeadaan(baru);
    return jumlah;
  };
  const pakaiKode = (jenis: JenisFavorit, x: { kode: string; nama: string }) => {
    if (jenis === 'diagnosis') setKeadaan((k) => ({ ...k, diagnosis: tambahDiagnosis(k.diagnosis, x) }));
    else if (jenis === 'tindakan') setKeadaan((k) => ({ ...k, tindakan: tambahTindakan(k.tindakan, x, new Date()) }));
  };
  const pakaiTemplatCatatan = (t: TemplatDto) => setKeadaan((k) => pakaiTemplat(k, t));

  const tutup = () => {
    if (adaTersimpan.current) onSelesai();
    else onTutup();
  };
  const tombolPanel = (id: Exclude<PanelTerbuka, null>, teks: string) => <Tombol type="button" varian="sekunder" onClick={() => setPanel(id)}>{teks}</Tombol>;

  const judul = mode === 'skrining' ? KLINIS.judulSkrining : KLINIS.judul;
  return (
    <>
      <ModalBertahap
        judul={judul}
        langkah={langkah}
        indeks={indeks}
        onIndeks={(n) => {
          setGalat(null);
          pindah(n);
        }}
        konteks={<KonteksKlinis konteks={konteks} nama={pasien.nama} nomorRm={pasien.nomor_rm} />}
        catatan={
          <Kolom jarak="sm">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: token.jarak.sm }}>
              {tombolPanel('riwayat', KLINIS.tombol.riwayat)}
              {mode === 'periksa' && tombolPanel('salin', KLINIS.tombol.salin)}
              {mode === 'periksa' && tombolPanel('favorit', KLINIS.tombol.favorit)}
              {tombolPanel('keluarga', KLINIS.tombol.keluarga)}
            </div>
            {drafDipulihkan && (
              <Peringatan nada="biru" style={{ display: 'flex', alignItems: 'center', gap: token.jarak.md }}>
                <span style={{ flexGrow: 1 }}>{MODAL.drafDipulihkan}</span>
                <Tombol
                  type="button"
                  varian="teks"
                  onClick={() => {
                    buang();
                    setKeadaan(server);
                    setIndeks(0);
                    setDikunjungi([0]);
                    setDrafDipulihkan(false);
                  }}
                >
                  {MODAL.buangDraf}
                </Tombol>
              </Peringatan>
            )}
          </Kolom>
        }
        galat={galat}
        onTutup={hasil ? onSelesai : tutup}
        lindungiTutup={!!klinis && adaPerubahan(server, keadaan)}
        onLanjut={(dari) => {
          const b = konfig[dari]?.bagian;
          const g = b ? rencana.find((r) => r.bagian === b)?.galat : null;
          if (g) {
            setTampilGalat(true);
            setGalat(g);
            return false;
          }
          setGalat(null);
          return true;
        }}
        labelKirim={memproses ? KLINIS.tombol.menyimpan : KLINIS.tombol.simpan}
        onKirim={() => {
          if (!memproses) void kirim();
        }}
        kirimNonaktif={memproses || !klinis || !adaYangDikirim}
        hasil={
          hasil
            ? {
                judul: KLINIS.hasil.judul,
                isi: (
                  <Kolom>
                    <p style={{ margin: 0 }}>{mode === 'skrining' ? KLINIS.hasil.pesanSkrining : KLINIS.hasil.pesan(hasil.jumlah)}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: token.jarak.sm }}>
                      <span style={{ color: token.warna.teksRedup }}>{KLINIS.hasil.tahap}</span>
                      <Lencana warna={TAHAP_LAYANAN.warna(hasil.kunjungan.tahap_layanan)}>{TAHAP_LAYANAN.label(hasil.kunjungan.tahap_layanan)}</Lencana>
                    </div>
                  </Kolom>
                ),
                aksi: <Tombol type="button" onClick={onSelesai}>{KLINIS.hasil.tutup}</Tombol>,
              }
            : undefined
        }
      />
      {panel === 'riwayat' && <PanelRiwayat pasienId={pasien.id} nama={pasien.nama} kecualiKunjunganId={kunjunganId} onTutup={() => setPanel(null)} />}
      {panel === 'salin' && <PanelSalin kunjunganId={kunjunganId} pasienId={pasien.id} onSalin={salin} onTutup={() => setPanel(null)} />}
      {panel === 'favorit' && (
        <HanyaDenganIzin fitur="klinis" aksi="input">
          <PanelFavorit k={keadaan} favorit={favorit} onFavorit={setFavorit} onPakaiKode={pakaiKode} onPakaiTemplat={pakaiTemplatCatatan} onTutup={() => setPanel(null)} />
        </HanyaDenganIzin>
      )}
      {panel === 'keluarga' && <PanelKeluarga pasienId={pasien.id} nama={pasien.nama} onTutup={() => setPanel(null)} />}
    </>
  );
}
