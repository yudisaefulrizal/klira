import { createHash, randomBytes } from 'node:crypto';
import { cocokKataSandi, hashKataSandi } from '@klira/db';
import { halamanAwal } from '@klira/shared';
import type { PenggunaSaya } from '@klira/shared';
import type { PenampungAudit } from '../../middleware/audit';
import type { PembatasPercobaan } from './pembatas';
import type { RepositoriAkses } from './repositori';
import type { AkunMasuk } from './skema';

export const JAM_SESI_BAWAAN = 12;

export type HasilMasuk =
  | { ok: true; idSesi: string; kedaluwarsa: Date; pengguna: PenggunaSaya }
  | { ok: false; alasan: 'salah' | 'terkunci' };

export type DependensiAkses = {
  repo: RepositoriAkses;
  audit: PenampungAudit;
  pembatas: PembatasPercobaan;
  sekarang?: () => Date;
  sesiMs?: number;
};

export function hashIdSesi(id: string): string {
  return createHash('sha256').update(id).digest('hex');
}

export function buatLayananAkses(dep: DependensiAkses) {
  const sekarang = dep.sekarang ?? (() => new Date());
  const sesiMs = dep.sesiMs ?? JAM_SESI_BAWAAN * 3_600_000;
  // Hash tiruan agar waktu respons username tak dikenal setara dengan kata sandi salah.
  const hashTiruan = hashKataSandi(randomBytes(16).toString('hex'));

  async function bentukPengguna(akun: AkunMasuk, t: Date): Promise<PenggunaSaya> {
    const akses = await dep.repo.ambilAkses(akun.id, t);
    return {
      id: akun.id,
      nama: akun.nama,
      username: akun.username,
      fasyankes_id: akun.fasyankes_id,
      wajib_ganti_kredensial: akun.wajib_ganti_kredensial,
      jenis_akun: akses.jenis_akun,
      fitur: akses.fitur,
      halaman_awal: halamanAwal(akses.fitur),
    };
  }

  return {
    async masuk(username: string, kataSandi: string, alamat = 'tidak-diketahui'): Promise<HasilMasuk> {
      const t = sekarang();
      if (dep.pembatas.sisaJeda(username, alamat) > 0) {
        await dep.audit.catat({ aksi: 'masuk_gagal', entitas: 'sesi', keterangan: 'Dibatasi: terlalu banyak percobaan', alamat });
        return { ok: false, alasan: 'terkunci' };
      }
      const akun = await dep.repo.cariAkunByUsername(username);
      const cocok = await cocokKataSandi(kataSandi, akun?.kata_sandi_hash ?? (await hashTiruan));
      if (!akun || !cocok) {
        dep.pembatas.catatGagal(username, alamat);
        await dep.audit.catat({
          fasyankes_id: akun?.fasyankes_id, pengguna_id: akun?.id, aksi: 'masuk_gagal', entitas: 'sesi',
          keterangan: `Percobaan masuk gagal untuk "${username.slice(0, 100)}"`, alamat,
        });
        return { ok: false, alasan: 'salah' };
      }
      dep.pembatas.catatBerhasil(username);
      await dep.repo.hapusKedaluwarsa(t);
      const idSesi = randomBytes(32).toString('base64url');
      const kedaluwarsa = new Date(t.getTime() + sesiMs);
      await dep.repo.buatSesi({ idHash: hashIdSesi(idSesi), akun, alamat, kedaluwarsa });
      await dep.audit.catat({
        fasyankes_id: akun.fasyankes_id, pengguna_id: akun.id, aksi: 'masuk', entitas: 'sesi',
        keterangan: akun.wajib_ganti_kredensial ? 'Masuk dengan kredensial awal' : 'Masuk berhasil', alamat,
      });
      return { ok: true, idSesi, kedaluwarsa, pengguna: await bentukPengguna(akun, t) };
    },

    async keluar(idSesi: string | undefined, alamat?: string): Promise<void> {
      if (!idSesi) return;
      const hash = hashIdSesi(idSesi);
      const sesi = await dep.repo.cariSesi(hash, sekarang());
      await dep.repo.hapusSesi(hash);
      if (sesi) {
        await dep.audit.catat({
          fasyankes_id: sesi.akun.fasyankes_id, pengguna_id: sesi.akun.id, aksi: 'keluar', entitas: 'sesi', alamat,
        });
      }
    },

    /** Pengguna dari id sesi; null bila tak ada atau kedaluwarsa. */
    async saya(idSesi: string | undefined): Promise<PenggunaSaya | null> {
      if (!idSesi) return null;
      const t = sekarang();
      const sesi = await dep.repo.cariSesi(hashIdSesi(idSesi), t);
      return sesi ? bentukPengguna(sesi.akun, t) : null;
    },
  };
}

export type LayananAkses = ReturnType<typeof buatLayananAkses>;
