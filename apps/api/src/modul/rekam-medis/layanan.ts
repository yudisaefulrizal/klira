import type { PengesahanDto, VerifikasiDto } from '@klira/shared';
import { KLINIS } from '@klira/shared';
import type { PenampungAudit } from '../../middleware/audit';
import { gagal } from '../hasil';
import type { Hasil } from '../hasil';
import { bolehPerbaikiSendiri, hashIsi, pilihJenisAkun } from './pengesahan';
import type { JenisAkunPengesah } from './pengesahan';
import type { PengesahanTersimpan, RepositoriPengesahan, TulisPengesahan, VersiLama } from './repositori';

/** Penyedia isi sekarang suatu entitas (dibaca dari tabel aslinya) untuk deteksi perubahan setelah pengesahan. */
export type PenyediaIsi = (fasyankesId: number, entitasId: number) => Promise<unknown>;

export type DependensiPengesahan = { repo: RepositoriPengesahan; audit: PenampungAudit; sekarang?: () => Date };

export type MasukanSiapkan = {
  fasyankesId: number;
  pelakuId: number;
  /** Fitur izin yang memberi hak atas tindakan ini; aksi mengikuti keadaan (input untuk pengesahan pertama, perbaikan untuk berikutnya). */
  fitur: string;
  entitas: string;
  entitasId: number;
  isiBaru: unknown;
  /** Isi sekarang di basis data (dibaca hanya bila entitas sudah pernah disahkan). */
  bacaIsiSekarang: () => Promise<unknown>;
  alasan?: string | null;
};

export type HasilSiapkan = { jenis: 'sama'; versi: number } | { jenis: 'baru'; rencana: Omit<TulisPengesahan, 'fasyankesId' | 'entitas' | 'entitasId'> };

export const keDto = (p: PengesahanTersimpan): PengesahanDto => ({
  versi: p.versi, pengguna_id: p.pengguna_id, pengguna_nama: p.pengguna_nama, jenis_akun: p.jenis_akun_nama, waktu: p.waktu.toISOString(), hash: p.hash,
});

/**
 * Layanan pengesahan catatan generik (4.2, 7: simpan = pengesahan). Dipakai modul klinis dan nanti CPPT, resume, hasil lab:
 * `siapkan` merancang pengesahan (versi, hash, jenis akun, versi catatan) lalu pemanggil menulis isi dan pengesahan dalam
 * satu transaksi; `verifikasi` membandingkan hash isi sekarang dengan pengesahan terakhir.
 */
export function buatLayananPengesahan({ repo, audit, sekarang = () => new Date() }: DependensiPengesahan) {
  const penyedia = new Map<string, PenyediaIsi>();

  /** Keadaan pengesahan: belum disahkan, sah (hash cocok), atau berubah setelah disahkan (hash tidak cocok). */
  async function keadaan(fasyankesId: number, entitas: string, entitasId: number): Promise<{ status: VerifikasiDto['status']; pengesahan: PengesahanTersimpan | null }> {
    const fn = penyedia.get(entitas);
    const terakhir = await repo.terakhir(fasyankesId, entitas, entitasId);
    if (!terakhir) return { status: 'belum_disahkan', pengesahan: null };
    if (!fn) return { status: 'berubah', pengesahan: terakhir };
    return { status: hashIsi(await fn(fasyankesId, entitasId)) === terakhir.hash ? 'sah' : 'berubah', pengesahan: terakhir };
  }

  return {
    daftarkanPenyedia(entitas: string, fn: PenyediaIsi): void {
      penyedia.set(entitas, fn);
    },
    entitasDikenal: (entitas: string): boolean => penyedia.has(entitas),

    async siapkan(m: MasukanSiapkan): Promise<Hasil<HasilSiapkan>> {
      const waktu = sekarang();
      const terakhir = await repo.terakhir(m.fasyankesId, m.entitas, m.entitasId);
      const hash = hashIsi(m.isiBaru);
      let versiLama: VersiLama | null = null;
      if (terakhir) {
        const isiSekarang = await m.bacaIsiSekarang();
        if (hash === terakhir.hash && hashIsi(isiSekarang) === terakhir.hash) return { ok: true, data: { jenis: 'sama', versi: terakhir.versi } };
        const alasan = m.alasan?.trim();
        if (!alasan) return gagal('tidak_valid', KLINIS.galat.alasanPerbaikan, 'alasan');
        if (!bolehPerbaikiSendiri(terakhir, m.pelakuId, waktu)) return gagal('konflik', KLINIS.galat.perbaikanButuhPersetujuan);
        versiLama = { versi: terakhir.versi, isi_lama: isiSekarang ?? null, alasan, disetujui_oleh: null };
      }
      const jenisAkun: JenisAkunPengesah | null = pilihJenisAkun(await repo.jenisAkunPemberiHak(m.fasyankesId, m.pelakuId, m.fitur, terakhir ? 'perbaikan' : 'input', waktu));
      return { ok: true, data: { jenis: 'baru', rencana: { versi: (terakhir?.versi ?? 0) + 1, penggunaId: m.pelakuId, jenisAkun, hash, waktu, versiLama } } };
    },

    keadaan,

    /** API verifikasi: dicatat `lihat` sebelum hasil dilepas. */
    async verifikasi(pelaku: { id: number; fasyankes_id: number }, entitas: string, entitasId: number, alamat?: string): Promise<Hasil<VerifikasiDto>> {
      if (!penyedia.has(entitas)) return gagal('tidak_ditemukan', KLINIS.galat.entitasTidakDikenal);
      const k = await keadaan(pelaku.fasyankes_id, entitas, entitasId);
      await audit.catat({ fasyankes_id: pelaku.fasyankes_id, pengguna_id: pelaku.id, aksi: 'lihat', entitas: 'pengesahan_catatan', entitas_id: entitasId, keterangan: `Verifikasi pengesahan ${entitas}`, alamat });
      return { ok: true, data: { entitas, entitas_id: entitasId, status: k.status, versi: k.pengesahan?.versi ?? null, pengesahan: k.pengesahan ? keDto(k.pengesahan) : null } };
    },

    riwayatVersi: (fasyankesId: number, entitas: string, entitasId: number) => repo.riwayatVersi(fasyankesId, entitas, entitasId),
  };
}

export type LayananPengesahan = ReturnType<typeof buatLayananPengesahan>;
