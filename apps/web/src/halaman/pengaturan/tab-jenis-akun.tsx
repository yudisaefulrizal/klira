import { useCallback, useEffect, useState } from 'react';
import { JENIS_AKUN, STATUS_AKUN } from '@klira/shared';
import { daftarJenisAkun, riwayatJenisAkun, ubahJenisAkun } from '../../api-klien/izin';
import type { JenisAkunDto, RiwayatDto } from '../../api-klien/izin';
import { GalatApi } from '../../api-klien/klien';
import { HanyaDenganIzin } from '../../komponen/izin-saja';
import { Konfirmasi } from '../../komponen/konfirmasi/konfirmasi';
import { PanelDetail } from '../../komponen/panel-detail/panel-detail';
import { Kartu } from '../../komponen/ui/kartu';
import { Lencana } from '../../komponen/ui/lencana';
import { Peringatan } from '../../komponen/ui/peringatan';
import { BarisTabel, SelTabel, Tabel } from '../../komponen/ui/tabel';
import { Tombol } from '../../komponen/ui/tombol';
import { token } from '../../gaya/token';
import { barisRiwayat } from '../../modal/akun-pengaturan/keadaan-jenis-akun';
import { ModalJenisAkun } from '../../modal/akun-pengaturan/jenis-akun';
import { formatWaktu } from '../../util/penyaring-tab';

const KOLOM = [
  { judul: JENIS_AKUN.kolom.nama }, { judul: JENIS_AKUN.kolom.syarat }, { judul: JENIS_AKUN.kolom.izin }, { judul: JENIS_AKUN.kolom.aktif },
  { judul: JENIS_AKUN.kolom.pemakai }, { judul: JENIS_AKUN.kolom.tindakan, rataKanan: true },
];

type Modal = { jenis?: JenisAkunDto } | null;

/** Tab Jenis akun (3.1): tabel jenis akun, Buat dan Ubah lewat modal, Nonaktifkan/Aktifkan dengan alasan, riwayat lewat Panel detail. */
export function TabJenisAkun() {
  const [data, setData] = useState<JenisAkunDto[] | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [status, setStatus] = useState<JenisAkunDto | null>(null);
  const [memproses, setMemproses] = useState(false);
  const [riwayat, setRiwayat] = useState<{ jenis: JenisAkunDto; data: RiwayatDto[] | null; galat: boolean } | null>(null);

  const muat = useCallback(async () => {
    try {
      setData(await daftarJenisAkun());
      setGalat(null);
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : JENIS_AKUN.gagalMuat);
    }
  }, []);

  useEffect(() => {
    void muat();
  }, [muat]);

  async function bukaRiwayat(jenis: JenisAkunDto) {
    setRiwayat({ jenis, data: null, galat: false });
    try {
      setRiwayat({ jenis, data: await riwayatJenisAkun(jenis.id), galat: false });
    } catch {
      setRiwayat({ jenis, data: null, galat: true });
    }
  }

  async function ubahStatus(jenis: JenisAkunDto, alasan: string) {
    setMemproses(true);
    try {
      await ubahJenisAkun(jenis.id, { aktif: !jenis.aktif, alasan_perubahan: alasan });
      setStatus(null);
      await muat();
    } catch (e) {
      setStatus(null);
      setGalat(e instanceof GalatApi ? e.message : JENIS_AKUN.gagalSimpan);
    } finally {
      setMemproses(false);
    }
  }

  return (
    <section id="panel-jenis-akun" role="tabpanel" aria-labelledby="tab-jenis-akun" style={{ display: 'flex', flexDirection: 'column', gap: token.jarak.md }}>
      <Kartu style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: token.jarak.md, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: token.jarak.md }}>
          <div style={{ fontSize: token.huruf.ukuran.besar, fontWeight: token.huruf.berat.tebal, flexGrow: 1 }}>{JENIS_AKUN.judulTab}</div>
          <HanyaDenganIzin fitur="akses" aksi="input">
            <Tombol onClick={() => setModal({})}>{JENIS_AKUN.buat}</Tombol>
          </HanyaDenganIzin>
        </div>
        {galat && <Peringatan style={{ margin: `0 ${token.jarak.md} ${token.jarak.md}` }}>{galat}</Peringatan>}
        <Tabel kolom={KOLOM} label={JENIS_AKUN.judulTab}>
          {data?.map((j) => (
            <BarisTabel key={j.id}>
              <SelTabel style={{ fontWeight: token.huruf.berat.tebal }}>{j.nama}</SelTabel>
              <SelTabel>{j.syarat_profesi || JENIS_AKUN.tanpaSyarat}</SelTabel>
              <SelTabel>{j.izin.length}</SelTabel>
              <SelTabel>
                <Lencana warna={STATUS_AKUN.warna(j.aktif ? 'aktif' : 'nonaktif')}>{STATUS_AKUN.label(j.aktif ? 'aktif' : 'nonaktif')}</Lencana>
              </SelTabel>
              <SelTabel>{j.jumlah_pemakai ?? 0}</SelTabel>
              <SelTabel style={{ textAlign: 'right' }}>
                <div style={{ display: 'inline-flex', gap: token.jarak.sm }}>
                  <HanyaDenganIzin fitur="akses" aksi="perbaikan">
                    <Tombol varian="teks" onClick={() => setModal({ jenis: j })}>{JENIS_AKUN.ubah}</Tombol>
                    <Tombol varian="teks" onClick={() => setStatus(j)}>{j.aktif ? JENIS_AKUN.nonaktifkan : JENIS_AKUN.aktifkan}</Tombol>
                  </HanyaDenganIzin>
                  <Tombol varian="teks" onClick={() => void bukaRiwayat(j)}>{JENIS_AKUN.riwayat}</Tombol>
                </div>
              </SelTabel>
            </BarisTabel>
          ))}
        </Tabel>
        {data && data.length === 0 && <div style={{ padding: token.jarak.md, color: token.warna.teksRedup }}>{JENIS_AKUN.kosong}</div>}
      </Kartu>
      <Peringatan nada="kuning">{JENIS_AKUN.catatan}</Peringatan>
      {modal && (
        <ModalJenisAkun
          jenis={modal.jenis}
          onTutup={() => setModal(null)}
          onSelesai={() => {
            setModal(null);
            void muat();
          }}
        />
      )}
      {status && (
        <Konfirmasi
          judul={JENIS_AKUN.statusJudul(status.nama, !status.aktif)}
          pesan={status.aktif ? JENIS_AKUN.statusPesanNonaktif : JENIS_AKUN.statusPesanAktif}
          labelYa={status.aktif ? JENIS_AKUN.nonaktifkan : JENIS_AKUN.aktifkan}
          alasan={{ label: JENIS_AKUN.alasan, wajib: true }}
          memproses={memproses}
          onYa={(alasan) => void ubahStatus(status, alasan)}
          onTidak={() => setStatus(null)}
        />
      )}
      {riwayat && (
        <PanelDetail
          judul={JENIS_AKUN.riwayatJudul(riwayat.jenis.nama)}
          onTutup={() => setRiwayat(null)}
          bagian={(riwayat.data ?? []).map((r) => {
            const b = barisRiwayat(r);
            return {
              judul: formatWaktu(r.dibuat_pada),
              baris: [
                { label: JENIS_AKUN.riwayatBagian.perubahan, nilai: b.perubahan },
                { label: JENIS_AKUN.riwayatBagian.alasan, nilai: b.alasan },
                { label: JENIS_AKUN.riwayatBagian.oleh, nilai: b.oleh },
              ],
            };
          })}
        >
          {riwayat.galat && <Peringatan>{JENIS_AKUN.riwayatGagal}</Peringatan>}
          {riwayat.data?.length === 0 && <span style={{ color: token.warna.teksRedup }}>{JENIS_AKUN.riwayatKosong}</span>}
        </PanelDetail>
      )}
    </section>
  );
}
