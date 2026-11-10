import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { token } from '../gaya/token';

export type ItemMenuAksi = { kunci: string; label: string; ikon?: ReactNode; onPilih: () => void; disabled?: boolean };
type Posisi = { kanan: number; y: number; atas: boolean; tinggiMaks: number };

/**
 * Tombol "⋯" yang membuka daftar tindakan sekunder. Daftar dirender di body (tidak terpotong tabel), ditutup oleh klik di luar,
 * gulir, Escape, atau memilih item; panah atas/bawah berpindah antar item, Escape mengembalikan fokus ke tombol.
 */
export function MenuAksi({ label, items }: { label: string; items: readonly ItemMenuAksi[] }) {
  const id = useId();
  const tombol = useRef<HTMLButtonElement>(null);
  const daftar = useRef<HTMLDivElement>(null);
  const [posisi, setPosisi] = useState<Posisi | null>(null);

  const tutup = (fokus = false) => {
    setPosisi(null);
    if (fokus) tombol.current?.focus();
  };
  const buka = () => {
    const r = tombol.current?.getBoundingClientRect();
    if (!r) return;
    // Buka ke arah yang lebih lega; tinggi dibatasi ke ruang yang tersedia dan digulir bila daftar lebih panjang.
    const perkiraan = items.length * 41 + 12;
    const ruangBawah = window.innerHeight - r.bottom - 14;
    const ruangAtas = r.top - 14;
    const atas = ruangBawah < perkiraan && ruangAtas > ruangBawah;
    setPosisi({ kanan: Math.max(8, window.innerWidth - r.right), y: atas ? r.top - 6 : r.bottom + 6, atas, tinggiMaks: Math.max(120, atas ? ruangAtas : ruangBawah) });
  };

  useEffect(() => {
    if (!posisi) return;
    const luar = (e: PointerEvent) => {
      if (!daftar.current?.contains(e.target as Node) && !tombol.current?.contains(e.target as Node)) tutup();
    };
    const tutupSaja = () => tutup();
    window.addEventListener('scroll', tutupSaja, true);
    window.addEventListener('resize', tutupSaja);
    document.addEventListener('pointerdown', luar);
    daftar.current?.querySelector<HTMLButtonElement>('button:not([disabled])')?.focus();
    return () => {
      window.removeEventListener('scroll', tutupSaja, true);
      window.removeEventListener('resize', tutupSaja);
      document.removeEventListener('pointerdown', luar);
    };
  }, [posisi]);

  const gerak = (e: React.KeyboardEvent) => {
    const butir = [...(daftar.current?.querySelectorAll<HTMLButtonElement>('button:not([disabled])') ?? [])];
    const i = butir.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      tutup(true);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      butir[(i + 1) % butir.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      butir[(i - 1 + butir.length) % butir.length]?.focus();
    }
  };

  return (
    <>
      <button
        ref={tombol}
        type="button"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={!!posisi}
        aria-controls={posisi ? id : undefined}
        onClick={() => (posisi ? tutup() : buka())}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: token.ukuran.tombol, height: token.ukuran.tombol, padding: 0, cursor: 'pointer',
          border: `${token.ukuran.garis} solid ${token.warna.garis}`, borderRadius: token.radius.sedang, background: posisi ? token.warna.utamaLatar : 'transparent', color: token.warna.teksMenu,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" /></svg>
      </button>
      {posisi && createPortal(
        <div
          ref={daftar}
          id={id}
          role="menu"
          aria-label={label}
          onKeyDown={gerak}
          style={{
            position: 'fixed', right: posisi.kanan, top: posisi.y, transform: posisi.atas ? 'translateY(-100%)' : undefined, zIndex: token.lapis.konfirmasi + 100, minWidth: 200, maxWidth: 'calc(100vw - 16px)',
            padding: token.jarak.xs, borderRadius: token.radius.sedang, background: token.warna.permukaan, border: `${token.ukuran.garis} solid ${token.warna.garis}`, boxShadow: token.bayangan.modal,
            display: 'flex', flexDirection: 'column', gap: 2, fontFamily: token.huruf.keluarga, maxHeight: posisi.tinggiMaks, overflowY: 'auto',
          }}
        >
          {items.map((i) => (
            <button
              key={i.kunci}
              type="button"
              role="menuitem"
              disabled={i.disabled}
              onClick={() => {
                tutup();
                i.onPilih();
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: token.jarak.sm, width: '100%', padding: `${token.jarak.sm} ${token.jarak.sm}`, border: 0, borderRadius: token.radius.kecil, background: 'transparent',
                color: token.warna.teks, fontSize: token.huruf.ukuran.dasar, fontFamily: token.huruf.keluarga, textAlign: 'left', cursor: i.disabled ? 'not-allowed' : 'pointer', opacity: i.disabled ? 0.5 : 1,
              }}
            >
              {i.ikon}
              <span>{i.label}</span>
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}
