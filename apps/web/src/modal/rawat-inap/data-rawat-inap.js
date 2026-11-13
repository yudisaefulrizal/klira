import { DISPOSISI_PULANG, INDIKATOR_KELAS, KELAS_RAWAT, KLINIS, RAWAT_INAP, TANDA_VITAL } from '@klira/shared';
import { ambilRawatInap, daftarCatatanHarian } from '../../api-klien/rawat-inap.js';
import { tanggalWaktuPendek } from '../../util/format.js';

/** Data rawat inap satu kunjungan IMP (admisi, penempatan, DPJP, CPPT, pemulangan) untuk tampilan rekam medis dan cetak. */
export async function muatDataRawatInap(kunjunganId) {
  const [detail, cppt] = await Promise.all([ambilRawatInap(kunjunganId), daftarCatatanHarian(kunjunganId)]);
  return { detail, cppt };
}

const waktu = (iso) => (iso ? tanggalWaktuPendek(iso) : null);
const periode = (mulai, selesai) => `${waktu(mulai)} – ${selesai ? waktu(selesai) : 'sekarang'}`;

/** Baris-baris "label/nilai" per bagian: dipakai tampilan ringkasan (DaftarRingkasan) dan lembar cetak. */
export function bagianRawatInap({ detail, cppt }) {
  const P = RAWAT_INAP, C = RAWAT_INAP.cppt, U = RAWAT_INAP.pulang;
  const penempatan = detail.penempatan.map((x) => ({
    label: [x.ruang_nama, x.bed_nama].filter(Boolean).join(' · ') || P.penempatan.belumAda,
    nilai: [KELAS_RAWAT.label(x.kelas), INDIKATOR_KELAS.label(x.indikator), x.tarif_nama, periode(x.mulai, x.selesai)].filter(Boolean).join(' · '),
  }));
  const dpjp = (detail.dpjp_riwayat ?? detail.dpjp).map((x) => ({
    label: x.tipe === 'ATND' ? P.admisi.dpjpUtama : P.admisi.dpjpBersama,
    nilai: x.mulai ? `${x.nama} · ${periode(x.mulai, x.selesai)}` : x.nama,
  }));
  const bagian = [{
    judul: P.judul,
    baris: [{ label: P.admisi.spri, nilai: detail.kunjungan.spri || '-' }, { label: 'Mulai dirawat', nilai: waktu(detail.kunjungan.mulai) }, ...dpjp, ...penempatan],
  }, {
    judul: C.judul,
    baris: cppt.length ? [...cppt].sort((a, b) => a.waktu.localeCompare(b.waktu)).map((c) => {
      const vital = c.tanda_vital ? TANDA_VITAL.filter((t) => c.tanda_vital[t.kunci] != null).map((t) => `${KLINIS.tandaVital[t.kunci]} ${c.tanda_vital[t.kunci]}`).join(' · ') : '';
      const isi = [['S', c.subjektif], ['O', c.objektif], ['A', c.asesmen], ['P', c.rencana], [C.instruksi, c.instruksi]].filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`);
      return { label: [waktu(c.waktu), c.dibuat_oleh_nama ? C.oleh(c.dibuat_oleh_nama) : null].filter(Boolean).join(' · '), nilai: [...isi, vital].filter(Boolean).join('\n') };
    }) : [{ label: C.judul, nilai: C.kosong }],
  }];
  const m = detail.pemulangan;
  if (m) {
    bagian.push({
      judul: U.judul,
      baris: [
        { label: U.disposisi, nilai: DISPOSISI_PULANG.label(m.disposisi) },
        { label: U.ringkasan, nilai: m.ringkasan || '-' },
        { label: U.diagnosis, nilai: m.diagnosis_akhir || '-' },
        { label: U.kondisi, nilai: m.kondisi_pulang || '-' },
        { label: U.tindak, nilai: m.tindak_lanjut || '-' },
        { label: 'Dipulangkan', nilai: [waktu(m.waktu), m.dibuat_oleh_nama].filter(Boolean).join(' · ') },
      ],
    });
  }
  return bagian;
}
