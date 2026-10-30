import { useEffect, useLayoutEffect, useId, useRef, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { MODAL } from '@klira/shared';
import { token } from '../../gaya/token';
import { SELEKTOR_FOKUS, fokusBerikut } from '../../util/fokus';
import { adalahAtas, adalahInert, keluarLapisan, langgananLapisan, lapisanAtas, masukLapisan, pilihTargetPemulihan, potretLapisan } from '../../util/lapisan';
import { Tombol } from './tombol';

type Props = {
  /** Nama dialog untuk pembaca layar (aria-label). */
  judul: string;
  /** Dipanggil saat Esc ditekan di lapisan teratas. */
  onEsc: () => void;
  letak?: 'tengah' | 'kanan';
  lapis?: keyof typeof token.lapis;
  lebar?: keyof typeof token.ukuran;
  /** Tinggi tetap dialog (kunci token ukuran); tanpa ini mengikuti isi sampai batas layar. */
  tinggi?: keyof typeof token.ukuran;
  children: ReactNode;
};

/** Mencabut inert lapisan teratas sekarang (render ulang baru menyusul), lalu memulihkan fokus ke pemicu atau isian pertama lapisan itu. */
function pulihkanFokus(pemicu: HTMLElement | null) {
  const atas = lapisanAtas();
  const elAtas = atas ? document.querySelector<HTMLElement>(`[data-lapisan="${CSS.escape(atas)}"]`) : null;
  const ada = !!pemicu && document.contains(pemicu);
  const lapisanPemicu = ada ? (pemicu.closest<HTMLElement>('[data-lapisan]')?.dataset.lapisan ?? null) : null;
  const target = pilihTargetPemulihan(ada, lapisanPemicu, atas);
  if (elAtas) elAtas.inert = false;
  if (target === 'pemicu') pemicu?.focus();
  else if (target === 'pertamaAtas' && elAtas) (elAtas.querySelector<HTMLElement>(SELEKTOR_FOKUS) ?? elAtas).focus();
}

const terlihat = (e: HTMLElement) => e.getClientRects().length > 0;

/**
 * Elemen dasar dialog (5.2b): tirai, fokus terkunci di dalam dialog, Esc, dikembalikan ke pemicu saat ditutup,
 * hanya lapisan teratas yang menanggapi keyboard dan lapisan di bawahnya inert. Tidak ada tutup lewat klik tirai
 * agar isian tidak hilang tanpa sengaja.
 */
export function Dialog({ judul, onEsc, letak = 'tengah', lapis = 'dialog', lebar = 'modalSedang', tinggi, children }: Props) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const onEscTerakhir = useRef(onEsc);
  onEscTerakhir.current = onEsc;
  useSyncExternalStore(langgananLapisan, potretLapisan);
  const bukanAtas = adalahInert(id);

  // Didaftarkan sinkron sebelum efek pasif: render pertama tidak inert, sehingga fokus awal bisa masuk.
  const pemicuRef = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    pemicuRef.current = document.activeElement as HTMLElement | null;
    masukLapisan(id);
    return () => keluarLapisan(id);
  }, [id]);

  useEffect(() => {
    const pemicu = pemicuRef.current;
    const gulirAwal = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const el = ref.current;
    if (el && !el.contains(document.activeElement)) (el.querySelector<HTMLElement>(SELEKTOR_FOKUS) ?? el).focus();

    const tekan = (e: KeyboardEvent) => {
      if (!adalahAtas(id)) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onEscTerakhir.current();
      } else if (e.key === 'Tab' && ref.current) {
        const daftar = Array.from(ref.current.querySelectorAll<HTMLElement>(SELEKTOR_FOKUS)).filter(terlihat);
        const berikut = fokusBerikut(daftar.length, daftar.indexOf(document.activeElement as HTMLElement), e.shiftKey);
        e.preventDefault();
        if (berikut >= 0) daftar[berikut].focus();
        else ref.current.focus();
      }
    };
    document.addEventListener('keydown', tekan);
    return () => {
      document.removeEventListener('keydown', tekan);
      document.body.style.overflow = gulirAwal;
      pulihkanFokus(pemicu);
    };
  }, [id]);

  const kanan = letak === 'kanan';
  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: token.lapis[lapis], background: token.warna.tirai, display: 'flex',
        alignItems: kanan ? 'stretch' : 'center', justifyContent: kanan ? 'flex-end' : 'center', padding: kanan ? 0 : token.jarak.lg,
        boxSizing: 'border-box',
      }}
    >
      <div
        ref={ref}
        data-lapisan={id}
        role="dialog"
        aria-modal="true"
        aria-label={judul}
        tabIndex={-1}
        inert={bukanAtas}
        style={{
          background: token.warna.permukaan, color: token.warna.teks, fontFamily: token.huruf.keluarga, fontSize: token.huruf.ukuran.dasar,
          boxShadow: token.bayangan.modal, display: 'flex', flexDirection: 'column', overflow: 'hidden', outline: 'none',
          width: token.ukuran[lebar], maxWidth: '100%', height: tinggi ? token.ukuran[tinggi] : undefined,
          maxHeight: kanan ? undefined : token.ukuran.maksLayar, borderRadius: kanan ? 0 : token.radius.besar,
        }}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

/** Kepala dialog: judul, slot samping (ringkasan konteks), dan tombol tutup. */
export function KepalaDialog({ judul, onTutup, labelTutup = MODAL.tutup, children, className }: { judul: string; onTutup: () => void; labelTutup?: string; children?: ReactNode; className?: string }) {
  return (
    <header
      className={className}
      style={{
        display: 'flex', alignItems: 'center', gap: token.jarak.lg, padding: `${token.jarak.md} ${token.jarak.lg}`,
        background: token.warna.kepalaTabel, borderBottom: `${token.ukuran.garis} solid ${token.warna.garis}`,
      }}
    >
      <h2 style={{ margin: 0, fontSize: token.huruf.ukuran.judul, fontWeight: token.huruf.berat.tebal }}>{judul}</h2>
      <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: token.jarak.lg, minWidth: 0 }}>{children}</div>
      <Tombol varian="sekunder" aria-label={labelTutup} title={labelTutup} onClick={onTutup} style={{ padding: 0, width: token.ukuran.tombol }}>
        <svg width={token.huruf.ukuran.besar} height={token.huruf.ukuran.besar} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M5 5l14 14M19 5L5 19" />
        </svg>
      </Tombol>
    </header>
  );
}
