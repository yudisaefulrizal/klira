import { useEffect, useState } from 'react';
import { DAFTAR_PASIEN, STATUS_IDENTITAS, TOMBOL } from '@klira/shared';
import type { PasienDetailDto } from '@klira/shared';
import { detailPasien } from '../../api-klien/pasien';
import { GalatApi } from '../../api-klien/klien';
import { NAVIGASI } from '@klira/shared';
import { token } from '../../gaya/token';
import { Panel } from '../../komponen/panel/panel';
import { Lencana } from '../../komponen/ui/lencana';
import { Peringatan } from '../../komponen/ui/peringatan';
import { DaftarRingkasan } from '../../komponen/ui/susunan';
import type { BagianRingkasan } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';

const strip = (v: string | null | undefined): string => (v && v.trim() ? v : '-');

/** Bagian ringkasan dari isi data pasien (fungsi murni untuk panel dan uji). */
export function bagianDetailPasien(p: PasienDetailDto): BagianRingkasan[] {
  const d = DAFTAR_PASIEN.detail;
  return [
    {
      judul: d.nama,
      baris: [
        { label: d.nomorRm, nilai: p.nomor_rm }, { label: d.nik, nilai: strip(p.nik) }, { label: d.ibu, nilai: strip(p.ibu_kandung) },
        { label: d.tempatLahir, nilai: strip(p.tempat_lahir) }, { label: d.tanggalLahir, nilai: p.tanggal_lahir },
        { label: d.jenisKelamin, nilai: DAFTAR_PASIEN.jenisKelamin[p.jenis_kelamin] },
        { label: d.agama, nilai: strip(p.agama) }, { label: d.suku, nilai: strip(p.suku) }, { label: d.bahasa, nilai: strip(p.bahasa) },
        { label: d.pekerjaan, nilai: strip(p.pekerjaan) }, { label: d.pendidikan, nilai: strip(p.pendidikan) }, { label: d.statusKawin, nilai: strip(p.status_kawin) },
        ...(p.tidak_cakap ? [{ label: d.tidakCakap, nilai: DAFTAR_PASIEN.detail.tidakCakap }] : []),
      ],
    },
    {
      judul: d.alamat,
      baris: [
        { label: d.alamat, nilai: strip(p.alamat) }, { label: d.kodeWilayah, nilai: strip(p.kode_wilayah) },
        ...(p.nomor_paspor ? [{ label: d.paspor, nilai: p.nomor_paspor }] : []), ...(p.nomor_kitas ? [{ label: d.kitas, nilai: p.nomor_kitas }] : []),
      ],
    },
    { judul: d.jknKartu, baris: [{ label: d.jknKartu, nilai: strip(p.jkn_nomor_kartu) }, { label: d.jknKelas, nilai: strip(p.jkn_kelas_hak) }, { label: d.jknFktp, nilai: strip(p.jkn_fktp_terdaftar) }] },
    {
      judul: d.wali,
      baris: p.wali.length ? p.wali.map((w) => ({ label: w.hubungan, nilai: w.kontak ? `${w.nama} (${w.kontak})` : w.nama })) : [{ label: d.wali, nilai: d.tanpaWali }],
    },
  ];
}

/** Panel baca-saja isi data pasien; membukanya tercatat di audit (lihat) oleh API. */
export function DetailPasien({ id, nama, onTutup }: { id: number; nama: string; onTutup: () => void }) {
  const [data, setData] = useState<PasienDetailDto | null>(null);
  const [galat, setGalat] = useState<string | null>(null);

  useEffect(() => {
    let batal = false;
    detailPasien(id)
      .then((p) => !batal && setData(p))
      .catch((e) => !batal && setGalat(e instanceof GalatApi ? e.message : DAFTAR_PASIEN.detailGagal));
    return () => {
      batal = true;
    };
  }, [id]);

  return (
    <Panel judul={`${DAFTAR_PASIEN.detailJudul}: ${nama}`} onTutup={onTutup} aksi={<Tombol type="button" varian="sekunder" onClick={onTutup}>{TOMBOL.tutup}</Tombol>}>
      <Peringatan nada="biru">{DAFTAR_PASIEN.detailTercatat}</Peringatan>
      {galat && <Peringatan>{galat}</Peringatan>}
      {!data && !galat && <p style={{ margin: 0, color: token.warna.teksRedup }}>{NAVIGASI.memuat}</p>}
      {data && (
        <>
          <div><Lencana warna={STATUS_IDENTITAS.warna(data.status_identitas)}>{STATUS_IDENTITAS.label(data.status_identitas)}</Lencana></div>
          <DaftarRingkasan bagian={bagianDetailPasien(data)} />
        </>
      )}
    </Panel>
  );
}
