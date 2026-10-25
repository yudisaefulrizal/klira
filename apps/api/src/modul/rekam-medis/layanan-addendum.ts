import type { AddendumDto, PenggunaSaya } from '@klira/shared';
import { GALAT } from '@klira/shared';
import type { PenampungAudit } from '../../middleware/audit';
import { gagal } from '../hasil';
import type { Hasil } from '../hasil';
import { keDto as keDtoPengesahan } from './layanan';
import type { LayananPengesahan } from './layanan';
import type { BarisAddendum, RepositoriAddendum } from './repositori-addendum';

type Pelaku = Pick<PenggunaSaya, 'id' | 'fasyankes_id'>;

/** Entitas pengesahan untuk isi addendum; penyedia isinya mendeteksi perubahan setelah disahkan. */
export const ENTITAS_PENGESAHAN_ADDENDUM = 'addendum';

/**
 * Layanan addendum generik (4.2, 7): membaca addendum kunjungan beserta keadaan pengesahannya. Penulisan terjadi dalam transaksi pemilik isi
 * (mis. validasi hasil lab) lewat `tulisAddendumDalam`, sehingga CPPT dan resume cukup memakai antarmuka yang sama.
 */
export function buatLayananAddendum({ repo, audit, pengesahan }: { repo: RepositoriAddendum; audit: PenampungAudit; pengesahan: LayananPengesahan }) {
  pengesahan.daftarkanPenyedia(ENTITAS_PENGESAHAN_ADDENDUM, (fas, id) => repo.isi(fas, id));

  async function keDto(fasyankesId: number, b: BarisAddendum): Promise<AddendumDto> {
    const k = await pengesahan.keadaan(fasyankesId, ENTITAS_PENGESAHAN_ADDENDUM, b.id);
    return {
      id: b.id, kunjungan_id: b.kunjungan_id, entitas: b.entitas, entitas_id: b.entitas_id, versi: b.versi, isi: b.isi, alasan: b.alasan, waktu: b.waktu.toISOString(),
      dibuat_oleh_nama: b.dibuat_oleh_nama, perlu_kirim_ulang: b.perlu_kirim_ulang, dikirim_pada: b.dikirim_pada?.toISOString() ?? null,
      pengesahan: k.pengesahan ? keDtoPengesahan(k.pengesahan) : null,
      verifikasi: k.status,
    };
  }

  return {
    /** Semua addendum satu kunjungan; dicatat `lihat` sebelum dilepas. */
    async daftar(p: Pelaku, kunjunganId: number, alamat?: string): Promise<Hasil<AddendumDto[]>> {
      if (!(await repo.kunjunganAda(p.fasyankes_id, kunjunganId))) return gagal('tidak_ditemukan', GALAT.tidakDitemukan);
      const baris = await repo.daftar(p.fasyankes_id, kunjunganId);
      await audit.catat({ fasyankes_id: p.fasyankes_id, pengguna_id: p.id, aksi: 'lihat', entitas: 'addendum', entitas_id: kunjunganId, keterangan: 'Membuka addendum kunjungan', alamat });
      return { ok: true, data: await Promise.all(baris.map((b) => keDto(p.fasyankes_id, b))) };
    },

    /** Addendum untuk beberapa entitas sumber (tanpa audit; pemanggil sudah mencatat pembukaan datanya). */
    async untukEntitas(fasyankesId: number, entitas: string, entitasIds: readonly number[]): Promise<AddendumDto[]> {
      return Promise.all((await repo.untukEntitas(fasyankesId, entitas, entitasIds)).map((b) => keDto(fasyankesId, b)));
    },
  };
}

export type LayananAddendum = ReturnType<typeof buatLayananAddendum>;
