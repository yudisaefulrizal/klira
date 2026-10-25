import { useCallback, useEffect, useMemo, useState } from 'react';
import { ATUR_IZIN, MODAL } from '@klira/shared';
import type { AksesEfektif, KonfirmasiPeringatan, PenggunaDaftarDto, PeringatanTerdeteksi } from '@klira/shared';
import {
  akhiriIzinAkun, akhiriPenugasan, aksesEfektif, beriIzinAkun, daftarIzin, daftarIzinAkun, daftarJenisAkun, daftarPenugasan, tugaskanJenis,
} from '../../api-klien/izin';
import type { IzinAkunDto, PenugasanDto } from '../../api-klien/izin';
import { GalatApi } from '../../api-klien/klien';
import { token } from '../../gaya/token';
import { Modal1 } from '../../komponen/modal-1/modal-1';
import { PanelDetail } from '../../komponen/panel-detail/panel-detail';
import { DialogPeringatan } from '../../komponen/peringatan/peringatan-izin';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Tombol } from '../../komponen/ui/tombol';
import { jalankanAksi } from './alur-atur-izin';
import { BagianIzin, BagianPenugasan, TeksMemuat } from './bagian-atur-izin';
import { hariIniLokal, opsiIzin } from './keadaan-akun';
import type { BarisIzinForm, IzinKatalog, JenisKatalog } from './keadaan-akun';
import { bagianAkses, bentukIzinBaru, bentukPenugasanBaru, izinAwal, izinTerpakai, jenisBerjalan, opsiJenisBaru, penugasanAwal } from './keadaan-izin';
import type { PenugasanForm } from './keadaan-izin';
import { Sebaris, Tumbuh } from '../../komponen/ui/susunan';

type Props = {
  pengguna: Pick<PenggunaDaftarDto, 'id' | 'nama' | 'username'>;
  /** Dipanggil saat modal ditutup; `berubah` true bila ada perubahan tersimpan (muat ulang daftar). */
  onTutup: (berubah: boolean) => void;
};

type Tertunda = { peringatan: PeringatanTerdeteksi[]; ulang: (k: KonfirmasiPeringatan) => Promise<void> };

/**
 * Modal Atur izin akun (3.3, MODAL-1): akses efektif (Panel detail), penugasan jenis akun (tambah, ubah periode,
 * akhiri), dan izin tambahan atau pengurangan dengan alasan wajib. Tanpa hapus permanen. Peringatan 409 meminta
 * alasan lewat DialogPeringatan lalu tindakan diulang dengan konfirmasi.
 */
export function AturIzin({ pengguna, onTutup }: Props) {
  const hariIni = useMemo(() => hariIniLokal(), []);
  const [jenis, setJenis] = useState<JenisKatalog[]>([]);
  const [katalog, setKatalog] = useState<IzinKatalog[]>([]);
  const [penugasan, setPenugasan] = useState<PenugasanDto[]>([]);
  const [izinAkun, setIzinAkun] = useState<IzinAkunDto[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);
  const [memproses, setMemproses] = useState(false);
  const [berubah, setBerubah] = useState(false);
  const [formTugas, setFormTugas] = useState<PenugasanForm>(penugasanAwal(hariIni));
  const [formIzin, setFormIzin] = useState<BarisIzinForm>(izinAwal(hariIni));
  const [kata, setKata] = useState('');
  const [tertunda, setTertunda] = useState<Tertunda | null>(null);
  const [akses, setAkses] = useState<AksesEfektif | null>(null);

  const muatData = useCallback(async () => {
    const [j, i, p, ia] = await Promise.all([daftarJenisAkun(), daftarIzin(), daftarPenugasan(pengguna.id), daftarIzinAkun(pengguna.id)]);
    setJenis(j);
    setKatalog(i);
    setPenugasan(p);
    setIzinAkun(ia);
  }, [pengguna.id]);

  useEffect(() => {
    let batal = false;
    muatData()
      .catch((e) => !batal && setGalat(e instanceof GalatApi ? e.message : ATUR_IZIN.gagalMuat))
      .finally(() => !batal && setMemuat(false));
    return () => {
      batal = true;
    };
  }, [muatData]);

  /** Jalankan tindakan; peringatan membuka dialog alasan, berhasil memuat ulang dan mengosongkan isian. */
  async function proses(kirim: (k?: KonfirmasiPeringatan) => Promise<unknown>, sesudah: () => void, konfirmasi?: KonfirmasiPeringatan) {
    setMemproses(true);
    setGalat(null);
    const h = await jalankanAksi(kirim, konfirmasi);
    if (h.jenis === 'peringatan') {
      setTertunda({ peringatan: h.peringatan, ulang: (k) => proses(kirim, sesudah, k) });
    } else if (h.jenis === 'galat') {
      setTertunda(null);
      setGalat(h.pesan);
    } else {
      setTertunda(null);
      try {
        await muatData();
      } catch {
        setGalat(ATUR_IZIN.gagalMuat);
      }
      setBerubah(true);
      sesudah();
    }
    setMemproses(false);
  }

  async function bukaAkses() {
    try {
      setAkses(await aksesEfektif(pengguna.id));
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : ATUR_IZIN.gagalMuat);
    }
  }

  const jenisKerja = jenisBerjalan(jenis, penugasan, hariIni);
  const opsi = opsiIzin(formIzin.tipe, katalog, jenisKerja, izinTerpakai(izinAkun, hariIni), kata);
  const adaIsian = formTugas.jenis_akun_id !== '' || formIzin.alasan.trim() !== '' || formIzin.izin_id !== 0;

  return (
    <>
      <Modal1
        judul={ATUR_IZIN.judul}
        lebar="modalBesar"
        lindungiTutup={adaIsian}
        onTutup={() => onTutup(berubah)}
        konteks={
          <Sebaris jarak="md">
            <Tumbuh tag="div">
              <div style={{ fontWeight: token.huruf.berat.tebal }}>{pengguna.nama}</div>
              <div style={{ fontSize: token.huruf.ukuran.kecil, color: token.warna.teksRedup }}>{pengguna.username}</div>
            </Tumbuh>
            <Tombol type="button" varian="sekunder" onClick={() => void bukaAkses()}>{ATUR_IZIN.lihatAkses}</Tombol>
          </Sebaris>
        }
        aksi={<Tombol type="button" varian="sekunder" onClick={() => onTutup(berubah)}>{ATUR_IZIN.tutup}</Tombol>}
      >
        {galat && <Peringatan>{galat}</Peringatan>}
        {memuat ? (
          <TeksMemuat />
        ) : (
          <>
            <BagianPenugasan
              data={penugasan}
              jenis={jenis}
              opsiJenis={opsiJenisBaru(jenis, penugasan, hariIni)}
              hariIni={hariIni}
              form={formTugas}
              onForm={setFormTugas}
              memproses={memproses}
              onTambah={() => void proses((k) => tugaskanJenis(pengguna.id, bentukPenugasanBaru(formTugas, k)), () => setFormTugas(penugasanAwal(hariIni)))}
              onPeriode={(id, selesai) => void proses(() => akhiriPenugasan(pengguna.id, id, selesai), () => undefined)}
            />
            <BagianIzin
              data={izinAkun}
              katalog={katalog}
              opsi={opsi}
              hariIni={hariIni}
              form={formIzin}
              kata={kata}
              onForm={setFormIzin}
              onKata={setKata}
              memproses={memproses}
              onTambah={() => void proses((k) => beriIzinAkun(pengguna.id, bentukIzinBaru(formIzin, k)), () => { setFormIzin(izinAwal(hariIni)); setKata(''); })}
              onPeriode={(id, selesai) => void proses(() => akhiriIzinAkun(pengguna.id, id, selesai), () => undefined)}
            />
          </>
        )}
      </Modal1>
      {akses && <PanelDetail judul={ATUR_IZIN.aksesJudul} onTutup={() => setAkses(null)} bagian={bagianAkses(akses)} />}
      {tertunda && (
        <DialogPeringatan
          peringatan={tertunda.peringatan}
          memproses={memproses}
          onBatal={() => setTertunda(null)}
          onLanjut={(k) => void tertunda.ulang(k)}
          labelLanjut={memproses ? ATUR_IZIN.memproses : MODAL.lanjutkanDenganAlasan}
        />
      )}
    </>
  );
}
