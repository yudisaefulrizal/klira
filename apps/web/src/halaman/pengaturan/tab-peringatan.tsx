import { useEffect, useState } from 'react';
import { DAFTAR_PERINGATAN, JENIS_PERINGATAN, PERINGATAN_IZIN } from '@klira/shared';
import type { Halaman, PeringatanIzinDto } from '@klira/shared';
import { daftarPeringatan } from '../../api-klien/izin';
import { GalatApi } from '../../api-klien/klien';
import { BilahPenyaring } from '../../komponen/bilah-penyaring';
import { Paginasi } from '../../komponen/paginasi';
import { Isian } from '../../komponen/ui/isian';
import { Kartu } from '../../komponen/ui/kartu';
import { Lencana } from '../../komponen/ui/lencana';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Pilihan } from '../../komponen/ui/pilihan';
import { BarisTabel, SelTabel, Tabel } from '../../komponen/ui/tabel';
import { token } from '../../gaya/token';
import type { NilaiPenyaring } from '../../util/penyaring-tab';
import { BAWAAN_PERINGATAN, bacaPenyaring, formatWaktu, queryPenyaring, rentangTerbalik, saringanPeringatan, ubahPenyaring } from '../../util/penyaring-tab';
import { Kolom } from '../../komponen/ui/susunan';

const UKURAN = 20;
const KOLOM = [
  { judul: DAFTAR_PERINGATAN.kolom.pengguna }, { judul: DAFTAR_PERINGATAN.kolom.jenis }, { judul: DAFTAR_PERINGATAN.kolom.alasan },
  { judul: DAFTAR_PERINGATAN.kolom.penetapan }, { judul: DAFTAR_PERINGATAN.kolom.waktu }, { judul: DAFTAR_PERINGATAN.kolom.diterima },
];
const OPSI_JENIS = [
  { nilai: '', label: DAFTAR_PERINGATAN.semuaJenis },
  ...JENIS_PERINGATAN.map((j) => ({ nilai: j, label: PERINGATAN_IZIN[j] })),
];

/** Tab Daftar peringatan izin (3.1, 2.2): satu daftar untuk pimpinan dan auditor, penyaring tersimpan di alamat. */
export function TabPeringatan({ search, ubahAlamat }: { search: string; ubahAlamat: (query: string) => void }) {
  const keadaan = bacaPenyaring(search, BAWAAN_PERINGATAN);
  const [draf, setDraf] = useState(keadaan.nilai);
  const [hasil, setHasil] = useState<Halaman<PeringatanIzinDto> | null>(null);
  const [galat, setGalat] = useState<string | null>(null);

  useEffect(() => setDraf(bacaPenyaring(search, BAWAAN_PERINGATAN).nilai), [search]);

  const kunci = JSON.stringify([keadaan.nilai, keadaan.halaman]);
  useEffect(() => {
    let batal = false;
    daftarPeringatan(saringanPeringatan(bacaPenyaring(search, BAWAAN_PERINGATAN), UKURAN))
      .then((h) => {
        if (batal) return;
        setHasil(h);
        setGalat(null);
      })
      .catch((e) => !batal && setGalat(e instanceof GalatApi ? e.message : DAFTAR_PERINGATAN.gagalMuat));
    return () => {
      batal = true;
    };
    // search diwakili `kunci` agar hanya berubah saat penyaring atau halaman berubah.
  }, [kunci]);

  const pasang = (k: typeof keadaan) => ubahAlamat(queryPenyaring('peringatan', k, BAWAAN_PERINGATAN));
  const terbalik = rentangTerbalik(draf.dari, draf.sampai);
  const ubah = (perubahan: NilaiPenyaring) => setDraf({ ...draf, ...perubahan });

  return (
    <Kolom tag="section" jarak="md" id="panel-peringatan" role="tabpanel" aria-labelledby="tab-peringatan">
      <Kartu style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: `${token.jarak.md} ${token.jarak.md} 0`, fontSize: token.huruf.ukuran.besar, fontWeight: token.huruf.berat.tebal }}>{DAFTAR_PERINGATAN.judulTab}</div>
        <BilahPenyaring
          labelTerapkan={DAFTAR_PERINGATAN.terapkan}
          labelAturUlang={DAFTAR_PERINGATAN.aturUlang}
          nonaktif={terbalik}
          onTerapkan={() => pasang(ubahPenyaring(keadaan, draf))}
          onAturUlang={() => pasang({ nilai: { ...BAWAAN_PERINGATAN }, halaman: 1 })}
        >
          <Isian id="peringatan-cari" label={DAFTAR_PERINGATAN.filterPengguna} type="search" value={draf.cari} onChange={(e) => ubah({ cari: e.target.value })} />
          <Pilihan id="peringatan-jenis" label={DAFTAR_PERINGATAN.filterJenis} value={draf.jenis} onChange={(e) => ubah({ jenis: e.target.value })} opsi={OPSI_JENIS} style={{ maxWidth: token.ukuran.kartu }} />
          <Isian id="peringatan-dari" label={DAFTAR_PERINGATAN.filterDari} type="date" value={draf.dari} onChange={(e) => ubah({ dari: e.target.value })} />
          <Isian id="peringatan-sampai" label={DAFTAR_PERINGATAN.filterSampai} type="date" value={draf.sampai} onChange={(e) => ubah({ sampai: e.target.value })} galat={terbalik ? DAFTAR_PERINGATAN.rentangTerbalik : undefined} />
        </BilahPenyaring>
        {galat && <Peringatan style={{ margin: `0 ${token.jarak.md} ${token.jarak.md}` }}>{galat}</Peringatan>}
        <Tabel kolom={KOLOM} label={DAFTAR_PERINGATAN.judulTab}>
          {hasil?.data.map((p) => (
            <BarisTabel key={p.id}>
              <SelTabel style={{ fontWeight: token.huruf.berat.tebal }}>{p.pengguna_nama ?? DAFTAR_PERINGATAN.tanpaPengguna}</SelTabel>
              <SelTabel>{(PERINGATAN_IZIN as Record<string, string>)[p.jenis_peringatan] ?? p.jenis_peringatan}</SelTabel>
              <SelTabel>{p.alasan_pimpinan}</SelTabel>
              <SelTabel>
                <div>{p.ditetapkan_oleh_nama ?? DAFTAR_PERINGATAN.tanpaPengguna}</div>
                <div style={{ fontSize: token.huruf.ukuran.kecil, color: token.warna.teksRedup }}>{DAFTAR_PERINGATAN.sumber[p.sumber] ?? p.sumber}</div>
              </SelTabel>
              <SelTabel>{formatWaktu(p.waktu)}</SelTabel>
              <SelTabel>
                <Lencana warna={p.diterima_untuk_akun ? 'hijau' : 'abu'}>{p.diterima_untuk_akun ? DAFTAR_PERINGATAN.diterimaYa : DAFTAR_PERINGATAN.diterimaTidak}</Lencana>
              </SelTabel>
            </BarisTabel>
          ))}
        </Tabel>
        {hasil && hasil.data.length === 0 && <div style={{ padding: token.jarak.md, color: token.warna.teksRedup }}>{DAFTAR_PERINGATAN.kosong}</div>}
        {hasil && <Paginasi halaman={keadaan.halaman} total={hasil.total} ukuran={hasil.ukuran} onPindah={(h) => pasang({ ...keadaan, halaman: h })} />}
      </Kartu>
      <Peringatan nada="kuning">{DAFTAR_PERINGATAN.catatan}</Peringatan>
    </Kolom>
  );
}
