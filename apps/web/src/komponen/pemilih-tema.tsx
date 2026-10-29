import { StatusKoneksi } from './status-koneksi';
import { useEffect, useState } from 'react';
import { token } from '../gaya/token';
import { KUNCI_TEMA, temaTersimpan, terapkanTema } from '../util/tema';

import './pemilih-tema.css';

const pilihanTema = [
  { nilai: 'terang', label: 'Terang', ikon: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></> },
  { nilai: 'sistem', label: 'Sistem', ikon: <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8m-4-4v4" /></> },
  { nilai: 'gelap', label: 'Gelap', ikon: <path d="M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z" /> },
] as const;

export function PemilihTema() {
  const [tema, setTema] = useState(temaTersimpan);

  useEffect(() => {
    terapkanTema(tema);
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const ubahSistem = () => terapkanTema(tema);
    media.addEventListener('change', ubahSistem);
    return () => media.removeEventListener('change', ubahSistem);
  }, [tema]);

  useEffect(() => {
    const sinkronkan = (event: StorageEvent) => {
      if (event.key === KUNCI_TEMA || event.key === null) setTema(temaTersimpan());
    };
    window.addEventListener('storage', sinkronkan);
    return () => window.removeEventListener('storage', sinkronkan);
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: token.jarak.sm, padding: `${token.jarak.sm} ${token.jarak.md}`, background: token.warna.permukaan, borderBottom: `1px solid ${token.warna.garis}` }}>
      <span className="pemilih-tema-label">Tampilan</span>
      <div className="pemilih-tema" role="group" aria-label="Pilih tema tampilan" style={{ '--tema-indeks': pilihanTema.findIndex((pilihan) => pilihan.nilai === tema) } as React.CSSProperties}>
        <span className="pemilih-tema-indikator" aria-hidden="true" />
        {pilihanTema.map((pilihan) => (
          <button
            key={pilihan.nilai}
            type="button"
            className="pemilih-tema-opsi"
            aria-pressed={tema === pilihan.nilai}
            title={pilihan.nilai === 'sistem' ? 'Ikuti tema sistem' : `Tema ${pilihan.label.toLowerCase()}`}
            onClick={() => {
              setTema(pilihan.nilai);
              terapkanTema(pilihan.nilai);
              try { localStorage.setItem(KUNCI_TEMA, pilihan.nilai); } catch { /* Pilihan tetap berlaku selama halaman terbuka. */ }
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{pilihan.ikon}</svg>
            <span>{pilihan.label}</span>
          </button>
        ))}
      </div>
      <StatusKoneksi />
    </div>
  );
}
