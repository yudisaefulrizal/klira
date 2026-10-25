import { ADDENDUM_TEKS, INTERPRETASI_HASIL, STATUS_PENGESAHAN } from '@klira/shared';
import type { AddendumDto, InterpretasiHasil } from '@klira/shared';
import { token } from '../../gaya/token';
import { tanggalWaktuPendek } from '../../util/format';
import { Bingkai } from '../ui/kartu';
import { Lencana } from '../ui/lencana';
import { Kisi, Kolom, PasanganRingkasan, Sebaris, Tumbuh } from '../ui/susunan';

/** Urutan bidang isi addendum yang ditampilkan; isi lain yang tak dikenal tidak ditampilkan mentah. */
const BIDANG = ['pemeriksaan', 'nilai', 'satuan', 'interpretasi', 'rujukan', 'catatan', 'kode_loinc'] as const;

const teksIsi = (k: string, v: unknown): string => {
  if (v === null || v === undefined || v === '') return '-';
  if (k === 'interpretasi') return INTERPRETASI_HASIL.nilai.includes(v as InterpretasiHasil) ? INTERPRETASI_HASIL.label(v as InterpretasiHasil) : String(v);
  return String(v);
};

/**
 * Tampilan addendum (4.2): isi susulan, versi, pengesah, dan penanda kirim ulang. Dipakai berkas hasil dan panel; CPPT dan resume nanti memakai
 * komponen yang sama. Addendum hanya dibaca (tidak menimpa catatan yang sudah disahkan).
 */
export function TampilanAddendum({ daftar }: { daftar: readonly AddendumDto[] }) {
  if (!daftar.length) return null;
  return (
    <Kolom jarak="sm">
      {daftar.map((a) => (
        <Bingkai key={a.id} arah="kolom" halus>
          <Sebaris bungkus>
            <strong>{ADDENDUM_TEKS.versi(a.versi)}</strong>
            <Lencana warna={STATUS_PENGESAHAN.warna(a.verifikasi)}>{STATUS_PENGESAHAN.label(a.verifikasi)}</Lencana>
            <Tumbuh style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{tanggalWaktuPendek(a.waktu)}</Tumbuh>
            <Lencana warna={a.perlu_kirim_ulang ? 'kuning' : 'hijau'}>{a.perlu_kirim_ulang ? ADDENDUM_TEKS.kirimUlang : ADDENDUM_TEKS.terkirim}</Lencana>
          </Sebaris>
          <Kisi tag="dl" kolom="max-content 1fr" jarakBaris="xs">
            {BIDANG.filter((k) => k in a.isi).map((k) => (
              <PasanganRingkasan key={k} label={ADDENDUM_TEKS.isiLabel[k] ?? k} nilai={teksIsi(k, a.isi[k])} />
            ))}
          </Kisi>
          <span style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>
            {a.pengesahan ? ADDENDUM_TEKS.disahkanOleh(a.pengesahan.pengguna_nama, a.pengesahan.jenis_akun) : ADDENDUM_TEKS.oleh(a.dibuat_oleh_nama ?? '-')}
          </span>
        </Bingkai>
      ))}
    </Kolom>
  );
}
