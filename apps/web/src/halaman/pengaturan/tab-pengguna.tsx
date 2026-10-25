import { useCallback, useEffect, useState } from 'react';
import { GALAT, PENGGUNA, STATUS_AKUN, STATUS_PENGGUNA } from '@klira/shared';
import type { Halaman, PenggunaDaftarDto } from '@klira/shared';
import { daftarPengguna, ubahAktifPengguna } from '../../api-klien/pengguna';
import { GalatApi } from '../../api-klien/klien';
import { HanyaDenganIzin } from '../../komponen/izin-saja';
import { Kartu } from '../../komponen/ui/kartu';
import { Lencana } from '../../komponen/ui/lencana';
import { Peringatan } from '../../komponen/ui/peringatan';
import { BarisTabel, SelTabel, Tabel } from '../../komponen/ui/tabel';
import { Tombol } from '../../komponen/ui/tombol';
import { Isian } from '../../komponen/ui/isian';
import { Pilihan } from '../../komponen/ui/pilihan';
import { token } from '../../gaya/token';
import { AturIzin } from '../../modal/akun-pengaturan/atur-izin';
import { PembuatanAkun } from '../../modal/akun-pengaturan/pembuatan-akun';
import { usePengguna } from '../../util/konteks-pengguna';
import { keadaanDariQuery, queryDariKeadaan, ubahKeadaan } from '../../util/penyaring-daftar';
import type { KeadaanDaftar } from '../../util/penyaring-daftar';
import { Kolom, Sebaris } from '../../komponen/ui/susunan';

const UKURAN = 20;
const KOLOM = [
  { judul: PENGGUNA.kolom.nama }, { judul: PENGGUNA.kolom.jenis }, { judul: PENGGUNA.kolom.izin },
  { judul: PENGGUNA.kolom.peringatan }, { judul: PENGGUNA.kolom.status }, { judul: PENGGUNA.kolom.tindakan, rataKanan: true },
];

/**
 * Tab Pengguna dan akses (3.1). Pencarian, status, dan halaman disimpan di alamat sehingga setelah modal ditutup
 * (butir berikutnya) daftar kembali dengan penyaring yang sama (5.1g).
 */
export function TabPengguna({ search, ubahAlamat }: { search: string; ubahAlamat: (query: string) => void }) {
  const { pengguna: saya } = usePengguna();
  const keadaan = keadaanDariQuery(search);
  const [cari, setCari] = useState(keadaan.cari);
  const [hasil, setHasil] = useState<Halaman<PenggunaDaftarDto> | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [aturUntuk, setAturUntuk] = useState<PenggunaDaftarDto | null>(null);
  const [bukaAkunBaru, setBukaAkunBaru] = useState(false);
  const [muatUlang, setMuatUlang] = useState(0);

  const terapkan = useCallback((perubahan: Partial<KeadaanDaftar>) => ubahAlamat(queryDariKeadaan(ubahKeadaan(keadaanDariQuery(search), perubahan), { tab: 'pengguna' })), [search, ubahAlamat]);

  useEffect(() => setCari(keadaanDariQuery(search).cari), [search]);

  // Tunda pencarian agar tidak memanggil API di tiap ketukan.
  useEffect(() => {
    if (cari.trim() === keadaan.cari) return;
    const t = setTimeout(() => terapkan({ cari: cari.trim() }), 300);
    return () => clearTimeout(t);
  }, [cari, keadaan.cari, terapkan]);

  const { cari: cariAktif, status: statusAktif, halaman: halamanAktif } = keadaan;
  useEffect(() => {
    let batal = false;
    daftarPengguna({ cari: cariAktif, status: statusAktif, halaman: halamanAktif, ukuran: UKURAN })
      .then((h) => {
        if (batal) return;
        setHasil(h);
        setGalat(null);
      })
      .catch((e) => !batal && setGalat(e instanceof GalatApi ? e.message : PENGGUNA.gagalMuat));
    return () => {
      batal = true;
    };
  }, [cariAktif, statusAktif, halamanAktif, muatUlang]);

  async function ubahAktif(p: PenggunaDaftarDto) {
    try {
      await ubahAktifPengguna(p.id, !p.aktif);
      setHasil((h) => h && { ...h, data: h.data.map((x) => (x.id === p.id ? { ...x, aktif: !p.aktif } : x)) });
      setGalat(null);
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : GALAT.umum);
    }
  }

  const totalHalaman = hasil ? Math.max(1, Math.ceil(hasil.total / hasil.ukuran)) : 1;

  return (
    <Kolom tag="section" jarak="md" id="panel-pengguna" role="tabpanel" aria-labelledby="tab-pengguna">
      <Kartu style={{ padding: 0, overflow: 'hidden' }}>
        <Sebaris jarak="md" padding="md" bungkus sejajar="akhir">
          <div style={{ fontSize: token.huruf.ukuran.besar, fontWeight: token.huruf.berat.tebal, flexGrow: 1 }}>{PENGGUNA.judulTab}</div>
          <Isian id="cari-pengguna" label={PENGGUNA.cari} type="search" value={cari} onChange={(e) => setCari(e.target.value)} />
          <Pilihan
            id="status-pengguna"
            label={PENGGUNA.kolom.status}
            value={keadaan.status}
            onChange={(e) => terapkan({ status: e.target.value as KeadaanDaftar['status'] })}
            opsi={STATUS_PENGGUNA.map((st) => ({ nilai: st, label: PENGGUNA.filterStatus[st] }))}
          />
          <HanyaDenganIzin fitur="akses" aksi="input">
            <Tombol onClick={() => setBukaAkunBaru(true)}>{PENGGUNA.tambahAkun}</Tombol>
          </HanyaDenganIzin>
        </Sebaris>
        {galat && <Peringatan style={{ margin: `0 ${token.jarak.md} ${token.jarak.md}` }}>{galat}</Peringatan>}
        <Tabel kolom={KOLOM} label={PENGGUNA.judulTab}>
          {hasil?.data.map((p) => (
            <BarisTabel key={p.id}>
              <SelTabel>
                <div style={{ fontWeight: token.huruf.berat.tebal }}>{p.nama}</div>
                <div style={{ fontSize: token.huruf.ukuran.kecil, color: token.warna.teksRedup }}>{p.username}</div>
              </SelTabel>
              <SelTabel>{p.jenis_akun_aktif.length ? p.jenis_akun_aktif.join(', ') : PENGGUNA.tanpaJenis}</SelTabel>
              <SelTabel>{p.jumlah_izin_tambahan}</SelTabel>
              <SelTabel>
                {p.jumlah_peringatan_terbuka > 0
                  ? <Lencana warna="kuning">{PENGGUNA.peringatanTerbuka(p.jumlah_peringatan_terbuka)}</Lencana>
                  : PENGGUNA.tanpaPeringatan}
              </SelTabel>
              <SelTabel>
                <Lencana warna={STATUS_AKUN.warna(p.aktif ? 'aktif' : 'nonaktif')}>{STATUS_AKUN.label(p.aktif ? 'aktif' : 'nonaktif')}</Lencana>
              </SelTabel>
              <SelTabel style={{ textAlign: 'right' }}>
                <Sebaris sebaris jarak="sm" sejajar="regang">
                  <HanyaDenganIzin fitur="akses" aksi="input">
                    <Tombol varian="teks" onClick={() => setAturUntuk(p)}>{PENGGUNA.aturIzin}</Tombol>
                  </HanyaDenganIzin>
                  {p.id !== saya?.id && (
                    <HanyaDenganIzin fitur="akses" aksi="perbaikan">
                      <Tombol varian="teks" onClick={() => void ubahAktif(p)}>{p.aktif ? PENGGUNA.nonaktifkan : PENGGUNA.aktifkan}</Tombol>
                    </HanyaDenganIzin>
                  )}
                </Sebaris>
              </SelTabel>
            </BarisTabel>
          ))}
        </Tabel>
        {hasil && hasil.data.length === 0 && <div style={{ padding: token.jarak.md, color: token.warna.teksRedup }}>{PENGGUNA.kosong}</div>}
        {hasil && hasil.total > hasil.ukuran && (
          <Sebaris jarak="md" padding="md" sebaran="akhir">
            <Tombol varian="sekunder" disabled={keadaan.halaman <= 1} onClick={() => terapkan({ halaman: keadaan.halaman - 1 })}>{PENGGUNA.sebelumnya}</Tombol>
            <span>{keadaan.halaman} / {totalHalaman}</span>
            <Tombol varian="sekunder" disabled={keadaan.halaman >= totalHalaman} onClick={() => terapkan({ halaman: keadaan.halaman + 1 })}>{PENGGUNA.berikutnya}</Tombol>
          </Sebaris>
        )}
      </Kartu>
      <Peringatan nada="kuning">{PENGGUNA.catatan}</Peringatan>
      {aturUntuk && (
        <AturIzin
          pengguna={aturUntuk}
          onTutup={(berubah) => {
            setAturUntuk(null);
            if (berubah) setMuatUlang((n) => n + 1);
          }}
        />
      )}
      {bukaAkunBaru && (
        <PembuatanAkun
          onTutup={() => setBukaAkunBaru(false)}
          onSelesai={() => {
            setBukaAkunBaru(false);
            setMuatUlang((n) => n + 1);
          }}
        />
      )}
    </Kolom>
  );
}
