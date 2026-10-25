import { createHash, randomBytes } from 'node:crypto';
import { cocokKataSandi, hashKataSandi } from '@klira/db';
import { halamanAwal, kredensialAwal } from '@klira/shared';
import type { MasukanGantiKredensial, PenggunaSaya } from '@klira/shared';
import type { PenampungAudit } from '../../middleware/audit';
import type { PembatasPercobaan } from './pembatas';
import { KonflikUsername } from './repositori';
import type { RepositoriAkses } from './repositori';
import type { AkunMasuk } from './skema';

export const JAM_SESI_BAWAAN = 12;

export type HasilMasuk =
  | { ok: true; idSesi: string; kedaluwarsa: Date; pengguna: PenggunaSaya }
  | { ok: false; alasan: 'salah' | 'terkunci' };

export type AlasanGantiGagal =
  | 'tidak_masuk'
  | 'kata_sandi_lama_salah'
  | 'username_sama_awal'
  | 'username_dipakai'
  | 'kata_sandi_sama_lama'
  | 'kata_sandi_sama_awal';

export type HasilGanti =
  | { ok: true; idSesi: string; kedaluwarsa: Date; pengguna: PenggunaSaya }
  | { ok: false; alasan: AlasanGantiGagal };

export type DependensiAkses = {
  /** Kredensial awal statis; bawaan dari env (USERNAME_AWAL, KATA_SANDI_AWAL) atau nilai bawaan. */
  kredensialAwal?: { username: string; kataSandi: string };
  repo: RepositoriAkses;
  audit: PenampungAudit;
  pembatas: PembatasPercobaan;
  sekarang?: () => Date;
  sesiMs?: number;
};

export function hashIdSesi(id: string): string {
  return createHash('sha256').update(id).digest('hex');
}

/** Penanda pendek username tak dikenal untuk audit; bukan teks username mentah. */
export function penandaUsername(username: string): string {
  return createHash('sha256').update(username.trim().toLowerCase()).digest('hex').slice(0, 12);
}

export function buatLayananAkses(dep: DependensiAkses) {
  const sekarang = dep.sekarang ?? (() => new Date());
  const sesiMs = dep.sesiMs ?? JAM_SESI_BAWAAN * 3_600_000;
  // Hash tiruan agar waktu respons username tak dikenal setara dengan kata sandi salah.
  const awal = dep.kredensialAwal ?? kredensialAwal(process.env);
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
          keterangan: akun
            ? 'Percobaan masuk gagal: kata sandi salah'
            : `Percobaan masuk gagal: username tidak dikenal (penanda ${penandaUsername(username)})`,
          alamat,
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

    /**
     * Ganti kredensial akun bersesi. Sukses: wajib ganti dimatikan, semua sesi akun dicabut,
     * sesi baru dibuat untuk perangkat ini, dan tercatat di audit.
     */
    async gantiKredensial(idSesi: string | undefined, masukan: MasukanGantiKredensial, alamat?: string): Promise<HasilGanti> {
      const t = sekarang();
      const sesi = idSesi ? await dep.repo.cariSesi(hashIdSesi(idSesi), t) : null;
      if (!sesi) return { ok: false, alasan: 'tidak_masuk' };
      const akun = sesi.akun;
      const gagal = async (alasan: AlasanGantiGagal): Promise<HasilGanti> => {
        await dep.audit.catat({
          fasyankes_id: akun.fasyankes_id, pengguna_id: akun.id, aksi: 'ganti_kredensial_gagal', entitas: 'pengguna',
          entitas_id: akun.id, keterangan: `Ganti kredensial ditolak: ${alasan}`, alamat,
        });
        return { ok: false, alasan };
      };
      if (!(await cocokKataSandi(masukan.kata_sandi_lama, akun.kata_sandi_hash))) return gagal('kata_sandi_lama_salah');
      if (masukan.username.toLowerCase() === awal.username.toLowerCase()) return gagal('username_sama_awal');
      if (masukan.kata_sandi === masukan.kata_sandi_lama) return gagal('kata_sandi_sama_lama');
      if (masukan.kata_sandi === awal.kataSandi) return gagal('kata_sandi_sama_awal');
      if (await dep.repo.usernameDipakai(masukan.username, akun.id)) return gagal('username_dipakai');

      const idBaru = randomBytes(32).toString('base64url');
      const kedaluwarsa = new Date(t.getTime() + sesiMs);
      const akunBaru: AkunMasuk = { ...akun, username: masukan.username, wajib_ganti_kredensial: false };
      try {
        await dep.repo.gantiKredensial({
          akun,
          username: masukan.username,
          kataSandiHash: await hashKataSandi(masukan.kata_sandi),
          sesiBaru: { idHash: hashIdSesi(idBaru), alamat, kedaluwarsa },
        });
      } catch (galat) {
        if (galat instanceof KonflikUsername) return gagal('username_dipakai');
        throw galat;
      }
      await dep.audit.catat({
        fasyankes_id: akun.fasyankes_id, pengguna_id: akun.id, aksi: 'ganti_kredensial', entitas: 'pengguna',
        entitas_id: akun.id, keterangan: 'Kredensial diganti; sesi lain dicabut', alamat,
      });
      return { ok: true, idSesi: idBaru, kedaluwarsa, pengguna: await bentukPengguna(akunBaru, t) };
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
