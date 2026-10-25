import { IZIN, AKUN_BARU, kunciIzin } from '@klira/shared';
import type { PenggunaBaru, PenggunaBaruDto, PenggunaSaya, PeringatanTerdeteksi } from '@klira/shared';
import { hashKataSandi } from '@klira/db';
import type { PenampungAudit } from '../../middleware/audit';
import { peringatanBaru } from '../akses/mesin-izin';
import type { SnapshotAkses } from '../akses/mesin-izin';
import type { RepositoriIzin } from '../akses/repositori-izin';
import { buatKataSandiAwal } from './kata-sandi-awal';
import { KonflikAkun } from './repositori-baru';
import type { RepositoriAkunBaru } from './repositori-baru';

export type HasilBuatAkun =
  | { ok: true; data: PenggunaBaruDto }
  | { ok: false; kode: 'konflik' | 'tidak_valid'; pesan: string }
  | { ok: false; kode: 'perlu_konfirmasi_peringatan'; pesan: string; peringatan: PeringatanTerdeteksi[] };

export type DependensiPembuatan = {
  repo: RepositoriAkunBaru;
  repoIzin: Pick<RepositoriIzin, 'daftarJenisAkun' | 'izinByIds' | 'cariIzin'>;
  audit: PenampungAudit;
  sekarang?: () => Date;
  buatKataSandi?: () => string;
  hash?: (kataSandi: string) => Promise<string>;
};

type Pelaku = Pick<PenggunaSaya, 'id' | 'fasyankes_id'>;

/**
 * Pembuatan akun dan penugasan (3.3): validasi, deteksi peringatan 2.2 (409 tanpa menyimpan bila belum ada alasan),
 * lalu simpan seluruhnya dalam satu transaksi. Kata sandi awal acak hanya dikembalikan di respons, tidak disimpan
 * mentah dan tidak masuk audit.
 */
export function buatLayananPembuatanAkun(dep: DependensiPembuatan) {
  const sekarang = dep.sekarang ?? (() => new Date());
  const buatKataSandi = dep.buatKataSandi ?? buatKataSandiAwal;
  const hash = dep.hash ?? hashKataSandi;

  return {
    async buat(p: Pelaku, m: PenggunaBaru, alamat?: string): Promise<HasilBuatAkun> {
      const dup = await dep.repo.cekDuplikat(m.username, m.nik, p.fasyankes_id);
      if (dup.username) return { ok: false, kode: 'konflik', pesan: AKUN_BARU.duplikatUsername };
      if (dup.nik) return { ok: false, kode: 'konflik', pesan: AKUN_BARU.duplikatNik };

      const jenisAda = new Map((await dep.repoIzin.daftarJenisAkun(p.fasyankes_id)).map((j) => [j.id, j]));
      for (const x of m.penugasan) if (!jenisAda.get(x.jenis_akun_id)?.aktif) return { ok: false, kode: 'tidak_valid', pesan: AKUN_BARU.jenisTidakAktif };
      const izinIds = [...new Set(m.izin_akun.map((x) => x.izin_id))];
      const katalog = new Map((await dep.repoIzin.izinByIds(izinIds)).map((i) => [i.id, i]));
      if (katalog.size !== izinIds.length) return { ok: false, kode: 'tidak_valid', pesan: IZIN.izinTidakDikenal };

      // Deteksi peringatan pada keadaan akhir: akun baru belum punya apa pun sebelumnya.
      const t = sekarang();
      const profil = m.profil
        ? { profesi: m.profil.profesi, nomor_sip: m.profil.nomor_sip ?? null, masa_berlaku_sip: m.profil.masa_berlaku_sip ?? null, ihs_practitioner_id: m.profil.ihs_practitioner_id ?? null }
        : null;
      const sebelum: SnapshotAkses = { pengguna_id: 0, aktif: true, profil: [], penugasan: [], izin_akun: [] };
      const sesudah: SnapshotAkses = {
        pengguna_id: 0, aktif: true,
        profil: profil ? [{ profesi: profil.profesi, nomor_sip: profil.nomor_sip, masa_berlaku_sip: profil.masa_berlaku_sip }] : [],
        penugasan: m.penugasan.map((x) => {
          const j = jenisAda.get(x.jenis_akun_id)!;
          return {
            id: 0, jenis_akun_id: j.id, jenis_nama: j.nama, syarat_profesi: j.syarat_profesi, jenis_aktif: j.aktif,
            mulai: x.mulai, selesai: x.selesai ?? null, izin: j.izin.map(({ fitur, aksi, cakupan }) => ({ fitur, aksi, cakupan })),
          };
        }),
        izin_akun: m.izin_akun.map((x) => {
          const i = katalog.get(x.izin_id)!;
          return { id: 0, tipe: x.tipe, izin: { fitur: i.fitur, aksi: i.aksi, cakupan: i.cakupan }, mulai: x.mulai, selesai: x.selesai ?? null };
        }),
      };
      const baru = peringatanBaru(sebelum, sesudah, t);
      if (baru.length && !m.konfirmasi_peringatan) {
        return {
          ok: false, kode: 'perlu_konfirmasi_peringatan', pesan: IZIN.perluKonfirmasi,
          peringatan: baru.map((w) => ({ jenis: w.jenis, kunci: w.kunci, pesan: w.pesan, izin: w.izin, penugasan_id: w.penugasan_id })),
        };
      }
      const peringatan = [];
      for (const w of baru) {
        const izin = w.izin ? await dep.repoIzin.cariIzin(w.izin.fitur, w.izin.aksi, w.izin.cakupan) : null;
        const jenisId = w.jenis === 'penugasan_lewat_sip' ? Number(/\|j(\d+)$/.exec(w.kunci)?.[1]) || null : null;
        peringatan.push({
          jenis_peringatan: w.jenis, izin_id: izin?.id ?? null, jenis_akun_id: jenisId,
          alasan_pimpinan: m.konfirmasi_peringatan?.alasan ?? IZIN.alasanBelumAda,
          diterima_untuk_akun: m.konfirmasi_peringatan?.terima_untuk_akun ?? false, keterangan: w.kunci,
        });
      }

      const kataSandi = buatKataSandi();
      let hasil;
      try {
        hasil = await dep.repo.buatAkun({
          fasyankes_id: p.fasyankes_id, oleh: p.id, nama: m.nama, nik: m.nik, username: m.username,
          kata_sandi_hash: await hash(kataSandi), profil,
          penugasan: m.penugasan.map((x) => ({ jenis_akun_id: x.jenis_akun_id, mulai: x.mulai, selesai: x.selesai ?? null })),
          izin_akun: m.izin_akun.map((x) => ({ izin_id: x.izin_id, tipe: x.tipe, alasan: x.alasan, mulai: x.mulai, selesai: x.selesai ?? null })),
          peringatan,
        });
      } catch (galat) {
        if (galat instanceof KonflikAkun) return { ok: false, kode: 'konflik', pesan: galat.bidang === 'nik' ? AKUN_BARU.duplikatNik : AKUN_BARU.duplikatUsername };
        throw galat;
      }

      // Audit tanpa kata sandi dan tanpa isi NIK; hanya identitas dan ringkasan.
      const catat = (aksi: 'input' | 'peringatan_izin', entitas: string, id: number, keterangan: string) =>
        dep.audit.catat({ fasyankes_id: p.fasyankes_id, pengguna_id: p.id, aksi, entitas, entitas_id: id, keterangan, alamat });
      await catat('input', 'pengguna', hasil.id, `Akun dibuat: ${m.username}`);
      if (hasil.profil_id) await catat('input', 'profil_profesi', hasil.profil_id, `Profil profesi akun ${hasil.id}: ${m.profil?.profesi}`);
      for (const [i, id] of hasil.penugasan_ids.entries()) {
        await catat('input', 'penugasan_jenis', id, `Penugasan jenis akun ${jenisAda.get(m.penugasan[i].jenis_akun_id)?.nama} ke pengguna ${hasil.id}`);
      }
      for (const [i, id] of hasil.izin_akun_ids.entries()) {
        const x = m.izin_akun[i];
        await catat('input', 'izin_per_akun', id, `Izin ${x.tipe} ${kunciIzin(katalog.get(x.izin_id)!)} untuk pengguna ${hasil.id}: ${x.alasan}`);
      }
      for (const w of hasil.peringatan) await catat('peringatan_izin', 'peringatan_izin', w.id, `${w.jenis_peringatan}: ${w.alasan_pimpinan}`);

      return {
        ok: true,
        data: {
          id: hasil.id, username: m.username, kata_sandi_awal: kataSandi,
          peringatan: hasil.peringatan.map((w) => ({ id: w.id, jenis_peringatan: w.jenis_peringatan })),
        },
      };
    },
  };
}
export type LayananPembuatanAkun = ReturnType<typeof buatLayananPembuatanAkun>;
