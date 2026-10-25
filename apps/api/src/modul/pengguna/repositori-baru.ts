import { Prisma, prisma } from '@klira/db';

export type DataAkunBaru = {
  fasyankes_id: number;
  oleh: number;
  nama: string;
  nik: string;
  username: string;
  kata_sandi_hash: string;
  profil: { profesi: string; nomor_sip: string | null; masa_berlaku_sip: Date | null; ihs_practitioner_id: string | null } | null;
  penugasan: { jenis_akun_id: number; mulai: Date; selesai: Date | null }[];
  izin_akun: { izin_id: number; tipe: 'tambah' | 'kurang'; alasan: string; mulai: Date; selesai: Date | null }[];
  peringatan: {
    jenis_peringatan: string; izin_id: number | null; jenis_akun_id: number | null; alasan_pimpinan: string;
    diterima_untuk_akun: boolean; keterangan: string;
  }[];
};

export type HasilAkunBaru = {
  id: number;
  profil_id: number | null;
  penugasan_ids: number[];
  izin_akun_ids: number[];
  peringatan: { id: number; jenis_peringatan: string; alasan_pimpinan: string }[];
};

/** Username atau NIK bentrok saat menyimpan (balapan setelah pemeriksaan awal). */
export class KonflikAkun extends Error {}

export interface RepositoriAkunBaru {
  /** Username dipakai di mana pun (tanpa beda huruf besar/kecil); NIK dipakai di fasyankes ini. */
  cekDuplikat(username: string, nik: string, fasyankesId: number): Promise<{ username: boolean; nik: boolean }>;
  /** Satu transaksi: akun, profil, penugasan, izin per akun, dan peringatan; semua atau tidak sama sekali. */
  buatAkun(data: DataAkunBaru): Promise<HasilAkunBaru>;
}

export class RepositoriAkunBaruPrisma implements RepositoriAkunBaru {
  async cekDuplikat(username: string, nik: string, fasyankesId: number) {
    const [u, n] = await Promise.all([
      prisma.pengguna.count({ where: { username } }),
      prisma.pengguna.count({ where: { fasyankes_id: fasyankesId, nik } }),
    ]);
    return { username: u > 0, nik: n > 0 };
  }

  async buatAkun(d: DataAkunBaru): Promise<HasilAkunBaru> {
    try {
      return await prisma.$transaction(async (tx) => {
        const p = await tx.pengguna.create({
          data: {
            fasyankes_id: d.fasyankes_id, nama: d.nama, nik: d.nik, username: d.username, kata_sandi_hash: d.kata_sandi_hash,
            aktif: true, wajib_ganti_kredensial: true, dibuat_oleh: d.oleh,
          },
        });
        const profil = d.profil
          ? await tx.profilProfesi.create({ data: { ...d.profil, fasyankes_id: d.fasyankes_id, pengguna_id: p.id, dibuat_oleh: d.oleh } })
          : null;
        const penugasanIds = new Map<number, number>();
        const ids: number[] = [];
        for (const x of d.penugasan) {
          const r = await tx.penugasanJenis.create({
            data: { fasyankes_id: d.fasyankes_id, pengguna_id: p.id, jenis_akun_id: x.jenis_akun_id, mulai: x.mulai, selesai: x.selesai, ditetapkan_oleh: d.oleh, dibuat_oleh: d.oleh },
          });
          ids.push(r.id);
          if (!penugasanIds.has(x.jenis_akun_id)) penugasanIds.set(x.jenis_akun_id, r.id);
        }
        const izinIds: number[] = [];
        for (const x of d.izin_akun) {
          const r = await tx.izinPerAkun.create({
            data: { fasyankes_id: d.fasyankes_id, pengguna_id: p.id, ...x, ditetapkan_oleh: d.oleh, dibuat_oleh: d.oleh },
          });
          izinIds.push(r.id);
        }
        const peringatan: HasilAkunBaru['peringatan'] = [];
        for (const w of d.peringatan) {
          const r = await tx.peringatanIzin.create({
            data: {
              fasyankes_id: d.fasyankes_id, pengguna_id: p.id, izin_id: w.izin_id,
              penugasan_id: w.jenis_akun_id ? (penugasanIds.get(w.jenis_akun_id) ?? null) : null,
              jenis_peringatan: w.jenis_peringatan, alasan_pimpinan: w.alasan_pimpinan, sumber: 'pemberian',
              diterima_untuk_akun: w.diterima_untuk_akun, keterangan: w.keterangan, ditetapkan_oleh: d.oleh, dibuat_oleh: d.oleh,
            },
          });
          peringatan.push({ id: r.id, jenis_peringatan: r.jenis_peringatan, alasan_pimpinan: r.alasan_pimpinan });
        }
        return { id: p.id, profil_id: profil?.id ?? null, penugasan_ids: ids, izin_akun_ids: izinIds, peringatan };
      });
    } catch (galat) {
      if (galat instanceof Prisma.PrismaClientKnownRequestError && galat.code === 'P2002') throw new KonflikAkun();
      throw galat;
    }
  }
}
