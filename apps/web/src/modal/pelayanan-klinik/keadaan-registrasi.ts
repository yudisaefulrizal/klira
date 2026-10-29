import { DAFTAR_PASIEN, REGISTRASI, registrasiPasienMasukan, statusIdentitasDari, STATUS_IDENTITAS } from '@klira/shared';
import type { BagianRingkasan } from '../../komponen/ui/susunan';
import type { JalurIdentitas, KandidatDuplikatDto, RegistrasiPasienKirim, TeksPersetujuanDto } from '@klira/shared';

export type WaliForm = { hubungan: string; nama: string; kontak: string };

/** Seluruh isian modal Registrasi pasien baru; semuanya teks agar mudah disimpan sebagai draf. */
export type KeadaanRegistrasi = {
  nama: string;
  nomor_hp: string;
  nik: string;
  tanggal_lahir: string;
  ibu_kandung: string;
  tempat_lahir: string;
  jenis_kelamin: '' | 'laki_laki' | 'perempuan';
  tidak_cakap: boolean;
  agama: string;
  suku: string;
  bahasa: string;
  pekerjaan: string;
  pendidikan: string;
  status_kawin: string;
  alamat: string;
  kode_wilayah: string;
  jalur_identitas: JalurIdentitas;
  nomor_paspor: string;
  nomor_kitas: string;
  wali: WaliForm[];
  jkn_nomor_kartu: string;
  jkn_kelas_hak: string;
  jkn_fktp_terdaftar: string;
  bentuk: 'tertulis' | 'lisan';
  penandatangan: 'pasien' | 'wali';
  /** Indeks wali sebagai teks (nilai pilihan); kosong = belum dipilih. */
  wali_ke: string;
  setuju: boolean;
  konfirmasi_duplikat: boolean;
};

/** Bidang yang tidak boleh masuk draf lokal: identitas, kontak, JKN, wali, persetujuan (komputer bersama). */
export const BIDANG_SENSITIF_REGISTRASI = [
  'nama', 'nomor_hp', 'nik', 'tanggal_lahir', 'ibu_kandung', 'tempat_lahir', 'alamat', 'kode_wilayah', 'nomor_paspor', 'nomor_kitas', 'wali',
  'jkn_nomor_kartu', 'jkn_kelas_hak', 'jkn_fktp_terdaftar', 'setuju', 'konfirmasi_duplikat',
] as const;

export const awalRegistrasi = (): KeadaanRegistrasi => ({
  nama: '', nomor_hp: '', nik: '', tanggal_lahir: '', ibu_kandung: '', tempat_lahir: '', jenis_kelamin: '', tidak_cakap: false,
  agama: '', suku: '', bahasa: '', pekerjaan: '', pendidikan: '', status_kawin: '',
  alamat: '', kode_wilayah: '', jalur_identitas: 'nik', nomor_paspor: '', nomor_kitas: '',
  wali: [], jkn_nomor_kartu: '', jkn_kelas_hak: '', jkn_fktp_terdaftar: '',
  bentuk: 'tertulis', penandatangan: 'pasien', wali_ke: '', setuju: false, konfirmasi_duplikat: false,
});

export const JUMLAH_LANGKAH_REGISTRASI = 7;
const L = { identitas: 0, sosial: 1, alamat: 2, wali: 3, jkn: 4, consent: 5, ringkasan: 6 } as const;

/** Bentuk permintaan API dari isian (skema bersama di packages/shared memvalidasi dan menormalkan). */
export function bentukRegistrasi(k: KeadaanRegistrasi, teksId: number | null): RegistrasiPasienKirim {
  const wali = k.penandatangan === 'wali' && k.wali_ke !== '' ? Number(k.wali_ke) : null;
  return {
    jalur_identitas: k.jalur_identitas,
    nik: k.jalur_identitas === 'tanpa_identitas' ? undefined : k.nik,
    nama: k.nama,
    nomor_hp: k.nomor_hp,
    ibu_kandung: k.ibu_kandung,
    tempat_lahir: k.tempat_lahir,
    tanggal_lahir: k.tanggal_lahir,
    jenis_kelamin: k.jenis_kelamin as 'laki_laki',
    agama: k.agama, suku: k.suku, bahasa: k.bahasa, pekerjaan: k.pekerjaan, pendidikan: k.pendidikan, status_kawin: k.status_kawin,
    alamat: k.alamat, kode_wilayah: k.kode_wilayah,
    nomor_paspor: k.jalur_identitas === 'paspor' ? k.nomor_paspor : undefined,
    nomor_kitas: k.jalur_identitas === 'kitas' ? k.nomor_kitas : undefined,
    jkn_nomor_kartu: k.jkn_nomor_kartu, jkn_kelas_hak: k.jkn_kelas_hak, jkn_fktp_terdaftar: k.jkn_fktp_terdaftar,
    tidak_cakap: k.tidak_cakap,
    wali: k.wali.map((w) => ({ hubungan: w.hubungan, nama: w.nama, kontak: w.kontak })),
    persetujuan: {
      teks_persetujuan_id: teksId ?? 0,
      bentuk: k.bentuk,
      penandatangan: k.penandatangan,
      wali_ke: wali !== null && Number.isInteger(wali) ? wali : null,
      setuju: k.setuju as true,
    },
    konfirmasi_duplikat: k.konfirmasi_duplikat,
  };
}

const LANGKAH_BIDANG: Record<string, number> = {
  nomor_hp: L.identitas, nama: L.identitas, nik: L.identitas, tanggal_lahir: L.identitas, ibu_kandung: L.identitas, tempat_lahir: L.identitas, jenis_kelamin: L.identitas,
  tidak_cakap: L.identitas,
  agama: L.sosial, suku: L.sosial, bahasa: L.sosial, pekerjaan: L.sosial, pendidikan: L.sosial, status_kawin: L.sosial,
  alamat: L.alamat, kode_wilayah: L.alamat, jalur_identitas: L.alamat, nomor_paspor: L.alamat, nomor_kitas: L.alamat,
  wali: L.wali,
  jkn_nomor_kartu: L.jkn, jkn_kelas_hak: L.jkn, jkn_fktp_terdaftar: L.jkn,
  persetujuan: L.consent,
};

export type GalatRegistrasi = {
  /** Pesan pertama tiap langkah (null = sah). */
  perLangkah: (string | null)[];
  /** Pesan per bidang, kunci = jalur Zod (mis. `nik`, `persetujuan.setuju`). */
  bidang: Record<string, string>;
};

/**
 * Galat per langkah dan per bidang. Validasi isian memakai skema Zod bersama; langkah Identitas memakai
 * aturan tambahan: kandidat harus ditinjau (NIK sama memblokir, selain itu dinyatakan berbeda).
 */
export function galatRegistrasi(k: KeadaanRegistrasi, teksId: number | null, kandidat: readonly KandidatDuplikatDto[] | null): GalatRegistrasi {
  const perLangkah: (string | null)[] = Array(JUMLAH_LANGKAH_REGISTRASI).fill(null);
  const bidang: Record<string, string> = {};
  const r = registrasiPasienMasukan.safeParse(bentukRegistrasi(k, teksId));
  if (!r.success) {
    for (const i of r.error.issues) {
      const jalur = i.path.join('.');
      bidang[jalur] ??= i.message;
      const langkah = LANGKAH_BIDANG[String(i.path[0])];
      if (langkah !== undefined) perLangkah[langkah] ??= i.message;
    }
  }
  if (teksId === null) {
    bidang['persetujuan.teks_persetujuan_id'] = REGISTRASI.consentTidakAda;
    perLangkah[L.consent] ??= REGISTRASI.consentTidakAda;
  }
  if (kandidat?.some((c) => c.alasan === 'nik')) perLangkah[L.identitas] = REGISTRASI.duplikatNikBlokir;
  else if (kandidat?.length && !k.konfirmasi_duplikat) perLangkah[L.identitas] = REGISTRASI.duplikatPerluTinjau;
  return { perLangkah, bidang };
}

/** Cukup data untuk mencari duplikat: NIK 16 digit, atau nama dengan tanggal lahir dan ibu kandung. */
export const bisaCariDuplikat = (k: Pick<KeadaanRegistrasi, 'nik' | 'nama' | 'tanggal_lahir' | 'ibu_kandung'>): boolean =>
  /^\d{16}$/.test(k.nik) || (!!k.nama.trim() && !!k.tanggal_lahir && !!k.ibu_kandung.trim());

/** Isian pencarian duplikat; kosong tidak dikirim. */
export function isianCariDuplikat(k: Pick<KeadaanRegistrasi, 'nik' | 'nama' | 'tanggal_lahir' | 'ibu_kandung'>) {
  return {
    ...(/^\d{16}$/.test(k.nik) ? { nik: k.nik } : {}),
    ...(k.nama.trim() ? { nama: k.nama.trim() } : {}),
    ...(k.tanggal_lahir ? { tanggal_lahir: k.tanggal_lahir } : {}),
    ...(k.ibu_kandung.trim() ? { ibu_kandung: k.ibu_kandung.trim() } : {}),
  };
}

/** Bidang kunci pencarian duplikat: mengubahnya membuat hasil pencarian lama tidak berlaku. */
export const BIDANG_KUNCI_DUPLIKAT = ['nik', 'nama', 'tanggal_lahir', 'ibu_kandung'] as const;

/** Isian yang bergantung jalur identitas dikosongkan saat jalur berubah (pasien tanpa identitas tidak ber-NIK). */
export function ubahJalur(k: KeadaanRegistrasi, jalur: JalurIdentitas): KeadaanRegistrasi {
  return {
    ...k,
    jalur_identitas: jalur,
    nik: jalur === 'tanpa_identitas' ? '' : k.nik,
    nomor_paspor: jalur === 'paspor' ? k.nomor_paspor : '',
    nomor_kitas: jalur === 'kitas' ? k.nomor_kitas : '',
    konfirmasi_duplikat: false,
  };
}

/** Pasien tidak cakap ditandatangani wali; kembali ke pasien bila tidak ada wali yang bisa dipilih. */
export function ubahTidakCakap(k: KeadaanRegistrasi, tidakCakap: boolean): KeadaanRegistrasi {
  return { ...k, tidak_cakap: tidakCakap, ...(tidakCakap ? { penandatangan: 'wali' as const } : {}) };
}

/** Hapus wali ke-n dan jaga penunjuk wali penandatangan tetap sah. */
export function hapusWali(k: KeadaanRegistrasi, n: number): KeadaanRegistrasi {
  const wali = k.wali.filter((_, i) => i !== n);
  const ke = k.wali_ke === '' ? -1 : Number(k.wali_ke);
  const waliKe = ke === n ? '' : ke > n ? String(ke - 1) : k.wali_ke;
  return { ...k, wali, wali_ke: waliKe, ...(wali.length === 0 && !k.tidak_cakap ? { penandatangan: 'pasien' as const, wali_ke: '' } : {}) };
}

const nilai = (v: string | undefined | null): string => (v && v.trim() ? v.trim() : REGISTRASI.kosongStrip);

/** Ringkasan pada langkah terakhir. */
export function ringkasanRegistrasi(k: KeadaanRegistrasi, teks: TeksPersetujuanDto | null): BagianRingkasan[] {
  const d = DAFTAR_PASIEN.detail;
  const R = REGISTRASI.ringkasanJudul;
  const jalur = REGISTRASI.jalurOpsi.find((o) => o.nilai === k.jalur_identitas)?.label ?? k.jalur_identitas;
  const penandatangan = k.penandatangan === 'wali' && k.wali_ke !== '' ? k.wali[Number(k.wali_ke)]?.nama : undefined;
  return [
    {
      judul: R.identitas,
      baris: [
        { label: d.nama, nilai: nilai(k.nama) }, { label: d.nik, nilai: nilai(k.nik) }, { label: d.tanggalLahir, nilai: nilai(k.tanggal_lahir) },
        { label: 'Nomor HP pasien', nilai: nilai(k.nomor_hp) }, { label: d.ibu, nilai: nilai(k.ibu_kandung) }, { label: d.tempatLahir, nilai: nilai(k.tempat_lahir) },
        { label: d.jenisKelamin, nilai: k.jenis_kelamin ? DAFTAR_PASIEN.jenisKelamin[k.jenis_kelamin] : REGISTRASI.kosongStrip },
        { label: d.identitas, nilai: STATUS_IDENTITAS.label(statusIdentitasDari(k.jalur_identitas)) },
        ...(k.tidak_cakap ? [{ label: d.tidakCakap, nilai: DAFTAR_PASIEN.detail.tidakCakap }] : []),
      ],
    },
    {
      judul: R.sosial,
      baris: [
        { label: d.agama, nilai: nilai(k.agama) }, { label: d.suku, nilai: nilai(k.suku) }, { label: d.bahasa, nilai: nilai(k.bahasa) },
        { label: d.pekerjaan, nilai: nilai(k.pekerjaan) }, { label: d.pendidikan, nilai: nilai(k.pendidikan) }, { label: d.statusKawin, nilai: nilai(k.status_kawin) },
      ],
    },
    {
      judul: R.alamat,
      baris: [
        { label: d.alamat, nilai: nilai(k.alamat) }, { label: d.kodeWilayah, nilai: nilai(k.kode_wilayah) }, { label: d.jalur, nilai: jalur },
        ...(k.jalur_identitas === 'paspor' ? [{ label: d.paspor, nilai: nilai(k.nomor_paspor) }] : []),
        ...(k.jalur_identitas === 'kitas' ? [{ label: d.kitas, nilai: nilai(k.nomor_kitas) }] : []),
      ],
    },
    {
      judul: R.wali,
      baris: k.wali.length ? k.wali.map((w) => ({ label: w.hubungan, nilai: w.kontak.trim() ? `${w.nama} (${w.kontak.trim()})` : w.nama })) : [{ label: d.wali, nilai: REGISTRASI.waliKosong }],
    },
    {
      judul: R.jkn,
      baris: [{ label: d.jknKartu, nilai: nilai(k.jkn_nomor_kartu) }, { label: d.jknKelas, nilai: nilai(k.jkn_kelas_hak) }, { label: d.jknFktp, nilai: nilai(k.jkn_fktp_terdaftar) }],
    },
    {
      judul: R.consent,
      baris: [
        { label: REGISTRASI.consentVersi(teks?.versi ?? 0), nilai: teks?.judul ?? REGISTRASI.kosongStrip },
        { label: REGISTRASI.consentBentuk, nilai: REGISTRASI.consentBentukOpsi.find((o) => o.nilai === k.bentuk)?.label ?? k.bentuk },
        { label: REGISTRASI.consentPenandatangan, nilai: penandatangan ?? REGISTRASI.consentPenandatanganOpsi.find((o) => o.nilai === k.penandatangan)?.label ?? k.penandatangan },
      ],
    },
  ];
}
