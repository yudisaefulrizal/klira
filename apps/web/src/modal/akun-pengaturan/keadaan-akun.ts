import { AKUN_BARU, dataAkun, izinAkunPembuatan, kunciIzin, penugasanAkunBaru, profilProfesiBaru } from '@klira/shared';
import type { KonfirmasiPeringatan, PenggunaBaruMasukan } from '@klira/shared';
import type { ZodType } from 'zod';
import { saringTeks } from '../../util/saring-teks';

export type IzinKatalog = { id: number; fitur: string; aksi: string; cakupan: string };
export type JenisKatalog = { id: number; nama: string; syarat_profesi: string | null; aktif: boolean; izin: IzinKatalog[] };

export type PeriodeForm = { mulai: string; selesai: string };
export type BarisIzinForm = { izin_id: number; tipe: 'tambah' | 'kurang'; alasan: string; mulai: string; selesai: string };

/** Bidang yang tidak pernah masuk draf lokal (komputer klinik bersama). */
export const BIDANG_SENSITIF_AKUN = ['nik', 'nomor_sip', 'ihs_practitioner_id'] as const;

/** Seluruh isian modal pembuatan akun; semuanya teks agar mudah disimpan sebagai draf. */
export type KeadaanAkun = {
  nama: string;
  nik: string;
  username: string;
  /** Kosong = tanpa profil profesi. */
  profesi: string;
  nomor_sip: string;
  masa_berlaku_sip: string;
  ihs_practitioner_id: string;
  /** Jenis akun terpilih menurut id, dengan periodenya. */
  penugasan: Record<number, PeriodeForm>;
  izin: BarisIzinForm[];
};

export const awalAkun = (): KeadaanAkun => ({
  nama: '', nik: '', username: '', profesi: '', nomor_sip: '', masa_berlaku_sip: '', ihs_practitioner_id: '', penugasan: {}, izin: [],
});

/** Tanggal hari ini (zona waktu setempat) sebagai YYYY-MM-DD untuk isian tanggal. */
export function hariIniLokal(sekarang: Date = new Date()): string {
  const dua = (n: number) => String(n).padStart(2, '0');
  return `${sekarang.getFullYear()}-${dua(sekarang.getMonth() + 1)}-${dua(sekarang.getDate())}`;
}

export type GalatBidang = Record<string, string>;

/** Hasil validasi skema shared menjadi peta bidang -> pesan pertama. */
export function galatSkema(skema: ZodType, data: unknown): GalatBidang {
  const h = skema.safeParse(data);
  if (h.success) return {};
  const peta: GalatBidang = {};
  for (const i of h.error.issues) {
    const kunci = i.path.join('.') || '_';
    if (!(kunci in peta)) peta[kunci] = i.message;
  }
  return peta;
}

const kosongJadi = (v: string) => (v.trim() === '' ? undefined : v.trim());

export const galatData = (k: KeadaanAkun): GalatBidang => galatSkema(dataAkun, { nama: k.nama, nik: k.nik, username: k.username });

const bentukProfil = (k: KeadaanAkun) => ({
  profesi: k.profesi, nomor_sip: kosongJadi(k.nomor_sip), masa_berlaku_sip: kosongJadi(k.masa_berlaku_sip), ihs_practitioner_id: kosongJadi(k.ihs_practitioner_id),
});

export const galatProfil = (k: KeadaanAkun): GalatBidang => (k.profesi === '' ? {} : galatSkema(profilProfesiBaru, bentukProfil(k)));

const bentukPenugasan = (jenisId: number, p: PeriodeForm) => ({ jenis_akun_id: jenisId, mulai: p.mulai, selesai: kosongJadi(p.selesai) });

/** Galat jenis akun dan periode menurut id jenis; kunci `_` untuk "pilih minimal satu". */
export function galatPenugasan(k: KeadaanAkun): GalatBidang {
  const ids = Object.keys(k.penugasan).map(Number);
  if (!ids.length) return { _: AKUN_BARU.wajibJenis };
  const hasil: GalatBidang = {};
  for (const id of ids) {
    const g = galatSkema(penugasanAkunBaru, bentukPenugasan(id, k.penugasan[id]));
    const pesan = g.selesai ?? g.mulai ?? g._;
    if (pesan) hasil[String(id)] = pesan;
  }
  return hasil;
}

const bentukIzin = (b: BarisIzinForm) => ({ ...b, selesai: kosongJadi(b.selesai) });
export const galatBarisIzin = (b: BarisIzinForm): GalatBidang => galatSkema(izinAkunPembuatan, bentukIzin(b));

/** Galat per langkah (indeks 0..3) untuk menahan Lanjut dan menandai langkah selesai; ringkasan tidak punya isian sendiri. */
export function galatLangkah(k: KeadaanAkun): (string | null)[] {
  const pertama = (g: GalatBidang) => Object.values(g)[0] ?? null;
  return [pertama(galatData(k)), pertama(galatProfil(k)), pertama(galatPenugasan(k)), k.izin.map(galatBarisIzin).map(pertama).find(Boolean) ?? null, null];
}

/** Badan POST /api/pengguna dari isian. */
export function bentukPermintaan(k: KeadaanAkun, konfirmasi?: KonfirmasiPeringatan): PenggunaBaruMasukan {
  return {
    nama: k.nama.trim(),
    nik: k.nik.trim(),
    username: k.username.trim(),
    profil: k.profesi === '' ? null : bentukProfil(k),
    penugasan: Object.keys(k.penugasan).map(Number).sort((a, b) => a - b).map((id) => bentukPenugasan(id, k.penugasan[id])),
    izin_akun: k.izin.map(bentukIzin),
    ...(konfirmasi ? { konfirmasi_peringatan: konfirmasi } : {}),
  };
}

export const labelIzin = (i: Pick<IzinKatalog, 'fitur' | 'aksi' | 'cakupan'>): string => `${i.fitur} · ${i.aksi} · ${i.cakupan}`;

/**
 * Pilihan izin untuk langkah izin tambahan atau pengurangan: Tambah = izin di luar paket jenis terpilih,
 * Kurangi = izin yang ada di paket jenis terpilih; yang sudah ditambahkan dengan tipe sama disembunyikan; disaring kata.
 */
export function opsiIzin(tipe: 'tambah' | 'kurang', katalog: readonly IzinKatalog[], jenisTerpilih: readonly JenisKatalog[], sudah: readonly BarisIzinForm[], kata: string): IzinKatalog[] {
  const paket = new Set(jenisTerpilih.flatMap((j) => j.izin.map((i) => kunciIzin({ fitur: i.fitur, aksi: i.aksi as 'input', cakupan: i.cakupan as 'unit' }))));
  const terpakai = new Set(sudah.filter((b) => b.tipe === tipe).map((b) => b.izin_id));
  const dasar = katalog.filter((i) => {
    const ada = paket.has(kunciIzin({ fitur: i.fitur, aksi: i.aksi as 'input', cakupan: i.cakupan as 'unit' }));
    return (tipe === 'kurang' ? ada : !ada) && !terpakai.has(i.id);
  });
  return saringTeks(dasar, kata, labelIzin);
}

export type BagianRingkasan = { judul: string; baris: { label: string; nilai: string }[] };

const tanggalPendek = (t: string) => t || '-';

/** Ringkasan di langkah terakhir; NIK ditampilkan penuh hanya karena pimpinan memasukkannya sendiri. */
export function ringkasanAkun(k: KeadaanAkun, jenis: readonly JenisKatalog[], katalog: readonly IzinKatalog[]): BagianRingkasan[] {
  const namaJenis = (id: number) => jenis.find((j) => j.id === id)?.nama ?? `#${id}`;
  const izin = (id: number) => katalog.find((i) => i.id === id);
  return [
    { judul: AKUN_BARU.ringkasanData, baris: [{ label: AKUN_BARU.nama, nilai: k.nama }, { label: AKUN_BARU.nik, nilai: k.nik }, { label: AKUN_BARU.username, nilai: k.username }] },
    {
      judul: AKUN_BARU.ringkasanProfil,
      baris: k.profesi === ''
        ? [{ label: AKUN_BARU.profesi, nilai: AKUN_BARU.tanpaProfil }]
        : [
            { label: AKUN_BARU.profesi, nilai: k.profesi },
            { label: AKUN_BARU.nomorSip, nilai: k.nomor_sip || '-' },
            { label: AKUN_BARU.masaSip, nilai: tanggalPendek(k.masa_berlaku_sip) },
            { label: AKUN_BARU.ihs, nilai: k.ihs_practitioner_id || '-' },
          ],
    },
    {
      judul: AKUN_BARU.ringkasanJenis,
      baris: Object.keys(k.penugasan).map(Number).sort((a, b) => a - b).map((id) => ({
        label: namaJenis(id), nilai: `${tanggalPendek(k.penugasan[id].mulai)} s.d. ${k.penugasan[id].selesai || AKUN_BARU.tanpaBatas}`,
      })),
    },
    {
      judul: AKUN_BARU.ringkasanIzin,
      baris: k.izin.length
        ? k.izin.map((b) => {
            const i = izin(b.izin_id);
            return {
              label: `${b.tipe === 'tambah' ? AKUN_BARU.izinTambahLabel : AKUN_BARU.izinKurangLabel}: ${i ? labelIzin(i) : `#${b.izin_id}`}`,
              nilai: `${b.alasan} (${tanggalPendek(b.mulai)} s.d. ${b.selesai || AKUN_BARU.tanpaBatas})`,
            };
          })
        : [{ label: AKUN_BARU.tanpaIzin, nilai: '' }],
    },
  ];
}
