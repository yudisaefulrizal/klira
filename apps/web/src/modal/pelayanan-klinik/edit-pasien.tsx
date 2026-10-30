import { PencarianWilayah } from '../../komponen/pencarian-wilayah';
import { useEffect, useState } from 'react';
import { perbaikanPasienMasukan, punyaIzin, REGISTRASI } from '@klira/shared';
import type { PasienDetailDto } from '@klira/shared';
import { GalatApi } from '../../api-klien/klien';
import { detailPasien, perbaikiPasien } from '../../api-klien/pasien';
import { Modal1 } from '../../komponen/modal-1/modal-1';
import { Isian } from '../../komponen/ui/isian';
import { Pilihan } from '../../komponen/ui/pilihan';
import { KotakCentang } from '../../komponen/ui/kotak-centang';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Tab } from '../../komponen/ui/tab';
import { TAB_EDIT_PASIEN, lokasiGalatEditPasien } from './keadaan-edit-pasien';
import type { TabEditPasien } from './keadaan-edit-pasien';
import { Tombol } from '../../komponen/ui/tombol';
import { Baris, Kolom, DaftarRingkasan } from '../../komponen/ui/susunan';
import { usePengguna } from '../../util/konteks-pengguna';
import { bagianDetailPasien } from './detail-pasien';

export function EditPasien({ id, nama, onTutup, onSelesai }: { id: number; nama: string; onTutup: () => void; onSelesai: () => void }) {
  const { pengguna } = usePengguna();
  const boleh = !!pengguna && punyaIzin(pengguna, 'pasien', 'perbaikan');
  const [data, setData] = useState<PasienDetailDto | null>(null);
  const [tab, setTab] = useState<TabEditPasien>('edit-identitas');
  const [waliAktif, setWaliAktif] = useState(0);
  const [awal, setAwal] = useState('');
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState('');
  const [bidang, setBidang] = useState<Record<string, string>>({});
  useEffect(() => {
    let hidup = true;
    void detailPasien(id).then((p) => { if (hidup) { setData(p); setAwal(JSON.stringify(p)); } })
      .catch((e) => { if (hidup) setGalat(e.message || 'Data pasien gagal dimuat.'); });
    return () => { hidup = false; };
  }, [id]);
  const ubah = (perubahan: Partial<PasienDetailDto>) => setData((p) => p && { ...p, ...perubahan });
  const isian = (key: keyof PasienDetailDto, label: string, maxLength = 200, type = 'text') => (
    <Isian id={`edit-pasien-${key}`} label={label} type={type} maxLength={maxLength}
      value={String(data?.[key] ?? '')} onChange={(e) => ubah(key === 'nik' ? { nik: e.target.value.replace(/\D/g, '') || null, ...(data?.jalur_identitas === 'tanpa_identitas' && e.target.value ? { jalur_identitas: 'nik' as const } : {}) } : { [key]: e.target.value })}
      galat={bidang[key]} autoComplete="off" />
  );
  const indeksTab = TAB_EDIT_PASIEN.findIndex((t) => t.id === tab);
  function tampilkanGalat(daftar: Record<string, string>) {
    setBidang(daftar);
    const lokasi = lokasiGalatEditPasien(Object.keys(daftar)[0] ?? 'nama');
    setTab(lokasi.tab);
    if (lokasi.wali !== undefined) setWaliAktif(lokasi.wali);
  }
  async function simpan() {
    if (!data || sibuk) return;
    const hasil = perbaikanPasienMasukan.safeParse({ ...data, wali: data.wali.map(({ id: waliId, ...w }) => ({ ...w, ...(waliId ? { id: waliId } : {}) })) });
    if (!hasil.success) {
      tampilkanGalat(Object.fromEntries(hasil.error.issues.map((i) => [i.path.join('.'), i.message])));
      setGalat('Periksa isian yang ditandai.');
      return;
    }
    setSibuk(true); setGalat(''); setBidang({});
    try { await perbaikiPasien(id, hasil.data); onSelesai(); }
    catch (e) {
      setGalat(e instanceof Error ? e.message : 'Data pasien gagal disimpan.');
      if (e instanceof GalatApi && e.rincian) tampilkanGalat(Object.fromEntries(e.rincian.map((r) => [r.jalur, r.pesan])));
    }
    finally { setSibuk(false); }
  }
  return (
    <Modal1 lebar="modalBesar" judul={`${boleh ? 'Edit data pasien' : 'Data pasien'}: ${nama}`} onTutup={() => { if (!sibuk) onTutup(); }}
      lindungiTutup={!!data && JSON.stringify(data) !== awal}
      aksi={boleh && data ? <>
        <Tombol type="button" varian="sekunder" disabled={sibuk || indeksTab === 0} onClick={() => setTab(TAB_EDIT_PASIEN[indeksTab - 1].id)}>Sebelumnya</Tombol>
        {indeksTab < TAB_EDIT_PASIEN.length - 1 && <Tombol type="button" varian="sekunder" disabled={sibuk} onClick={() => setTab(TAB_EDIT_PASIEN[indeksTab + 1].id)}>Berikutnya</Tombol>}
        <Tombol type="submit" form="edit-pasien-form" disabled={sibuk || JSON.stringify(data) === awal}>{sibuk ? 'Menyimpan…' : 'Simpan perubahan'}</Tombol>
      </> : undefined}>
      {galat && <Peringatan>{galat}</Peringatan>}
      {!data && !galat && <p>Memuat data pasien…</p>}
      {data && !boleh && <DaftarRingkasan bagian={bagianDetailPasien(data)} />}
      {data && boleh && <>
        <p style={{ margin: 0 }}>Nomor RM: <strong>{data.nomor_rm}</strong></p>
        <Tab daftar={TAB_EDIT_PASIEN} aktif={tab} onPilih={(pilihan) => { if (!sibuk) setTab(pilihan); }} label="Bagian data pasien" />
        <form id="edit-pasien-form" onSubmit={(e) => { e.preventDefault(); void simpan(); }}>
          <fieldset disabled={sibuk} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
            <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
              {tab === 'edit-identitas' && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '24px' }}>
                <Kolom>
                {isian('nama', 'Nama pasien')}
                <Baris>
                  {isian('tanggal_lahir', 'Tanggal lahir', 10, 'date')}
                  <Pilihan id="edit-pasien-jk" label="Jenis kelamin" value={data.jenis_kelamin} onChange={(e) => ubah({ jenis_kelamin: e.target.value as PasienDetailDto['jenis_kelamin'] })}
                    opsi={[{ nilai: 'laki_laki', label: 'Laki-laki' }, { nilai: 'perempuan', label: 'Perempuan' }]} />
                </Baris>
                {isian('nik', 'NIK', 16)}
                {data.jalur_identitas === 'paspor' && isian('nomor_paspor', 'Nomor paspor', 50)}
                {data.jalur_identitas === 'kitas' && isian('nomor_kitas', 'Nomor KITAS', 50)}
                </Kolom>
                <Kolom>
                  {isian('nomor_hp', 'Nomor HP pasien', 40, 'tel')}
                  <Baris>{isian('agama', 'Agama', 50)}{isian('pekerjaan', 'Pekerjaan', 100)}</Baris>
                  <Baris>{isian('pendidikan', 'Pendidikan', 100)}{isian('status_kawin', 'Status perkawinan', 50)}</Baris>
                </Kolom>
              </div>}
              {tab === 'edit-pelengkap' && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '24px' }}>
                <Kolom>
                  <Baris>{isian('tempat_lahir', 'Tempat lahir', 100)}{isian('ibu_kandung', 'Nama ibu kandung')}</Baris>
                  <PencarianWilayah id="edit-pasien-wilayah" value={data.kode_wilayah ?? ''} onChange={(kode) => ubah({ kode_wilayah: kode || null })} galat={bidang.kode_wilayah} />
                </Kolom>
                <Kolom>
                  <Baris>{isian('suku', 'Suku', 100)}{isian('bahasa', 'Bahasa', 100)}</Baris>
                </Kolom>
              </div>}
              {tab === 'edit-keluarga' && <Kolom>
                <KotakCentang id="edit-pasien-tidak-cakap" label={REGISTRASI.tidakCakap} checked={data.tidak_cakap} onChange={(e) => ubah({ tidak_cakap: e.target.checked })} />
                {bidang.wali && <Peringatan>{bidang.wali}</Peringatan>}
                {data.wali.length > 0 ? <>
                  <Pilihan id="edit-pilih-wali" label="Wali/keluarga yang diedit" value={String(Math.min(waliAktif, data.wali.length - 1))} onChange={(e) => setWaliAktif(Number(e.target.value))}
                    opsi={data.wali.map((w, i) => ({ nilai: String(i), label: `${i + 1}. ${w.nama || 'Wali/keluarga baru'}` }))} />
                  {data.wali.map((w, i) => i === Math.min(waliAktif, data.wali.length - 1) && <Kolom key={w.id || `baru-${i}`}>
                    <Baris>
                      <Isian id={`edit-wali-${i}-nama`} label="Nama wali/keluarga" value={w.nama} maxLength={200} galat={bidang[`wali.${i}.nama`]} onChange={(e) => ubah({ wali: data.wali.map((v, n) => n === i ? { ...v, nama: e.target.value } : v) })} />
                      <Isian id={`edit-wali-${i}-hubungan`} label="Hubungan" value={w.hubungan} maxLength={100} galat={bidang[`wali.${i}.hubungan`]} onChange={(e) => ubah({ wali: data.wali.map((v, n) => n === i ? { ...v, hubungan: e.target.value } : v) })} />
                    </Baris>
                    <Isian id={`edit-wali-${i}-kontak`} label="Nomor HP / kontak wali atau keluarga" value={w.kontak ?? ''} maxLength={100} galat={bidang[`wali.${i}.kontak`]} onChange={(e) => ubah({ wali: data.wali.map((v, n) => n === i ? { ...v, kontak: e.target.value } : v) })} />
                    {!w.id && <Tombol type="button" varian="teks" onClick={() => { ubah({ wali: data.wali.filter((_v, n) => n !== i) }); setWaliAktif(Math.max(0, i - 1)); }}>Batalkan tambahan wali</Tombol>}
                  </Kolom>)}
                </> : <p>Belum ada kontak wali/keluarga.</p>}
                <Tombol type="button" varian="sekunder" disabled={data.wali.length >= 10} onClick={() => { setWaliAktif(data.wali.length); ubah({ wali: [...data.wali, { id: 0, nama: '', hubungan: '', kontak: '' }] }); }}>Tambah wali/keluarga</Tombol>
              </Kolom>}

              {tab === 'edit-jkn' && <Kolom>
                {isian('jkn_nomor_kartu', 'Nomor kartu JKN', 50)}
                {isian('jkn_kelas_hak', 'Kelas hak', 20)}
                {isian('jkn_fktp_terdaftar', 'FKTP terdaftar')}
              </Kolom>}
            </div>
          </fieldset>
        </form>
      </>}
    </Modal1>
  );
}
