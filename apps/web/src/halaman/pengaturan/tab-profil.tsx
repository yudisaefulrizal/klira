import { PengaturanWebsiteKlinik } from './website-klinik';
import { useCallback, useEffect, useState } from 'react';
import { PROFIL_KLINIK } from '@klira/shared';
import type { Halaman, ProfilKlinikDto, RiwayatProfilDto } from '@klira/shared';
import { GalatApi } from '../../api-klien/klien';
import { ambilProfilKlinik, daftarRiwayatProfil, simpanProfilKlinik } from '../../api-klien/master';
import { HanyaDenganIzin, useIzin } from '../../komponen/izin-saja';
import { Paginasi } from '../../komponen/paginasi';
import { Isian } from '../../komponen/ui/isian';
import { Kartu } from '../../komponen/ui/kartu';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Pilihan } from '../../komponen/ui/pilihan';
import { BarisTabel, SelTabel, Tabel } from '../../komponen/ui/tabel';
import { Tombol } from '../../komponen/ui/tombol';
import { token } from '../../gaya/token';
import { formatWaktu } from '../../util/penyaring-tab';
import { bentukProfil, formDariProfil, galatProfil, labelJenisRiwayat, profilBerubah } from './keadaan-profil';
import type { FormProfil } from './keadaan-profil';
import { Baris, Kolom } from '../../komponen/ui/susunan';

const UKURAN = 10;
const KOLOM = [
  { judul: PROFIL_KLINIK.riwayatKolom.waktu }, { judul: PROFIL_KLINIK.riwayatKolom.jenis },
  { judul: PROFIL_KLINIK.riwayatKolom.ringkasan }, { judul: PROFIL_KLINIK.riwayatKolom.oleh },
];
const OPSI_JENIS = Object.entries(PROFIL_KLINIK.jenisPilihan).map(([nilai, label]) => ({ nilai, label }));

/** Tab Profil klinik (3.1, 3.3, 4.1, 4.9): isian langsung di halaman (bukan modal); hanya baca tanpa izin perbaikan; riwayat perubahan. */
export function TabProfil() {
  const boleh = useIzin();
  const bolehUbah = boleh('profil-klinik', 'perbaikan');
  const [awal, setAwal] = useState<FormProfil | null>(null);
  const [form, setForm] = useState<FormProfil | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [memproses, setMemproses] = useState(false);
  const [dicoba, setDicoba] = useState(false);
  const [riwayat, setRiwayat] = useState<Halaman<RiwayatProfilDto> | null>(null);
  const [halaman, setHalaman] = useState(1);
  const [muatRiwayat, setMuatRiwayat] = useState(0);
  const [galatRiwayat, setGalatRiwayat] = useState<string | null>(null);

  const terapkan = useCallback((p: ProfilKlinikDto) => {
    const f = formDariProfil(p);
    setAwal(f);
    setForm(f);
  }, []);

  useEffect(() => {
    let batal = false;
    ambilProfilKlinik()
      .then((p) => !batal && terapkan(p))
      .catch((e) => !batal && setGalat(e instanceof GalatApi ? e.message : PROFIL_KLINIK.gagalMuat));
    return () => {
      batal = true;
    };
  }, [terapkan]);

  useEffect(() => {
    let batal = false;
    daftarRiwayatProfil(halaman, UKURAN)
      .then((h) => {
        if (batal) return;
        setRiwayat(h);
        setGalatRiwayat(null);
      })
      .catch((e) => !batal && setGalatRiwayat(e instanceof GalatApi ? e.message : PROFIL_KLINIK.riwayatGagalMuat));
    return () => {
      batal = true;
    };
  }, [halaman, muatRiwayat]);

  const galatBidang = form ? galatProfil(form) : {};
  const berubah = !!awal && !!form && profilBerubah(awal, form);
  const tampil = (k: keyof FormProfil) => (dicoba ? galatBidang[k] : undefined);

  async function simpan() {
    setDicoba(true);
    if (!form || Object.keys(galatBidang).length) return;
    setMemproses(true);
    setGalat(null);
    setInfo(null);
    try {
      terapkan(await simpanProfilKlinik(bentukProfil(form)));
      setDicoba(false);
      setInfo(PROFIL_KLINIK.tersimpan);
      setHalaman(1);
      setMuatRiwayat((n) => n + 1);
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : PROFIL_KLINIK.gagalSimpan);
    } finally {
      setMemproses(false);
    }
  }

  const isian = (k: keyof FormProfil, label: string, opsi: { maks?: number; tipe?: 'text' | 'date' } = {}) =>
    form && (
      <Isian
        key={k} id={`profil-${k}`} label={label} type={opsi.tipe ?? 'text'} maxLength={opsi.maks} value={form[k]}
        readOnly={!bolehUbah} onChange={(e) => setForm({ ...form, [k]: e.target.value })} galat={tampil(k)}
      />
    );

  return (
    <Kolom tag="section" jarak="md" id="panel-profil" role="tabpanel" aria-labelledby="tab-profil">
      <Kartu susun="md">
        <div style={{ fontSize: token.huruf.ukuran.besar, fontWeight: token.huruf.berat.tebal }}>{PROFIL_KLINIK.dataJudul}</div>
        <span style={{ color: token.warna.teksRedup }}>{PROFIL_KLINIK.dataPetunjuk}</span>
        {!bolehUbah && <Peringatan nada="biru">{PROFIL_KLINIK.bacaSaja}</Peringatan>}
        {galat && <Peringatan>{galat}</Peringatan>}
        {info && <Peringatan nada="biru">{info}</Peringatan>}
        {form && (
          <Kolom tag="form" jarak="md"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              void simpan();
            }}
          >
            <Baris>
              {isian('nama', PROFIL_KLINIK.nama, { maks: 200 })}
              <Pilihan
                id="profil-jenis" label={PROFIL_KLINIK.jenis} value={form.jenis} opsi={OPSI_JENIS} disabled={!bolehUbah}
                onChange={(e) => setForm({ ...form, jenis: e.target.value })} galat={tampil('jenis')}
              />
              {isian('bentuk_usaha', PROFIL_KLINIK.bentukUsaha, { maks: 100 })}
              {isian('kode_registrasi', PROFIL_KLINIK.kodeRegistrasi, { maks: 50 })}
              {isian('organization_id', PROFIL_KLINIK.organizationId, { maks: 100 })}
              {isian('puskesmas_wilayah', PROFIL_KLINIK.puskesmasWilayah, { maks: 200 })}
              {isian('status_akreditasi', PROFIL_KLINIK.statusAkreditasi, { maks: 100 })}
              {isian('tanggal_akreditasi', PROFIL_KLINIK.tanggalAkreditasi, { tipe: 'date' })}
            </Baris>
            <HanyaDenganIzin fitur="profil-klinik" aksi="perbaikan">
              <div>
                <Tombol type="submit" disabled={memproses || !berubah}>{memproses ? PROFIL_KLINIK.menyimpan : PROFIL_KLINIK.simpan}</Tombol>
              </div>
            </HanyaDenganIzin>
          </Kolom>
        )}
      </Kartu>
      <PengaturanWebsiteKlinik onSelesai={() => { setHalaman(1); setMuatRiwayat(n => n + 1); }} />
      <Kartu style={{ padding: 0, overflow: 'hidden' }}>
        <Kolom jarak="xs" padding="md">
          <div style={{ fontSize: token.huruf.ukuran.besar, fontWeight: token.huruf.berat.tebal }}>{PROFIL_KLINIK.riwayatJudul}</div>
          <span style={{ color: token.warna.teksRedup }}>{PROFIL_KLINIK.riwayatPetunjuk}</span>
        </Kolom>
        {galatRiwayat && <Peringatan style={{ margin: `0 ${token.jarak.md} ${token.jarak.md}` }}>{galatRiwayat}</Peringatan>}
        <Tabel kolom={KOLOM} label={PROFIL_KLINIK.riwayatJudul}>
          {riwayat?.data.map((r) => (
            <BarisTabel key={r.id}>
              <SelTabel>{formatWaktu(r.dibuat_pada)}</SelTabel>
              <SelTabel>{labelJenisRiwayat(r.jenis)}</SelTabel>
              <SelTabel style={{ overflowWrap: 'anywhere' }}>{r.ringkasan}</SelTabel>
              <SelTabel>{r.dibuat_oleh_nama ?? PROFIL_KLINIK.tanpaTanggal}</SelTabel>
            </BarisTabel>
          ))}
        </Tabel>
        {riwayat && riwayat.data.length === 0 && <div style={{ padding: token.jarak.md, color: token.warna.teksRedup }}>{PROFIL_KLINIK.riwayatKosong}</div>}
        {riwayat && <Paginasi halaman={halaman} total={riwayat.total} ukuran={riwayat.ukuran} onPindah={setHalaman} />}
      </Kartu>
    </Kolom>
  );
}
