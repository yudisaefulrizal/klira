import { useCallback, useEffect, useMemo, useState } from 'react';
import { GALAT, MODAL, REGISTRASI } from '@klira/shared';
import type { KandidatDuplikatDto, PasienBaruDto, TeksPersetujuanDto } from '@klira/shared';
import { cekDuplikatPasien, registrasiPasien, teksGeneralConsent } from '../../api-klien/pasien';
import { GalatApi } from '../../api-klien/klien';
import { token } from '../../gaya/token';
import { ModalBertahap } from '../../komponen/modal-bertahap/modal-bertahap';
import type { LangkahModal } from '../../komponen/modal-bertahap/modal-bertahap';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Kolom } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { usePengguna } from '../../util/konteks-pengguna';
import { adaPerubahan, adaptorLokal, kunciDraf } from '../../util/draf';
import { useDrafOtomatis } from '../../util/draf-otomatis';
import { batasi, langkahBermasalah } from '../../util/langkah';
import {
  awalRegistrasi, BIDANG_KUNCI_DUPLIKAT, bentukRegistrasi, bisaCariDuplikat, galatRegistrasi, isianCariDuplikat, JUMLAH_LANGKAH_REGISTRASI,
  BIDANG_SENSITIF_REGISTRASI,
} from './keadaan-registrasi';
import type { KeadaanRegistrasi } from './keadaan-registrasi';
import {
  KonteksPasien, LangkahConsent, LangkahIdentitas, LangkahJkn, LangkahRingkasan, LangkahSosial, LangkahWali,
} from './langkah-registrasi';

export const ALUR_REGISTRASI_PASIEN = 'registrasi-pasien';

type Props = {
  onTutup: () => void;
  /** Dipanggil saat modal ditutup setelah pasien terdaftar (muat ulang daftar). */
  onSelesai: () => void;
  /** Pakai pasien yang sudah ada (hasil cek duplikat) atau lanjut mendaftarkan kunjungan pasien baru. */
  onDaftarkanKunjungan: (pasien: { id: number; nama: string; nomor_rm: string }) => void;
};

/**
 * Modal Registrasi pasien baru (3.3, MODAL-BERTAHAP): Identitas dan alamat (deteksi duplikat otomatis) > Data sosial >
 * Wali/keluarga > Data JKN > General consent > Ringkasan. Satu permintaan, satu transaksi di API; draf otomatis.
 */
export function RegistrasiPasien({ onTutup, onSelesai, onDaftarkanKunjungan }: Props) {
  const { pengguna: saya } = usePengguna();
  const awal = useMemo(() => awalRegistrasi(), []);
  const kunci = kunciDraf(ALUR_REGISTRASI_PASIEN, saya?.id);

  const [keadaan, setKeadaan] = useState<KeadaanRegistrasi>(awal);
  const [indeks, setIndeks] = useState(0);
  const [dikunjungi, setDikunjungi] = useState<number[]>([0]);
  const [tampilGalat, setTampilGalat] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [memproses, setMemproses] = useState(false);
  const [hasil, setHasil] = useState<PasienBaruDto | null>(null);
  const [kandidat, setKandidat] = useState<KandidatDuplikatDto[] | null>(null);
  const [mencari, setMencari] = useState(false);
  const [ulangiCari, setUlangiCari] = useState(0);
  const [galatCari, setGalatCari] = useState<string | null>(null);
  const [teks, setTeks] = useState<TeksPersetujuanDto | null>(null);
  const [memuatTeks, setMemuatTeks] = useState(true);
  const [galatTeks, setGalatTeks] = useState<string | null>(null);
  const [drafDipulihkan, setDrafDipulihkan] = useState(false);

  const adaptor = useMemo(() => adaptorLokal<KeadaanRegistrasi>(kunci, { sensitif: BIDANG_SENSITIF_REGISTRASI }), [kunci]);
  const { pulihan, hapus, buang } = useDrafOtomatis<KeadaanRegistrasi>({ adaptor, nilai: keadaan, awal, langkah: indeks, aktif: !hasil });

  useEffect(() => {
    if (!pulihan) return;
    // Mulai dari Identitas saat memulihkan draf agar indeks alur lama tidak melewati langkah.
    const n = 0;
    setKeadaan({ ...awal, ...pulihan.nilai, jalur_identitas: 'nik', nomor_paspor: '', nomor_kitas: '' });
    setIndeks(n);
    setDikunjungi(Array.from({ length: n + 1 }, (_x, i) => i));
    setDrafDipulihkan(true);
    // hanya sekali saat dibuka
  }, []);

  useEffect(() => {
    let batal = false;
    teksGeneralConsent()
      .then((t) => !batal && setTeks(t))
      .catch((e) => !batal && setGalatTeks(e instanceof GalatApi ? e.message : REGISTRASI.consentGagal))
      .finally(() => !batal && setMemuatTeks(false));
    return () => {
      batal = true;
    };
  }, []);

  // Mengubah bidang kunci pencarian membuat hasil duplikat lama tidak berlaku.
  const ubah = useCallback((p: Partial<KeadaanRegistrasi>) => {
    setKeadaan((k) => ({ ...k, ...p }));
    if (BIDANG_KUNCI_DUPLIKAT.some((b) => b in p)) {
      setKandidat(null);
      setGalatCari(null);
      setKeadaan((k) => (k.konfirmasi_duplikat && !('konfirmasi_duplikat' in p) ? { ...k, konfirmasi_duplikat: false } : k));
    }
  }, []);

  const g = galatRegistrasi(keadaan, teks?.id ?? null, kandidat);
  const pindah = (n: number) => {
    const t = batasi(n, JUMLAH_LANGKAH_REGISTRASI);
    setIndeks(t);
    setDikunjungi((d) => (d.includes(t) ? d : [...d, t]));
  };
  const bisaCari = bisaCariDuplikat(keadaan);

  useEffect(() => {
    let batal = false;
    setKandidat(null);
    setGalatCari(null);
    setMencari(bisaCari);
    if (!bisaCari) return;
    const jeda = setTimeout(() => {
      cekDuplikatPasien(isianCariDuplikat(keadaan))
        .then((hasil) => { if (!batal) setKandidat(hasil); })
        .catch((e) => { if (!batal) setGalatCari(e instanceof GalatApi ? e.message : REGISTRASI.duplikatGagal); })
        .finally(() => { if (!batal) setMencari(false); });
    }, 500);
    return () => { batal = true; clearTimeout(jeda); };
  }, [keadaan.nik, keadaan.nama, keadaan.tanggal_lahir, keadaan.ibu_kandung, bisaCari, ulangiCari]);

  const dasar = { keadaan, ubah, galat: g.bidang, tampilGalat };
  const langkah: LangkahModal[] = [
    {
      id: 'identitas', judul: REGISTRASI.langkah.identitas,
      isi: (
        <LangkahIdentitas
          {...dasar} kandidat={kandidat} mencari={mencari} galatCari={galatCari}
          onCari={() => setUlangiCari((n) => n + 1)}
          onPakai={(c) => {
            hapus();
            onDaftarkanKunjungan({ id: c.id, nama: c.nama, nomor_rm: c.nomor_rm });
          }}
        />
      ),
    },
    { id: 'sosial', judul: REGISTRASI.langkah.sosial, isi: <LangkahSosial {...dasar} /> },
    { id: 'wali', judul: REGISTRASI.langkah.wali, isi: <LangkahWali {...dasar} /> },
    { id: 'jkn', judul: REGISTRASI.langkah.jkn, isi: <LangkahJkn {...dasar} /> },
    { id: 'consent', judul: REGISTRASI.langkah.consent, isi: <LangkahConsent {...dasar} teks={teks} memuat={memuatTeks} galatMuat={galatTeks} /> },
    { id: 'ringkasan', judul: REGISTRASI.langkah.ringkasan, isi: <LangkahRingkasan keadaan={keadaan} teks={teks} /> },
  ].map((l, n) => ({ ...l, selesai: n < JUMLAH_LANGKAH_REGISTRASI - 1 && dikunjungi.includes(n) && indeks !== n && !g.perLangkah[n] }));

  async function kirim() {
    if (bisaCari && (mencari || kandidat === null)) {
      setGalat(galatCari ?? REGISTRASI.duplikatMencari);
      pindah(0);
      return;
    }
    const masalah = langkahBermasalah(g.perLangkah);
    if (masalah >= 0) {
      setTampilGalat(true);
      setGalat(g.perLangkah[masalah]);
      pindah(masalah);
      return;
    }
    setGalat(null);
    setMemproses(true);
    try {
      const h = await registrasiPasien(bentukRegistrasi(keadaan, teks?.id ?? null));
      hapus();
      setHasil(h);
    } catch (e) {
      if (e instanceof GalatApi && e.status === 409) {
        // Kemungkinan data ganda: kembali ke Identitas dan periksa ulang.
        setGalat(e.message);
        pindah(0);
        setUlangiCari((n) => n + 1);
      } else {
        setGalat(e instanceof GalatApi ? e.message : GALAT.umum);
      }
    } finally {
      setMemproses(false);
    }
  }

  return (
    <ModalBertahap
      judul={REGISTRASI.judul}
      langkah={langkah}
      indeks={indeks}
      onIndeks={(n) => {
        setGalat(null);
        pindah(n);
      }}
      konteks={<KonteksPasien keadaan={keadaan} />}
      catatan={
        drafDipulihkan ? (
          <Peringatan nada="biru" baris>
            <span style={{ flexGrow: 1 }}>{MODAL.drafDipulihkan}</span>
            <Tombol
              type="button"
              varian="teks"
              onClick={() => {
                buang();
                setKeadaan(awal);
                setIndeks(0);
                setDikunjungi([0]);
                setKandidat(null);
                setDrafDipulihkan(false);
              }}
            >
              {MODAL.buangDraf}
            </Tombol>
          </Peringatan>
        ) : undefined
      }
      galat={galat}
      onTutup={hasil ? onSelesai : onTutup}
      lindungiTutup={adaPerubahan(awal, keadaan)}
      onLanjut={(dari) => {
        if (dari === 0 && bisaCari && (mencari || kandidat === null)) {
          setGalat(galatCari ?? REGISTRASI.duplikatMencari);
          return false;
        }
        if (g.perLangkah[dari]) {
          setTampilGalat(true);
          setGalat(g.perLangkah[dari]);
          return false;
        }
        setGalat(null);
        return true;
      }}
      labelKirim={memproses ? REGISTRASI.membuat : REGISTRASI.buat}
      onKirim={() => {
        if (!memproses) void kirim();
      }}
      kirimNonaktif={memproses}
      hasil={
        hasil
          ? {
              judul: REGISTRASI.berhasilJudul,
              isi: (
                <Kolom>
                  <p style={{ margin: 0 }}>{REGISTRASI.berhasilPesan(hasil.nama)}</p>
                  <Kolom jarak="xs">
                    <span style={{ color: token.warna.teksRedup }}>{REGISTRASI.nomorRm}</span>
                    <strong style={{ fontSize: token.huruf.ukuran.judul }} data-testid="nomor-rm-baru">{hasil.nomor_rm}</strong>
                  </Kolom>
                </Kolom>
              ),
              aksi: (
                <>
                  <Tombol type="button" varian="sekunder" onClick={onSelesai}>{REGISTRASI.selesai}</Tombol>
                  <Tombol type="button" onClick={() => onDaftarkanKunjungan({ id: hasil.id, nama: hasil.nama, nomor_rm: hasil.nomor_rm })}>{REGISTRASI.daftarkanKunjungan}</Tombol>
                </>
              ),
            }
          : undefined
      }
    />
  );
}
