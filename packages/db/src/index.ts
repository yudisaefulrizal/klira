export { prisma } from './klien';
export * from './enkripsi';
export * from './validasi';
export * from './izin-awal';
export { Prisma, PrismaClient } from '@prisma/client';
export type {
  Fasyankes, KredensialSatusehat, Lokasi, Pengguna, ProfilProfesi, Pasien, WaliKeluarga,
  JenisAkun, Izin, PenugasanJenis, IzinPerAkun, PeringatanIzin,
} from '@prisma/client';
