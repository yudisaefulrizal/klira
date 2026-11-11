import { FARMASI } from '@klira/shared';
import type { ResepDto } from '@klira/shared';
import { token } from '../../gaya/token';
import { Kolom } from '../../komponen/ui/susunan';

const R = FARMASI.resep;
const gayaTeks = { margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontFamily: 'inherit', fontSize: token.huruf.ukuran.dasar } as const;

/** Teks resep dokter apa adanya (baris dan racikan dipertahankan). */
export function TeksResepDokter({ teks, judul = true }: { teks: string; judul?: boolean }) {
  return <Kolom jarak="xs">
    {judul && <small style={{ color: token.warna.teksRedup }}>{R.teksDokter}</small>}
    <pre style={gayaTeks}>{teks.trim() || '-'}</pre>
  </Kolom>;
}

/** Item obat yang disiapkan farmasi: nama, jumlah dan satuan, aturan pakai, bentuk/rute bila ada. */
export function ItemResepFarmasi({ item }: { item: ResepDto['item'] }) {
  return <Kolom jarak="xs">
    <small style={{ color: token.warna.teksRedup }}>{R.itemFarmasi}</small>
    {item.length === 0 ? <span style={{ color: token.warna.teksRedup }}>{R.belumAdaItem}</span>
      : item.map((i) => <span key={i.id}>{i.nama}: {i.jumlah} {i.satuan}, {i.aturan_pakai}{[i.bentuk, i.rute].filter(Boolean).length ? ` (${[i.bentuk, i.rute].filter(Boolean).join(', ')})` : ''}</span>)}
  </Kolom>;
}

/** Tampilan resep lengkap: teks dokter lalu item yang disiapkan farmasi. */
export function TampilanResep({ resep }: { resep: Pick<ResepDto, 'teks' | 'item'> }) {
  return <Kolom jarak="sm">
    <TeksResepDokter teks={resep.teks} />
    <ItemResepFarmasi item={resep.item} />
  </Kolom>;
}
