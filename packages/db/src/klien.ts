import { PrismaClient } from '@prisma/client';

const global_ = globalThis as unknown as { __klira_prisma?: PrismaClient };

/** Klien Prisma tunggal; waktu disimpan UTC. */
export const prisma: PrismaClient = global_.__klira_prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') global_.__klira_prisma = prisma;
