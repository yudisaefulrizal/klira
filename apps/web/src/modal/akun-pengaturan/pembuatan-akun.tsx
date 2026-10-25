import { useCallback, useEffect, useMemo, useState } from 'react';
import { AKUN_BARU, MODAL } from '@klira/shared';
import type { PenggunaBaruDto, PeringatanTerdeteksi } from '@klira/shared';
import { buatPengguna } from '../../api-klien/pengguna';
import { daftarIzin, daftarJenisAkun } from '../../api-klien/izin';
import { GalatApi } from '../../api-klien/klien';
import { FormPeringatan, dariIsian, isianPeringatanAwal, isianPeringatanSiap } from '../../komponen/peringatan/peringatan-izin';
import { ModalBertahap } from '../../komponen/modal-bertahap/modal-bertahap';
import type { LangkahModal } from '../../komponen/modal-bertahap/modal-bertahap';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Tombol } from '../../komponen/ui/tombol';
import { token } from '../../gaya/token';
import { adaPerubahan, kunciDraf } from '../../util/draf';
import { useDrafOtomatis } from '../../util/draf-otomatis';
import { batasi, langkahBermasalah } from '../../util/langkah';
import { usePengguna } from '../../util/konteks-pengguna';
import { kirimAkun } from './alur-buat-akun';
import { awalAkun, galatLangkah, hariIniLokal } from './keadaan-akun';
import type { IzinKatalog, JenisKatalog, KeadaanAkun } from './keadaan-akun';
import { IsiHasilAkun, LangkahData, LangkahIzin, LangkahJenis, LangkahProfil, LangkahRingkasan } from './langkah-akun';

export const ALUR_PEMBUATAN_AKUN = 'pembuatan-akun';
const JUMLAH_LANGKAH = 5;

type Props = {
  onTutup: () => void;
  /** Dipanggil setelah akun dibuat dan modal ditutup (muat ulang daftar). */
  onSelesai: () => void;
};

/**
 * Modal Pembuatan akun dan penugasan (3.3): MODAL-BERTAHAP Data akun > Profil profesi > Jenis akun dan periode >
 * Izin tambahan/pengurangan > Ringkasan dan peringatan. Satu permintaan, satu transaksi di API.
 */
export function PembuatanAkun({ onTutup, onSelesai }: Props) {
  const { pengguna: saya } = usePengguna();
  const hariIni = useMemo(() => hariIniLokal(), []);
  const awal = useMemo(() => awalAkun(), []);
  const kunci = kunciDraf(ALUR_PEMBUATAN_AKUN, saya?.id);

  const [hasil, setHasil] = useState<PenggunaBaruDto | null>(null);
  const [keadaan, setKeadaanMentah] = useState<KeadaanAkun>(awal);
  const [indeks, setIndeks] = useState(0);
  const [dikunjungi, setDikunjungi] = useState<number[]>([0]);
  const [tampilGalat, setTampilGalat] = useState(false);
  const [peringatan, setPeringatan] = useState<PeringatanTerdeteksi[] | null>(null);
  const [isian, setIsian] = useState(isianPeringatanAwal);
  const [galat, setGalat] = useState<string | null>(null);
  const [memproses, setMemproses] = useState(false);
  const [katalog, setKatalog] = useState<{ jenis: JenisKatalog[]; izin: IzinKatalog[] } | null>(null);
  const [galatKatalog, setGalatKatalog] = useState<string | null>(null);
  const [drafDipulihkan, setDrafDipulihkan] = useState(false);

  const { pulihan, hapus, buang } = useDrafOtomatis<KeadaanAkun>({ kunci, nilai: keadaan, awal, langkah: indeks, aktif: !hasil });

  useEffect(() => {
    if (!pulihan) return;
    setKeadaanMentah({ ...awal, ...pulihan.nilai });
    setIndeks(batasi(pulihan.langkah, JUMLAH_LANGKAH));
    setDikunjungi(Array.from({ length: batasi(pulihan.langkah, JUMLAH_LANGKAH) + 1 }, (_x, n) => n));
    setDrafDipulihkan(true);
    // hanya sekali saat dibuka
  }, []);

  useEffect(() => {
    let batal = false;
    Promise.all([daftarJenisAkun(), daftarIzin()])
      .then(([j, i]) => !batal && setKatalog({ jenis: j, izin: i }))
      .catch((e) => !batal && setGalatKatalog(e instanceof GalatApi ? e.message : AKUN_BARU.gagalMuatKatalog));
    return () => {
      batal = true;
    };
  }, []);

  // Perubahan isian membatalkan peringatan yang sudah tampil (bisa berbeda untuk isian baru).
  const ubah = useCallback((p: Partial<KeadaanAkun>) => {
    setKeadaanMentah((k) => ({ ...k, ...p }));
    setPeringatan(null);
    setIsian(isianPeringatanAwal);
  }, []);

  const jenis = katalog?.jenis ?? [];
  const izin = katalog?.izin ?? [];
  const galatPerLangkah = galatLangkah(keadaan);
  const pindah = (n: number) => {
    const t = batasi(n, JUMLAH_LANGKAH);
    setIndeks(t);
    setDikunjungi((d) => (d.includes(t) ? d : [...d, t]));
  };

  const dasar = { keadaan, ubah, tampilGalat };
  const langkah: LangkahModal[] = [
    { id: 'data', judul: AKUN_BARU.langkah.data, isi: <LangkahData {...dasar} /> },
    { id: 'profil', judul: AKUN_BARU.langkah.profil, isi: <LangkahProfil {...dasar} /> },
    { id: 'jenis', judul: AKUN_BARU.langkah.jenis, isi: <LangkahJenis {...dasar} jenis={jenis} hariIni={hariIni} memuat={!katalog && !galatKatalog} /> },
    { id: 'izin', judul: AKUN_BARU.langkah.izin, isi: <LangkahIzin {...dasar} jenis={jenis} katalog={izin} hariIni={hariIni} memuat={!katalog && !galatKatalog} /> },
    {
      id: 'ringkasan',
      judul: AKUN_BARU.langkah.ringkasan,
      isi: (
        <>
          <LangkahRingkasan keadaan={keadaan} jenis={jenis} katalog={izin} />
          {peringatan && <FormPeringatan peringatan={peringatan} nilai={isian} onUbah={setIsian} idDasar="akun-peringatan" />}
        </>
      ),
    },
  ].map((l, n) => ({ ...l, selesai: n < JUMLAH_LANGKAH - 1 && dikunjungi.includes(n) && indeks !== n && !galatPerLangkah[n] }));

  async function kirim() {
    const masalah = langkahBermasalah(galatPerLangkah);
    if (masalah >= 0) {
      setTampilGalat(true);
      setGalat(galatPerLangkah[masalah]);
      pindah(masalah);
      return;
    }
    setGalat(null);
    setMemproses(true);
    const h = await kirimAkun(keadaan, peringatan ? dariIsian(isian) : undefined, buatPengguna);
    setMemproses(false);
    if (h.jenis === 'berhasil') {
      hapus();
      setHasil(h.data);
    } else if (h.jenis === 'peringatan') {
      setPeringatan(h.peringatan);
    } else {
      setGalat(h.pesan);
    }
  }

  const tutup = () => (hasil ? onSelesai() : onTutup());

  return (
    <ModalBertahap
      judul={AKUN_BARU.judul}
      langkah={langkah}
      indeks={indeks}
      onIndeks={(n) => {
        setGalat(null);
        pindah(n);
      }}
      konteks={
        <div>
          <div style={{ fontWeight: token.huruf.berat.tebal }}>{keadaan.nama.trim() || '-'}</div>
          <div style={{ fontSize: token.huruf.ukuran.kecil, color: token.warna.teksRedup }}>
            {keadaan.username.trim() || '-'} · {Object.keys(keadaan.penugasan).length} jenis akun · {keadaan.izin.length} izin per akun
          </div>
        </div>
      }
      catatan={
        drafDipulihkan ? (
          <Peringatan nada="biru" style={{ display: 'flex', alignItems: 'center', gap: token.jarak.md }}>
            <span style={{ flexGrow: 1 }}>{MODAL.drafDipulihkan}</span>
            <Tombol
              type="button"
              varian="teks"
              onClick={() => {
                buang();
                setKeadaanMentah(awal);
                setIndeks(0);
                setDikunjungi([0]);
                setDrafDipulihkan(false);
              }}
            >
              {MODAL.buangDraf}
            </Tombol>
          </Peringatan>
        ) : undefined
      }
      galat={galat ?? galatKatalog}
      onTutup={tutup}
      lindungiTutup={adaPerubahan(awal, keadaan)}
      onLanjut={(dari) => {
        if (galatPerLangkah[dari]) {
          setTampilGalat(true);
          setGalat(galatPerLangkah[dari]);
          return false;
        }
        setGalat(null);
        return true;
      }}
      labelKirim={memproses ? AKUN_BARU.membuat : peringatan ? AKUN_BARU.buatDenganAlasan : AKUN_BARU.buat}
      onKirim={() => {
        if (!memproses && (!peringatan || isianPeringatanSiap(isian))) void kirim();
      }}
      kirimNonaktif={memproses || (!!peringatan && !isianPeringatanSiap(isian))}
      hasil={
        hasil
          ? {
              judul: AKUN_BARU.berhasilJudul,
              isi: <IsiHasilAkun username={hasil.username} kataSandi={hasil.kata_sandi_awal} jumlahPeringatan={hasil.peringatan.length} />,
              aksi: <Tombol type="button" onClick={onSelesai}>{AKUN_BARU.tombolSelesai}</Tombol>,
            }
          : undefined
      }
    />
  );
}
