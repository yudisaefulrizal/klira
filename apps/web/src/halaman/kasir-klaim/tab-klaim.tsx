import { useCallback, useEffect, useState } from 'react';
import { AMBANG_BATAS_DEKAT_HARI, aksiKlaimTersedia, KLAIM, STATUS_KLAIM } from '@klira/shared';
import type { HalamanKlaimDto, KlaimDto } from '@klira/shared';
import { daftarKlaim } from '../../api-klien/klaim';
import { GalatApi } from '../../api-klien/klien';
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
import { PenyiapanKlaim } from '../../modal/pelayanan-klinik/penyiapan-klaim';
import { UbahStatusKlaim } from '../../modal/pelayanan-klinik/ubah-status-klaim';
import { formatWaktu } from '../../util/penyaring-tab';

const UKURAN = 20;
const KOLOM = [{ judul: KLAIM.kolom.pasien }, { judul: KLAIM.kolom.sep }, { judul: KLAIM.kolom.selesai }, { judul: KLAIM.kolom.batas }, { judul: KLAIM.kolom.status }, { judul: KLAIM.kolom.tindakan, rataKanan: true }];
const OPSI = [{ nilai: '', label: KLAIM.semuaStatus }, ...STATUS_KLAIM.nilai.map((s) => ({ nilai: s, label: STATUS_KLAIM.label(s) }))];
type Saringan = { status: string; cari: string; halaman: number };
const AWAL: Saringan = { status: '', cari: '', halaman: 1 };
type Modal = { jenis: 'siapkan' } | { jenis: 'berkas' | 'status'; klaim: KlaimDto } | null;
const kecil = { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil } as const;

/** Tab Klaim JKN/BPJS (3.1, 4.5): daftar klaim dengan status dan sisa batas waktu; siapkan klaim, ubah SEP dan berkas, serta ubah status dibuka sebagai modal. */
export function TabKlaim() {
  const boleh = useIzin();
  const [terapan, setTerapan] = useState<Saringan>(AWAL);
  const [draf, setDraf] = useState<Saringan>(AWAL);
  const [hasil, setHasil] = useState<HalamanKlaimDto | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [muat, setMuat] = useState(0);
  const [modal, setModal] = useState<Modal>(null);

  const selesai = useCallback(() => {
    setModal(null);
    setMuat((n) => n + 1);
  }, []);

  useEffect(() => {
    let batal = false;
    daftarKlaim({ status: terapan.status || undefined, cari: terapan.cari, halaman: terapan.halaman, ukuran: UKURAN })
      .then((h) => {
        if (batal) return;
        setHasil(h);
        setGalat(null);
      })
      .catch((e) => !batal && setGalat(e instanceof GalatApi ? e.message : KLAIM.gagalMuat));
    return () => {
      batal = true;
    };
  }, [terapan, muat]);

  return (
    <>
      <Kartu style={{ padding: 0, overflow: 'hidden' }}>
        <BilahPenyaring labelTerapkan={KLAIM.terapkan} labelAturUlang={KLAIM.aturUlang} onTerapkan={() => setTerapan({ ...draf, halaman: 1 })} onAturUlang={() => { setDraf(AWAL); setTerapan(AWAL); }}>
          <Isian id="klaim-cari" label={KLAIM.cari} type="search" value={draf.cari} onChange={(e) => setDraf({ ...draf, cari: e.target.value })} autoComplete="off" />
          <Pilihan id="klaim-status" label={KLAIM.filterStatus} opsi={OPSI} value={draf.status} onChange={(e) => setDraf({ ...draf, status: e.target.value })} />
          {boleh('klaim', 'input') && <Tombol type="button" onClick={() => setModal({ jenis: 'siapkan' })}>{KLAIM.siapkan}</Tombol>}
        </BilahPenyaring>
        {hasil && (
          <Sebaris bungkus jarak="sm" style={{ padding: `0 ${token.jarak.md} ${token.jarak.md}` }}>
            {STATUS_KLAIM.nilai.filter((s) => hasil.ringkasan[s] > 0).map((s) => <Lencana key={s} warna={STATUS_KLAIM.warna(s)}>{STATUS_KLAIM.label(s)}: {hasil.ringkasan[s]}</Lencana>)}
          </Sebaris>
        )}
        {galat && <Peringatan style={{ margin: `0 ${token.jarak.md} ${token.jarak.md}` }}>{galat}</Peringatan>}
        <Tabel kolom={KOLOM} label={KLAIM.tab}>
          {hasil?.data.map((k) => (
            <BarisTabel key={k.id}>
              <SelTabel><div style={{ fontWeight: token.huruf.berat.tebal }}>{k.pasien_nama}</div><div style={kecil}>{k.pasien_nomor_rm}{k.jenis === 'IMP' ? ' · rawat inap' : ''}</div></SelTabel>
              <SelTabel>{k.nomor_sep ?? '-'}</SelTabel>
              <SelTabel>{formatWaktu(k.tanggal_selesai)}</SelTabel>
              <SelTabel>
                {k.sisa_hari === null ? '-' : <span style={{ color: k.sisa_hari <= AMBANG_BATAS_DEKAT_HARI ? token.warna.status.merah.teks : undefined }}>{KLAIM.batas.sisa(k.sisa_hari)}</span>}
              </SelTabel>
              <SelTabel>
                <Lencana warna={STATUS_KLAIM.warna(k.status)}>{STATUS_KLAIM.label(k.status)}</Lencana>
                {k.kode_beda && <> <Lencana warna="kuning">Kode beda</Lencana></>}
              </SelTabel>
              <SelTabel style={{ textAlign: 'right' }}>
                <Sebaris sebaris jarak="sm" bungkus sebaran="akhir">
                  {boleh('klaim', 'perbaikan') && (k.status === 'menunggu_sep' || k.status === 'siap_diajukan' || k.status === 'dikembalikan') && <Tombol type="button" varian="teks" onClick={() => setModal({ jenis: 'berkas', klaim: k })}>{KLAIM.berkas}</Tombol>}
                  <Tombol type="button" varian="teks" onClick={() => setModal({ jenis: 'status', klaim: k })}>{boleh('klaim', 'perbaikan') && aksiKlaimTersedia(k.status).length ? KLAIM.ubahStatus : KLAIM.rincian}</Tombol>
                </Sebaris>
              </SelTabel>
            </BarisTabel>
          ))}
        </Tabel>
        {hasil && hasil.data.length === 0 && <div style={{ padding: token.jarak.md, color: token.warna.teksRedup }}>{KLAIM.kosong}</div>}
        {hasil && <Paginasi halaman={terapan.halaman} total={hasil.total} ukuran={hasil.ukuran} onPindah={(h) => setTerapan({ ...terapan, halaman: h })} />}
      </Kartu>
      {modal?.jenis === 'siapkan' && <PenyiapanKlaim onTutup={() => setModal(null)} onSelesai={selesai} />}
      {modal?.jenis === 'berkas' && <PenyiapanKlaim klaim={modal.klaim} onTutup={() => setModal(null)} onSelesai={selesai} />}
      {modal?.jenis === 'status' && <UbahStatusKlaim klaim={modal.klaim} onTutup={() => setModal(null)} onSelesai={selesai} />}
    </>
  );
}
