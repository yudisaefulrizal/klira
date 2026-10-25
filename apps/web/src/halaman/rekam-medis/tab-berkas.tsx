import { useCallback, useEffect, useState } from 'react';
import { REKAM_MEDIS, STATUS_KODE } from '@klira/shared';
import type { BerkasBarisDto, HalamanBerkasDto } from '@klira/shared';
import { GalatApi } from '../../api-klien/klien';
import { daftarBerkas } from '../../api-klien/rekam-medis';
import { BilahPenyaring } from '../../komponen/bilah-penyaring';
import { useIzin } from '../../komponen/izin-saja';
import { Paginasi } from '../../komponen/paginasi';
import { Isian } from '../../komponen/ui/isian';
import { Kartu } from '../../komponen/ui/kartu';
import { Lencana } from '../../komponen/ui/lencana';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Pilihan } from '../../komponen/ui/pilihan';
import { Sebaris } from '../../komponen/ui/susunan';
import { BarisTabel, SelTabel, Tabel } from '../../komponen/ui/tabel';
import { Tombol } from '../../komponen/ui/tombol';
import { token } from '../../gaya/token';
import { PanelRiwayat } from '../../modal/pelayanan-klinik/panel-riwayat';
import { PengkodeanIcd } from '../../modal/pelayanan-klinik/pengkodean-icd';
import { PerbaikiCatatan } from '../../modal/pelayanan-klinik/perbaiki-catatan';
import { formatWaktu } from '../../util/penyaring-tab';

const B = REKAM_MEDIS.berkas;
const UKURAN = 20;
const KOLOM = [{ judul: B.kolom.pasien }, { judul: B.kolom.ditutup }, { judul: B.kolom.diagnosis }, { judul: B.kolom.kode }, { judul: B.kolom.arsip }, { judul: B.kolom.tindakan, rataKanan: true }];
const OPSI_KODE = [{ nilai: '', label: B.semuaKode }, { nilai: 'belum', label: STATUS_KODE.label('belum') }, { nilai: 'sudah', label: STATUS_KODE.label('sudah') }];
type Saringan = { cari: string; kode: '' | 'belum' | 'sudah'; dari: string; sampai: string; halaman: number };
const AWAL: Saringan = { cari: '', kode: '', dari: '', sampai: '', halaman: 1 };
type Modal = { jenis: 'riwayat' | 'perbaiki' | 'kode'; baris: BerkasBarisDto } | null;

/** Tab Berkas pasien (3.1): kunjungan yang sudah ditutup dengan status pengkodean dan arsip; riwayat, perbaikan catatan, dan pengkodean dibuka dari baris. */
export function TabBerkas({ judulDaftar = B.kolom.pasien, kodeAwal = '' as '' | 'belum' | 'sudah' }: { judulDaftar?: string; kodeAwal?: '' | 'belum' | 'sudah' }) {
  const boleh = useIzin();
  const awal: Saringan = { ...AWAL, kode: kodeAwal };
  const [terapan, setTerapan] = useState<Saringan>(awal);
  const [draf, setDraf] = useState<Saringan>(awal);
  const [hasil, setHasil] = useState<HalamanBerkasDto | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [muat, setMuat] = useState(0);
  const [modal, setModal] = useState<Modal>(null);

  const selesai = useCallback(() => {
    setModal(null);
    setMuat((n) => n + 1);
  }, []);

  useEffect(() => {
    let batal = false;
    daftarBerkas({ cari: terapan.cari, kode: terapan.kode || undefined, dari: terapan.dari || undefined, sampai: terapan.sampai || undefined, halaman: terapan.halaman, ukuran: UKURAN })
      .then((h) => {
        if (batal) return;
        setHasil(h);
        setGalat(null);
      })
      .catch((e) => !batal && setGalat(e instanceof GalatApi ? e.message : B.gagalMuat));
    return () => {
      batal = true;
    };
  }, [terapan, muat]);

  const terbalik = !!draf.dari && !!draf.sampai && draf.dari > draf.sampai;

  return (
    <>
      <Kartu style={{ padding: 0, overflow: 'hidden' }}>
        <BilahPenyaring labelTerapkan={B.terapkan} labelAturUlang={B.aturUlang} nonaktif={terbalik} onTerapkan={() => setTerapan({ ...draf, halaman: 1 })} onAturUlang={() => { setDraf(awal); setTerapan(awal); }}>
          <Isian id="berkas-cari" label={B.cari} type="search" value={draf.cari} onChange={(e) => setDraf({ ...draf, cari: e.target.value })} autoComplete="off" />
          <Pilihan id="berkas-kode" label={B.filterKode} opsi={OPSI_KODE} value={draf.kode} onChange={(e) => setDraf({ ...draf, kode: e.target.value as Saringan['kode'] })} />
          <Isian id="berkas-dari" label={B.dari} type="date" value={draf.dari} onChange={(e) => setDraf({ ...draf, dari: e.target.value })} />
          <Isian id="berkas-sampai" label={B.sampai} type="date" value={draf.sampai} onChange={(e) => setDraf({ ...draf, sampai: e.target.value })} galat={terbalik ? 'Tanggal akhir sebelum tanggal awal.' : undefined} />
        </BilahPenyaring>
        {galat && <Peringatan style={{ margin: `0 ${token.jarak.md} ${token.jarak.md}` }}>{galat}</Peringatan>}
        <Tabel kolom={KOLOM} label={judulDaftar}>
          {hasil?.data.map((b) => (
            <BarisTabel key={b.kunjungan_id}>
              <SelTabel><div style={{ fontWeight: token.huruf.berat.tebal }}>{b.pasien_nama}</div><div style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{b.pasien_nomor_rm} · {B.rawat[b.jenis]}</div></SelTabel>
              <SelTabel>{b.waktu_tutup ? formatWaktu(b.waktu_tutup) : '-'}</SelTabel>
              <SelTabel>{b.diagnosis_final ?? b.diagnosis_dokter ?? '-'}</SelTabel>
              <SelTabel><Lencana warna={STATUS_KODE.warna(b.status_kode)}>{STATUS_KODE.label(b.status_kode)}</Lencana>{b.perbaikan_menunggu > 0 && <> <Lencana warna="kuning">{B.perbaikanMenunggu(b.perbaikan_menunggu)}</Lencana></>}</SelTabel>
              <SelTabel>{b.diarsipkan_pada && b.retensi_sampai ? B.diarsipkan(b.retensi_sampai) : B.belumArsip}</SelTabel>
              <SelTabel style={{ textAlign: 'right' }}>
                <Sebaris sebaris jarak="sm" bungkus sebaran="akhir">
                  <Tombol type="button" varian="teks" onClick={() => setModal({ jenis: 'riwayat', baris: b })}>{B.riwayat}</Tombol>
                  {boleh('klinis', 'perbaikan') && <Tombol type="button" varian="teks" onClick={() => setModal({ jenis: 'perbaiki', baris: b })}>{B.perbaiki}</Tombol>}
                  {boleh('rekam-medis', 'input') && <Tombol type="button" varian="teks" onClick={() => setModal({ jenis: 'kode', baris: b })}>{B.kodekan}</Tombol>}
                </Sebaris>
              </SelTabel>
            </BarisTabel>
          ))}
        </Tabel>
        {hasil && hasil.data.length === 0 && <div style={{ padding: token.jarak.md, color: token.warna.teksRedup }}>{B.kosong}</div>}
        {hasil && <Paginasi halaman={terapan.halaman} total={hasil.total} ukuran={hasil.ukuran} onPindah={(h) => setTerapan({ ...terapan, halaman: h })} />}
      </Kartu>
      <p style={{ margin: 0, color: token.warna.teksRedup }}>{B.catatan}</p>
      {modal?.jenis === 'riwayat' && <PanelRiwayat pasienId={modal.baris.pasien_id} nama={modal.baris.pasien_nama} onTutup={() => setModal(null)} />}
      {modal?.jenis === 'perbaiki' && <PerbaikiCatatan kunjunganId={modal.baris.kunjungan_id} pasien={{ id: modal.baris.pasien_id, nama: modal.baris.pasien_nama, nomor_rm: modal.baris.pasien_nomor_rm }} onTutup={() => setModal(null)} onSelesai={selesai} />}
      {modal?.jenis === 'kode' && <PengkodeanIcd kunjunganId={modal.baris.kunjungan_id} onTutup={() => setModal(null)} onSelesai={selesai} />}
    </>
  );
}
