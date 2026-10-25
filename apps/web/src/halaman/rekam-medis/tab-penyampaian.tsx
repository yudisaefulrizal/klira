import { useCallback, useEffect, useState } from 'react';
import { REKAM_MEDIS } from '@klira/shared';
import type { HalamanPenyampaianDto } from '@klira/shared';
import { daftarPenyampaian } from '../../api-klien/dokumen-rm';
import { GalatApi } from '../../api-klien/klien';
import { BilahPenyaring } from '../../komponen/bilah-penyaring';
import { useIzin } from '../../komponen/izin-saja';
import { Paginasi } from '../../komponen/paginasi';
import { Isian } from '../../komponen/ui/isian';
import { Kartu } from '../../komponen/ui/kartu';
import { Peringatan } from '../../komponen/ui/peringatan';
import { BarisTabel, SelTabel, Tabel } from '../../komponen/ui/tabel';
import { Tombol } from '../../komponen/ui/tombol';
import { token } from '../../gaya/token';
import { PenyampaianRm } from '../../modal/pelayanan-klinik/penyampaian-rm';
import { formatWaktu } from '../../util/penyaring-tab';

const P = REKAM_MEDIS.dok.penyampaian;
const UKURAN = 20;
const KOLOM = [{ judul: P.kolom.pasien }, { judul: P.kolom.penerima }, { judul: P.kolom.bentuk }, { judul: P.kolom.bukti }, { judul: P.kolom.petugas }, { judul: P.kolom.waktu }];

/** Tab Penyampaian (3.1, 4.4): riwayat penyampaian rekam medis kepada pasien, wali, keluarga, atau pihak lain; dicatat lewat modal. */
export function TabPenyampaian() {
  const boleh = useIzin();
  const [terapan, setTerapan] = useState({ cari: '', halaman: 1 });
  const [cari, setCari] = useState('');
  const [hasil, setHasil] = useState<HalamanPenyampaianDto | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [muat, setMuat] = useState(0);
  const [catat, setCatat] = useState(false);

  const selesai = useCallback(() => {
    setCatat(false);
    setMuat((n) => n + 1);
  }, []);

  useEffect(() => {
    let batal = false;
    daftarPenyampaian({ cari: terapan.cari, halaman: terapan.halaman, ukuran: UKURAN })
      .then((h) => {
        if (batal) return;
        setHasil(h);
        setGalat(null);
      })
      .catch((e) => !batal && setGalat(e instanceof GalatApi ? e.message : REKAM_MEDIS.dok.gagalMuat));
    return () => {
      batal = true;
    };
  }, [terapan, muat]);

  return (
    <>
      <Kartu style={{ padding: 0, overflow: 'hidden' }}>
        <BilahPenyaring labelTerapkan={P.terapkan} labelAturUlang={P.aturUlang} onTerapkan={() => setTerapan({ cari, halaman: 1 })} onAturUlang={() => { setCari(''); setTerapan({ cari: '', halaman: 1 }); }}>
          <Isian id="penyampaian-cari" label={P.cari} type="search" value={cari} onChange={(e) => setCari(e.target.value)} autoComplete="off" />
          {boleh('rekam-medis', 'input') && <Tombol type="button" onClick={() => setCatat(true)}>{P.catat}</Tombol>}
        </BilahPenyaring>
        {galat && <Peringatan style={{ margin: `0 ${token.jarak.md} ${token.jarak.md}` }}>{galat}</Peringatan>}
        <Tabel kolom={KOLOM} label={REKAM_MEDIS.dok.tab.penyampaian}>
          {hasil?.data.map((p) => (
            <BarisTabel key={p.id}>
              <SelTabel><div style={{ fontWeight: token.huruf.berat.tebal }}>{p.pasien_nama}</div><div style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{p.pasien_nomor_rm}</div></SelTabel>
              <SelTabel>{p.penerima_nama} ({P.hubunganLabel[p.hubungan]})</SelTabel>
              <SelTabel>{P.bentukLabel[p.bentuk]}</SelTabel>
              <SelTabel>{p.bukti_persetujuan ?? '-'}</SelTabel>
              <SelTabel>{p.petugas_nama ?? '-'}</SelTabel>
              <SelTabel>{formatWaktu(p.waktu)}</SelTabel>
            </BarisTabel>
          ))}
        </Tabel>
        {hasil && hasil.data.length === 0 && <div style={{ padding: token.jarak.md, color: token.warna.teksRedup }}>{P.kosong}</div>}
        {hasil && <Paginasi halaman={terapan.halaman} total={hasil.total} ukuran={hasil.ukuran} onPindah={(h) => setTerapan({ ...terapan, halaman: h })} />}
      </Kartu>
      {catat && <PenyampaianRm onTutup={() => setCatat(false)} onSelesai={selesai} />}
    </>
  );
}
