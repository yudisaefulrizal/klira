import { useState } from 'react';
import { GALAT, REGISTRASI, STATUS_IDENTITAS, statusIdentitasDari } from '@klira/shared';
import type { KandidatDuplikatDto, TeksPersetujuanDto } from '@klira/shared';
import { token } from '../../gaya/token';
import { AreaTeks } from '../../komponen/ui/area-teks';
import { Isian } from '../../komponen/ui/isian';
import { KotakCentang } from '../../komponen/ui/kotak-centang';
import { Lencana } from '../../komponen/ui/lencana';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Pilihan } from '../../komponen/ui/pilihan';
import { Baris, Daftar, DaftarRingkasan, Kolom, Sebaris, Tumbuh } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { hapusWali, ringkasanRegistrasi, ubahJalur, ubahTidakCakap } from './keadaan-registrasi';
import type { KeadaanRegistrasi } from './keadaan-registrasi';
import { Bingkai } from '../../komponen/ui/kartu';

type Ubah = (perubahan: Partial<KeadaanRegistrasi>) => void;
type Dasar = { keadaan: KeadaanRegistrasi; ubah: Ubah; galat: Record<string, string>; tampilGalat: boolean };

const teksRedup = { margin: 0, color: token.warna.teksRedup } as const;
const opsiDari = (daftar: readonly string[]) => [{ nilai: '', label: REGISTRASI.pilih }, ...daftar.map((o) => ({ nilai: o, label: o }))];

/** Bidang identitas utama untuk pendaftaran dan deteksi duplikat. */
function BidangKunci({ keadaan: k, ubah, galat, tampilGalat, awalan }: Dasar & { awalan: string }) {
  const g = (b: string) => (tampilGalat ? galat[b] : undefined);
  return (
    <>
      <Isian id={`${awalan}-nama`} label={REGISTRASI.nama} value={k.nama} onChange={(e) => ubah({ nama: e.target.value })} galat={g('nama')} autoComplete="off" />
      <Baris>
        <Isian
          id={`${awalan}-nik`} label={REGISTRASI.nik} value={k.nik} inputMode="numeric" maxLength={16} disabled={k.jalur_identitas === 'tanpa_identitas'}
          onChange={(e) => ubah({ nik: e.target.value.replace(/\D/g, '') })} galat={g('nik')} autoComplete="off"
        />
        <Isian id={`${awalan}-lahir`} label={REGISTRASI.tanggalLahir} type="date" value={k.tanggal_lahir} onChange={(e) => ubah({ tanggal_lahir: e.target.value })} galat={g('tanggal_lahir')} />
      </Baris>
      <Isian id={`${awalan}-ibu`} label={REGISTRASI.ibu} value={k.ibu_kandung} onChange={(e) => ubah({ ibu_kandung: e.target.value })} galat={g('ibu_kandung')} autoComplete="off" />
    </>
  );
}

type PropsDuplikat = Dasar & {
  kandidat: readonly KandidatDuplikatDto[] | null;
  mencari: boolean;
  bisaCari: boolean;
  galatCari: string | null;
  onCari: () => void;
  onPakai: (c: KandidatDuplikatDto) => void;
};

function HasilDuplikat({ kandidat, mencari, bisaCari, galatCari, onCari, onPakai, ...dasar }: PropsDuplikat) {
  const { keadaan: k, ubah } = dasar;
  const nikSama = !!kandidat?.some((c) => c.alasan === 'nik');
  return (
    <Kolom>
      <p style={teksRedup}>{REGISTRASI.duplikatPetunjuk}</p>
      {mencari && <p style={teksRedup} role="status">{REGISTRASI.duplikatMencari}</p>}
      {!bisaCari && <p style={teksRedup}>{REGISTRASI.duplikatBelumCukup}</p>}
      {galatCari && <div><Tombol type="button" varian="sekunder" onClick={onCari}>Coba periksa lagi</Tombol></div>}
      {galatCari && <Peringatan>{galatCari}</Peringatan>}
      {kandidat && kandidat.length === 0 && <Peringatan nada="biru">{REGISTRASI.duplikatTidakAda}</Peringatan>}
      {kandidat && kandidat.length > 0 && (
        <Kolom jarak="sm">
          <Peringatan nada="kuning">{nikSama ? REGISTRASI.duplikatNikBlokir : REGISTRASI.duplikatDitemukan}</Peringatan>
          <Daftar>
            {kandidat.map((c) => (
              <Bingkai tag="li" jarak="md" key={c.id}>
                <Tumbuh>
                  <strong>{c.nama}</strong>
                  <span style={{ color: token.warna.teksRedup }}> · {c.nomor_rm} · {c.tanggal_lahir}</span>
                </Tumbuh>
                <Lencana warna={c.alasan === 'nik' ? 'merah' : 'kuning'}>{REGISTRASI.duplikatAlasan[c.alasan]}</Lencana>
                <Tombol type="button" varian="sekunder" onClick={() => onPakai(c)}>{REGISTRASI.duplikatPakai}</Tombol>
              </Bingkai>
            ))}
          </Daftar>
          {!nikSama && (
            <KotakCentang id="reg-lanjut-duplikat" label={REGISTRASI.duplikatLanjut} checked={k.konfirmasi_duplikat} onChange={(e) => ubah({ konfirmasi_duplikat: e.target.checked })} />
          )}
        </Kolom>
      )}
    </Kolom>
  );
}

export function LangkahIdentitas({ kandidat, mencari, bisaCari, galatCari, onCari, onPakai, ...dasar }: PropsDuplikat) {
  const { keadaan: k, ubah, galat, tampilGalat } = dasar;
  const g = (b: string) => (tampilGalat ? galat[b] : undefined);
  return (
    <Kolom>
      <BidangKunci {...dasar} awalan="id" />
      <HasilDuplikat {...dasar} kandidat={kandidat} mencari={mencari} bisaCari={bisaCari} galatCari={galatCari} onCari={onCari} onPakai={onPakai} />
      <Isian id="reg-nomor-hp" label="Nomor HP pasien (opsional)" type="tel" value={k.nomor_hp} maxLength={40}
        onChange={(e) => ubah({ nomor_hp: e.target.value })} galat={g('nomor_hp')} autoComplete="off" />
      <Baris>
        <Isian id="reg-tempat" label={REGISTRASI.tempatLahir} value={k.tempat_lahir} onChange={(e) => ubah({ tempat_lahir: e.target.value })} galat={g('tempat_lahir')} autoComplete="off" />
        <Pilihan id="reg-jk" label={REGISTRASI.jenisKelamin} value={k.jenis_kelamin} onChange={(e) => ubah({ jenis_kelamin: e.target.value as KeadaanRegistrasi['jenis_kelamin'] })} opsi={REGISTRASI.jenisKelaminOpsi} galat={g('jenis_kelamin')} />
      </Baris>
      <KotakCentang id="reg-tidak-cakap" label={REGISTRASI.tidakCakap} keterangan={REGISTRASI.tidakCakapKet} checked={k.tidak_cakap} onChange={(e) => ubah(ubahTidakCakap(k, e.target.checked))} />
    </Kolom>
  );
}

export function LangkahSosial({ keadaan: k, ubah, galat, tampilGalat }: Dasar) {
  const g = (b: string) => (tampilGalat ? galat[b] : undefined);
  return (
    <Kolom>
      <Baris>
        <Pilihan id="reg-agama" label={REGISTRASI.agama} value={k.agama} onChange={(e) => ubah({ agama: e.target.value })} opsi={opsiDari(REGISTRASI.agamaOpsi)} galat={g('agama')} />
        <Isian id="reg-suku" label={REGISTRASI.suku} value={k.suku} onChange={(e) => ubah({ suku: e.target.value })} galat={g('suku')} autoComplete="off" />
      </Baris>
      <Baris>
        <Isian id="reg-bahasa" label={REGISTRASI.bahasa} value={k.bahasa} onChange={(e) => ubah({ bahasa: e.target.value })} galat={g('bahasa')} autoComplete="off" />
        <Isian id="reg-pekerjaan" label={REGISTRASI.pekerjaan} value={k.pekerjaan} onChange={(e) => ubah({ pekerjaan: e.target.value })} galat={g('pekerjaan')} autoComplete="off" />
      </Baris>
      <Baris>
        <Pilihan id="reg-pendidikan" label={REGISTRASI.pendidikan} value={k.pendidikan} onChange={(e) => ubah({ pendidikan: e.target.value })} opsi={opsiDari(REGISTRASI.pendidikanOpsi)} galat={g('pendidikan')} />
        <Pilihan id="reg-kawin" label={REGISTRASI.statusKawin} value={k.status_kawin} onChange={(e) => ubah({ status_kawin: e.target.value })} opsi={opsiDari(REGISTRASI.statusKawinOpsi)} galat={g('status_kawin')} />
      </Baris>
    </Kolom>
  );
}

export function LangkahAlamat({ keadaan: k, ubah, galat, tampilGalat }: Dasar) {
  const g = (b: string) => (tampilGalat ? galat[b] : undefined);
  return (
    <Kolom>
      <AreaTeks id="reg-alamat" label={REGISTRASI.alamat} value={k.alamat} onChange={(e) => ubah({ alamat: e.target.value })} />
      <Isian id="reg-wilayah" label={REGISTRASI.kodeWilayah} value={k.kode_wilayah} onChange={(e) => ubah({ kode_wilayah: e.target.value })} galat={g('kode_wilayah')} autoComplete="off" />
      <span style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{REGISTRASI.kodeWilayahKet}</span>
      <Pilihan id="reg-jalur" label={REGISTRASI.jalur} value={k.jalur_identitas} onChange={(e) => ubah(ubahJalur(k, e.target.value as KeadaanRegistrasi['jalur_identitas']))} opsi={REGISTRASI.jalurOpsi} galat={g('jalur_identitas')} />
      {k.jalur_identitas === 'paspor' && <Isian id="reg-paspor" label={REGISTRASI.paspor} value={k.nomor_paspor} onChange={(e) => ubah({ nomor_paspor: e.target.value })} galat={g('nomor_paspor')} autoComplete="off" />}
      {k.jalur_identitas === 'kitas' && <Isian id="reg-kitas" label={REGISTRASI.kitas} value={k.nomor_kitas} onChange={(e) => ubah({ nomor_kitas: e.target.value })} galat={g('nomor_kitas')} autoComplete="off" />}
      {k.jalur_identitas === 'tanpa_identitas' && <Peringatan nada="kuning">{REGISTRASI.tanpaIdentitasInfo}</Peringatan>}
    </Kolom>
  );
}

export function LangkahWali({ keadaan: k, ubah, galat, tampilGalat }: Dasar) {
  const [hubungan, setHubungan] = useState('');
  const [nama, setNama] = useState('');
  const [kontak, setKontak] = useState('');
  const [coba, setCoba] = useState(false);
  const siap = hubungan.trim() !== '' && nama.trim() !== '';

  function tambah() {
    setCoba(true);
    if (!siap) return;
    ubah({ wali: [...k.wali, { hubungan: hubungan.trim(), nama: nama.trim(), kontak: kontak.trim() }] });
    setHubungan('');
    setNama('');
    setKontak('');
    setCoba(false);
  }
  const enterTambah = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      tambah();
    }
  };
  return (
    <Kolom>
      <p style={teksRedup}>{REGISTRASI.waliPetunjuk}</p>
      {tampilGalat && galat.wali && <Peringatan nada="kuning">{galat.wali}</Peringatan>}
      <Bingkai arah="kolom" padding="md" onKeyDown={enterTambah}>
        <Baris>
          <Isian id="wali-hubungan" label={REGISTRASI.waliHubungan} value={hubungan} onChange={(e) => setHubungan(e.target.value)} galat={coba && !hubungan.trim() ? GALAT.wajibDiisi : undefined} autoComplete="off" />
          <Isian id="wali-nama" label={REGISTRASI.waliNama} value={nama} onChange={(e) => setNama(e.target.value)} galat={coba && !nama.trim() ? GALAT.wajibDiisi : undefined} autoComplete="off" />
        </Baris>
        <Isian id="wali-kontak" label={REGISTRASI.waliKontak} value={kontak} onChange={(e) => setKontak(e.target.value)} autoComplete="off" />
        <div><Tombol type="button" varian="sekunder" onClick={tambah}>{REGISTRASI.waliTambah}</Tombol></div>
      </Bingkai>
      {k.wali.length === 0 && <p style={teksRedup}>{REGISTRASI.waliKosong}</p>}
      <Daftar>
        {k.wali.map((w, n) => (
          <Bingkai tag="li" halus key={`${w.nama}-${n}`}>
            <Lencana warna="biru">{w.hubungan}</Lencana>
            <Tumbuh><strong>{w.nama}</strong>{w.kontak && <span style={{ color: token.warna.teksRedup }}> · {w.kontak}</span>}</Tumbuh>
            <Tombol type="button" varian="teks" onClick={() => ubah(hapusWali(k, n))}>{REGISTRASI.waliHapus}</Tombol>
          </Bingkai>
        ))}
      </Daftar>
    </Kolom>
  );
}

export function LangkahJkn({ keadaan: k, ubah, galat, tampilGalat }: Dasar) {
  const g = (b: string) => (tampilGalat ? galat[b] : undefined);
  return (
    <Kolom>
      <p style={teksRedup}>{REGISTRASI.jknPetunjuk}</p>
      <Baris>
        <Isian id="reg-jkn-kartu" label={REGISTRASI.jknKartu} value={k.jkn_nomor_kartu} inputMode="numeric" onChange={(e) => ubah({ jkn_nomor_kartu: e.target.value })} galat={g('jkn_nomor_kartu')} autoComplete="off" />
        <Pilihan id="reg-jkn-kelas" label={REGISTRASI.jknKelas} value={k.jkn_kelas_hak} onChange={(e) => ubah({ jkn_kelas_hak: e.target.value })} opsi={opsiDari(REGISTRASI.jknKelasOpsi)} galat={g('jkn_kelas_hak')} />
      </Baris>
      <Isian id="reg-jkn-fktp" label={REGISTRASI.jknFktp} value={k.jkn_fktp_terdaftar} onChange={(e) => ubah({ jkn_fktp_terdaftar: e.target.value })} galat={g('jkn_fktp_terdaftar')} autoComplete="off" />
    </Kolom>
  );
}

type PropsConsent = Dasar & { teks: TeksPersetujuanDto | null; memuat: boolean; galatMuat: string | null };

export function LangkahConsent({ teks, memuat, galatMuat, ...dasar }: PropsConsent) {
  const { keadaan: k, ubah, galat, tampilGalat } = dasar;
  const g = (b: string) => (tampilGalat ? galat[b] : undefined);
  if (memuat) return <p style={teksRedup}>{REGISTRASI.consentMemuat}</p>;
  if (!teks) return <Peringatan>{galatMuat ?? REGISTRASI.consentTidakAda}</Peringatan>;
  return (
    <Kolom>
      <div>
        <strong>{teks.judul}</strong>
        <span style={{ color: token.warna.teksRedup }}> · {REGISTRASI.consentVersi(teks.versi)}</span>
      </div>
      <Bingkai arah="kolom" padding="md" style={{ display: 'block', whiteSpace: 'pre-line', background: token.warna.kepalaTabel, maxHeight: token.ukuran.tinggiDaftar, overflowY: 'auto' }}>
        {teks.isi}
      </Bingkai>
      <Baris>
        <Pilihan id="reg-bentuk" label={REGISTRASI.consentBentuk} value={k.bentuk} onChange={(e) => ubah({ bentuk: e.target.value as KeadaanRegistrasi['bentuk'] })} opsi={REGISTRASI.consentBentukOpsi} />
        <Pilihan
          id="reg-tanda" label={REGISTRASI.consentPenandatangan} value={k.penandatangan} disabled={k.tidak_cakap}
          onChange={(e) => ubah({ penandatangan: e.target.value as KeadaanRegistrasi['penandatangan'], ...(e.target.value === 'pasien' ? { wali_ke: '' } : {}) })}
          opsi={REGISTRASI.consentPenandatanganOpsi} galat={g('persetujuan.penandatangan')}
        />
      </Baris>
      {k.penandatangan === 'wali' && (
        <Pilihan
          id="reg-wali-ke" label={REGISTRASI.consentWali} value={k.wali_ke} onChange={(e) => ubah({ wali_ke: e.target.value })} galat={g('persetujuan.wali_ke')}
          opsi={[{ nilai: '', label: REGISTRASI.pilih }, ...k.wali.map((w, n) => ({ nilai: String(n), label: `${w.nama} (${w.hubungan})` }))]}
        />
      )}
      <KotakCentang id="reg-setuju" label={REGISTRASI.consentSetuju} checked={k.setuju} onChange={(e) => ubah({ setuju: e.target.checked })} />
      {g('persetujuan.setuju') && <Peringatan nada="kuning">{g('persetujuan.setuju')}</Peringatan>}
    </Kolom>
  );
}

export function LangkahRingkasan({ keadaan, teks }: { keadaan: KeadaanRegistrasi; teks: TeksPersetujuanDto | null }) {
  return <DaftarRingkasan bagian={ringkasanRegistrasi(keadaan, teks)} />;
}

/** Ringkasan pasien yang tetap terlihat di semua langkah (kepala modal). */
export function KonteksPasien({ keadaan: k }: { keadaan: KeadaanRegistrasi }) {
  const status = statusIdentitasDari(k.jalur_identitas);
  return (
    <Sebaris jarak="md">
      <div>
        <div style={{ fontWeight: token.huruf.berat.tebal }}>{k.nama.trim() || REGISTRASI.kosongStrip}</div>
        <div style={{ fontSize: token.huruf.ukuran.kecil, color: token.warna.teksRedup }}>{k.tanggal_lahir || REGISTRASI.kosongStrip}</div>
      </div>
      <Lencana warna={STATUS_IDENTITAS.warna(status)}>{STATUS_IDENTITAS.label(status)}</Lencana>
    </Sebaris>
  );
}
