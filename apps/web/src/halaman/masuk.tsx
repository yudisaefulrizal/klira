import { useState } from 'react';
import type { FormEvent } from 'react';
import { MASUK } from '@klira/shared';
import { Isian } from '../komponen/ui/isian';
import { Kartu } from '../komponen/ui/kartu';
import { Peringatan } from '../komponen/ui/peringatan';
import { Tombol } from '../komponen/ui/tombol';
import { token } from '../gaya/token';
import { usePengguna } from '../util/konteks-pengguna';

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
    <div style={{ display: 'grid', gridTemplateColumns: `${token.ukuran.kolomKiri} ${token.ukuran.kolomKanan}`, minHeight: '100vh' }}>
      <div
        style={{
          background: token.warna.utama,
          color: token.warna.permukaan,
          padding: token.jarak.xl,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: token.jarak.md,
        }}
      >
        <h1 style={{ margin: 0, fontSize: token.huruf.ukuran.tajuk, fontWeight: token.huruf.berat.tebal }}>{MASUK.judul}</h1>
        <p style={{ margin: 0, fontSize: token.huruf.ukuran.besar }}>{MASUK.keterangan}</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: token.jarak.xl }}>
        <Kartu style={{ width: token.ukuran.kartu }}>
          <form onSubmit={kirim} style={{ display: 'flex', flexDirection: 'column', gap: token.jarak.md }}>
            <h2 style={{ margin: 0, fontSize: token.huruf.ukuran.judul }}>{MASUK.judulForm}</h2>
            {galat && <Peringatan>{galat}</Peringatan>}
            <Isian id="username" label={MASUK.username} autoFocus autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} />
            <Isian id="kata-sandi" label={MASUK.kataSandi} type="password" autoComplete="current-password" value={kataSandi} onChange={(e) => setKataSandi(e.target.value)} />
            <Tombol type="submit" penuh disabled={proses || !username || !kataSandi}>
              {proses ? MASUK.tombolProses : MASUK.tombol}
            </Tombol>
            <Peringatan nada="biru">{MASUK.catatanGanti}</Peringatan>
          </form>
        </Kartu>
      </div>
    </div>
  );
}
