import { useCallback, useEffect, useState } from 'react';
import { PDP } from '@klira/shared';
import type { HakDto, HalamanHakDto } from '@klira/shared';
import { daftarHak } from '../../api-klien/pdp';
import { GalatApi } from '../../api-klien/klien';
import { BilahPenyaring } from '../../komponen/bilah-penyaring';
import { useIzin } from '../../komponen/izin-saja';
import { Paginasi } from '../../komponen/paginasi';
import { Isian } from '../../komponen/ui/isian';
import { Kartu } from '../../komponen/ui/kartu';
import { Lencana } from '../../komponen/ui/lencana';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Pilihan } from '../../komponen/ui/pilihan';
import { BarisTabel, SelTabel, Tabel } from '../../komponen/ui/tabel';
import { Tombol } from '../../komponen/ui/tombol';
import { token } from '../../gaya/token';
import { CatatHak } from '../../modal/pelindungan-data/catat-hak';
import { ProsesHak } from '../../modal/pelindungan-data/proses-hak';
import { formatWaktu } from '../../util/penyaring-tab';

const H = PDP.hak;
const KOLOM = [{ judul: H.kolom.pasien }, { judul: H.kolom.hak }, { judul: H.kolom.pemohon }, { judul: H.kolom.batas }, { judul: H.kolom.status }, { judul: H.kolom.tindakan, rataKanan: true }];
const STATUS = { diterima: 'Diterima', disetujui: 'Disetujui', ditolak: 'Ditolak', dilaksanakan: 'Dilaksanakan', selesai: 'Selesai' } as const;
const WARNA = { diterima: 'kuning', disetujui: 'biru', ditolak: 'merah', dilaksanakan: 'ungu', selesai: 'hijau' } as const;
type Saringan = { status: string; cari: string; halaman: number };
const AWAL: Saringan = { status: '', cari: '', halaman: 1 };
const kecil = { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil } as const;

/** Tab Permintaan hak pasien (3.1): daftar dengan batas 3x24 jam, catat permintaan, dan proses bertahap lewat modal. */
export function TabHak() {
  const boleh = useIzin();
  const [terapan, setTerapan] = useState<Saringan>(AWAL);
  const [draf, setDraf] = useState<Saringan>(AWAL);
  const [hasil, setHasil] = useState<HalamanHakDto | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [muat, setMuat] = useState(0);
  const [catat, setCatat] = useState(false);
  const [terpilih, setTerpilih] = useState<HakDto | null>(null);
  const selesai = useCallback(() => {
    setCatat(false);
    setTerpilih(null);
    setMuat((n) => n + 1);
  }, []);

  useEffect(() => {
    let batal = false;
    daftarHak({ status: terapan.status || undefined, cari: terapan.cari, halaman: terapan.halaman })
      .then((h) => {
        if (batal) return;
        setHasil(h);
        setGalat(null);
      })
      .catch((e) => !batal && setGalat(e instanceof GalatApi ? e.message : PDP.gagalMuat));
    return () => {
      batal = true;
    };
  }, [terapan, muat]);

  return (
    <>
      <Kartu style={{ padding: 0, overflow: 'hidden' }}>
        <BilahPenyaring labelTerapkan={PDP.terapkan} labelAturUlang={PDP.aturUlang} onTerapkan={() => setTerapan({ ...draf, halaman: 1 })} onAturUlang={() => { setDraf(AWAL); setTerapan(AWAL); }}>
          <Isian id="hak-cari" label={H.cari} type="search" value={draf.cari} onChange={(e) => setDraf({ ...draf, cari: e.target.value })} autoComplete="off" />
          <Pilihan id="hak-status" label={PDP.filterStatus} opsi={[{ nilai: '', label: PDP.semuaStatus }, ...Object.entries(STATUS).map(([nilai, label]) => ({ nilai, label }))]} value={draf.status} onChange={(e) => setDraf({ ...draf, status: e.target.value })} />
          {hasil && <span style={kecil}>{H.aktif(hasil.aktif)} · {H.terlambat(hasil.terlambat)}</span>}
          {boleh('pdp', 'input') && <Tombol type="button" onClick={() => setCatat(true)}>{H.catat}</Tombol>}
        </BilahPenyaring>
        {galat && <Peringatan style={{ margin: `0 ${token.jarak.md} ${token.jarak.md}` }}>{galat}</Peringatan>}
        <Tabel kolom={KOLOM} label={PDP.tab.hak}>
          {hasil?.data.map((k) => (
            <BarisTabel key={k.id}>
              <SelTabel><div style={{ fontWeight: token.huruf.berat.tebal }}>{k.pasien_nama}</div><div style={kecil}>{k.pasien_nomor_rm}</div></SelTabel>
              <SelTabel>{H.hakLabel[k.jenis]}</SelTabel>
              <SelTabel>{k.pemohon_nama}<div style={kecil}>{H.hubunganLabel[k.pemohon_hubungan]} · {H.saluranLabel[k.saluran]}</div></SelTabel>
              <SelTabel>{formatWaktu(k.batas_waktu)}{k.sisa_jam !== null && <div style={{ ...kecil, color: k.terlambat ? token.warna.status.merah.teks : token.warna.teksRedup }}>{PDP.batas.sisa(k.sisa_jam)}</div>}</SelTabel>
              <SelTabel><Lencana warna={WARNA[k.status]}>{STATUS[k.status]}</Lencana></SelTabel>
              <SelTabel style={{ textAlign: 'right' }}><Tombol type="button" varian="teks" onClick={() => setTerpilih(k)}>{k.tahap_berikut && boleh('pdp', 'perbaikan') ? H.proses : PDP.rincian}</Tombol></SelTabel>
            </BarisTabel>
          ))}
        </Tabel>
        {hasil && hasil.data.length === 0 && <div style={{ padding: token.jarak.md, ...kecil }}>{H.kosong}</div>}
        {hasil && <Paginasi halaman={terapan.halaman} total={hasil.total} ukuran={hasil.ukuran} onPindah={(h) => setTerapan({ ...terapan, halaman: h })} />}
      </Kartu>
      {catat && <CatatHak onTutup={() => setCatat(false)} onSelesai={selesai} />}
      {terpilih && <ProsesHak hak={boleh('pdp', 'perbaikan') ? terpilih : { ...terpilih, tahap_berikut: null }} onTutup={() => setTerpilih(null)} onSelesai={selesai} />}
    </>
  );
}
