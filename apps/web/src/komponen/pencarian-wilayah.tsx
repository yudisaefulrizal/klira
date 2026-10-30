import { useEffect, useState } from 'react';
import type { HasilCariWilayah, WilayahDto } from '@klira/shared';
import { ambilWilayah, cariWilayah, ingatWilayah } from '../api-klien/wilayah';
import { GalatApi } from '../api-klien/klien';
import { token } from '../gaya/token';
import { Isian } from './ui/isian';

/** Resolusi kode lama tidak mengubah data pasien bila referensi belum mengenalinya. */
export function useNamaWilayah(kode: string | null | undefined): string {
  const [hasil, setHasil] = useState<{ kode: string; label: string } | null>(null);
  useEffect(() => {
    let batal = false;
    if (kode) ambilWilayah(kode).then((w) => { if (!batal) setHasil(w); }).catch(() => { if (!batal) setHasil({ kode, label: 'Wilayah tersimpan belum dapat ditampilkan' }); });
    return () => { batal = true; };
  }, [kode]);
  return !kode ? '-' : hasil?.kode === kode ? hasil.label : 'Memuat wilayah…';
}

export function PencarianWilayah({ id, value, onChange, galat }: { id: string; value: string; onChange: (kode: string) => void; galat?: string }) {
  const nama = useNamaWilayah(value);
  const [kata, setKata] = useState('');
  const [hasil, setHasil] = useState<HasilCariWilayah>({ data: [], lebih_banyak: false });
  const [terbuka, setTerbuka] = useState(false);
  const [aktif, setAktif] = useState(-1);
  const [mencari, setMencari] = useState(false);
  const [gagal, setGagal] = useState<string | null>(null);
  useEffect(() => {
    let batal = false;
    if (value || kata.trim().length < 2) return;
    const timer = setTimeout(() => {
      setMencari(true);
      cariWilayah(kata.trim()).then((h) => { if (!batal) setHasil(h); })
        .catch((e) => { if (!batal) setGagal(e instanceof GalatApi ? e.message : 'Pencarian wilayah gagal.'); })
        .finally(() => { if (!batal) setMencari(false); });
    }, 300);
    return () => { batal = true; clearTimeout(timer); };
  }, [kata, value]);
  function pilih(w: WilayahDto) {
    ingatWilayah(w);
    setKata(''); setTerbuka(false); setAktif(-1); setHasil({ data: [], lebih_banyak: false });
    onChange(w.kode);
  }
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: token.jarak.xs }}>
      <Isian id={id} label="Alamat" value={value ? nama : kata} galat={galat}
        placeholder="Cari nama desa/kelurahan, kecamatan, atau kota" autoComplete="off" maxLength={100}
        role="combobox" aria-autocomplete="list" aria-expanded={terbuka && !value && hasil.data.length > 0}
        aria-controls={`${id}-hasil`} aria-activedescendant={terbuka && aktif >= 0 ? `${id}-opsi-${aktif}` : undefined}
        onFocus={() => setTerbuka(true)} onBlur={() => setTerbuka(false)}
        onChange={(e) => {
          onChange(''); setKata(e.target.value); setHasil({ data: [], lebih_banyak: false });
          setMencari(e.target.value.trim().length >= 2); setGagal(null); setAktif(-1); setTerbuka(true);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setTerbuka(false); }
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault(); setTerbuka(true);
            setAktif((n) => hasil.data.length ? Math.max(0, Math.min(hasil.data.length - 1, n + (e.key === 'ArrowDown' ? 1 : -1))) : -1);
          }
          if (e.key === 'Enter' && !value) { e.preventDefault(); if (terbuka && hasil.data[aktif]) pilih(hasil.data[aktif]); }
        }} />
      {value && <button type="button" onClick={() => { onChange(''); setKata(''); setMencari(false); setGagal(null); }} style={{ alignSelf: 'flex-start' }}>Hapus pilihan wilayah</button>}
      <small style={{ color: token.warna.teksRedup }}>Pilih hasil yang sesuai. Tambahkan nama kecamatan atau kabupaten untuk mempersempit pencarian.</small>
      {!value && kata.trim().length >= 2 && <small role="status">
        {gagal ?? (mencari ? 'Mencari wilayah…' : hasil.data.length === 0 ? 'Wilayah tidak ditemukan.' : hasil.lebih_banyak ? 'Hasil dibatasi 20 wilayah. Perjelas pencarian jika belum ditemukan.' : 'Pilih salah satu wilayah dari hasil pencarian.')}
      </small>}
      {!value && terbuka && hasil.data.length > 0 && (
        <ul id={`${id}-hasil`} role="listbox" aria-label="Hasil pencarian desa/kelurahan" style={{ margin: 0, padding: 0, listStyle: 'none', maxHeight: 240, overflowY: 'auto', border: `1px solid ${token.warna.garis}`, borderRadius: token.radius.sedang }}>
          {hasil.data.map((w, i) => <li key={w.kode} id={`${id}-opsi-${i}`} role="option" aria-selected={aktif === i}
            onMouseDown={(e) => e.preventDefault()} onClick={() => pilih(w)}
            style={{ padding: token.jarak.sm, cursor: 'pointer', background: aktif === i ? token.warna.latar : token.warna.permukaan }}>
            {w.label}
          </li>)}
        </ul>
      )}
    </div>
  );
}
