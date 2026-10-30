import { useEffect, useState } from 'react';
import type { MasterObatDto } from '@klira/shared';
import { Isian } from '../../komponen/ui/isian';

type Props = { id: string; obat: readonly MasterObatDto[]; value: string; onPilih: (obat: MasterObatDto | null) => void; galat?: string };

/** Pencarian langsung pada kolom obat, hanya memilih master aktif. */
export function PencarianObatResep({ id, obat, value, onPilih, galat }: Props) {
  const [kata, setKata] = useState('');
  const [terbuka, setTerbuka] = useState(false);
  const [aktif, setAktif] = useState(-1);
  const dipilih = obat.find((o) => String(o.id) === value);
  const q = kata.trim().toLowerCase();
  const hasil = q ? obat.filter((o) => o.aktif && [o.nama_tampil, o.kfa_nama, o.kfa_kode].some((t) => t?.toLowerCase().includes(q))).slice(0, 20) : [];
  const tampil = terbuka && !value && hasil.length > 0;
  useEffect(() => {
    if (tampil && aktif >= 0) document.getElementById(`${id}-opsi-${aktif}`)?.scrollIntoView({ block: 'nearest' });
  }, [aktif, tampil, id]);
  const pilih = (o: MasterObatDto) => { onPilih(o); setTerbuka(false); setKata(''); setAktif(-1); };
  return <div className="resep-pencarian">
    <Isian id={id} label="Obat" placeholder="Cari nama atau kode obat…" value={dipilih?.nama_tampil ?? (value ? `Obat #${value}` : kata)}
      autoComplete="off" galat={galat} role="combobox" aria-autocomplete="list" aria-expanded={tampil}
      aria-controls={`${id}-hasil`} aria-activedescendant={tampil && aktif >= 0 ? `${id}-opsi-${aktif}` : undefined}
      onFocus={() => setTerbuka(true)} onBlur={() => setTerbuka(false)}
      onChange={(e) => { onPilih(null); setKata(e.target.value); setTerbuka(true); setAktif(-1); }}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && terbuka) { e.preventDefault(); e.stopPropagation(); setTerbuka(false); }
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault(); setTerbuka(true);
          setAktif((n) => hasil.length ? Math.max(0, Math.min(hasil.length - 1, n + (e.key === 'ArrowDown' ? 1 : -1))) : -1);
        }
        if (e.key === 'Enter' && !value) { e.preventDefault(); if (tampil && hasil[aktif]) pilih(hasil[aktif]); }
      }} />
    {terbuka && !value && q && hasil.length === 0 && <small role="status">Tidak ada obat yang cocok.</small>}
    {tampil && <ul id={`${id}-hasil`} role="listbox" aria-label="Hasil pencarian obat" className="resep-hasil">
      {hasil.map((o, n) => <li key={o.id} id={`${id}-opsi-${n}`} role="option" aria-selected={aktif === n}
        onMouseDown={(e) => e.preventDefault()} onClick={() => pilih(o)} className={aktif === n ? 'aktif' : ''}>
        <strong>{o.nama_tampil}</strong><small>{o.satuan}</small>
      </li>)}
    </ul>}
  </div>;
}
