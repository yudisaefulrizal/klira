import { useCallback, useEffect, useMemo, useState } from 'react';
import { DEFINISI_MASTER, MASTER, STATUS_AKUN, STATUS_FILTER_MASTER, STATUS_OPERASIONAL, teksSelMaster } from '@klira/shared';
import type { BarisMaster, Halaman, JenisMaster, JenisMasterUbah } from '@klira/shared';
import { daftarMaster, ubahAktifMaster } from '../api-klien/master';
import { GalatApi } from '../api-klien/klien';
import { HanyaDenganIzin } from './izin-saja';
import { Konfirmasi } from './konfirmasi/konfirmasi';
import { Paginasi } from './paginasi';
import { Isian } from './ui/isian';
import { Kartu } from './ui/kartu';
import { Lencana } from './ui/lencana';
import { Peringatan } from './ui/peringatan';
import { Pilihan } from './ui/pilihan';
import { Tab } from './ui/tab';
import { BarisTabel, SelTabel, Tabel } from './ui/tabel';
import { Tombol } from './ui/tombol';
import { token } from '../gaya/token';
import { ModalMasterProfil } from '../modal/akun-pengaturan/master-profil';
import { BAWAAN_MASTER, bacaPenyaring, queryPenyaring, saringanMaster, ubahPenyaring } from '../util/penyaring-tab';
import { Kolom, Sebaris } from './ui/susunan';
import { jenisMasterDiHalaman } from '../util/lokasi-master';

const UKURAN = 20;
type Modal = { baris?: BarisMaster } | null;

/**
 * Pengelolaan master bersama; setiap halaman hanya menyediakan jenis data yang terkait. Tiap subbagian punya tabel,
 * pencarian, dan aktif/nonaktif (tanpa hapus permanen). Tambah dan Ubah memakai satu modal generik (MODAL-1).
 */
export function DaftarMaster({ search, ubahAlamat, jenisDaftar }: { search: string; ubahAlamat: (query: string) => void; jenisDaftar: readonly JenisMaster[] }) {
  const bawaan = useMemo(() => ({ ...BAWAAN_MASTER, jenis: jenisDaftar[0] ?? 'poli' }), [jenisDaftar]);
  const keadaan = bacaPenyaring(search, bawaan);
  const jenis = jenisMasterDiHalaman(search, jenisDaftar);
  const subbagian = jenisDaftar.map(j => ({ id: j, label: MASTER.jenis[j] }));
  const def = DEFINISI_MASTER[jenis];
  const ubahBisa = jenis !== 'wilayah';
  const [cari, setCari] = useState(keadaan.nilai.cari);
  const [hasil, setHasil] = useState<Halaman<BarisMaster> | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [status, setStatus] = useState<BarisMaster | null>(null);
  const [memproses, setMemproses] = useState(false);
  const [muatUlang, setMuatUlang] = useState(0);

  const terapkan = useCallback(
    (perubahan: Record<string, string>, ganti = false) => {
      const dibaca = bacaPenyaring(search, bawaan);
      const k = { ...dibaca, nilai: { ...dibaca.nilai, jenis: jenisMasterDiHalaman(search, jenisDaftar) } };
      // Pindah subbagian membersihkan pencarian dan penyaring subbagian sebelumnya.
      const dasar = ganti ? { ...k, nilai: { ...bawaan } } : k;
      ubahAlamat(queryPenyaring('master', ubahPenyaring(dasar, perubahan), bawaan));
    },
    [search, ubahAlamat, bawaan, jenisDaftar],
  );

  useEffect(() => setCari(bacaPenyaring(search, bawaan).nilai.cari), [search, bawaan]);
  useEffect(() => {
    if (cari.trim() === keadaan.nilai.cari) return;
    const t = setTimeout(() => terapkan({ cari: cari.trim() }), 300);
    return () => clearTimeout(t);
  }, [cari, keadaan.nilai.cari, terapkan]);

  const { cari: cariAktif, status: statusAktif, tingkat: tingkatAktif } = keadaan.nilai;
  const { halaman } = keadaan;
  useEffect(() => {
    let batal = false;
    setHasil(null);
    daftarMaster(jenis, saringanMaster({ nilai: { jenis, cari: cariAktif, status: statusAktif, tingkat: tingkatAktif }, halaman }, UKURAN))
      .then((h) => {
        if (batal) return;
        setHasil(h);
        setGalat(null);
      })
      .catch((e) => !batal && setGalat(e instanceof GalatApi ? e.message : MASTER.gagalMuat));
    return () => {
      batal = true;
    };
  }, [jenis, cariAktif, statusAktif, tingkatAktif, halaman, muatUlang]);

  async function ubahStatus(baris: BarisMaster) {
    setMemproses(true);
    try {
      await ubahAktifMaster(jenis as JenisMasterUbah, baris.id, !baris.aktif);
      setStatus(null);
      setMuatUlang((n) => n + 1);
    } catch (e) {
      setStatus(null);
      setGalat(e instanceof GalatApi ? e.message : MASTER.gagalUbahStatus);
    } finally {
      setMemproses(false);
    }
  }

  const kolom = [...def.kolom.map((k) => ({ judul: k.label })), ...(def.punyaStatus ? [{ judul: MASTER.status }, { judul: MASTER.tindakan, rataKanan: true }] : [])];
  const namaBaris = (b: BarisMaster) => String(b.nama ?? b.pengguna_nama ?? b.kode ?? b.id);

  return (
    <Kolom tag="section" jarak="md" aria-label={`Pengelolaan ${MASTER.jenis[jenis].toLowerCase()}`}>
      {subbagian.length > 1 && <Tab daftar={subbagian} aktif={jenis} label={MASTER.pilihJenis} onPilih={(j) => terapkan({ jenis: j }, true)} />}
      <Kartu id={`panel-${jenis}`} role={subbagian.length > 1 ? 'tabpanel' : undefined} aria-labelledby={subbagian.length > 1 ? `tab-${jenis}` : undefined} style={{ padding: 0, overflow: 'hidden' }}>
        <Sebaris jarak="md" padding="md" bungkus sejajar="akhir">
          <div style={{ fontSize: token.huruf.ukuran.besar, fontWeight: token.huruf.berat.tebal, flexGrow: 1 }}>{MASTER.jenis[jenis]}</div>
          <Isian id="cari-master" label={MASTER.cari} type="search" value={cari} onChange={(e) => setCari(e.target.value)} />
          {def.punyaStatus && (
            <Pilihan
              id="status-master" label={MASTER.status} value={keadaan.nilai.status}
              onChange={(e) => terapkan({ status: e.target.value })}
              opsi={STATUS_FILTER_MASTER.map((s) => ({ nilai: s, label: s === 'semua' ? MASTER.semuaStatus : s === 'aktif' ? MASTER.statusAktif : MASTER.statusNonaktif }))}
            />
          )}
          {jenis === 'wilayah' && (
            <Pilihan
              id="tingkat-master" label={MASTER.filterTingkat} value={keadaan.nilai.tingkat}
              onChange={(e) => terapkan({ tingkat: e.target.value })}
              opsi={[{ nilai: '', label: MASTER.semuaTingkat }, ...Object.entries(MASTER.tingkat).map(([nilai, label]) => ({ nilai, label }))]}
            />
          )}
          {ubahBisa && (
            <HanyaDenganIzin fitur="master" aksi="input">
              <Tombol onClick={() => setModal({})}>{MASTER.tambah}</Tombol>
            </HanyaDenganIzin>
          )}
        </Sebaris>
        {galat && <Peringatan style={{ margin: `0 ${token.jarak.md} ${token.jarak.md}` }}>{galat}</Peringatan>}
        <Tabel kolom={kolom} label={MASTER.jenis[jenis]}>
          {hasil?.data.map((b) => (
            <BarisTabel key={b.id}>
              {def.kolom.map((k, i) => (
                <SelTabel key={k.kunci} style={i === 0 ? { fontWeight: token.huruf.berat.tebal } : undefined}>{teksSelMaster(k.kunci, b)}</SelTabel>
              ))}
              {def.punyaStatus && (
                <>
                  <SelTabel>
                    {b.status_operasional !== undefined
                      ? <Lencana warna={STATUS_OPERASIONAL.warna(b.status_operasional as 'O' | 'U')}>{STATUS_OPERASIONAL.label(b.status_operasional as 'O' | 'U')}</Lencana>
                      : <Lencana warna={STATUS_AKUN.warna(b.aktif ? 'aktif' : 'nonaktif')}>{b.aktif ? MASTER.statusAktif : MASTER.statusNonaktif}</Lencana>}
                  </SelTabel>
                  <SelTabel style={{ textAlign: 'right' }}>
                    <Sebaris sebaris jarak="sm" sejajar="regang">
                      <HanyaDenganIzin fitur="master" aksi="perbaikan">
                        <Tombol varian="teks" onClick={() => setModal({ baris: b })}>{MASTER.ubah}</Tombol>
                        <Tombol varian="teks" onClick={() => setStatus(b)}>{b.aktif ? MASTER.nonaktifkan : MASTER.aktifkan}</Tombol>
                      </HanyaDenganIzin>
                    </Sebaris>
                  </SelTabel>
                </>
              )}
            </BarisTabel>
          ))}
        </Tabel>
        {hasil && hasil.data.length === 0 && <div style={{ padding: token.jarak.md, color: token.warna.teksRedup }}>{MASTER.kosong}</div>}
        {hasil && <Paginasi halaman={halaman} total={hasil.total} ukuran={hasil.ukuran} onPindah={(h) => ubahAlamat(queryPenyaring('master', { nilai: { ...keadaan.nilai, jenis }, halaman: h }, bawaan))} />}
      </Kartu>
      {jenis === 'praktisi' && <Peringatan nada="biru">{MASTER.catatanPraktisi}</Peringatan>}
      {jenis === 'wilayah' && <Peringatan nada="kuning">{MASTER.catatanWilayah}</Peringatan>}
      {modal && ubahBisa && (
        <ModalMasterProfil
          jenis={jenis as JenisMasterUbah}
          baris={modal.baris}
          onTutup={() => setModal(null)}
          onSelesai={() => {
            setModal(null);
            setMuatUlang((n) => n + 1);
          }}
        />
      )}
      {status && (
        <Konfirmasi
          judul={status.aktif ? MASTER.nonaktifJudul(namaBaris(status)) : MASTER.aktifJudul(namaBaris(status))}
          pesan={status.aktif ? MASTER.nonaktifPesan : MASTER.aktifPesan}
          labelYa={status.aktif ? MASTER.nonaktifkan : MASTER.aktifkan}
          memproses={memproses}
          onYa={() => void ubahStatus(status)}
          onTidak={() => setStatus(null)}
        />
      )}
    </Kolom>
  );
}
