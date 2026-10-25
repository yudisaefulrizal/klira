import { useCallback, useEffect, useState } from 'react';
import { DEFINISI_MASTER, JENIS_MASTER, MASTER, STATUS_AKUN, STATUS_FILTER_MASTER, STATUS_OPERASIONAL, teksSelMaster } from '@klira/shared';
import type { BarisMaster, Halaman, JenisMaster, JenisMasterUbah } from '@klira/shared';
import { daftarMaster, ubahAktifMaster } from '../../api-klien/master';
import { GalatApi } from '../../api-klien/klien';
import { HanyaDenganIzin } from '../../komponen/izin-saja';
import { Konfirmasi } from '../../komponen/konfirmasi/konfirmasi';
import { Paginasi } from '../../komponen/paginasi';
import { Isian } from '../../komponen/ui/isian';
import { Kartu } from '../../komponen/ui/kartu';
import { Lencana } from '../../komponen/ui/lencana';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Pilihan } from '../../komponen/ui/pilihan';
import { Tab } from '../../komponen/ui/tab';
import { BarisTabel, SelTabel, Tabel } from '../../komponen/ui/tabel';
import { Tombol } from '../../komponen/ui/tombol';
import { token } from '../../gaya/token';
import { ModalMasterProfil } from '../../modal/akun-pengaturan/master-profil';
import { BAWAAN_MASTER, bacaPenyaring, queryPenyaring, saringanMaster, ubahPenyaring } from '../../util/penyaring-tab';

const UKURAN = 20;
const SUBBAGIAN = JENIS_MASTER.map((j) => ({ id: j, label: MASTER.jenis[j] }));
const jenisSah = (t: string): JenisMaster => (JENIS_MASTER as readonly string[]).includes(t) ? (t as JenisMaster) : 'poli';
type Modal = { baris?: BarisMaster } | null;

/**
 * Tab Master data (3.1): subbagian poli, ruang, bed, praktisi, jadwal praktik, tarif, dan wilayah. Tiap subbagian punya tabel,
 * pencarian, dan aktif/nonaktif (tanpa hapus permanen). Tambah dan Ubah memakai satu modal generik (MODAL-1).
 */
export function TabMaster({ search, ubahAlamat }: { search: string; ubahAlamat: (query: string) => void }) {
  const keadaan = bacaPenyaring(search, BAWAAN_MASTER);
  const jenis = jenisSah(keadaan.nilai.jenis);
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
      const k = bacaPenyaring(search, BAWAAN_MASTER);
      // Pindah subbagian membersihkan pencarian dan penyaring subbagian sebelumnya.
      const dasar = ganti ? { ...k, nilai: { ...BAWAAN_MASTER } } : k;
      ubahAlamat(queryPenyaring('master', ubahPenyaring(dasar, perubahan), BAWAAN_MASTER));
    },
    [search, ubahAlamat],
  );

  useEffect(() => setCari(bacaPenyaring(search, BAWAAN_MASTER).nilai.cari), [search]);
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
    <section id="panel-master" role="tabpanel" aria-labelledby="tab-master" style={{ display: 'flex', flexDirection: 'column', gap: token.jarak.md }}>
      <Tab daftar={SUBBAGIAN} aktif={jenis} label={MASTER.pilihJenis} onPilih={(j) => terapkan({ jenis: j }, true)} />
      <Kartu style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: token.jarak.md, display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: token.jarak.md }}>
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
        </div>
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
                    <div style={{ display: 'inline-flex', gap: token.jarak.sm }}>
                      <HanyaDenganIzin fitur="master" aksi="perbaikan">
                        <Tombol varian="teks" onClick={() => setModal({ baris: b })}>{MASTER.ubah}</Tombol>
                        <Tombol varian="teks" onClick={() => setStatus(b)}>{b.aktif ? MASTER.nonaktifkan : MASTER.aktifkan}</Tombol>
                      </HanyaDenganIzin>
                    </div>
                  </SelTabel>
                </>
              )}
            </BarisTabel>
          ))}
        </Tabel>
        {hasil && hasil.data.length === 0 && <div style={{ padding: token.jarak.md, color: token.warna.teksRedup }}>{MASTER.kosong}</div>}
        {hasil && <Paginasi halaman={halaman} total={hasil.total} ukuran={hasil.ukuran} onPindah={(h) => ubahAlamat(queryPenyaring('master', { nilai: keadaan.nilai, halaman: h }, BAWAAN_MASTER))} />}
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
    </section>
  );
}
