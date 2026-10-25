import { useState } from 'react';
import type { FormEvent } from 'react';
import { GALAT, GANTI_KREDENSIAL, MASUK, gantiKredensial as skemaGanti } from '@klira/shared';
import { Isian } from '../komponen/ui/isian';
import { Kartu } from '../komponen/ui/kartu';
import { Peringatan } from '../komponen/ui/peringatan';
import { Tombol } from '../komponen/ui/tombol';
import { token } from '../gaya/token';
import { usePengguna } from '../util/konteks-pengguna';

/** Layar wajib pada login pertama akun awal (2.4); penjaga rute mengalihkan semua halaman ke sini. */
export function HalamanGantiKredensial() {
  const { gantiKredensial, keluar } = usePengguna();
  const [username, setUsername] = useState('');
  const [kataSandiLama, setKataSandiLama] = useState('');
  const [kataSandi, setKataSandi] = useState('');
  const [konfirmasi, setKonfirmasi] = useState('');
  const [galat, setGalat] = useState<string | null>(null);
  const [proses, setProses] = useState(false);

  async function kirim(e: FormEvent) {
    e.preventDefault();
    setGalat(null);
    const masukan = {
      username,
      kata_sandi_lama: kataSandiLama,
      kata_sandi: kataSandi,
      konfirmasi_kata_sandi: konfirmasi,
    };
    const cek = skemaGanti.safeParse(masukan);
    if (!cek.success) return setGalat(cek.error.issues[0]?.message ?? GALAT.tidakValid);
    setProses(true);
    try {
      await gantiKredensial(masukan); // penjaga rute lalu mengalihkan ke halaman awal
    } catch (g) {
      setGalat(g instanceof Error ? g.message : GALAT.umum);
      setProses(false);
    }
  }

  const lengkap = username && kataSandiLama && kataSandi && konfirmasi;

  return (
    <div style={{ minHeight: token.ukuran.tinggiLayar, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: token.jarak.xl }}>
      <Kartu style={{ width: token.ukuran.kartu }}>
        <form onSubmit={kirim} style={{ display: 'flex', flexDirection: 'column', gap: token.jarak.md }}>
          <h1 style={{ margin: 0, fontSize: token.huruf.ukuran.judul }}>{GANTI_KREDENSIAL.judul}</h1>
          <Peringatan nada="biru">{GANTI_KREDENSIAL.keterangan}</Peringatan>
          {galat && <Peringatan>{galat}</Peringatan>}
          <Isian id="username-baru" label={GANTI_KREDENSIAL.usernameBaru} autoFocus autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <Isian id="kata-sandi-lama" label={GANTI_KREDENSIAL.kataSandiLama} type="password" autoComplete="current-password" value={kataSandiLama} onChange={(e) => setKataSandiLama(e.target.value)} />
          <Isian id="kata-sandi-baru" label={GANTI_KREDENSIAL.kataSandiBaru} type="password" autoComplete="new-password" value={kataSandi} onChange={(e) => setKataSandi(e.target.value)} />
          <Isian id="konfirmasi" label={GANTI_KREDENSIAL.konfirmasi} type="password" autoComplete="new-password" value={konfirmasi} onChange={(e) => setKonfirmasi(e.target.value)} />
          <span style={{ fontSize: token.huruf.ukuran.kecil }}>{GANTI_KREDENSIAL.petunjukKataSandi}</span>
          <Tombol type="submit" penuh disabled={proses || !lengkap}>
            {proses ? GANTI_KREDENSIAL.tombolProses : GANTI_KREDENSIAL.tombol}
          </Tombol>
          <Tombol
            type="button"
            penuh
            varian="sekunder"
            onClick={() => void keluar()}
          >
            {MASUK.keluar}
          </Tombol>
        </form>
      </Kartu>
    </div>
  );
}
