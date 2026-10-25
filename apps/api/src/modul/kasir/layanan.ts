import type { PenggunaSaya, TagihanDto } from '@klira/shared';
import { GALAT } from '@klira/shared';
import type { PenampungAudit } from '../../middleware/audit';
import { gagal } from '../hasil';
import type { Hasil } from '../hasil';
import type { RepositoriTagihan } from './repositori';

type Pelaku = Pick<PenggunaSaya, 'id' | 'fasyankes_id'>;

/** Tagihan dasar (4.5): baca tagihan kunjungan. Item ditambah oleh modul asalnya (mis. order lab) lewat `tambahItemTagihanDalam`; kasir lengkap menyusul. */
export function buatLayananTagihan({ repo, audit }: { repo: RepositoriTagihan; audit: PenampungAudit }) {
  return {
    /** Tagihan kunjungan; kunjungan tanpa tagihan mengembalikan tagihan kosong (belum lengkap, belum dibayar). Dicatat `lihat`. */
    async ambil(p: Pelaku, kunjunganId: number, alamat?: string): Promise<Hasil<TagihanDto>> {
      if (!(await repo.kunjunganAda(p.fasyankes_id, kunjunganId))) return gagal('tidak_ditemukan', GALAT.tidakDitemukan);
      const t = (await repo.ambil(p.fasyankes_id, kunjunganId)) ?? {
        id: null, kunjungan_id: kunjunganId, status_tagihan: 'belum_lengkap' as const, status_pembayaran: 'belum' as const, total: 0, item: [],
      };
      await audit.catat({ fasyankes_id: p.fasyankes_id, pengguna_id: p.id, aksi: 'lihat', entitas: 'tagihan', entitas_id: kunjunganId, keterangan: 'Membuka tagihan kunjungan', alamat });
      return { ok: true, data: t };
    },
  };
}

export type LayananTagihan = ReturnType<typeof buatLayananTagihan>;
