import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { TOMBOL } from '@klira/shared';
import { token } from '../../gaya/token';

type Posisi = { x: number; y: number; bawah: boolean };
const LEBAR_MAKS = 280;

/**
 * Ikon "i" kecil di samping label. Penjelasan muncul saat kursor didekatkan atau tombol difokus (keyboard),
 * dan tetap tampil saat diketuk/diklik (layar sentuh) sampai diketuk lagi, klik di luar, gulir, atau Escape.
 * Gelembung dirender di body sehingga tidak terpotong modal.
 */
export function InfoBantuan({ label, children }: { label: string; children: string }) {
  const id = useId();
  const ref = useRef<HTMLButtonElement>(null);
  const [posisi, setPosisi] = useState<Posisi | null>(null);
  const [terkunci, setTerkunci] = useState(false);
  const tutup = () => {
    setPosisi(null);
    setTerkunci(false);
  };
  const tampil = () => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const bawah = r.top < 140;
    setPosisi({ x: Math.max(LEBAR_MAKS / 2 + 12, Math.min(window.innerWidth - LEBAR_MAKS / 2 - 12, r.left + r.width / 2)), y: bawah ? r.bottom + 8 : r.top - 8, bawah });
  };

  useEffect(() => {
    if (!posisi) return;
    const luar = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) tutup();
    };
    window.addEventListener('scroll', tutup, true);
    window.addEventListener('resize', tutup);
    document.addEventListener('pointerdown', luar);
    return () => {
      window.removeEventListener('scroll', tutup, true);
      window.removeEventListener('resize', tutup);
      document.removeEventListener('pointerdown', luar);
    };
  }, [posisi]);

  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-label={`${TOMBOL.penjelasan}: ${label}`}
        aria-describedby={posisi ? id : undefined}
        onMouseEnter={tampil}
        onMouseLeave={() => !terkunci && tutup()}
        onFocus={tampil}
        onBlur={tutup}
        onClick={() => (posisi && terkunci ? tutup() : (tampil(), setTerkunci(true)))}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && posisi) {
            e.preventDefault();
            e.stopPropagation();
            tutup();
          }
        }}
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0, border: 0, background: 'transparent', cursor: 'help', color: posisi ? token.warna.utamaGelap : token.warna.teksRedup }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5" />
          <path d="M12 8h.01" />
        </svg>
      </button>
      {posisi && createPortal(
        <span
          id={id}
          role="tooltip"
          style={{
            position: 'fixed', left: posisi.x, top: posisi.y, transform: posisi.bawah ? 'translate(-50%, 0)' : 'translate(-50%, -100%)', zIndex: token.lapis.konfirmasi + 100,
            width: 'max-content', maxWidth: `min(${LEBAR_MAKS}px, calc(100vw - 24px))`, padding: '8px 11px', borderRadius: token.radius.sedang,
            background: token.warna.teks, color: token.warna.permukaan, boxShadow: token.bayangan.kartu, fontFamily: token.huruf.keluarga,
            fontSize: token.huruf.ukuran.kecil, fontWeight: token.huruf.berat.sedang, lineHeight: 1.5, textAlign: 'left', pointerEvents: 'none',
          }}
        >
          {children}
        </span>,
        document.body,
      )}
    </>
  );
}
