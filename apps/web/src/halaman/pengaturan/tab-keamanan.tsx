import { useCallback, useEffect, useState } from 'react';
import { KEAMANAN, STATUS_BACKUP, formatUkuranByte } from '@klira/shared';
import type { Halaman, RiwayatBackupDto } from '@klira/shared';
import { GalatApi } from '../../api-klien/klien';
import { ambilPengaturanKeamanan, daftarRiwayatBackup, simpanPengaturanKeamanan } from '../../api-klien/keamanan';
import { HanyaDenganIzin, useIzin } from '../../komponen/izin-saja';
import { Paginasi } from '../../komponen/paginasi';
import { Isian } from '../../komponen/ui/isian';
import { Kartu } from '../../komponen/ui/kartu';
import { Lencana } from '../../komponen/ui/lencana';
import { Peringatan } from '../../komponen/ui/peringatan';
import { BarisTabel, SelTabel, Tabel } from '../../komponen/ui/tabel';
import { Tombol } from '../../komponen/ui/tombol';
import { token } from '../../gaya/token';
import { formatWaktu } from '../../util/penyaring-tab';
import { BATAS_FORM, formDariPengaturan, bentukKeamanan, galatKeamanan, keamananBerubah } from './keadaan-keamanan';
import type { FormKeamanan } from './keadaan-keamanan';

const UKURAN = 10;
const KOLOM = [
  { judul: KEAMANAN.backupKolom.waktu }, { judul: KEAMANAN.backupKolom.status }, { judul: KEAMANAN.backupKolom.ukuran }, { judul: KEAMANAN.backupKolom.lokasi },
];

/** Tab Keamanan (3.1, 3.3, 4.9): kebijakan akses diisi langsung di halaman (bukan modal), riwayat backup hanya baca. */
export function TabKeamanan() {
  const boleh = useIzin();
  const bolehUbah = boleh('akses', 'perbaikan');
  const [awal, setAwal] = useState<FormKeamanan | null>(null);
  const [form, setForm] = useState<FormKeamanan | null>(null);
  const [bawaan, setBawaan] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [memproses, setMemproses] = useState(false);
  const [dicoba, setDicoba] = useState(false);
  const [backup, setBackup] = useState<Halaman<RiwayatBackupDto> | null>(null);
  const [halaman, setHalaman] = useState(1);
  const [galatBackup, setGalatBackup] = useState<string | null>(null);

  const terapkanDto = useCallback((p: Parameters<typeof formDariPengaturan>[0] & { bawaan: boolean }) => {
    const f = formDariPengaturan(p);
    setAwal(f);
    setForm(f);
    setBawaan(p.bawaan);
  }, []);

  useEffect(() => {
    let batal = false;
    ambilPengaturanKeamanan()
      .then((p) => !batal && terapkanDto(p))
      .catch((e) => !batal && setGalat(e instanceof GalatApi ? e.message : KEAMANAN.gagalMuat));
    return () => {
      batal = true;
    };
  }, [terapkanDto]);

  useEffect(() => {
    let batal = false;
    daftarRiwayatBackup(halaman, UKURAN)
      .then((h) => {
        if (batal) return;
        setBackup(h);
        setGalatBackup(null);
      })
      .catch((e) => !batal && setGalatBackup(e instanceof GalatApi ? e.message : KEAMANAN.backupGagalMuat));
    return () => {
      batal = true;
    };
  }, [halaman]);

  const galatBidang = form ? galatKeamanan(form) : {};
  const berubah = !!awal && !!form && keamananBerubah(awal, form);
  const tampil = (k: keyof FormKeamanan) => (dicoba ? galatBidang[k] : undefined);

  async function simpan() {
    setDicoba(true);
    if (!form || Object.keys(galatBidang).length) return;
    setMemproses(true);
    setGalat(null);
    setInfo(null);
    try {
      terapkanDto(await simpanPengaturanKeamanan(bentukKeamanan(form)));
      setDicoba(false);
      setInfo(KEAMANAN.tersimpan);
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : KEAMANAN.gagalSimpan);
    } finally {
      setMemproses(false);
    }
  }

  const ubah = (k: keyof FormKeamanan, nilai: string) => form && setForm({ ...form, [k]: nilai });
  const bidang = (k: keyof FormKeamanan, label: string, batas: { min: number; maks: number }, petunjuk: string) =>
    form && (
      <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: token.jarak.xs }}>
        <Isian
          id={`keamanan-${k}`} label={label} type="number" inputMode="numeric" min={batas.min} max={batas.maks} step={1}
          value={form[k]} readOnly={!bolehUbah} onChange={(e) => ubah(k, e.target.value)} galat={tampil(k)}
          style={{ maxWidth: token.ukuran.kolomFilter }}
        />
        <span style={{ fontSize: token.huruf.ukuran.kecil, color: token.warna.teksRedup }}>{petunjuk}</span>
      </div>
    );

  return (
    <section id="panel-keamanan" role="tabpanel" aria-labelledby="tab-keamanan" style={{ display: 'flex', flexDirection: 'column', gap: token.jarak.md }}>
      <Kartu style={{ display: 'flex', flexDirection: 'column', gap: token.jarak.md }}>
        <div style={{ fontSize: token.huruf.ukuran.besar, fontWeight: token.huruf.berat.tebal }}>{KEAMANAN.kebijakanJudul}</div>
        <span style={{ color: token.warna.teksRedup }}>{KEAMANAN.kebijakanPetunjuk}</span>
        {bawaan && <Peringatan nada="biru">{KEAMANAN.bawaan}</Peringatan>}
        {galat && <Peringatan>{galat}</Peringatan>}
        {info && <Peringatan nada="biru">{info}</Peringatan>}
        {form && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void simpan();
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: token.jarak.md }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: token.jarak.lg }}>
              {bidang('masa_sesi_jam', KEAMANAN.masaSesi, BATAS_FORM.masaSesiJam, KEAMANAN.petunjukMasaSesi(BATAS_FORM.masaSesiJam.min, BATAS_FORM.masaSesiJam.maks))}
              {bidang('batas_percobaan_masuk', KEAMANAN.batasPercobaan, BATAS_FORM.batasPercobaanMasuk, KEAMANAN.petunjukBatas(BATAS_FORM.batasPercobaanMasuk.min, BATAS_FORM.batasPercobaanMasuk.maks))}
              {bidang('panjang_minimum_kata_sandi', KEAMANAN.panjangKataSandi, BATAS_FORM.panjangMinimumKataSandi, KEAMANAN.petunjukPanjang(BATAS_FORM.panjangMinimumKataSandi.min, BATAS_FORM.panjangMinimumKataSandi.maks))}
            </div>
            <HanyaDenganIzin fitur="akses" aksi="perbaikan">
              <div>
                <Tombol type="submit" disabled={memproses || !berubah}>{memproses ? KEAMANAN.menyimpan : KEAMANAN.simpan}</Tombol>
              </div>
            </HanyaDenganIzin>
          </form>
        )}
      </Kartu>
      <Kartu style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: token.jarak.md, display: 'flex', flexDirection: 'column', gap: token.jarak.xs }}>
          <div style={{ fontSize: token.huruf.ukuran.besar, fontWeight: token.huruf.berat.tebal }}>{KEAMANAN.backupJudul}</div>
          <span style={{ color: token.warna.teksRedup }}>{KEAMANAN.backupPetunjuk}</span>
        </div>
        {galatBackup && <Peringatan style={{ margin: `0 ${token.jarak.md} ${token.jarak.md}` }}>{galatBackup}</Peringatan>}
        <Tabel kolom={KOLOM} label={KEAMANAN.backupJudul}>
          {backup?.data.map((b) => (
            <BarisTabel key={b.id}>
              <SelTabel>{formatWaktu(b.waktu)}</SelTabel>
              <SelTabel>
                {b.status in STATUS_BACKUP.peta
                  ? <Lencana warna={STATUS_BACKUP.warna(b.status as keyof typeof STATUS_BACKUP.peta)}>{STATUS_BACKUP.label(b.status as keyof typeof STATUS_BACKUP.peta)}</Lencana>
                  : b.status}
              </SelTabel>
              <SelTabel>{formatUkuranByte(b.ukuran_byte)}</SelTabel>
              <SelTabel style={{ overflowWrap: 'anywhere' }}>{b.lokasi ?? KEAMANAN.tanpaLokasi}</SelTabel>
            </BarisTabel>
          ))}
        </Tabel>
        {backup && backup.data.length === 0 && <div style={{ padding: token.jarak.md, color: token.warna.teksRedup }}>{KEAMANAN.backupKosong}</div>}
        {backup && <Paginasi halaman={halaman} total={backup.total} ukuran={backup.ukuran} onPindah={setHalaman} />}
      </Kartu>
    </section>
  );
}
