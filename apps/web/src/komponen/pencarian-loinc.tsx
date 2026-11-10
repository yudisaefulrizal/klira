import { useEffect, useState } from 'react';
import { NAVIGASI, PENUNJANG } from '@klira/shared';
import type { LoincDto } from '@klira/shared';
import { cariLoinc } from '../api-klien/penunjang';
import { token } from '../gaya/token';
import { useNilaiTertunda } from '../util/tunda';
import { Isian } from './ui/isian';
import { Bingkai } from './ui/kartu';
import { Kolom } from './ui/susunan';
import { Tombol } from './ui/tombol';

type Props = { id: string; label: string; petunjuk?: string; value: string; onChange: (kode: string) => void; galat?: string };

/** Jumlah saran yang ditampilkan; sisanya dicapai dengan kata kunci yang lebih spesifik. */
const BATAS_HASIL = 10;
const M = PENUNJANG.master;
const redup = { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil } as const;

/** Kolom kode LOINC dengan saran saat mengetik (nama bahasa Inggris atau kode); memilih saran mengisi kode. Kode manual yang sah tetap diterima. */
export function PencarianLoinc({ id, label, petunjuk, value, onChange, galat }: Props) {
  const tertunda = useNilaiTertunda(value.trim(), 250);
  const [hasil, setHasil] = useState<LoincDto[] | null>(null);
  const [terbuka, setTerbuka] = useState(false);
  const [memuat, setMemuat] = useState(false);
  const [galatCari, setGalatCari] = useState<string | null>(null);
  const [nama, setNama] = useState<string | null>(null);

  useEffect(() => {
    if (tertunda.length < 2) {
      setHasil(null);
      setNama(null);
      setMemuat(false);
      return;
    }
    let batal = false;
    setMemuat(true);
    setGalatCari(null);
    cariLoinc(tertunda, BATAS_HASIL)
      .then((h) => {
        if (batal) return;
        setHasil(h);
        setNama(h.find((x) => x.kode === tertunda)?.nama ?? null);
      })
      .catch(() => !batal && setGalatCari(M.gagalCariLoinc))
      .finally(() => !batal && setMemuat(false));
    return () => {
      batal = true;
    };
  }, [tertunda]);

  const pilih = (h: LoincDto) => {
    onChange(h.kode);
    setNama(h.nama);
    setTerbuka(false);
  };

  return (
    <Kolom jarak="xs">
      <Isian id={id} label={label} petunjuk={petunjuk} placeholder={M.cariLoincPetunjuk} value={value} autoComplete="off" galat={galat || galatCari || undefined}
        onChange={(e) => { onChange(e.target.value); setTerbuka(true); }} onKeyDown={(e) => { if (e.key === 'Escape') setTerbuka(false); }} />
      {nama && !terbuka && <span style={redup}>{nama}</span>}
      {memuat && terbuka && <span style={redup}>{NAVIGASI.memuat}</span>}
      {terbuka && hasil && hasil.length > 0 && (
        <div style={{ maxHeight: token.ukuran.tinggiDaftar, overflowY: 'auto' }}>
          <Bingkai tag="ul" arah="kolom" jarak="tanpa" padding="tanpa" aria-label={M.hasilLoinc}>
            {hasil.map((h) => (
              <Kolom tag="li" jarak="tanpa" garis="atas" halus key={h.kode}>
                <Tombol type="button" varian="langkah" penuh onClick={() => pilih(h)}>
                  <strong style={{ minWidth: token.ukuran.kolomKode }}>{h.kode}</strong>
                  <span style={{ flexGrow: 1 }}>{h.nama}<small style={{ display: 'block', color: token.warna.teksRedup }}>{h.kelas}</small></span>
                </Tombol>
              </Kolom>
            ))}
          </Bingkai>
          <span style={redup}>{M.hakCiptaLoinc}</span>
        </div>
      )}
      {terbuka && hasil && hasil.length === 0 && !memuat && <span style={redup}>{M.loincTidakAda}</span>}
    </Kolom>
  );
}
