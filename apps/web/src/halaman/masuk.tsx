import { useState } from 'react';
import type { FormEvent } from 'react';
import { MASUK } from '@klira/shared';
import { Isian } from '../komponen/ui/isian';
import { Kartu } from '../komponen/ui/kartu';
import { Peringatan } from '../komponen/ui/peringatan';
import { Tombol } from '../komponen/ui/tombol';
import { token } from '../gaya/token';
import { usePengguna } from '../util/konteks-pengguna';
import { Baris, Kolom, Sebaris } from '../komponen/ui/susunan';

export function HalamanMasuk() {
  const { masuk } = usePengguna();
  const [username, setUsername] = useState('');
  const [kataSandi, setKataSandi] = useState('');
  const [galat, setGalat] = useState<string | null>(null);
  const [proses, setProses] = useState(false);

  async function kirim(e: FormEvent) {
    e.preventDefault();
    setGalat(null);
    setProses(true);
    try {
      await masuk(username, kataSandi);
    } catch (g) {
      setGalat(g instanceof Error ? g.message : MASUK.gagal);
      setProses(false);
    }
  }

  return (
    <Baris style={{ gap: 0, minHeight: token.ukuran.tinggiLayar }}>
      <Kolom jarak="md" padding="xl" style={{ background: token.warna.utama, color: token.warna.permukaan, justifyContent: 'center' }}>
        <h1 style={{ margin: 0, fontSize: token.huruf.ukuran.tajuk, fontWeight: token.huruf.berat.tebal }}>{MASUK.judul}</h1>
        <p style={{ margin: 0, fontSize: token.huruf.ukuran.besar }}>{MASUK.keterangan}</p>
      </Kolom>
      <Sebaris jarak="tanpa" padding="xl" sebaran="tengah">
        <Kartu style={{ width: token.ukuran.kartu }}>
          <Kolom tag="form" jarak="md" onSubmit={kirim}>
            <h2 style={{ margin: 0, fontSize: token.huruf.ukuran.judul }}>{MASUK.judulForm}</h2>
            {galat && <Peringatan>{galat}</Peringatan>}
            <Isian id="username" label={MASUK.username} autoFocus autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} />
            <Isian id="kata-sandi" label={MASUK.kataSandi} type="password" autoComplete="current-password" value={kataSandi} onChange={(e) => setKataSandi(e.target.value)} />
            <Tombol type="submit" penuh disabled={proses || !username || !kataSandi}>
              {proses ? MASUK.tombolProses : MASUK.tombol}
            </Tombol>
            <Peringatan nada="biru">{MASUK.catatanGanti}</Peringatan>
          </Kolom>
        </Kartu>
      </Sebaris>
    </Baris>
  );
}
