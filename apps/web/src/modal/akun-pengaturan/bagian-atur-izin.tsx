import { useState } from 'react';
import { ATUR_IZIN, NAVIGASI, STATUS_PERIODE } from '@klira/shared';
import type { IzinAkunDto, PenugasanDto } from '../../api-klien/izin';
import { token } from '../../gaya/token';
import { HanyaDenganIzin } from '../../komponen/izin-saja';
import { AreaTeks } from '../../komponen/ui/area-teks';
import { Isian, PesanGalat } from '../../komponen/ui/isian';
import { Lencana } from '../../komponen/ui/lencana';
import { Pilihan } from '../../komponen/ui/pilihan';
import { BarisTabel, SelTabel, Tabel } from '../../komponen/ui/tabel';
import { Tombol } from '../../komponen/ui/tombol';
import { labelIzin } from './keadaan-akun';
import type { BarisIzinForm, IzinKatalog, JenisKatalog } from './keadaan-akun';
import { galatIzinBaru, galatPenugasanBaru, galatUbahPeriode, periodeTeks, statusPeriode, tanggalSaja } from './keadaan-izin';
import type { PenugasanForm } from './keadaan-izin';

const kolom = { display: 'flex', flexDirection: 'column', gap: token.jarak.md } as const;
const baris = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: token.jarak.md } as const;
const kotak = { ...kolom, gap: token.jarak.sm, padding: token.jarak.md, border: `${token.ukuran.garis} solid ${token.warna.garis}`, borderRadius: token.radius.sedang } as const;
const judulBagian = { margin: 0, fontSize: token.huruf.ukuran.besar, fontWeight: token.huruf.berat.tebal } as const;

export type Aksi = { memproses: boolean };

type PeriodeProps = { id: string; mulai: string; hariIni: string; memproses: boolean; onSimpan: (selesai: string) => void };

/** Satu baris aksi periode: Ubah periode (tanggal selesai) dan Akhiri sekarang; tanpa hapus. */
function AksiPeriode({ id, mulai, selesai, hariIni, memproses, onSimpan }: PeriodeProps & { selesai: string | null }) {
  const [ubah, setUbah] = useState(false);
  const [nilai, setNilai] = useState(tanggalSaja(selesai) || hariIni);
  const galat = ubah ? galatUbahPeriode(mulai, nilai) : null;
  if (ubah) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'flex-end', gap: token.jarak.sm }}>
        <Isian id={`${id}-selesai`} label={ATUR_IZIN.selesai} type="date" value={nilai} onChange={(e) => setNilai(e.target.value)} galat={galat ?? undefined} />
        <Tombol type="button" disabled={memproses || !!galat} onClick={() => { onSimpan(nilai); setUbah(false); }}>{ATUR_IZIN.simpanPeriode}</Tombol>
        <Tombol type="button" varian="sekunder" onClick={() => setUbah(false)}>{ATUR_IZIN.batalUbah}</Tombol>
      </div>
    );
  }
  const berakhir = statusPeriode(mulai, selesai, hariIni) === 'berakhir';
  return (
    <div style={{ display: 'inline-flex', gap: token.jarak.sm }}>
      <Tombol type="button" varian="teks" disabled={memproses} onClick={() => setUbah(true)}>{ATUR_IZIN.ubahPeriode}</Tombol>
      {!berakhir && <Tombol type="button" varian="teks" disabled={memproses || galatUbahPeriode(mulai, hariIni) !== null} onClick={() => onSimpan(hariIni)}>{ATUR_IZIN.akhiri}</Tombol>}
    </div>
  );
}

type PenugasanProps = Aksi & {
  data: readonly PenugasanDto[];
  jenis: readonly JenisKatalog[];
  opsiJenis: readonly JenisKatalog[];
  hariIni: string;
  form: PenugasanForm;
  onForm: (f: PenugasanForm) => void;
  onTambah: () => void;
  onPeriode: (id: number, selesai: string) => void;
};

export function BagianPenugasan({ data, jenis, opsiJenis, hariIni, form, onForm, onTambah, onPeriode, memproses }: PenugasanProps) {
  const [coba, setCoba] = useState(false);
  const g = coba ? galatPenugasanBaru(form) : {};
  const nama = (id: number) => jenis.find((j) => j.id === id)?.nama ?? `#${id}`;
  return (
    <section style={kolom} aria-label={ATUR_IZIN.penugasanJudul}>
      <h3 style={judulBagian}>{ATUR_IZIN.penugasanJudul}</h3>
      {data.length === 0 && <p style={{ margin: 0, color: token.warna.teksRedup }}>{ATUR_IZIN.penugasanKosong}</p>}
      {data.length > 0 && (
        <Tabel kolom={[{ judul: ATUR_IZIN.kolom.jenis }, { judul: ATUR_IZIN.kolom.periode }, { judul: ATUR_IZIN.kolom.status }, { judul: ATUR_IZIN.kolom.tindakan, rataKanan: true }]} label={ATUR_IZIN.penugasanJudul}>
          {data.map((p) => {
            const st = statusPeriode(p.mulai, p.selesai, hariIni);
            return (
              <BarisTabel key={p.id}>
                <SelTabel style={{ fontWeight: token.huruf.berat.tebal }}>{nama(p.jenis_akun_id)}</SelTabel>
                <SelTabel>{periodeTeks(p.mulai, p.selesai)}</SelTabel>
                <SelTabel><Lencana warna={STATUS_PERIODE.warna(st)}>{STATUS_PERIODE.label(st)}</Lencana></SelTabel>
                <SelTabel style={{ textAlign: 'right' }}>
                  <HanyaDenganIzin fitur="akses" aksi="perbaikan">
                    <AksiPeriode id={`penugasan-${p.id}`} mulai={p.mulai} selesai={p.selesai} hariIni={hariIni} memproses={memproses} onSimpan={(s) => onPeriode(p.id, s)} />
                  </HanyaDenganIzin>
                </SelTabel>
              </BarisTabel>
            );
          })}
        </Tabel>
      )}
      <HanyaDenganIzin fitur="akses" aksi="input">
        <div style={kotak}>
          <div style={{ fontWeight: token.huruf.berat.sedang }}>{ATUR_IZIN.penugasanTambah}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: token.jarak.md }}>
            <Pilihan
              id="penugasan-jenis"
              label={ATUR_IZIN.jenisPilih}
              value={form.jenis_akun_id}
              onChange={(e) => onForm({ ...form, jenis_akun_id: e.target.value })}
              galat={g.jenis_akun_id}
              opsi={[{ nilai: '', label: opsiJenis.length ? '-' : ATUR_IZIN.jenisTidakAda }, ...opsiJenis.map((j) => ({ nilai: String(j.id), label: j.nama }))]}
            />
            <Isian id="penugasan-mulai" label={ATUR_IZIN.mulai} type="date" value={form.mulai} onChange={(e) => onForm({ ...form, mulai: e.target.value })} galat={g.mulai} />
            <Isian id="penugasan-selesai" label={ATUR_IZIN.selesaiOpsional} type="date" value={form.selesai} onChange={(e) => onForm({ ...form, selesai: e.target.value })} galat={g.selesai} />
          </div>
          <div>
            <Tombol
              type="button"
              varian="sekunder"
              disabled={memproses}
              onClick={() => {
                setCoba(true);
                if (Object.keys(galatPenugasanBaru(form)).length) return;
                setCoba(false);
                onTambah();
              }}
            >
              {ATUR_IZIN.tambahkan}
            </Tombol>
          </div>
        </div>
      </HanyaDenganIzin>
    </section>
  );
}

type IzinProps = Aksi & {
  data: readonly IzinAkunDto[];
  katalog: readonly IzinKatalog[];
  opsi: readonly IzinKatalog[];
  hariIni: string;
  form: BarisIzinForm;
  kata: string;
  onForm: (f: BarisIzinForm) => void;
  onKata: (k: string) => void;
  onTambah: () => void;
  onPeriode: (id: number, selesai: string) => void;
};

export function BagianIzin({ data, katalog, opsi, hariIni, form, kata, onForm, onKata, onTambah, onPeriode, memproses }: IzinProps) {
  const [coba, setCoba] = useState(false);
  const g = coba ? galatIzinBaru(form) : {};
  const nilaiIzin = opsi.some((o) => o.id === form.izin_id) ? String(form.izin_id) : '';
  const nama = (id: number) => {
    const i = katalog.find((x) => x.id === id);
    return i ? labelIzin(i) : `#${id}`;
  };
  return (
    <section style={kolom} aria-label={ATUR_IZIN.izinJudul}>
      <h3 style={judulBagian}>{ATUR_IZIN.izinJudul}</h3>
      {data.length === 0 && <p style={{ margin: 0, color: token.warna.teksRedup }}>{ATUR_IZIN.izinKosong}</p>}
      {data.length > 0 && (
        <Tabel
          kolom={[{ judul: ATUR_IZIN.kolom.tipe }, { judul: ATUR_IZIN.kolom.izin }, { judul: ATUR_IZIN.kolom.alasan }, { judul: ATUR_IZIN.kolom.periode }, { judul: ATUR_IZIN.kolom.status }, { judul: ATUR_IZIN.kolom.tindakan, rataKanan: true }]}
          label={ATUR_IZIN.izinJudul}
        >
          {data.map((i) => {
            const st = statusPeriode(i.mulai, i.selesai, hariIni);
            return (
              <BarisTabel key={i.id}>
                <SelTabel><Lencana warna={i.tipe === 'tambah' ? 'hijau' : 'kuning'}>{ATUR_IZIN.tipeLabel[i.tipe]}</Lencana></SelTabel>
                <SelTabel style={{ fontWeight: token.huruf.berat.tebal }}>{nama(i.izin_id)}</SelTabel>
                <SelTabel>{i.alasan}</SelTabel>
                <SelTabel>{periodeTeks(i.mulai, i.selesai)}</SelTabel>
                <SelTabel><Lencana warna={STATUS_PERIODE.warna(st)}>{STATUS_PERIODE.label(st)}</Lencana></SelTabel>
                <SelTabel style={{ textAlign: 'right' }}>
                  <HanyaDenganIzin fitur="akses" aksi="perbaikan">
                    <AksiPeriode id={`izin-${i.id}`} mulai={i.mulai} selesai={i.selesai} hariIni={hariIni} memproses={memproses} onSimpan={(s) => onPeriode(i.id, s)} />
                  </HanyaDenganIzin>
                </SelTabel>
              </BarisTabel>
            );
          })}
        </Tabel>
      )}
      <HanyaDenganIzin fitur="akses" aksi="input">
        <div style={kotak}>
          <div style={{ fontWeight: token.huruf.berat.sedang }}>{ATUR_IZIN.izinTambah}</div>
          <div style={baris}>
            <Pilihan
              id="atur-izin-tipe"
              label={ATUR_IZIN.tipe}
              value={form.tipe}
              onChange={(e) => onForm({ ...form, tipe: e.target.value as 'tambah' | 'kurang', izin_id: 0 })}
              opsi={[{ nilai: 'tambah', label: ATUR_IZIN.tipeOpsi.tambah }, { nilai: 'kurang', label: ATUR_IZIN.tipeOpsi.kurang }]}
            />
            <Isian id="atur-izin-cari" label={ATUR_IZIN.cariIzin} type="search" value={kata} onChange={(e) => onKata(e.target.value)} />
          </div>
          <Pilihan
            id="atur-izin-pilih"
            label={ATUR_IZIN.pilihIzin}
            value={nilaiIzin}
            onChange={(e) => onForm({ ...form, izin_id: Number(e.target.value) || 0 })}
            galat={g.izin_id}
            opsi={[{ nilai: '', label: opsi.length ? '-' : ATUR_IZIN.izinTidakAda }, ...opsi.map((o) => ({ nilai: String(o.id), label: labelIzin(o) }))]}
          />
          <AreaTeks id="atur-izin-alasan" label={ATUR_IZIN.alasan} required value={form.alasan} onChange={(e) => onForm({ ...form, alasan: e.target.value })} />
          {g.alasan && <PesanGalat id="atur-izin-alasan-galat">{g.alasan}</PesanGalat>}
          <div style={baris}>
            <Isian id="atur-izin-mulai" label={ATUR_IZIN.mulai} type="date" value={form.mulai} onChange={(e) => onForm({ ...form, mulai: e.target.value })} galat={g.mulai} />
            <Isian id="atur-izin-selesai" label={ATUR_IZIN.selesaiOpsional} type="date" value={form.selesai} onChange={(e) => onForm({ ...form, selesai: e.target.value })} galat={g.selesai} />
          </div>
          <div>
            <Tombol
              type="button"
              varian="sekunder"
              disabled={memproses}
              onClick={() => {
                setCoba(true);
                if (Object.keys(galatIzinBaru(form)).length) return;
                setCoba(false);
                onTambah();
              }}
            >
              {ATUR_IZIN.tambahkan}
            </Tombol>
          </div>
        </div>
      </HanyaDenganIzin>
    </section>
  );
}

export const TeksMemuat = () => <p style={{ margin: 0, color: token.warna.teksRedup }}>{NAVIGASI.memuat}</p>;
