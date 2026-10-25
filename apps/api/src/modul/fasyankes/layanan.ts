import { PROFIL_KLINIK } from '@klira/shared';
import type { Halaman, PenggunaSaya, ProfilKlinikDto, ProfilKlinikMasukan, RiwayatProfilDto } from '@klira/shared';
import type { PenampungAudit } from '../../middleware/audit';
import type { RepositoriFasyankes, RiwayatBaru } from './repositori';

export type DependensiFasyankes = { repo: RepositoriFasyankes; audit: PenampungAudit };
export type HasilProfil =
  | { ok: true; data: ProfilKlinikDto }
  | { ok: false; kode: 'konflik' | 'tidak_ditemukan'; pesan: string };

const kosongJadiNull = (v: string | null | undefined): string | null => (v === undefined || v === null || v.trim() === '' ? null : v.trim());
const tgl = (v: Date | string | null | undefined): string | null => (v ? new Date(v).toISOString().slice(0, 10) : null);

const LABEL: Record<Exclude<keyof ProfilKlinikDto, 'id'>, string> = {
  nama: PROFIL_KLINIK.nama, jenis: PROFIL_KLINIK.jenis, bentuk_usaha: PROFIL_KLINIK.bentukUsaha, kode_registrasi: PROFIL_KLINIK.kodeRegistrasi,
  organization_id: PROFIL_KLINIK.organizationId, status_akreditasi: PROFIL_KLINIK.statusAkreditasi, tanggal_akreditasi: PROFIL_KLINIK.tanggalAkreditasi,
  puskesmas_wilayah: PROFIL_KLINIK.puskesmasWilayah,
};
const AKREDITASI = new Set(['status_akreditasi', 'tanggal_akreditasi']);

/** Nilai profil dari masukan tervalidasi: string kosong menjadi null, tanggal menjadi YYYY-MM-DD. */
export const normalkanProfil = (id: number, m: ProfilKlinikMasukan): ProfilKlinikDto => ({
  id, nama: m.nama.trim(), jenis: m.jenis, bentuk_usaha: kosongJadiNull(m.bentuk_usaha), kode_registrasi: kosongJadiNull(m.kode_registrasi),
  organization_id: kosongJadiNull(m.organization_id), status_akreditasi: kosongJadiNull(m.status_akreditasi), tanggal_akreditasi: tgl(m.tanggal_akreditasi),
  puskesmas_wilayah: kosongJadiNull(m.puskesmas_wilayah),
});

/** Riwayat per jenis: perubahan akreditasi (status/tanggal) dipisah dari perubahan profil lain. */
export function riwayatPerubahan(lama: ProfilKlinikDto, baru: ProfilKlinikDto): RiwayatBaru[] {
  const bagian = { profil: [] as string[], akreditasi: [] as string[] };
  for (const k of Object.keys(LABEL) as (keyof typeof LABEL)[]) {
    if ((lama[k] ?? null) === (baru[k] ?? null)) continue;
    bagian[AKREDITASI.has(k) ? 'akreditasi' : 'profil'].push(`${LABEL[k]}: ${lama[k] ?? '-'} menjadi ${baru[k] ?? '-'}`);
  }
  return (['profil', 'akreditasi'] as const).filter((j) => bagian[j].length).map((j) => ({ jenis: j, ringkasan: bagian[j].join('; ') }));
}

export function buatLayananFasyankes({ repo, audit }: DependensiFasyankes) {
  return {
    async ambil(p: Pick<PenggunaSaya, 'fasyankes_id'>): Promise<ProfilKlinikDto | null> {
      return repo.ambil(p.fasyankes_id);
    },

    async simpan(p: Pick<PenggunaSaya, 'id' | 'fasyankes_id'>, masukan: ProfilKlinikMasukan, alamat?: string): Promise<HasilProfil> {
      const lama = await repo.ambil(p.fasyankes_id);
      if (!lama) return { ok: false, kode: 'tidak_ditemukan', pesan: PROFIL_KLINIK.gagalMuat };
      const baru = normalkanProfil(lama.id, masukan);
      if (baru.kode_registrasi && baru.kode_registrasi !== lama.kode_registrasi && (await repo.kodeDipakaiLain(p.fasyankes_id, baru.kode_registrasi))) {
        return { ok: false, kode: 'konflik', pesan: PROFIL_KLINIK.kodeKembar };
      }
      const riwayat = riwayatPerubahan(lama, baru);
      const hasil = riwayat.length ? await repo.simpan(p.fasyankes_id, baru, p.id, riwayat) : lama;
      if (riwayat.length) {
        await audit.catat({
          fasyankes_id: p.fasyankes_id, pengguna_id: p.id, aksi: 'perbaikan', entitas: 'fasyankes', entitas_id: lama.id,
          keterangan: `Profil klinik diubah (${riwayat.map((r) => r.jenis).join(', ')})`, alamat,
        });
      }
      return { ok: true, data: hasil };
    },

    async riwayat(p: Pick<PenggunaSaya, 'fasyankes_id'>, halaman: number, ukuran: number): Promise<Halaman<RiwayatProfilDto>> {
      const { total, baris } = await repo.riwayat(p.fasyankes_id, (halaman - 1) * ukuran, ukuran);
      return { data: baris.map((b) => ({ ...b, dibuat_pada: b.dibuat_pada.toISOString() })), halaman, ukuran, total };
    },
  };
}

export type LayananFasyankes = ReturnType<typeof buatLayananFasyankes>;
