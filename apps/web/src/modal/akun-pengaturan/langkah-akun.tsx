import { useState } from 'react';
import { AKUN_BARU, NAVIGASI } from '@klira/shared';
import { token } from '../../gaya/token';
import { Isian } from '../../komponen/ui/isian';
import { KotakCentang } from '../../komponen/ui/kotak-centang';
import { Lencana } from '../../komponen/ui/lencana';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Pilihan } from '../../komponen/ui/pilihan';
import { Tombol } from '../../komponen/ui/tombol';
import {
  galatBarisIzin, galatData, galatPenugasan, galatProfil, labelIzin, opsiIzin, ringkasanAkun,
} from './keadaan-akun';
import type { BarisIzinForm, IzinKatalog, JenisKatalog, KeadaanAkun } from './keadaan-akun';
import { Baris, Daftar, Kisi, Kolom, PasanganRingkasan, Sebaris, Tumbuh } from '../../komponen/ui/susunan';
import { Bingkai } from '../../komponen/ui/kartu';
import { Kode } from '../../komponen/ui/penanda';

type Ubah = (perubahan: Partial<KeadaanAkun>) => void;
type DasarProps = { keadaan: KeadaanAkun; ubah: Ubah; tampilGalat: boolean };


export function LangkahData({ keadaan: k, ubah, tampilGalat }: DasarProps) {
  const g = tampilGalat ? galatData(k) : {};
  return (
    <Kolom>
      <Isian id="akun-nama" label={AKUN_BARU.nama} value={k.nama} onChange={(e) => ubah({ nama: e.target.value })} galat={g.nama} autoComplete="off" />
      <Isian id="akun-nik" label={AKUN_BARU.nik} value={k.nik} inputMode="numeric" maxLength={16} onChange={(e) => ubah({ nik: e.target.value.replace(/\D/g, '') })} galat={g.nik} autoComplete="off" />
      <Isian id="akun-username" label={AKUN_BARU.username} value={k.username} onChange={(e) => ubah({ username: e.target.value })} galat={g.username} autoComplete="off" />
      <span style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{AKUN_BARU.petunjukUsername}</span>
    </Kolom>
  );
}

export function LangkahProfil({ keadaan: k, ubah, tampilGalat }: DasarProps) {
  const g = tampilGalat ? galatProfil(k) : {};
  const adaProfil = k.profesi !== '';
  return (
    <Kolom>
      <Pilihan
        id="akun-profesi"
        label={AKUN_BARU.profesi}
        value={k.profesi}
        onChange={(e) => ubah({ profesi: e.target.value })}
        galat={g.profesi}
        opsi={[{ nilai: '', label: AKUN_BARU.tanpaProfil }, ...AKUN_BARU.profesiOpsi.map((p) => ({ nilai: p, label: p }))]}
      />
      {adaProfil && (
        <>
          <Baris>
            <Isian id="akun-sip" label={AKUN_BARU.nomorSip} value={k.nomor_sip} onChange={(e) => ubah({ nomor_sip: e.target.value })} galat={g.nomor_sip} autoComplete="off" />
            <Isian id="akun-masa-sip" label={AKUN_BARU.masaSip} type="date" value={k.masa_berlaku_sip} onChange={(e) => ubah({ masa_berlaku_sip: e.target.value })} galat={g.masa_berlaku_sip} />
          </Baris>
          <Isian id="akun-ihs" label={AKUN_BARU.ihs} value={k.ihs_practitioner_id} onChange={(e) => ubah({ ihs_practitioner_id: e.target.value })} galat={g.ihs_practitioner_id} autoComplete="off" />
          <Peringatan nada="biru">{AKUN_BARU.petunjukIhs}</Peringatan>
        </>
      )}
    </Kolom>
  );
}

type JenisProps = DasarProps & { jenis: readonly JenisKatalog[]; hariIni: string; memuat: boolean };

export function LangkahJenis({ keadaan: k, ubah, tampilGalat, jenis, hariIni, memuat }: JenisProps) {
  const g = tampilGalat ? galatPenugasan(k) : {};
  const aktif = jenis.filter((j) => j.aktif);
  function pilih(id: number, on: boolean) {
    const sisa = { ...k.penugasan };
    if (on) sisa[id] = { mulai: hariIni, selesai: '' };
    else delete sisa[id];
    ubah({ penugasan: sisa });
  }
  if (memuat) return <p style={{ margin: 0, color: token.warna.teksRedup }}>{NAVIGASI.memuat}</p>;
  return (
    <Kolom>
      <p style={{ margin: 0, color: token.warna.teksRedup }}>{AKUN_BARU.jenisPetunjuk}</p>
      {g._ && <Peringatan nada="kuning">{g._}</Peringatan>}
      {aktif.length === 0 && <Peringatan nada="kuning">{AKUN_BARU.jenisKosong}</Peringatan>}
      {aktif.map((j) => {
        const p = k.penugasan[j.id];
        return (
          <Bingkai arah="kolom" padding="md" key={j.id}>
            <KotakCentang id={`jenis-${j.id}`} label={j.nama} keterangan={j.syarat_profesi ? AKUN_BARU.syaratProfesi(j.syarat_profesi) : undefined} checked={!!p} onChange={(e) => pilih(j.id, e.target.checked)} />
            {p && (
              <Baris>
                <Isian id={`jenis-${j.id}-mulai`} label={AKUN_BARU.mulai} type="date" value={p.mulai} onChange={(e) => ubah({ penugasan: { ...k.penugasan, [j.id]: { ...p, mulai: e.target.value } } })} galat={g[String(j.id)]} />
                <Isian id={`jenis-${j.id}-selesai`} label={AKUN_BARU.selesai} type="date" value={p.selesai} onChange={(e) => ubah({ penugasan: { ...k.penugasan, [j.id]: { ...p, selesai: e.target.value } } })} />
              </Baris>
            )}
          </Bingkai>
        );
      })}
    </Kolom>
  );
}

type IzinProps = DasarProps & { jenis: readonly JenisKatalog[]; katalog: readonly IzinKatalog[]; hariIni: string; memuat: boolean };

export function LangkahIzin({ keadaan: k, ubah, jenis, katalog, hariIni, memuat }: IzinProps) {
  const [tipe, setTipe] = useState<'tambah' | 'kurang'>('tambah');
  const [kata, setKata] = useState('');
  const [izinId, setIzinId] = useState('');
  const [alasan, setAlasan] = useState('');
  const [mulai, setMulai] = useState(hariIni);
  const [selesai, setSelesai] = useState('');
  const [coba, setCoba] = useState(false);

  const terpilih = jenis.filter((j) => k.penugasan[j.id]);
  const opsi = opsiIzin(tipe, katalog, terpilih, k.izin, kata);
  const calon: BarisIzinForm = { izin_id: Number(izinId) || 0, tipe, alasan, mulai, selesai };
  const g = coba ? galatBarisIzin(calon) : {};
  const nilaiIzin = opsi.some((o) => String(o.id) === izinId) ? izinId : '';

  function tambah() {
    setCoba(true);
    if (Object.keys(galatBarisIzin(calon)).length) return;
    ubah({ izin: [...k.izin, { ...calon, alasan: alasan.trim() }] });
    setIzinId('');
    setAlasan('');
    setSelesai('');
    setCoba(false);
  }
  const enterTambah = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      tambah();
    }
  };
  const nama = (id: number) => katalog.find((i) => i.id === id);

  if (memuat) return <p style={{ margin: 0, color: token.warna.teksRedup }}>{NAVIGASI.memuat}</p>;
  return (
    <Kolom>
      <Bingkai arah="kolom" padding="md" onKeyDown={enterTambah}>
        <Baris>
          <Pilihan id="izin-tipe" label={AKUN_BARU.izinTipe} value={tipe} onChange={(e) => { setTipe(e.target.value as 'tambah' | 'kurang'); setIzinId(''); }} opsi={[{ nilai: 'tambah', label: AKUN_BARU.izinTipeOpsi.tambah }, { nilai: 'kurang', label: AKUN_BARU.izinTipeOpsi.kurang }]} />
          <Isian id="izin-cari" label={AKUN_BARU.izinCari} type="search" value={kata} onChange={(e) => setKata(e.target.value)} />
        </Baris>
        <Pilihan
          id="izin-pilih"
          label={AKUN_BARU.izinPilih}
          value={nilaiIzin}
          onChange={(e) => setIzinId(e.target.value)}
          galat={g.izin_id}
          opsi={[{ nilai: '', label: opsi.length ? '-' : AKUN_BARU.izinTidakAda }, ...opsi.map((i) => ({ nilai: String(i.id), label: labelIzin(i) }))]}
        />
        <Isian id="izin-alasan" label={AKUN_BARU.izinAlasan} value={alasan} onChange={(e) => setAlasan(e.target.value)} galat={g.alasan} autoComplete="off" />
        <Baris>
          <Isian id="izin-mulai" label={AKUN_BARU.mulai} type="date" value={mulai} onChange={(e) => setMulai(e.target.value)} galat={g.mulai} />
          <Isian id="izin-selesai" label={AKUN_BARU.selesai} type="date" value={selesai} onChange={(e) => setSelesai(e.target.value)} galat={g.selesai} />
        </Baris>
        <div><Tombol type="button" varian="sekunder" onClick={tambah}>{AKUN_BARU.izinTambahkan}</Tombol></div>
      </Bingkai>
      {k.izin.length === 0 && <p style={{ margin: 0, color: token.warna.teksRedup }}>{AKUN_BARU.izinKosong}</p>}
      <Daftar>
        {k.izin.map((b, n) => {
          const i = nama(b.izin_id);
          return (
            <Bingkai tag="li" halus key={`${b.tipe}-${b.izin_id}`}>
              <Lencana warna={b.tipe === 'tambah' ? 'hijau' : 'kuning'}>{b.tipe === 'tambah' ? AKUN_BARU.izinTambahLabel : AKUN_BARU.izinKurangLabel}</Lencana>
              <Tumbuh>
                <strong>{i ? labelIzin(i) : `#${b.izin_id}`}</strong>
                <span style={{ color: token.warna.teksRedup }}> — {b.alasan}</span>
              </Tumbuh>
              <Tombol type="button" varian="teks" onClick={() => ubah({ izin: k.izin.filter((_, x) => x !== n) })}>{AKUN_BARU.izinHapus}</Tombol>
            </Bingkai>
          );
        })}
      </Daftar>
    </Kolom>
  );
}

export function LangkahRingkasan({ keadaan, jenis, katalog }: { keadaan: KeadaanAkun; jenis: readonly JenisKatalog[]; katalog: readonly IzinKatalog[] }) {
  return (
    <Kolom>
      {ringkasanAkun(keadaan, jenis, katalog).map((b) => (
        <Kolom tag="section" jarak="xs" key={b.judul}>
          <h4 style={{ margin: 0, fontSize: token.huruf.ukuran.besar, fontWeight: token.huruf.berat.tebal }}>{b.judul}</h4>
          <Kisi tag="dl" kolom="max-content 1fr" jarakBaris="xs">
            {b.baris.map((r) => (
              <PasanganRingkasan key={r.label} label={r.label} nilai={r.nilai} />
            ))}
          </Kisi>
        </Kolom>
      ))}
    </Kolom>
  );
}

/** Hasil: kata sandi awal ditampilkan sekali. */
export function IsiHasilAkun({ username, kataSandi, jumlahPeringatan }: { username: string; kataSandi: string; jumlahPeringatan: number }) {
  const [tersalin, setTersalin] = useState(false);
  async function salin() {
    try {
      await navigator.clipboard.writeText(kataSandi);
      setTersalin(true);
    } catch {
      setTersalin(false);
    }
  }
  return (
    <>
      <Peringatan nada="kuning">{AKUN_BARU.kataSandiPeringatan}</Peringatan>
      <Kolom jarak="xs">
        <span style={{ color: token.warna.teksRedup }}>{AKUN_BARU.username}</span>
        <strong>{username}</strong>
      </Kolom>
      <Kolom jarak="xs">
        <span style={{ color: token.warna.teksRedup }}>{AKUN_BARU.kataSandiAwal}</span>
        <Sebaris jarak="md">
          <Kode data-testid="kata-sandi-awal">{kataSandi}</Kode>
          <Tombol type="button" varian="sekunder" onClick={() => void salin()}>{tersalin ? AKUN_BARU.tersalin : AKUN_BARU.salin}</Tombol>
        </Sebaris>
      </Kolom>
      {jumlahPeringatan > 0 && <Peringatan nada="biru">{AKUN_BARU.peringatanTercatat(jumlahPeringatan)}</Peringatan>}
    </>
  );
}
