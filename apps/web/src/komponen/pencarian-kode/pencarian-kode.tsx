import { useEffect, useState } from 'react';
import type { KodeTerminologiDto, SistemTerminologi } from '@klira/shared';
import { KLINIS, NAVIGASI, TOMBOL } from '@klira/shared';
import { token } from '../../gaya/token';
import { useNilaiTertunda } from '../../util/tunda';
import { Isian } from '../ui/isian';
import { Lencana } from '../ui/lencana';
import { Peringatan } from '../ui/peringatan';
import { Baris, Kolom } from '../ui/susunan';
import { Tombol } from '../ui/tombol';
import { Bingkai } from '../ui/kartu';
import { KamusKode } from './kamus-kode';

type Props = {
  id: string;
  label: string;
  petunjuk: string;
  /** Pencarian terminologi dengan saran otomatis; hasil sudah dibatasi server. */
  cari: (q: string) => Promise<KodeTerminologiDto[]>;
  onPilih: (kode: { kode: string; nama: string }) => void;
  /** Izinkan menambahkan kode sebagai teks sendiri bila master belum memuatnya (kode lengkap menyusul). */
  manual?: boolean;
  /** Teks pada tombol tambah manual dan label kolom manual. */
  teksManual?: { kode: string; nama: string };
  kamus?: { judul: string; sistem: SistemTerminologi };
};

/** Pencarian kode terminologi (ICD-10, ICD-9 CM) dengan saran otomatis; dipakai langkah Diagnosis dan Tindakan. */
export function PencarianKode({ id, label, petunjuk, cari, onPilih, manual = false, teksManual, kamus }: Props) {
  const [q, setQ] = useState('');
  const [kamusTerbuka, setKamusTerbuka] = useState(false);
  const tertunda = useNilaiTertunda(q.trim(), 250);
  const [hasil, setHasil] = useState<KodeTerminologiDto[] | null>(null);
  const [kataHasil, setKataHasil] = useState<string | null>(null);
  const hasilTampil = kataHasil === q.trim() ? hasil : null;
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [kodeManual, setKodeManual] = useState('');
  const [namaManual, setNamaManual] = useState('');

  useEffect(() => {
    if (!tertunda) {
      setHasil(null);
      setGalat(null);
      return;
    }
    let batal = false;
    setMemuat(true);
    cari(tertunda)
      .then((h) => {
        if (batal) return;
        setHasil(h);
        setKataHasil(tertunda);
        setGalat(null);
      })
      .catch((e) => !batal && setGalat(e instanceof Error ? e.message : KLINIS.galat.pencarianKosong))
      .finally(() => !batal && setMemuat(false));
    return () => {
      batal = true;
    };
  }, [tertunda, cari]);

  const pilih = (k: { kode: string; nama: string }) => {
    onPilih(k);
    setQ('');
    setHasil(null);
    setKodeManual('');
    setNamaManual('');
  };

  return (
    <Kolom jarak="sm">
      <div style={{ display: 'flex', gap: token.jarak.sm, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 220px', minWidth: 0 }}>
          <Isian id={id} label={label} placeholder={petunjuk} value={q} onChange={(e) => { setQ(e.target.value); setHasil(null); }} autoComplete="off" />
        </div>
        {kamus && <Tombol type="button" varian="sekunder" onClick={() => setKamusTerbuka(true)} aria-haspopup="dialog" style={{ display: 'inline-flex', alignItems: 'center', gap: token.jarak.sm }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}><path d="M12 5C9 3 5 3 2 4v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1Z"/><path d="M12 5v15"/></svg>
          {kamus.judul}
        </Tombol>}
      </div>
      {kamus && kamusTerbuka && <KamusKode judul={kamus.judul} sistem={kamus.sistem} onTutup={() => setKamusTerbuka(false)}
        onPilih={(kode) => { pilih(kode); setKamusTerbuka(false); }} />}
      {galat && <Peringatan>{galat}</Peringatan>}
      {memuat && <span style={{ color: token.warna.teksRedup }}>{NAVIGASI.memuat}</span>}
      {hasilTampil && hasilTampil.length > 0 && (
        <Bingkai tag="ul" arah="kolom" jarak="tanpa" padding="tanpa" aria-label={KLINIS.diagnosis.hasil}>
          {hasilTampil.map((h) => (
            <Kolom tag="li" jarak="tanpa" garis="atas" halus key={h.kode}>
              <Tombol type="button" varian="langkah" penuh onClick={() => pilih(h)}>
                <strong style={{ minWidth: token.ukuran.kolomKode }}>{h.kode}</strong>
                <span style={{ flexGrow: 1 }}>{h.nama_indonesia ?? h.nama}{h.nama_indonesia && <small style={{ display: 'block', color: token.warna.teksRedup }}>{h.nama} · Padanan komunitas</small>}</span>
                {h.contoh && <Lencana warna="kuning">{KLINIS.diagnosis.contoh}</Lencana>}
              </Tombol>
            </Kolom>
          ))}
        </Bingkai>
      )}
      {hasilTampil && hasilTampil.length === 0 && !memuat && <Peringatan nada="kuning">{KLINIS.diagnosis.tidakAda}</Peringatan>}
      {manual && hasilTampil && hasilTampil.length === 0 && !memuat && teksManual && (
        <Baris>
          <Isian id={`${id}-kode`} label={teksManual.kode} value={kodeManual} onChange={(e) => setKodeManual(e.target.value)} autoComplete="off" />
          <Isian id={`${id}-nama`} label={teksManual.nama} value={namaManual} onChange={(e) => setNamaManual(e.target.value)} autoComplete="off" />
          <Tombol type="button" varian="sekunder" disabled={!kodeManual.trim() || !namaManual.trim()} onClick={() => pilih({ kode: kodeManual, nama: namaManual })}>{TOMBOL.tambah}</Tombol>
        </Baris>
      )}
    </Kolom>
  );
}
