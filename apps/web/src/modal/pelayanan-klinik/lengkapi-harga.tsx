import { useState } from 'react';
import { KASIR } from '@klira/shared';
import type { KasirKunjunganDto } from '@klira/shared';
import { lengkapiHargaItem } from '../../api-klien/kasir';
import { GalatApi } from '../../api-klien/klien';
import { token } from '../../gaya/token';
import { Isian } from '../../komponen/ui/isian';
import { Bingkai } from '../../komponen/ui/kartu';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Sebaris, Tumbuh } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';

const L = KASIR.lengkapi;
type Props = { kunjunganId: number; gambaran: KasirKunjunganDto; onUbah: (g: KasirKunjunganDto) => void };

/** Daftar item tagihan yang belum berharga dengan kolom isian harga; menyelesaikan titik buntu "tagihan belum lengkap" di tempat. */
export function LengkapiHarga({ kunjunganId, gambaran, onUbah }: Props) {
  const kosong = gambaran.tagihan.item.filter((i) => i.harga === null);
  const [nilai, setNilai] = useState<Record<number, string>>({});
  const [proses, setProses] = useState<number | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  if (!kosong.length) return null;

  async function simpan(itemId: number) {
    const harga = (nilai[itemId] ?? '').trim();
    if (!/^\d+$/.test(harga)) return setGalat(KASIR.galat.angka);
    setProses(itemId);
    setGalat(null);
    try {
      onUbah(await lengkapiHargaItem(kunjunganId, itemId, harga));
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : KASIR.bayar.gagal);
    } finally {
      setProses(null);
    }
  }

  return (
    <Bingkai halus arah="kolom" jarak="sm">
      <strong>{L.judul}</strong>
      <span style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{L.petunjuk}</span>
      {galat && <Peringatan>{galat}</Peringatan>}
      {kosong.map((i) => (
        <Sebaris key={i.id} jarak="sm" sejajar="akhir" bungkus>
          <Tumbuh>
            <Isian id={`lengkapi-${i.id}`} label={L.harga(i.nama)} inputMode="numeric" value={nilai[i.id] ?? ''} autoComplete="off" onChange={(e) => setNilai({ ...nilai, [i.id]: e.target.value })} />
          </Tumbuh>
          <Tombol type="button" varian="sekunder" disabled={proses !== null} onClick={() => void simpan(i.id)}>{proses === i.id ? L.menyimpan : L.simpan}</Tombol>
        </Sebaris>
      ))}
      <a href="/kasir-klaim?tab=tarif" style={{ fontSize: token.huruf.ukuran.kecil }}>{L.tautanTarif}</a>
    </Bingkai>
  );
}
