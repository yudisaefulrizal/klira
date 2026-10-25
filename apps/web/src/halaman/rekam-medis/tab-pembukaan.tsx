import { useCallback, useEffect, useState } from 'react';
import { REKAM_MEDIS, STATUS_PERBAIKAN } from '@klira/shared';
import type { HalamanPembukaanDto, PembukaanDto } from '@klira/shared';
import { daftarPembukaan } from '../../api-klien/dokumen-rm';
import { GalatApi } from '../../api-klien/klien';
import { BilahPenyaring } from '../../komponen/bilah-penyaring';
import { useIzin } from '../../komponen/izin-saja';
import { Paginasi } from '../../komponen/paginasi';
import { Kartu } from '../../komponen/ui/kartu';
import { Lencana } from '../../komponen/ui/lencana';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Pilihan } from '../../komponen/ui/pilihan';
import { Sebaris } from '../../komponen/ui/susunan';
import { BarisTabel, SelTabel, Tabel } from '../../komponen/ui/tabel';
import { Tombol } from '../../komponen/ui/tombol';
import { token } from '../../gaya/token';
import { PermintaanPembukaan } from '../../modal/pelayanan-klinik/permintaan-pembukaan';
import { TinjauPembukaan } from '../../modal/pelayanan-klinik/tinjau-pembukaan';
import { formatWaktu } from '../../util/penyaring-tab';

const P = REKAM_MEDIS.dok.pembukaan;
const UKURAN = 20;
const KOLOM = [{ judul: P.kolom.pasien }, { judul: P.kolom.pemohon }, { judul: P.kolom.dasar }, { judul: P.kolom.cakupan }, { judul: P.kolom.status }, { judul: P.kolom.waktu }, { judul: P.kolom.tindakan, rataKanan: true }];
const OPSI = [{ nilai: '', label: P.semua }, ...(['diajukan', 'disetujui', 'ditolak'] as const).map((s) => ({ nilai: s, label: STATUS_PERBAIKAN.label(s) }))];
type Saringan = { status: '' | 'diajukan' | 'disetujui' | 'ditolak'; halaman: number };
const AWAL: Saringan = { status: 'diajukan', halaman: 1 };

/** Tab Permintaan pembukaan (3.1, 4.4): permintaan pembukaan rekam medis tanpa persetujuan atau atas dasar hukum; ajukan lewat modal, putuskan oleh orang lain. */
export function TabPembukaan() {
  const boleh = useIzin();
  const [terapan, setTerapan] = useState<Saringan>(AWAL);
  const [draf, setDraf] = useState<Saringan>(AWAL);
  const [hasil, setHasil] = useState<HalamanPembukaanDto | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [muat, setMuat] = useState(0);
  const [ajukan, setAjukan] = useState(false);
  const [terpilih, setTerpilih] = useState<PembukaanDto | null>(null);

  const selesai = useCallback(() => {
    setAjukan(false);
    setTerpilih(null);
    setMuat((n) => n + 1);
  }, []);

  useEffect(() => {
    let batal = false;
    daftarPembukaan({ status: terapan.status || undefined, halaman: terapan.halaman, ukuran: UKURAN })
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
        <BilahPenyaring labelTerapkan={REKAM_MEDIS.berkas.terapkan} labelAturUlang={REKAM_MEDIS.berkas.aturUlang} onTerapkan={() => setTerapan({ ...draf, halaman: 1 })} onAturUlang={() => { setDraf(AWAL); setTerapan(AWAL); }}>
          <Pilihan id="pembukaan-status" label={P.filter} opsi={OPSI} value={draf.status} onChange={(e) => setDraf({ ...draf, status: e.target.value as Saringan['status'] })} />
          {hasil && <span style={{ color: token.warna.teksRedup }}>{P.menunggu(hasil.menunggu)}</span>}
          {boleh('rekam-medis', 'input') && <Tombol type="button" onClick={() => setAjukan(true)}>{P.ajukan}</Tombol>}
        </BilahPenyaring>
        {galat && <Peringatan style={{ margin: `0 ${token.jarak.md} ${token.jarak.md}` }}>{galat}</Peringatan>}
        <Tabel kolom={KOLOM} label={REKAM_MEDIS.dok.tab.pembukaan}>
          {hasil?.data.map((q) => (
            <BarisTabel key={q.id}>
              <SelTabel><div style={{ fontWeight: token.huruf.berat.tebal }}>{q.pasien_nama}</div><div style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{q.pasien_nomor_rm}</div></SelTabel>
              <SelTabel>{q.pemohon_nama}{q.pemohon_instansi ? ` · ${q.pemohon_instansi}` : ''}</SelTabel>
              <SelTabel>{P.dasar[q.dasar]}{q.alasan_hukum ? ` · ${P.alasan[q.alasan_hukum]}` : ''}</SelTabel>
              <SelTabel>{q.cakupan}</SelTabel>
              <SelTabel><Lencana warna={STATUS_PERBAIKAN.warna(q.status)}>{STATUS_PERBAIKAN.label(q.status)}</Lencana></SelTabel>
              <SelTabel>{formatWaktu(q.dibuat_pada)}</SelTabel>
              <SelTabel style={{ textAlign: 'right' }}><Sebaris sebaris jarak="sm" bungkus sebaran="akhir"><Tombol type="button" varian="teks" onClick={() => setTerpilih(q)}>{P.tinjau}</Tombol></Sebaris></SelTabel>
            </BarisTabel>
          ))}
        </Tabel>
        {hasil && hasil.data.length === 0 && <div style={{ padding: token.jarak.md, color: token.warna.teksRedup }}>{P.kosong}</div>}
        {hasil && <Paginasi halaman={terapan.halaman} total={hasil.total} ukuran={hasil.ukuran} onPindah={(h) => setTerapan({ ...terapan, halaman: h })} />}
      </Kartu>
      {ajukan && <PermintaanPembukaan onTutup={() => setAjukan(false)} onSelesai={selesai} />}
      {terpilih && <TinjauPembukaan permintaan={terpilih} bolehPutuskan={boleh('rekam-medis', 'perbaikan')} onTutup={() => setTerpilih(null)} onSelesai={selesai} />}
    </>
  );
}
