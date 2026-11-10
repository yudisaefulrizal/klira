import { useEffect, useRef, useState } from 'react';
import { KEAMANAN, STATUS_BACKUP, formatUkuranByte } from '@klira/shared';
import type { Halaman, RiwayatBackupDto } from '@klira/shared';
import { GalatApi } from '../../api-klien/klien';
import { alamatUnduhBackup, daftarRiwayatBackup, resetSistem, unggahBackup } from '../../api-klien/keamanan';
import { Konfirmasi } from '../../komponen/konfirmasi/konfirmasi';
import { HanyaDenganIzin } from '../../komponen/izin-saja';
import { Paginasi } from '../../komponen/paginasi';
import { Isian } from '../../komponen/ui/isian';
import { Kartu } from '../../komponen/ui/kartu';
import { Lencana } from '../../komponen/ui/lencana';
import { Peringatan } from '../../komponen/ui/peringatan';
import { BarisTabel, SelTabel, Tabel } from '../../komponen/ui/tabel';
import { Tombol } from '../../komponen/ui/tombol';
import { token } from '../../gaya/token';
import { formatWaktu } from '../../util/penyaring-tab';
import { Kolom, Sebaris } from '../../komponen/ui/susunan';

const UKURAN = 10;
const KOLOM = [
  { judul: KEAMANAN.backupKolom.waktu }, { judul: KEAMANAN.backupKolom.status }, { judul: KEAMANAN.backupKolom.ukuran }, { judul: KEAMANAN.backupKolom.lokasi },
];

/** Tab Backup: unduh, unggah (pulihkan), dan reset sistem; riwayat backup hanya baca. */
export function TabBackup() {
  const [backup, setBackup] = useState<Halaman<RiwayatBackupDto> | null>(null);
  const [halaman, setHalaman] = useState(1);
  const [galatBackup, setGalatBackup] = useState<string | null>(null);
  const [berkasPulih, setBerkasPulih] = useState<File | null>(null);
  const [tanyaReset, setTanyaReset] = useState(false);
  const [ketikReset, setKetikReset] = useState('');
  const [sistemMemproses, setSistemMemproses] = useState(false);
  const [galatSistem, setGalatSistem] = useState<string | null>(null);
  const inputBerkas = useRef<HTMLInputElement>(null);

  /** Setelah data diganti, sesi lama tidak berlaku: muat ulang ke halaman masuk. */
  async function jalankanSistem(f: () => Promise<unknown>, gagal: string) {
    setSistemMemproses(true);
    setGalatSistem(null);
    try {
      await f();
      window.location.assign('/');
    } catch (e) {
      setGalatSistem(e instanceof GalatApi ? e.message : gagal);
      setSistemMemproses(false);
      setBerkasPulih(null);
      setTanyaReset(false);
      setKetikReset('');
    }
  }

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


  return (
    <Kolom tag="section" jarak="md" id="panel-backup" role="tabpanel" aria-labelledby="tab-backup">
      <HanyaDenganIzin fitur="akses" aksi="perbaikan">
        <Kartu susun="md">
          <div style={{ fontSize: token.huruf.ukuran.besar, fontWeight: token.huruf.berat.tebal }}>{KEAMANAN.sistemJudul}</div>
          <span style={{ color: token.warna.teksRedup }}>{KEAMANAN.sistemPetunjuk}</span>
          {galatSistem && <Peringatan>{galatSistem}</Peringatan>}
          {sistemMemproses && <Peringatan nada="biru">{KEAMANAN.memproses}</Peringatan>}
          <Sebaris jarak="sm" bungkus>
            <a href={alamatUnduhBackup} download style={{ textDecoration: 'none' }}>
              <Tombol type="button" varian="sekunder" disabled={sistemMemproses} tabIndex={-1}>{KEAMANAN.unduh}</Tombol>
            </a>
            <Tombol type="button" varian="sekunder" disabled={sistemMemproses} onClick={() => inputBerkas.current?.click()}>{KEAMANAN.unggah}</Tombol>
            <Tombol type="button" disabled={sistemMemproses} onClick={() => setTanyaReset(true)}>{KEAMANAN.reset}</Tombol>
            <input
              ref={inputBerkas} type="file" accept=".sql" hidden
              onChange={(e) => {
                setBerkasPulih(e.target.files?.[0] ?? null);
                e.target.value = '';
              }}
            />
          </Sebaris>
        </Kartu>
        {berkasPulih && (
          <Konfirmasi
            judul={KEAMANAN.pulihJudul} pesan={KEAMANAN.pulihPesan(berkasPulih.name)} labelYa={KEAMANAN.pulihYa}
            memproses={sistemMemproses} onTidak={() => setBerkasPulih(null)}
            onYa={() => void jalankanSistem(() => unggahBackup(berkasPulih), KEAMANAN.pulihGagal)}
          />
        )}
        {tanyaReset && (
          <Konfirmasi
            judul={KEAMANAN.resetJudul}
            pesan={
              <Kolom jarak="sm">
                <span>{KEAMANAN.resetPesan}</span>
                <Isian id="ketik-reset" label="RESET" value={ketikReset} onChange={(e) => setKetikReset(e.target.value)} />
              </Kolom>
            }
            labelYa={KEAMANAN.resetYa} memproses={sistemMemproses || ketikReset !== 'RESET'}
            onTidak={() => { setTanyaReset(false); setKetikReset(''); }}
            onYa={() => void jalankanSistem(resetSistem, KEAMANAN.resetGagal)}
          />
        )}
      </HanyaDenganIzin>
      <Kartu style={{ padding: 0, overflow: 'hidden' }}>
        <Kolom jarak="xs" padding="md">
          <div style={{ fontSize: token.huruf.ukuran.besar, fontWeight: token.huruf.berat.tebal }}>{KEAMANAN.backupJudul}</div>
          <span style={{ color: token.warna.teksRedup }}>{KEAMANAN.backupPetunjuk}</span>
        </Kolom>
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
    </Kolom>
  );
}
