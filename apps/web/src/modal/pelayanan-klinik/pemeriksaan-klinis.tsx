import { TombolIkonPasien } from '../../komponen/ikon-pasien';
import './pemeriksaan-klinis.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BAGIAN_KLINIS, GALAT, KLINIS, TAHAP_LAYANAN } from '@klira/shared';
import type { BagianKlinis, FavoritDto, JenisFavorit, KlinisKunjunganDto, KonteksKlinisDto, KunjunganDto, SalinanKunjunganDto, TemplatDto } from '@klira/shared';
import { buatOrderLab } from '../../api-klien/penunjang';
import { awalOrderLab, bentukOrderLab, galatOrderLab } from './keadaan-order-lab';
import { GalatApi } from '../../api-klien/klien';
import { adaptorDrafServer } from '../../api-klien/draf-klinis';
import { adaIsianResep, awalResep, bentukResep, galatResep } from './keadaan-farmasi';
import { buatResep, resepKunjungan } from '../../api-klien/farmasi';
import { ambilKlinis, ambilKonteksKlinis, daftarFavorit, selesaikanPemeriksaan, simpanBagian } from '../../api-klien/klinis';
import { token } from '../../gaya/token';
import { HanyaDenganIzin } from '../../komponen/izin-saja';
import { ModalBertahap } from '../../komponen/modal-bertahap/modal-bertahap';
import type { LangkahModal } from '../../komponen/modal-bertahap/modal-bertahap';
import { Lencana } from '../../komponen/ui/lencana';
import { KotakCentang } from '../../komponen/ui/kotak-centang';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Kolom, Sebaris } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { adaPerubahan, hapusDrafKlinisLama } from '../../util/draf';
import { useDrafOtomatis } from '../../util/draf-otomatis';
import { batasi } from '../../util/langkah';
import { KonteksKlinis } from './konteks-klinis';
import {
  awalKeadaan, bagianLangkah, langkahDraf, bagianDiModal, daftarLangkah, disahkanDari, isiBagian, keadaanDariServer, LABEL_BAGIAN, pakaiTemplat, perluAlasan, pulihkanKeadaan, rencanaSimpan, salinKeKeadaan, statusRingkasan,
  syaratSelesaiTerpenuhi, tambahDiagnosis, tambahTindakan,
} from './keadaan-pemeriksaan';
import type { BagianSalinan, KeadaanPemeriksaan, ModePemeriksaan } from './keadaan-pemeriksaan';
import {
  LangkahNarasi, LangkahAnamnesis, LangkahDiagnosis, LangkahMenyusul, LangkahPemeriksaan, LangkahRingkasan, LangkahTandaVital, LangkahTindakan, LangkahTindakLanjut,
} from './langkah-pemeriksaan';
import { LangkahPenunjang } from './langkah-penunjang';
import { LangkahResep } from './langkah-resep';
import { RingkasanOrderKunjungan } from './ringkasan-order-kunjungan';
import { HasilPenunjangKunjungan } from './hasil-penunjang-kunjungan';
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
 * Modal Pemeriksaan klinis: S > O > A > P > I > E > Ringkasan. Daftar langkah dari konfigurasi (keadaan-pemeriksaan). Perawat memakai mode skrining (tanda vital saja).
 * Simpan = pengesahan catatan per bagian yang berubah. Draf otomatis disimpan di SERVER (data kesehatan tidak boleh di penyimpanan lokal
 * komputer bersama), kedaluwarsa di server, dan dihapus saat selesai.
 */
export function PemeriksaanKlinis({ kunjunganId, pasien, mode, onTutup, onSelesai }: Props) {
  const konfig = useMemo(() => daftarLangkah(mode), [mode]);
  const adaptor = useMemo(() => adaptorDrafServer<KeadaanPemeriksaan>(kunjunganId, mode === 'skrining' ? ALUR_SKRINING : ALUR_PEMERIKSAAN), [kunjunganId, mode]);

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
  const adaTersimpan = useRef(false);
  const sedangMengirim = useRef(false);

  const server = useMemo(() => (klinis ? keadaanDariServer(klinis.bagian) : awalKeadaan()), [klinis]);
  const disahkan = useMemo(() => (klinis ? disahkanDari(klinis.bagian) : ({} as Record<BagianKlinis, boolean>)), [klinis]);

  const [formSiap, setFormSiap] = useState(false);
  const { pulihan, siap: drafSiap, hapus } = useDrafOtomatis<KeadaanPemeriksaan>({
    adaptor, nilai: keadaan, awal: server, langkah: indeks, aktif: formSiap && !hasil,
  });

  // Muat catatan tersimpan, ringkasan pasien, dan favorit; sisa draf lokal lama dibuang (draf kini di server).
  useEffect(() => {
    hapusDrafKlinisLama();
    let batal = false;
    Promise.all([ambilKlinis(kunjunganId), ambilKonteksKlinis(kunjunganId), daftarFavorit().catch(() => [] as FavoritDto[])])
      .then(([k, c, f]) => {
        if (batal) return;
        setKlinis(k);
        setKonteks(c);
        setFavorit(f);
      })
      .catch((e) => !batal && setGalatMuat(e instanceof GalatApi ? e.message : KLINIS.konteks.gagal));
    return () => {
      batal = true;
    };
    // hanya sekali saat dibuka
  }, [kunjunganId]);

  // Setelah catatan dan draf server sama-sama terbaca: draf yang ada menimpa isian server, sekali saja.
  useEffect(() => {
    if (!klinis || !drafSiap || formSiap) return;
    const dasar = keadaanDariServer(klinis.bagian);
    if (pulihan) {
      const n = batasi(langkahDraf(mode, pulihan.langkah, pulihan.nilai), konfig.length);
      setKeadaan(pulihkanKeadaan(dasar, pulihan.nilai));
      setIndeks(n);
      setDikunjungi(Array.from({ length: n + 1 }, (_x, i) => i));
    } else setKeadaan(dasar);
    setFormSiap(true);
  }, [klinis, drafSiap, formSiap, pulihan, konfig.length, mode]);

  const ubah = useCallback((p: Partial<KeadaanPemeriksaan>) => setKeadaan((k) => ({ ...k, ...p })), []);
  const pindah = (n: number) => {
    const t = batasi(n, konfig.length);
    setIndeks(t);
    setDikunjungi((d) => (d.includes(t) ? d : [...d, t]));
  };

  const rencana = useMemo(() => rencanaSimpan(mode, keadaan, server, disahkan), [mode, keadaan, server, disahkan]);
  const galatDi = (bagian?: BagianKlinis) => (tampilGalat && bagian ? rencana.find((r) => r.bagian === bagian)?.galat ?? null : null);
  const alasanPerlu = perluAlasan(rencana, disahkan);
  const bisaSelesai = mode === 'periksa' && !!klinis && klinis.kunjungan.tahap_layanan === 'pemeriksaan' && syaratSelesaiTerpenuhi(disahkan, rencana) && (['anamnesis', 'diagnosis', 'tindak_lanjut'] as const).every((b) => klinis.bagian[b].verifikasi === 'sah' || rencana.some((r) => r.bagian === b && !r.galat));
  const pilihSelesai = selesaiDipilih && bisaSelesai;
  const adaResepBaru = adaIsianResep(keadaan.resep);
  const adaYangDikirim = rencana.length > 0 || pilihSelesai || keadaan.lab_dipilih || adaResepBaru;
  const statusBagian = Object.fromEntries(BAGIAN_KLINIS.map((b) => [b, statusRingkasan(b, keadaan, server, klinis?.bagian[b].verifikasi ?? 'belum_disahkan')])) as Parameters<typeof LangkahRingkasan>[0]['status'];

  const infoServer = (b?: BagianKlinis) => (b && klinis ? klinis.bagian[b] : null);
  const dasar = (b?: BagianKlinis) => ({ k: keadaan, ubah, galat: galatDi(b), server: infoServer(b) });
  const favoritDari = (j: JenisFavorit) => favorit.filter((f) => f.jenis === j);
  const berikut = () => pindah(indeks + 1);

  const isiLangkah = (l: (typeof konfig)[number]) => {
    if (!klinis || !formSiap) return galatMuat ? <Peringatan>{galatMuat}</Peringatan> : <span style={{ color: token.warna.teksRedup }}>{KLINIS.konteks.memuat}</span>;
    if (!l.aktif) return <LangkahMenyusul langkah={l} onLewati={berikut} />;
    switch (l.id) {
      case 'subjective': return <LangkahAnamnesis {...dasar('anamnesis')} />;
      case 'objective': return <Kolom>
        <LangkahTandaVital {...dasar('tanda_vital')} />
        <LangkahPemeriksaan {...dasar('pemeriksaan')} />
        <HasilPenunjangKunjungan kunjunganId={kunjunganId} />
      </Kolom>;
      case 'assessment': return <Kolom>
        <LangkahNarasi bagian="assessment" {...dasar('assessment')} />
        <LangkahDiagnosis {...dasar('diagnosis')} favorit={favoritDari('diagnosis')} />
      </Kolom>;
      case 'plan': return <Kolom>
        <LangkahTindakLanjut {...dasar('tindak_lanjut')} ringkas />
        <LangkahNarasi bagian="plan" {...dasar('plan')} />
        <LangkahResep baris={keadaan.resep} onUbah={(resep) => ubah({ resep })} tampilGalat={tampilGalat && adaResepBaru} disabled={memproses} />
        <KotakCentang id="plan-lab" label="Lab" checked={keadaan.lab_dipilih} disabled={memproses} onChange={(e) => ubah({ lab_dipilih: e.target.checked })} />
        {keadaan.lab_dipilih && <LangkahPenunjang cara={konteks?.kunjungan.cara_pembayaran === 'jkn' ? 'jkn' : 'umum'} k={keadaan.order_lab} onUbah={(order_lab) => ubah({ order_lab })} disabled={memproses} galatPilihan={tampilGalat && keadaan.lab_dipilih ? galatOrderLab(keadaan.order_lab) : null} />}
      </Kolom>;
      case 'implementasi': return <Kolom>
        <LangkahNarasi bagian="implementasi" {...dasar('implementasi')} />
        <LangkahTindakan {...dasar('tindakan')} favorit={favoritDari('tindakan')} />
      </Kolom>;
      case 'evaluasi': return <LangkahNarasi bagian="evaluasi" {...dasar('evaluasi')} />;
      case 'anamnesis': return <LangkahAnamnesis {...dasar(l.bagian)} />;
      case 'tanda_vital': return <LangkahTandaVital {...dasar(l.bagian)} />;
      case 'pemeriksaan': return <LangkahPemeriksaan {...dasar(l.bagian)} />;
      case 'diagnosis': return <LangkahDiagnosis {...dasar(l.bagian)} favorit={favoritDari('diagnosis')} />;
      case 'tindakan': return <LangkahTindakan {...dasar(l.bagian)} favorit={favoritDari('tindakan')} />;
      case 'resep': return <LangkahResep baris={keadaan.resep} onUbah={(resep) => ubah({ resep })} tampilGalat={tampilGalat && adaResepBaru} disabled={memproses} />;
      case 'penunjang': return <LangkahPenunjang cara={konteks?.kunjungan.cara_pembayaran === 'jkn' ? 'jkn' : 'umum'} k={keadaan.order_lab} onUbah={(order_lab) => ubah({ order_lab })} disabled={memproses} galatPilihan={tampilGalat && keadaan.lab_dipilih ? galatOrderLab(keadaan.order_lab) : null} />;
      case 'tindak_lanjut': return <LangkahTindakLanjut {...dasar(l.bagian)} />;
      default:
        return (
          <LangkahRingkasan
            k={keadaan} ubah={ubah} rencana={rencana} status={statusBagian} bagian={bagianDiModal(mode)} labelBagian={labelBagian} perluAlasan={alasanPerlu}
            bisaSelesai={bisaSelesai} tampilSelesai={mode === 'periksa'} selesai={selesaiDipilih} onSelesai={setSelesaiDipilih}
          >
            {mode === 'periksa' && <RingkasanOrderKunjungan kunjunganId={kunjunganId} k={keadaan} />}
          </LangkahRingkasan>
        );
    }
  };

  const langkah: LangkahModal[] = konfig.map((l, n) => ({
    id: l.id, judul: l.judul, isi: isiLangkah(l),
    selesai: bagianLangkah(l).some((b) => disahkan[b]) && bagianLangkah(l).every((b) => !rencana.some((r) => r.bagian === b) && !galatDi(b)) && dikunjungi.includes(n) && indeks !== n,
  }));

  async function kirim() {
    if (sedangMengirim.current) return;
    const galatObat = adaResepBaru ? Object.values(galatResep(keadaan.resep))[0] : undefined;
    if (galatObat) {
      setTampilGalat(true);
      setGalat(galatObat);
      pindah(konfig.findIndex((l) => l.id === 'plan' || l.id === 'resep'));
      return;
    }
    if (keadaan.lab_dipilih && galatOrderLab(keadaan.order_lab)) {
      setTampilGalat(true);
      setGalat(galatOrderLab(keadaan.order_lab));
      pindah(konfig.findIndex((l) => l.id === 'plan' || l.id === 'penunjang'));
      return;
    }
    const masalah = rencana.findIndex((r) => r.galat);
    if (masalah >= 0) {
      setTampilGalat(true);
      setGalat(rencana[masalah].galat);
      const n = konfig.findIndex((l) => bagianLangkah(l).includes(rencana[masalah].bagian));
      pindah(n >= 0 ? n : konfig.length - 1);
      return;
    }
    if (alasanPerlu && !keadaan.alasan.trim()) {
      setGalat(KLINIS.galat.alasanPerbaikan);
      return;
    }
    setGalat(null);
    sedangMengirim.current = true;
    setMemproses(true);
    let labBerjalan = false;
    let resepBerjalan = false;
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
      if (keadaan.lab_dipilih) {
        labBerjalan = true;
        await buatOrderLab(kunjunganId, bentukOrderLab({ ...keadaan.order_lab, prioritas: 'rutin' }));
        labBerjalan = false;
        adaTersimpan.current = true;
        // Hapus draf order yang berhasil agar kegagalan tahap berikutnya tidak memesannya lagi.
        ubah({ lab_dipilih: false, order_lab: awalOrderLab() });
      }
      if (adaResepBaru) {
        resepBerjalan = true;
        await buatResep(kunjunganId, bentukResep(keadaan.resep));
        resepBerjalan = false;
        adaTersimpan.current = true;
        // Resep yang sudah dikonfirmasi tidak diajukan lagi bila tahap berikutnya gagal.
        ubah({ resep: awalResep() });
      }
      let kunjungan = (await ambilKlinis(kunjunganId)).kunjungan;
      if (pilihSelesai) {
        // Resep yang belum siap mengirim kunjungan ke farmasi (tahap resep); tanpa itu langsung ke kasir.
        const perluFarmasi = (await resepKunjungan(kunjunganId)).some((r) => r.status === 'diajukan' || r.status === 'ditelaah');
        kunjungan = await selesaikanPemeriksaan(kunjunganId, perluFarmasi ? 'resep' : 'kasir');
        adaTersimpan.current = true;
      }
      hapus();
      setHasil({ jumlah: disimpan, kunjungan });
    } catch (e) {
      const pesan = e instanceof GalatApi ? e.message : GALAT.umum;
      setGalat(resepBerjalan ? `Penyimpanan pemeriksaan belum lengkap pada bagian resep. ${pesan}` : labBerjalan ? `Penyimpanan pemeriksaan belum lengkap pada bagian lab. ${pesan}` : bagianBerjalan ? `${KLINIS.gagalSebagian(labelBagian[bagianBerjalan])} ${pesan}` : pesan);
      // sebagian bagian mungkin sudah tersimpan: muat ulang agar keadaan pengesahan tampil benar
      void ambilKlinis(kunjunganId).then(setKlinis).catch(() => undefined);
      setTampilGalat(true);
    } finally {
      sedangMengirim.current = false;
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
        aksiHeader={
          <div className="pemeriksaan-aksi-header" role="group" aria-label="Alat pemeriksaan">
            <TombolIkonPasien ikon="riwayat" label={KLINIS.tombol.riwayat} varian="teks" style={{ padding: 0 }} onClick={() => setPanel('riwayat')} />
            {mode === 'periksa' && <TombolIkonPasien label={KLINIS.tombol.salin} varian="teks" style={{ padding: 0 }} onClick={() => setPanel('salin')}
              ikonKustom={<svg width="24" height="24" style={{ width: 24, height: 24, flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3"/></svg>} />}
            {mode === 'periksa' && <TombolIkonPasien label={KLINIS.tombol.favorit} varian="teks" style={{ padding: 0 }} onClick={() => setPanel('favorit')}
              ikonKustom={<svg width="24" height="24" style={{ width: 24, height: 24, flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z"/></svg>} />}
            <TombolIkonPasien ikon="keluarga" label={KLINIS.tombol.keluarga} varian="teks" style={{ padding: 0 }} onClick={() => setPanel('keluarga')} />
          </div>
        }
        galat={galat}
        onTutup={hasil ? onSelesai : tutup}
        lindungiTutup={formSiap && adaPerubahan(server, keadaan)}
        onLanjut={(dari) => {
          const bagian = bagianLangkah(konfig[dari]);
          const g = rencana.find((r) => bagian.includes(r.bagian) && r.galat)?.galat;
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
        kirimNonaktif={memproses || !formSiap || !adaYangDikirim}
        hasil={
          hasil
            ? {
                judul: mode === 'skrining' ? KLINIS.hasil.judul : 'Pemeriksaan tersimpan',
                isi: (
                  <Kolom>
                    <p style={{ margin: 0 }}>{mode === 'skrining' ? KLINIS.hasil.pesanSkrining : 'Pemeriksaan tersimpan dan disahkan.'}</p>
                    <Sebaris>
                      <span style={{ color: token.warna.teksRedup }}>{KLINIS.hasil.tahap}</span>
                      <Lencana warna={TAHAP_LAYANAN.warna(hasil.kunjungan.tahap_layanan)}>{TAHAP_LAYANAN.label(hasil.kunjungan.tahap_layanan)}</Lencana>
                    </Sebaris>
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
