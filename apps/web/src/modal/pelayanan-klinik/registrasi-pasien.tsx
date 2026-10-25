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
  KonteksPasien, LangkahAlamat, LangkahConsent, LangkahDuplikat, LangkahIdentitas, LangkahJkn, LangkahRingkasan, LangkahSosial, LangkahWali,
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
 * Modal Registrasi pasien baru (3.3, MODAL-BERTAHAP): Cari duplikat > Identitas > Data sosial > Alamat dan jalur identitas khusus >
 * Wali/keluarga > Cara pembayaran (data JKN) > General consent > Ringkasan. Satu permintaan, satu transaksi di API; draf otomatis.
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
  const [galatCari, setGalatCari] = useState<string | null>(null);
  const [teks, setTeks] = useState<TeksPersetujuanDto | null>(null);
  const [memuatTeks, setMemuatTeks] = useState(true);
  const [galatTeks, setGalatTeks] = useState<string | null>(null);
  const [drafDipulihkan, setDrafDipulihkan] = useState(false);

  const adaptor = useMemo(() => adaptorLokal<KeadaanRegistrasi>(kunci, { sensitif: BIDANG_SENSITIF_REGISTRASI }), [kunci]);
  const { pulihan, hapus, buang } = useDrafOtomatis<KeadaanRegistrasi>({ adaptor, nilai: keadaan, awal, langkah: indeks, aktif: !hasil });

  useEffect(() => {
    if (!pulihan) return;
    const n = batasi(pulihan.langkah, JUMLAH_LANGKAH_REGISTRASI);
    setKeadaan({ ...awal, ...pulihan.nilai });
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

  const cari = useCallback(async (k: KeadaanRegistrasi) => {
    setMencari(true);
    setGalatCari(null);
    try {
      setKandidat(await cekDuplikatPasien(isianCariDuplikat(k)));
    } catch (e) {
      setGalatCari(e instanceof GalatApi ? e.message : REGISTRASI.duplikatGagal);
    } finally {
      setMencari(false);
    }
  }, []);

  const dasar = { keadaan, ubah, galat: g.bidang, tampilGalat };
  const langkah: LangkahModal[] = [
    {
      id: 'duplikat', judul: REGISTRASI.langkah.duplikat,
      isi: (
        <LangkahDuplikat
          {...dasar} kandidat={kandidat} mencari={mencari} bisaCari={bisaCari} galatCari={galatCari} onCari={() => void cari(keadaan)}
          onPakai={(c) => {
            hapus();
            onDaftarkanKunjungan({ id: c.id, nama: c.nama, nomor_rm: c.nomor_rm });
          }}
        />
      ),
    },
    { id: 'identitas', judul: REGISTRASI.langkah.identitas, isi: <LangkahIdentitas {...dasar} /> },
    { id: 'sosial', judul: REGISTRASI.langkah.sosial, isi: <LangkahSosial {...dasar} /> },
    { id: 'alamat', judul: REGISTRASI.langkah.alamat, isi: <LangkahAlamat {...dasar} /> },
    { id: 'wali', judul: REGISTRASI.langkah.wali, isi: <LangkahWali {...dasar} /> },
    { id: 'jkn', judul: REGISTRASI.langkah.jkn, isi: <LangkahJkn {...dasar} /> },
    { id: 'consent', judul: REGISTRASI.langkah.consent, isi: <LangkahConsent {...dasar} teks={teks} memuat={memuatTeks} galatMuat={galatTeks} /> },
    { id: 'ringkasan', judul: REGISTRASI.langkah.ringkasan, isi: <LangkahRingkasan keadaan={keadaan} teks={teks} /> },
  ].map((l, n) => ({ ...l, selesai: n < JUMLAH_LANGKAH_REGISTRASI - 1 && dikunjungi.includes(n) && indeks !== n && !g.perLangkah[n] }));

  async function kirim() {
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
        // Kemungkinan data ganda: kembali ke langkah pertama dan muat ulang hasil pencarian.
        setGalat(e.message);
        pindah(0);
        void cari(keadaan);
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
