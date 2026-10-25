import { useCallback, useEffect, useState } from 'react';
import { REKAM_MEDIS, STATUS_PERBAIKAN } from '@klira/shared';
import type { HalamanPerbaikanDto, PermintaanPerbaikanDto } from '@klira/shared';
import { GalatApi } from '../../api-klien/klien';
import { daftarPerbaikan } from '../../api-klien/rekam-medis';
import { BilahPenyaring } from '../../komponen/bilah-penyaring';
import { useIzin } from '../../komponen/izin-saja';
import { Paginasi } from '../../komponen/paginasi';
import { Kartu } from '../../komponen/ui/kartu';
import { Lencana } from '../../komponen/ui/lencana';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Pilihan } from '../../komponen/ui/pilihan';
import { BarisTabel, SelTabel, Tabel } from '../../komponen/ui/tabel';
import { Tombol } from '../../komponen/ui/tombol';
import { token } from '../../gaya/token';
import { TinjauPerbaikan } from '../../modal/pelayanan-klinik/tinjau-perbaikan';
import { formatWaktu } from '../../util/penyaring-tab';

const T = REKAM_MEDIS.tinjau;
const UKURAN = 20;
const KOLOM = [{ judul: T.kolom.pasien }, { judul: T.kolom.bagian }, { judul: T.kolom.pemohon }, { judul: T.kolom.alasan }, { judul: T.kolom.status }, { judul: T.kolom.waktu }, { judul: T.kolom.tindakan, rataKanan: true }];
const OPSI = [{ nilai: '', label: T.semua }, ...(['diajukan', 'disetujui', 'ditolak'] as const).map((s) => ({ nilai: s, label: STATUS_PERBAIKAN.label(s) }))];
type Saringan = { status: '' | 'diajukan' | 'disetujui' | 'ditolak'; halaman: number };
const AWAL: Saringan = { status: 'diajukan', halaman: 1 };

/** Tab Antrean perbaikan (3.1): permintaan perbaikan yang menunggu persetujuan (bawaan) atau yang sudah diputuskan; tinjau lewat modal. */
export function TabPerbaikan() {
  const boleh = useIzin();
  const [terapan, setTerapan] = useState<Saringan>(AWAL);
  const [draf, setDraf] = useState<Saringan>(AWAL);
  const [hasil, setHasil] = useState<HalamanPerbaikanDto | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [muat, setMuat] = useState(0);
  const [terpilih, setTerpilih] = useState<PermintaanPerbaikanDto | null>(null);

  const selesai = useCallback(() => {
    setTerpilih(null);
    setMuat((n) => n + 1);
  }, []);

  useEffect(() => {
    let batal = false;
    daftarPerbaikan({ status: terapan.status || undefined, halaman: terapan.halaman, ukuran: UKURAN })
      .then((h) => {
        if (batal) return;
        setHasil(h);
        setGalat(null);
      })
      .catch((e) => !batal && setGalat(e instanceof GalatApi ? e.message : T.gagalMuat));
    return () => {
      batal = true;
    };
  }, [terapan, muat]);

  return (
    <>
      <Kartu style={{ padding: 0, overflow: 'hidden' }}>
        <BilahPenyaring labelTerapkan="Terapkan" labelAturUlang="Atur ulang" onTerapkan={() => setTerapan({ ...draf, halaman: 1 })} onAturUlang={() => { setDraf(AWAL); setTerapan(AWAL); }}>
          <Pilihan id="perbaikan-status" label={T.filterStatus} opsi={OPSI} value={draf.status} onChange={(e) => setDraf({ ...draf, status: e.target.value as Saringan['status'] })} />
          {hasil && <span style={{ color: token.warna.teksRedup }}>{T.menunggu(hasil.menunggu)}</span>}
        </BilahPenyaring>
        {galat && <Peringatan style={{ margin: `0 ${token.jarak.md} ${token.jarak.md}` }}>{galat}</Peringatan>}
        <Tabel kolom={KOLOM} label={REKAM_MEDIS.tab.perbaikan}>
          {hasil?.data.map((p) => (
            <BarisTabel key={p.id}>
              <SelTabel><div style={{ fontWeight: token.huruf.berat.tebal }}>{p.pasien_nama}</div><div style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{p.pasien_nomor_rm}</div></SelTabel>
              <SelTabel>{REKAM_MEDIS.perbaikan.bagianLabel[p.bagian]}</SelTabel>
              <SelTabel>{p.pemohon_nama ?? '-'}</SelTabel>
              <SelTabel>{p.alasan}</SelTabel>
              <SelTabel><Lencana warna={STATUS_PERBAIKAN.warna(p.status)}>{STATUS_PERBAIKAN.label(p.status)}</Lencana></SelTabel>
              <SelTabel>{formatWaktu(p.dibuat_pada)}</SelTabel>
              <SelTabel style={{ textAlign: 'right' }}>{(p.status !== 'diajukan' || boleh('rekam-medis', 'perbaikan')) && <Tombol type="button" varian="teks" onClick={() => setTerpilih(p)}>{T.tinjau}</Tombol>}</SelTabel>
            </BarisTabel>
          ))}
        </Tabel>
        {hasil && hasil.data.length === 0 && <div style={{ padding: token.jarak.md, color: token.warna.teksRedup }}>{T.kosong}</div>}
        {hasil && <Paginasi halaman={terapan.halaman} total={hasil.total} ukuran={hasil.ukuran} onPindah={(h) => setTerapan({ ...terapan, halaman: h })} />}
      </Kartu>
      {terpilih && <TinjauPerbaikan permintaan={terpilih} onTutup={() => setTerpilih(null)} onSelesai={selesai} />}
    </>
  );
}
