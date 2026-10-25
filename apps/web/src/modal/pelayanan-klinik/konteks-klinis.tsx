import { CARA_PEMBAYARAN, DAFTAR_PASIEN, KLINIS } from '@klira/shared';
import type { KonteksKlinisDto } from '@klira/shared';
import { token } from '../../gaya/token';
import { daftarAlergi, ringkasTandaVital } from './keadaan-pemeriksaan';
import { Sebaris } from '../../komponen/ui/susunan';

const gayaBlok = { fontSize: token.huruf.ukuran.dasar, lineHeight: 1.4 } as const;
const label = { color: token.warna.teksMenu, display: 'block' } as const;

/** Ringkasan pasien yang tetap terlihat di semua langkah: identitas, alergi, diagnosis aktif, dan tanda vital terakhir. */
export function KonteksKlinis({ konteks, nama, nomorRm }: { konteks: KonteksKlinisDto | null; nama: string; nomorRm: string }) {
  const k = KLINIS.konteks;
  const alergi = daftarAlergi(konteks?.alergi ?? null);
  const ttv = ringkasTandaVital(konteks?.tanda_vital_terakhir ?? null);
  const sub = konteks
    ? [`${DAFTAR_PASIEN.jenisKelaminSingkat[konteks.pasien.jenis_kelamin]}, ${DAFTAR_PASIEN.umur(konteks.pasien.umur_tahun)}`, `RM ${konteks.pasien.nomor_rm}`, CARA_PEMBAYARAN.label(konteks.kunjungan.cara_pembayaran), konteks.kunjungan.poli_nama]
        .filter(Boolean).join(' · ')
    : `RM ${nomorRm}`;
  return (
    <Sebaris jarak="lg" bungkus style={{ minWidth: 0 }}>
      <div>
        <div style={{ fontSize: token.huruf.ukuran.besar, fontWeight: token.huruf.berat.tebal }}>{konteks?.pasien.nama ?? nama}</div>
        <div style={{ ...gayaBlok, color: token.warna.teksMenu }}>{sub}</div>
      </div>
      <div style={gayaBlok}>
        <span style={label}>{k.alergi}</span>
        {alergi.length ? <strong style={{ color: token.warna.status.merah.teks }}>{alergi.join(', ')}</strong> : <span style={{ color: token.warna.teksRedup }}>{konteks ? k.tidakAda : k.memuat}</span>}
      </div>
      <div style={gayaBlok}>
        <span style={label}>{k.diagnosisAktif}</span>
        {konteks?.diagnosis_aktif.length ? <strong>{konteks.diagnosis_aktif.map((d) => `${d.nama} (${d.kode})`).join('; ')}</strong> : <span style={{ color: token.warna.teksRedup }}>{k.tidakAda}</span>}
      </div>
      <div style={gayaBlok}>
        <span style={label}>{k.tandaVital}</span>
        {ttv ? <strong>{ttv}</strong> : <span style={{ color: token.warna.teksRedup }}>{k.tidakAda}</span>}
      </div>
    </Sebaris>
  );
}
