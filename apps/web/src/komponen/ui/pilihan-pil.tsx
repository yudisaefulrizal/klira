import { useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { token } from '../../gaya/token';
import { gayaDiubah, LabelIsian, PesanGalat } from './isian';

type Opsi<T extends string> = { nilai: T; label: string };
type Props<T extends string> = {
  id: string;
  label: string;
  opsi: readonly Opsi<T>[];
  nilai: T | '';
  onUbah: (nilai: T) => void;
  /** Nilai berbeda dari default keadaan baik: latar status kuning dan label "· diubah". */
  diubah?: boolean;
  galat?: string | null;
  disabled?: boolean;
};

/**
 * Pilihan tunggal berbentuk pil (radiogroup): untuk pilihan pendek seperti ya/tidak, jenis, atau skala 0–10.
 * Panah kiri/kanan memindah pilihan (pola radio WAI-ARIA).
 */
export function PilihanPil<T extends string>({ id, label, opsi, nilai, onUbah, diubah, galat, disabled }: Props<T>) {
  const grup = useRef<HTMLDivElement>(null);
  const pindah = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const arah = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!arah) return;
    e.preventDefault();
    const n = (i + arah + opsi.length) % opsi.length;
    onUbah(opsi[n].nilai);
    grup.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[n]?.focus();
  };
  const terpilih = opsi.findIndex((o) => o.nilai === nilai);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: token.jarak.xs }}>
      <span id={`${id}-label`}><LabelIsian tag="span" label={label} diubah={diubah} /></span>
      <div
        ref={grup} id={id} role="radiogroup" aria-labelledby={`${id}-label`} aria-invalid={galat ? true : undefined} aria-describedby={galat ? `${id}-galat` : undefined}
        style={{ display: 'flex', flexWrap: 'wrap', gap: token.jarak.xs }}
      >
        {opsi.map((o, i) => {
          const aktif = o.nilai === nilai;
          return (
            <button
              key={o.nilai} type="button" role="radio" aria-checked={aktif} disabled={disabled}
              tabIndex={aktif || (terpilih < 0 && i === 0) ? 0 : -1}
              onClick={() => onUbah(o.nilai)} onKeyDown={(e) => pindah(e, i)}
              style={{
                minHeight: token.ukuran.tombol, minWidth: token.ukuran.tombol, padding: `0 ${token.jarak.md}`, borderRadius: token.radius.pil,
                border: `${token.ukuran.garis} solid ${aktif ? token.warna.utama : galat ? token.warna.status.merah.teks : token.warna.garis}`,
                background: token.warna.permukaan, color: token.warna.teks,
                ...(aktif ? (diubah ? { ...gayaDiubah, color: token.warna.status.kuning.teks } : { background: token.warna.utamaLatar, color: token.warna.utamaGelap }) : {}),
                fontFamily: token.huruf.keluarga, fontSize: token.huruf.ukuran.dasar, fontWeight: aktif ? token.huruf.berat.tebal : token.huruf.berat.biasa,
                cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1,
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {galat && <PesanGalat id={`${id}-galat`}>{galat}</PesanGalat>}
    </div>
  );
}
