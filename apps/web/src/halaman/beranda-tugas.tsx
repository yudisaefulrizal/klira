import { useEffect, useState } from 'react';
import { BERANDA, punyaIzin } from '@klira/shared';
import { ambilRingkasanPdp } from '../api-klien/beranda';
import { GalatApi } from '../api-klien/klien';
import { Kartu } from '../komponen/ui/kartu';
import { Lencana } from '../komponen/ui/lencana';
import { Peringatan } from '../komponen/ui/peringatan';
import { Kolom, Sebaris } from '../komponen/ui/susunan';
import { Tombol } from '../komponen/ui/tombol';
import { token } from '../gaya/token';
import { usePengguna } from '../util/konteks-pengguna';
import { useNavigasi } from '../util/navigasi';
import { tugasPdp } from '../util/tugas-beranda';
import type { Tugas } from '../util/tugas-beranda';

/** Beranda tugas (3.1): pengganti Daftar pasien bagi akun tanpa akses rekam medis; menampilkan tugas pelindungan data yang menunggu dan catatan SATUSEHAT. */
export function HalamanBerandaTugas() {
  const { pengguna } = usePengguna();
  const { ganti } = useNavigasi();
  const bolehPdp = !!pengguna && punyaIzin(pengguna, 'pdp', 'lihat');
  const bolehSatusehat = !!pengguna && punyaIzin(pengguna, 'satusehat', 'lihat');
  const [tugas, setTugas] = useState<Tugas[] | null>(bolehPdp ? null : []);
  const [galat, setGalat] = useState<string | null>(null);

  useEffect(() => {
    if (!bolehPdp) return;
    let batal = false;
    ambilRingkasanPdp()
      .then((r) => !batal && setTugas(tugasPdp(r)))
      .catch((e) => !batal && setGalat(e instanceof GalatApi ? e.message : BERANDA.gagal));
    return () => {
      batal = true;
    };
  }, [bolehPdp]);

  return (
    <>
      <h1 style={{ margin: 0, fontSize: token.huruf.ukuran.halaman, fontWeight: token.huruf.berat.tebal }}>{BERANDA.judul}</h1>
      {galat && <Peringatan>{galat}</Peringatan>}
      {tugas === null && !galat && <span style={{ color: token.warna.teksRedup }}>{BERANDA.memuat}</span>}
      {bolehPdp && tugas && (
        <Kartu susun="sm" aria-label={BERANDA.pdp.judul}>
          <strong style={{ fontSize: token.huruf.ukuran.besar }}>{BERANDA.pdp.judul}</strong>
          {!tugas.length && <span style={{ color: token.warna.teksRedup }}>{BERANDA.kosong}</span>}
          {tugas.map((t) => (
            <Sebaris key={t.kunci} jarak="md" bungkus>
              <span style={{ flexGrow: 1 }}>{t.teks}</span>
              {t.mendesak && <Lencana warna="merah">!</Lencana>}
              <Tombol type="button" varian="teks" onClick={() => ganti(`/pelindungan-data?tab=${t.tab}`)}>{BERANDA.buka}</Tombol>
            </Sebaris>
          ))}
        </Kartu>
      )}
      {bolehSatusehat && (
        <Kartu susun="sm">
          <Kolom jarak="xs"><strong style={{ fontSize: token.huruf.ukuran.besar }}>{BERANDA.satusehat.judul}</strong><span style={{ color: token.warna.teksRedup }}>{BERANDA.satusehat.info}</span></Kolom>
        </Kartu>
      )}
      {!bolehPdp && !bolehSatusehat && <span style={{ color: token.warna.teksRedup }}>{BERANDA.kosong}</span>}
    </>
  );
}
