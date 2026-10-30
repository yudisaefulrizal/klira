import { useEffect, useState } from 'react';
import type { HalamanKamusTerminologiDto, SistemTerminologi } from '@klira/shared';
import { jelajahKamus } from '../../api-klien/klinis';
import { token } from '../../gaya/token';
import { Panel } from '../panel/panel';
import { Paginasi } from '../paginasi';
import { Kolom, Sebaris } from '../ui/susunan';
import { Tombol } from '../ui/tombol';
import { Peringatan } from '../ui/peringatan';
import { Lencana } from '../ui/lencana';

type Props = { judul: string; sistem: SistemTerminologi; onTutup: () => void; onPilih: (kode: { kode: string; nama: string }) => void };

/** Kamus langsung terbuka pada daftar kode; indeks dan halaman untuk menjelajah tanpa mengetik. */
export function KamusKode({ judul, sistem, onTutup, onPilih }: Props) {
  const [halaman, setHalaman] = useState(1);
  const [awalan, setAwalan] = useState('');
  const [hasil, setHasil] = useState<HalamanKamusTerminologiDto | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [ulangi, setUlangi] = useState(0);
  useEffect(() => {
    let batal = false;
    setHasil(null); setGalat(null);
    jelajahKamus(sistem, halaman, awalan).then((h) => { if (!batal) setHasil(h); })
      .catch((e) => { if (!batal) setGalat(e instanceof Error ? e.message : 'Kamus gagal dimuat.'); });
    return () => { batal = true; };
  }, [sistem, halaman, awalan, ulangi]);
  const indeks = sistem === 'icd10' ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' : '0123456789';
  return <Panel judul={judul} onTutup={onTutup}>
    <Kolom jarak="sm">
      <span style={{ color: token.warna.teksRedup }}>Pilih kode dari referensi yang tersedia.</span>
      {sistem === 'icd10' && <small style={{ color: token.warna.teksRedup }}>Padanan Indonesia dari komunitas, belum diverifikasi klinis. Nama resmi Inggris tetap ditampilkan.</small>}
      <Sebaris bungkus jarak="xs" role="group" aria-label="Awalan kode">
        {['', ...indeks].map((huruf) => <Tombol key={huruf} type="button" varian={awalan === huruf ? 'utama' : 'sekunder'} aria-pressed={awalan === huruf}
          onClick={() => { if (huruf === awalan && halaman === 1) return; setHasil(null); setHalaman(1); setAwalan(huruf); }} style={{ minWidth: 32, padding: '0 8px', height: 32 }}>{huruf || 'Semua'}</Tombol>)}
      </Sebaris>
    </Kolom>
    {galat && <><Peringatan>{galat}</Peringatan><Tombol type="button" varian="sekunder" onClick={() => setUlangi((n) => n + 1)}>Coba lagi</Tombol></>}
    {!hasil && !galat && <span role="status">Memuat kamus…</span>}
    {hasil && <>
      <small role="status" style={{ color: token.warna.teksRedup }}>{hasil.total} kode{awalan ? ` dengan awalan ${awalan}` : ''}</small>
      {!hasil.data.length && <p style={{ margin: 0 }}>Belum ada kode pada bagian ini.</p>}
      <ul aria-label="Daftar kode kamus" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {hasil.data.map((kode) => <li key={kode.kode} style={{ borderBottom: `1px solid ${token.warna.garis}` }}>
          <Tombol type="button" varian="langkah" penuh onClick={() => onPilih(kode)} style={{ alignItems: 'flex-start', gap: 12 }}>
            <strong style={{ minWidth: 64 }}>{kode.kode}</strong>
            <span style={{ flex: 1, overflowWrap: 'anywhere' }}>{kode.nama_indonesia ?? kode.nama}{kode.nama_indonesia && <small style={{ display: 'block', color: token.warna.teksRedup }}>{kode.nama}</small>}</span>
            {kode.contoh && <Lencana warna="kuning">Contoh</Lencana>}
          </Tombol>
        </li>)}
      </ul>
      <Paginasi halaman={hasil.halaman} ukuran={hasil.ukuran} total={hasil.total} onPindah={(n) => { setHasil(null); setHalaman(n); }} />
    </>}
  </Panel>;
}
