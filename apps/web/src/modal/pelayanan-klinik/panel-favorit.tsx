import { useEffect, useState } from 'react';
import { KLINIS, NAVIGASI, TOMBOL } from '@klira/shared';
import type { BagianTemplat, FavoritDto, JenisFavorit, TemplatDto } from '@klira/shared';
import { GalatApi } from '../../api-klien/klien';
import { daftarTemplat, hapusFavorit, hapusTemplat, tambahFavorit, tambahTemplat, ubahUrutanFavorit } from '../../api-klien/klinis';
import { token } from '../../gaya/token';
import { Panel } from '../../komponen/panel/panel';
import { Isian } from '../../komponen/ui/isian';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Kolom, Sebaris } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { isiTemplatDari } from './keadaan-pemeriksaan';
import type { KeadaanPemeriksaan } from './keadaan-pemeriksaan';

type Props = {
  k: KeadaanPemeriksaan;
  favorit: readonly FavoritDto[];
  onFavorit: (daftar: FavoritDto[]) => void;
  onPakaiKode: (jenis: JenisFavorit, kode: { kode: string; nama: string }) => void;
  onPakaiTemplat: (t: TemplatDto) => void;
  onTutup: () => void;
};


/** PANEL Favorit dan templat: favorit diagnosis dan tindakan per dokter (urut, tambah, hapus) serta templat catatan pribadi. */
export function PanelFavorit({ k, favorit, onFavorit, onPakaiKode, onPakaiTemplat, onTutup }: Props) {
  const p = KLINIS.panel;
  const [templat, setTemplat] = useState<TemplatDto[] | null>(null);
  const [nama, setNama] = useState('');
  const [galat, setGalat] = useState<string | null>(null);
  const [sibuk, setSibuk] = useState(false);

  useEffect(() => {
    let batal = false;
    daftarTemplat()
      .then((t) => !batal && setTemplat(t))
      .catch((e) => !batal && setGalat(e instanceof GalatApi ? e.message : p.templatGagal));
    return () => {
      batal = true;
    };
  }, [p.templatGagal]);

  async function jalankan(f: () => Promise<void>, pesan: string) {
    if (sibuk) return;
    setSibuk(true);
    setGalat(null);
    try {
      await f();
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : pesan);
    } finally {
      setSibuk(false);
    }
  }

  const geser = (jenis: JenisFavorit, i: number, arah: -1 | 1) =>
    jalankan(async () => {
      const daftar = favorit.filter((f) => f.jenis === jenis);
      const a = daftar[i];
      const b = daftar[i + arah];
      if (!a || !b) return;
      // urutan ditukar; bila sama (data lama) dipisah dahulu
      const ua = a.urutan === b.urutan ? b.urutan + arah : b.urutan;
      const [na, nb] = await Promise.all([ubahUrutanFavorit(a.id, ua), ubahUrutanFavorit(b.id, a.urutan)]);
      onFavorit([...favorit.filter((f) => f.id !== a.id && f.id !== b.id), na, nb].sort((x, y) => x.urutan - y.urutan || x.id - y.id));
    }, p.favoritGagal);

  const tambah = (jenis: JenisFavorit, x: { kode: string; nama: string }) =>
    jalankan(async () => {
      const f = await tambahFavorit({ jenis, kode: x.kode, nama: x.nama });
      onFavorit([...favorit, f]);
    }, p.favoritGagal);

  const hapus = (f: FavoritDto) =>
    jalankan(async () => {
      await hapusFavorit(f.id);
      onFavorit(favorit.filter((x) => x.id !== f.id));
    }, p.favoritGagal);

  const simpanTemplat = (bagian: BagianTemplat) =>
    jalankan(async () => {
      const t = await tambahTemplat({ bagian, nama, isi: isiTemplatDari(bagian, k) } as Parameters<typeof tambahTemplat>[0]);
      setTemplat((x) => [...(x ?? []), t].sort((a, b) => a.nama.localeCompare(b.nama)));
      setNama('');
    }, p.templatGagal);

  const bagianFavorit = (jenis: JenisFavorit, judul: string, usulan: { kode: string; nama: string }[]) => {
    const daftar = favorit.filter((f) => f.jenis === jenis);
    const baru = usulan.filter((u) => !daftar.some((f) => f.kode === u.kode));
    return (
      <Kolom jarak="sm">
        <strong>{judul}</strong>
        {daftar.length === 0 && <p style={{ margin: 0, color: token.warna.teksRedup }}>{p.favoritKosong}</p>}
        {daftar.map((f, i) => (
          <Sebaris key={f.id}>
            <span style={{ flexGrow: 1 }}><strong>{f.kode}</strong> {f.nama}</span>
            <Tombol type="button" varian="sekunder" onClick={() => onPakaiKode(jenis, f)}>{p.favoritPakai}</Tombol>
            <Tombol type="button" varian="teks" disabled={i === 0 || sibuk} aria-label={p.favoritNaik} title={p.favoritNaik} onClick={() => void geser(jenis, i, -1)}>↑</Tombol>
            <Tombol type="button" varian="teks" disabled={i === daftar.length - 1 || sibuk} aria-label={p.favoritTurun} title={p.favoritTurun} onClick={() => void geser(jenis, i, 1)}>↓</Tombol>
            <Tombol type="button" varian="teks" disabled={sibuk} onClick={() => void hapus(f)}>{p.favoritHapus}</Tombol>
          </Sebaris>
        ))}
        {baru.length > 0 && (
          <Sebaris bungkus>
            <span style={{ color: token.warna.teksRedup }}>{p.favoritTambah}</span>
            {baru.map((u) => <Tombol key={u.kode} type="button" varian="sekunder" disabled={sibuk} onClick={() => void tambah(jenis, u)}>+ {u.kode} {u.nama}</Tombol>)}
          </Sebaris>
        )}
      </Kolom>
    );
  };

  return (
    <Panel judul={p.favoritJudul} onTutup={onTutup} aksi={<Tombol type="button" varian="sekunder" onClick={onTutup}>{TOMBOL.tutup}</Tombol>}>
      {galat && <Peringatan>{galat}</Peringatan>}
      {bagianFavorit('diagnosis', p.favoritDiagnosis, k.diagnosis.map((d) => ({ kode: d.kode, nama: d.nama })))}
      {bagianFavorit('tindakan', p.favoritTindakan, k.tindakan.map((t) => ({ kode: t.kode, nama: t.nama })))}
      <Kolom jarak="sm">
        <strong>{p.templatJudul}</strong>
        {!templat && !galat && <span style={{ color: token.warna.teksRedup }}>{NAVIGASI.memuat}</span>}
        {templat?.length === 0 && <p style={{ margin: 0, color: token.warna.teksRedup }}>{p.templatKosong}</p>}
        {templat?.map((t) => (
          <Sebaris key={t.id}>
            <span style={{ flexGrow: 1 }}><strong>{t.nama}</strong> <span style={{ color: token.warna.teksRedup }}>({p.templatBagian[t.bagian]})</span></span>
            <Tombol type="button" varian="sekunder" onClick={() => onPakaiTemplat(t)}>{p.templatPakai}</Tombol>
            <Tombol
              type="button" varian="teks" disabled={sibuk}
              onClick={() => void jalankan(async () => { await hapusTemplat(t.id); setTemplat((x) => (x ?? []).filter((y) => y.id !== t.id)); }, p.templatGagal)}
            >
              {p.templatHapus}
            </Tombol>
          </Sebaris>
        ))}
        <Isian id="templat-nama" label={p.templatNama} value={nama} onChange={(e) => setNama(e.target.value)} autoComplete="off" />
        <Sebaris bungkus>
          {(['anamnesis', 'pemeriksaan'] as const).map((b) => (
            <Tombol key={b} type="button" varian="sekunder" disabled={sibuk || !nama.trim()} onClick={() => void simpanTemplat(b)}>{p.templatSimpan}: {p.templatBagian[b]}</Tombol>
          ))}
        </Sebaris>
      </Kolom>
    </Panel>
  );
}
