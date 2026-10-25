import { useEffect, useState } from 'react';
import { KLINIS, NAVIGASI, TOMBOL } from '@klira/shared';
import type { FolderKeluargaDto, PasienBarisDto } from '@klira/shared';
import { GalatApi } from '../../api-klien/klien';
import { ambilFolderKeluarga, tautkanKeluarga, ubahKeluarga } from '../../api-klien/klinis';
import { daftarPasien } from '../../api-klien/pasien';
import { token } from '../../gaya/token';
import { useIzin } from '../../komponen/izin-saja';
import { Panel } from '../../komponen/panel/panel';
import { Isian } from '../../komponen/ui/isian';
import { Lencana } from '../../komponen/ui/lencana';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Kolom, Sebaris } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { useNilaiTertunda } from '../../util/tunda';

type Props = { pasienId: number; nama: string; onTutup: () => void };

/** PANEL Family folder: ringkasan wali dan anggota keluarga yang juga pasien, dengan penanda privasi per anggota. */
export function PanelKeluarga({ pasienId, nama, onTutup }: Props) {
  const p = KLINIS.panel;
  const boleh = useIzin();
  const bolehUbah = boleh('pasien', 'input') || boleh('klinis', 'input');
  const [data, setData] = useState<FolderKeluargaDto | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [cari, setCari] = useState('');
  const kataCari = useNilaiTertunda(cari.trim(), 300);
  const [hasil, setHasil] = useState<PasienBarisDto[]>([]);
  const [pilih, setPilih] = useState<PasienBarisDto | null>(null);
  const [hubungan, setHubungan] = useState('');
  const [sibuk, setSibuk] = useState(false);

  useEffect(() => {
    let batal = false;
    ambilFolderKeluarga(pasienId)
      .then((d) => !batal && setData(d))
      .catch((e) => !batal && setGalat(e instanceof GalatApi ? e.message : p.keluargaGagal));
    return () => {
      batal = true;
    };
  }, [pasienId, p.keluargaGagal]);

  useEffect(() => {
    if (!kataCari || !bolehUbah) {
      setHasil([]);
      return;
    }
    let batal = false;
    daftarPasien({ cari: kataCari, tahap: 'semua', halaman: 1, ukuran: 5 })
      .then((h) => !batal && setHasil(h.data.filter((x) => x.id !== pasienId)))
      .catch(() => !batal && setHasil([]));
    return () => {
      batal = true;
    };
  }, [kataCari, pasienId, bolehUbah]);

  async function jalankan(f: () => Promise<void>) {
    if (sibuk) return;
    setSibuk(true);
    setGalat(null);
    try {
      await f();
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : p.keluargaGagal);
    } finally {
      setSibuk(false);
    }
  }

  const tautkan = () =>
    jalankan(async () => {
      if (!pilih) return;
      const a = await tautkanKeluarga(pasienId, { anggota_pasien_id: pilih.id, hubungan });
      setData((d) => (d ? { ...d, anggota: [...d.anggota, a] } : d));
      setPilih(null);
      setHubungan('');
      setCari('');
    });

  const ganti = (id: number, dibatasi: boolean) =>
    jalankan(async () => {
      const a = await ubahKeluarga(pasienId, id, { dibatasi });
      setData((d) => (d ? { ...d, anggota: d.anggota.map((x) => (x.id === id ? a : x)) } : d));
    });

  const sudahTertaut = (id: number) => !!data?.anggota.some((a) => a.pasien?.id === id);

  return (
    <Panel judul={`${p.keluargaJudul}: ${nama}`} onTutup={onTutup} aksi={<Tombol type="button" varian="sekunder" onClick={onTutup}>{TOMBOL.tutup}</Tombol>}>
      <Peringatan nada="biru">{p.keluargaTercatat}</Peringatan>
      {galat && <Peringatan>{galat}</Peringatan>}
      {!data && !galat && <span style={{ color: token.warna.teksRedup }}>{NAVIGASI.memuat}</span>}
      {data && (
        <>
          <Kolom jarak="sm">
            <strong>{p.keluargaWali}</strong>
            {data.wali.length === 0 && <p style={{ margin: 0, color: token.warna.teksRedup }}>{p.keluargaTanpaWali}</p>}
            {data.wali.map((w) => <div key={w.id}><strong>{w.hubungan}</strong>: {w.nama}{w.kontak ? ` (${w.kontak})` : ''}</div>)}
          </Kolom>
          <Kolom jarak="sm">
            <strong>{p.keluargaAnggota}</strong>
            {data.anggota.length === 0 && <p style={{ margin: 0, color: token.warna.teksRedup }}>{p.keluargaKosong}</p>}
            {data.anggota.map((a) => (
              <Sebaris key={a.id}>
                <span style={{ flexGrow: 1 }}>
                  <strong>{a.hubungan}</strong>:{' '}
                  {a.pasien ? `${a.pasien.nama} · ${a.pasien.nomor_rm}` : <span style={{ color: token.warna.teksRedup }}>{p.keluargaTersembunyi}</span>}
                </span>
                {a.dibatasi && <Lencana warna="kuning">{p.keluargaDibatasi}</Lencana>}
                {bolehUbah && <Tombol type="button" varian="teks" disabled={sibuk} onClick={() => void ganti(a.id, !a.dibatasi)}>{a.dibatasi ? p.keluargaBuka : p.keluargaBatasi}</Tombol>}
              </Sebaris>
            ))}
          </Kolom>
          {bolehUbah && (
            <Kolom jarak="sm">
              <strong>{p.keluargaTambah}</strong>
              <Isian id="keluarga-cari" label={p.keluargaCari} value={cari} onChange={(e) => { setCari(e.target.value); setPilih(null); }} autoComplete="off" />
              {kataCari && hasil.length === 0 && !pilih && <span style={{ color: token.warna.teksRedup }}>{p.keluargaHasilKosong}</span>}
              {!pilih && hasil.filter((h) => !sudahTertaut(h.id)).map((h) => (
                <Tombol key={h.id} type="button" varian="langkah" penuh onClick={() => setPilih(h)}>
                  <span style={{ flexGrow: 1 }}>{h.nama} · {h.nomor_rm}</span>
                  <span style={{ color: token.warna.teksRedup }}>{p.keluargaPilih}</span>
                </Tombol>
              ))}
              {pilih && <div><strong>{pilih.nama}</strong> · {pilih.nomor_rm}</div>}
              <Isian id="keluarga-hubungan" label={p.keluargaHubungan} value={hubungan} onChange={(e) => setHubungan(e.target.value)} autoComplete="off" />
              <div><Tombol type="button" disabled={sibuk || !pilih || !hubungan.trim()} onClick={() => void tautkan()}>{p.keluargaTautkan}</Tombol></div>
            </Kolom>
          )}
        </>
      )}
    </Panel>
  );
}
