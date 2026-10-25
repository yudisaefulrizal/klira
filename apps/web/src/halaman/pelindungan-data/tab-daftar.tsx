import type { ReactNode } from 'react';
import { PDP } from '@klira/shared';
import { Paginasi } from '../../komponen/paginasi';
import { Kartu } from '../../komponen/ui/kartu';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Sebaris } from '../../komponen/ui/susunan';
import { Tabel } from '../../komponen/ui/tabel';
import type { KolomTabel } from '../../komponen/ui/tabel';
import { token } from '../../gaya/token';
import { useDaftar } from '../../util/use-daftar';

type Props<T> = {
  label: string;
  kolom: readonly KolomTabel[];
  ambil: (halaman: number) => Promise<{ data: T[]; total: number; ukuran: number }>;
  versi: number;
  baris: (item: T) => ReactNode;
  kosong: string;
  /** Tombol di atas tabel (mis. Tambah). */
  aksiAtas?: ReactNode;
  /** Keterangan di bawah tabel. */
  catatan?: string;
};

/** Tab daftar berhalaman untuk halaman Pelindungan data: tabel, galat, kosong, dan paginasi; isi baris dan modal diatur tab pemakainya. */
export function TabDaftarPdp<T>({ label, kolom, ambil, versi, baris, kosong, aksiAtas, catatan }: Props<T>) {
  const { halaman, setHalaman, hasil, galat } = useDaftar(ambil, PDP.gagalMuat, versi);
  return (
    <>
      {aksiAtas && <Sebaris jarak="md" bungkus sebaran="akhir">{aksiAtas}</Sebaris>}
      <Kartu style={{ padding: 0, overflow: 'hidden' }}>
        {galat && <Peringatan style={{ margin: token.jarak.md }}>{galat}</Peringatan>}
        <Tabel kolom={kolom} label={label}>{hasil?.data.map(baris)}</Tabel>
        {hasil && hasil.data.length === 0 && <div style={{ padding: token.jarak.md, color: token.warna.teksRedup }}>{kosong}</div>}
        {hasil && <Paginasi halaman={halaman} total={hasil.total} ukuran={hasil.ukuran} onPindah={setHalaman} />}
      </Kartu>
      {catatan && <p style={{ margin: 0, color: token.warna.teksRedup }}>{catatan}</p>}
    </>
  );
}
