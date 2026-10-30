import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Tombol } from './ui/tombol';

export type NamaIkonPasien = 'cari' | 'tanggal' | 'hari-ini' | 'pasien-baru' | 'kunjungan-baru' | 'semua'
  | 'skrining' | 'periksa' | 'resep' | 'bayar' | 'selesai' | 'batal' | 'panggil' | 'panggil-ulang' | 'mulai'
  | 'buka' | 'edit' | 'riwayat' | 'keluarga' | 'persetujuan' | 'order-lab' | 'spesimen' | 'hasil-lab'
  | 'telaah' | 'tutup-kunjungan' | 'whatsapp' | 'instagram' | 'sebelumnya' | 'berikutnya' | 'filter';

/** Mask PNG dari desain gambar; warna mengikuti tema, fokus, dan status tombol. */
export function IkonPasien({ nama }: { nama: NamaIkonPasien }) {
  const mask = `url("/asset/icon/pasien/${nama}.png") center / contain no-repeat`;
  return <span className="pasien-ikon" aria-hidden="true" style={{ mask, WebkitMask: mask }} />;
}

type Props = Omit<ComponentProps<typeof Tombol>, 'children'> & {
  ikon?: NamaIkonPasien;
  ikonKustom?: ReactNode;
  label: string;
  children?: ReactNode;
};

export function TombolIkonPasien({ ikon, ikonKustom, label, children, className = '', ...props }: Props) {
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);
  const [posisi, setPosisi] = useState<{ x: number; y: number; bawah: boolean } | null>(null);
  const tutup = () => setPosisi(null);
  const tampil = () => {
    const r = ref.current?.getBoundingClientRect();
    if (r) setPosisi({ x: Math.max(120, Math.min(window.innerWidth - 120, r.left + r.width / 2)), y: r.top < 60 ? r.bottom + 8 : r.top - 8, bawah: r.top < 60 });
  };
  useEffect(() => {
    if (!posisi) return;
    window.addEventListener('scroll', tutup, true);
    window.addEventListener('resize', tutup);
    return () => {
      window.removeEventListener('scroll', tutup, true);
      window.removeEventListener('resize', tutup);
    };
  }, [posisi]);
  return <span ref={ref} className="pasien-ikon-wrap" onMouseEnter={tampil} onMouseLeave={tutup}
    onFocus={tampil} onBlur={tutup} onClick={tutup} onKeyDown={(e) => { if (e.key === 'Escape' && posisi) { e.preventDefault(); e.stopPropagation(); tutup(); } }}>
    <Tombol type="button" {...props} className={`pasien-tombol-ikon ${className}`} aria-label={label} aria-describedby={posisi ? id : undefined}>
      {ikonKustom ? <span className="pasien-ikon-kustom" style={{ display: 'inline-flex', width: 24, height: 24, flex: '0 0 24px' }}>{ikonKustom}</span> : ikon ? <IkonPasien nama={ikon} /> : null}{children}
    </Tombol>
    {posisi && createPortal(<span id={id} role="tooltip" className="pasien-tooltip" data-bawah={posisi.bawah}
      style={{ left: posisi.x, top: posisi.y }}>{label}</span>, document.body)}
  </span>;
}
