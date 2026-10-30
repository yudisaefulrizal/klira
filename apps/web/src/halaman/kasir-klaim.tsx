import { TautanKelolaMaster } from '../komponen/tautan-kelola-master';
import { useCallback, useEffect, useState } from 'react';
import { KASIR, METODE_BAYAR } from '@klira/shared';
import type { RekapHarianDto, ShiftDto } from '@klira/shared';
import { GalatApi } from '../api-klien/klien';
import { rekapHarian, shiftSaya } from '../api-klien/kasir';
import { HanyaDenganIzin } from '../komponen/izin-saja';
import { Isian } from '../komponen/ui/isian';
import { Kartu } from '../komponen/ui/kartu';
import { Peringatan } from '../komponen/ui/peringatan';
import { Kisi, Kolom, Sebaris, Tumbuh } from '../komponen/ui/susunan';
import { Tab } from '../komponen/ui/tab';
import { BarisTabel, SelTabel, Tabel } from '../komponen/ui/tabel';
import { Tombol } from '../komponen/ui/tombol';
import { token } from '../gaya/token';
import { TabKlaim } from './kasir-klaim/tab-klaim';
import { ShiftKasir } from '../modal/pelayanan-klinik/shift-kasir';
import { rupiah } from '../modal/pelayanan-klinik/keadaan-order-lab';
import { bacaTabTerakhir, pilihTab, simpanTabTerakhir } from '../util/ingatan-tab';
import { usePengguna } from '../util/konteks-pengguna';
import { useNavigasi } from '../util/navigasi';
import { formatWaktu } from '../util/penyaring-tab';
import { tabKasirKlaimDiizinkan } from '../util/tab-kasir-klaim';
import type { IdTabKasirKlaim } from '../util/tab-kasir-klaim';

const HALAMAN = 'kasir-klaim';
const simpanan = () => (typeof sessionStorage === 'undefined' ? null : sessionStorage);
const hariIni = () => new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10);
const KOLOM_SHIFT = [{ judul: 'Kasir' }, { judul: 'Dibuka' }, { judul: 'Ditutup' }, { judul: KASIR.shift.kasAwal }, { judul: KASIR.shift.tunai }, { judul: KASIR.shift.seharusnya }, { judul: KASIR.shift.selisih }];

function TabShift() {
  const S = KASIR.shift;
  const [terbuka, setTerbuka] = useState<ShiftDto | null | undefined>(undefined);
  const [tanggal, setTanggal] = useState(hariIni);
  const [rekap, setRekap] = useState<RekapHarianDto | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [modal, setModal] = useState(false);
  const [muat, setMuat] = useState(0);

  const selesai = useCallback(() => {
    setModal(false);
    setMuat((n) => n + 1);
  }, []);

  useEffect(() => {
    let batal = false;
    Promise.all([shiftSaya(), rekapHarian(tanggal)])
      .then(([s, r]) => {
        if (batal) return;
        setTerbuka(s.terbuka);
        setRekap(r);
        setGalat(null);
      })
      .catch((e) => !batal && setGalat(e instanceof GalatApi ? e.message : KASIR.rekap.gagalMuat));
    return () => {
      batal = true;
    };
  }, [tanggal, muat]);

  return (
    <>
      {galat && <Peringatan>{galat}</Peringatan>}
      <Kartu>
        <Sebaris jarak="md" bungkus>
          <Tumbuh>
            <strong style={{ fontSize: token.huruf.ukuran.besar }}>{S.judul}</strong>
            <div style={{ color: token.warna.teksRedup }}>
              {terbuka === undefined ? KASIR.memuat : terbuka ? `${S.dibuka(formatWaktu(terbuka.buka))} · ${S.kasAwal} ${rupiah(terbuka.kas_awal)} · ${S.seharusnya} ${rupiah(terbuka.kas_seharusnya)}` : S.tidakAda}
            </div>
          </Tumbuh>
          <HanyaDenganIzin fitur="kasir" aksi="input">
            {terbuka !== undefined && <Tombol type="button" onClick={() => setModal(true)}>{terbuka ? S.tutup : S.buka}</Tombol>}
          </HanyaDenganIzin>
        </Sebaris>
      </Kartu>
      <Sebaris jarak="md" bungkus sejajar="akhir">
        <h2 style={{ margin: 0, fontSize: token.huruf.ukuran.besar, flexGrow: 1 }}>{KASIR.rekap.judul}</h2>
        <Isian id="rekap-tanggal" label={KASIR.rekap.tanggal} type="date" value={tanggal} onChange={(e) => e.target.value && setTanggal(e.target.value)} />
      </Sebaris>
      {rekap && (
        <>
          <Kisi kolom={`repeat(4, minmax(0, 1fr))`}>
            {([['total', KASIR.rekap.total, rupiah(rekap.total)], ['tunai', METODE_BAYAR.label('tunai'), rupiah(rekap.per_metode.tunai)], ['transfer', METODE_BAYAR.label('transfer'), rupiah(rekap.per_metode.transfer)], ['qris', METODE_BAYAR.label('qris'), rupiah(rekap.per_metode.qris)]] as const).map(([k, label, nilai]) => (
              <Kartu key={k}>
                <Kolom jarak="xs">
                  <span style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{label}</span>
                  <strong style={{ fontSize: token.huruf.ukuran.besar }}>{nilai}</strong>
                  {k === 'total' && <span style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{KASIR.rekap.jumlah}: {rekap.jumlah_pembayaran}</span>}
                </Kolom>
              </Kartu>
            ))}
          </Kisi>
          <Kartu style={{ padding: 0, overflow: 'hidden' }}>
            <Tabel kolom={KOLOM_SHIFT} label={S.riwayat}>
              {rekap.shift.map((s) => (
                <BarisTabel key={s.id}>
                  <SelTabel>{s.kasir_nama ?? '-'}</SelTabel>
                  <SelTabel>{formatWaktu(s.buka)}</SelTabel>
                  <SelTabel>{s.tutup ? formatWaktu(s.tutup) : '-'}</SelTabel>
                  <SelTabel>{rupiah(s.kas_awal)}</SelTabel>
                  <SelTabel>{rupiah(s.tunai)}</SelTabel>
                  <SelTabel>{rupiah(s.kas_seharusnya)}</SelTabel>
                  <SelTabel>{s.selisih === null ? '-' : `${s.selisih > 0 ? '+' : ''}${s.selisih}${s.alasan_selisih ? ` (${s.alasan_selisih})` : ''}`}</SelTabel>
                </BarisTabel>
              ))}
            </Tabel>
            {rekap.shift.length === 0 && <div style={{ padding: token.jarak.md, color: token.warna.teksRedup }}>{S.kosongRiwayat}</div>}
          </Kartu>
        </>
      )}
      <p style={{ margin: 0, color: token.warna.teksRedup }}>{KASIR.rekap.catatan}</p>
      {modal && terbuka !== undefined && <ShiftKasir shift={terbuka} onTutup={() => setModal(false)} onSelesai={selesai} />}
    </>
  );
}

/** Halaman Kasir dan klaim (3.1): tab Shift dan rekap harian (kasir) dan Klaim JKN/BPJS (petugas klaim), menurut izin. Pembayaran dan tutup kunjungan dibuka dari Daftar pasien; penyerahan obat dikelola farmasi. */
export function HalamanKasirKlaim() {
  const { pengguna } = usePengguna();
  const { search, ganti } = useNavigasi();
  const tabBoleh = pengguna ? tabKasirKlaimDiizinkan(pengguna) : [];
  const ids = tabBoleh.map((t) => t.id);
  const dariAlamat = new URLSearchParams(search).get('tab');
  const aktif: IdTabKasirKlaim | undefined = ids.length ? pilihTab(ids, dariAlamat, bacaTabTerakhir(HALAMAN, ids, simpanan())) : undefined;

  useEffect(() => {
    if (!aktif) return;
    simpanTabTerakhir(HALAMAN, aktif, simpanan());
    if (dariAlamat !== aktif) ganti(`/${HALAMAN}?tab=${aktif}`);
  }, [aktif, dariAlamat, ganti]);

  return (
    <>
      <Sebaris tag="header" jarak="md" bungkus>
        <h1 style={{ margin: 0, fontSize: token.huruf.ukuran.halaman, fontWeight: token.huruf.berat.tebal, flexGrow: 1 }}>{KASIR.judul}</h1>
        <TautanKelolaMaster kelompok="tarif" />
        {aktif && <Tab daftar={tabBoleh} aktif={aktif} label={KASIR.tabLabel} onPilih={(id) => ganti(`/${HALAMAN}?tab=${id}`)} />}
      </Sebaris>
      {aktif === 'shift' && <TabShift />}
      {aktif === 'klaim' && <TabKlaim />}
    </>
  );
}
