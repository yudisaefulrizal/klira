import { useEffect, useState } from 'react';
import { BERANDA, punyaIzin } from '@klira/shared';
import type { ItemKesiapanDto, KesiapanDto, KunciKesiapan } from '@klira/shared';
import { ambilKesiapan } from '../api-klien/beranda';
import { token } from '../gaya/token';
import { usePengguna } from '../util/konteks-pengguna';
import { useNavigasi } from '../util/navigasi';
import { Kartu } from './ui/kartu';
import { Lencana } from './ui/lencana';
import { Peringatan } from './ui/peringatan';
import { Kolom, Sebaris } from './ui/susunan';
import { Tombol } from './ui/tombol';

const K = BERANDA.kesiapan;
/** Halaman tempat tiap hal diatur. */
const TUJUAN: Record<KunciKesiapan, string> = {
  poli: '/pasien?tab=poli', praktisi: '/pasien?tab=praktisi', jadwal: '/pasien?tab=jadwal', tarif: '/kasir-klaim?tab=tarif',
  obat: '/farmasi', pemeriksaan: '/penunjang?tab=master', pemeriksaan_tanpa_tarif: '/penunjang?tab=master', sip_kedaluwarsa: '/pasien?tab=praktisi',
};
const labelItem = (i: ItemKesiapanDto): string => {
  const t = K.item[i.kunci];
  return typeof t.label === 'function' ? t.label(i.jumlah) : t.label;
};
const perluDibereskan = (k: KesiapanDto): ItemKesiapanDto[] => k.item.filter((i) => !i.ok);

/**
 * Daftar periksa pengaturan awal klinik: `kartu` menampilkan seluruh daftar (Beranda tugas); `spanduk` hanya satu baris bila masih ada yang kurang (Daftar pasien).
 * Hanya untuk akun dengan izin lihat master; tidak tampil bila gagal dimuat atau tidak ada yang perlu dibereskan (spanduk).
 */
export function KesiapanAwal({ mode }: { mode: 'kartu' | 'spanduk' }) {
  const { pengguna } = usePengguna();
  const { ganti } = useNavigasi();
  const boleh = !!pengguna && punyaIzin(pengguna, 'master', 'lihat');
  const [data, setData] = useState<KesiapanDto | null>(null);
  const [galat, setGalat] = useState(false);

  useEffect(() => {
    if (!boleh) return;
    let batal = false;
    ambilKesiapan().then((d) => !batal && setData(d)).catch(() => !batal && setGalat(true));
    return () => {
      batal = true;
    };
  }, [boleh]);

  if (!boleh || !data) return galat && mode === 'kartu' ? <Peringatan>{K.gagal}</Peringatan> : null;
  const kurang = perluDibereskan(data);

  if (mode === 'spanduk') {
    if (!kurang.length) return null;
    return (
      <Peringatan nada="kuning">
        <Sebaris jarak="sm" bungkus sejajar="tengah">
          <span style={{ flexGrow: 1 }}>{K.spanduk(kurang.length)}</span>
          <Tombol type="button" varian="teks" onClick={() => ganti('/beranda')}>{K.lihat}</Tombol>
        </Sebaris>
      </Peringatan>
    );
  }

  const wajib = data.item.filter((i) => !i.peringatan);
  const siap = wajib.filter((i) => i.ok).length;
  const tampil = [...wajib, ...data.item.filter((i) => i.peringatan && !i.ok)];
  return (
    <Kartu susun="sm" aria-label={K.judul}>
      <Sebaris jarak="md" bungkus sejajar="tengah">
        <strong style={{ fontSize: token.huruf.ukuran.besar, flexGrow: 1 }}>{K.judul}</strong>
        <Lencana warna={siap === wajib.length ? 'hijau' : 'kuning'}>{K.ringkasan(siap, wajib.length)}</Lencana>
      </Sebaris>
      {!kurang.length && <span style={{ color: token.warna.teksRedup }}>{K.semuaSiap}</span>}
      {tampil.map((i) => (
        <Sebaris key={i.kunci} jarak="md" bungkus sejajar="tengah">
          <Kolom jarak="xs" style={{ flexGrow: 1 }}>
            <span>{labelItem(i)}{!i.peringatan && <span style={{ color: token.warna.teksRedup }}> ({i.jumlah})</span>}</span>
            {!i.ok && <span style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{K.item[i.kunci].petunjuk}</span>}
          </Kolom>
          <Lencana warna={i.ok ? 'hijau' : i.peringatan ? 'merah' : 'kuning'}>{i.ok ? 'Siap' : i.peringatan ? '!' : 'Belum'}</Lencana>
          <Tombol type="button" varian="teks" onClick={() => ganti(TUJUAN[i.kunci])}>{K.atur}</Tombol>
        </Sebaris>
      ))}
    </Kartu>
  );
}
