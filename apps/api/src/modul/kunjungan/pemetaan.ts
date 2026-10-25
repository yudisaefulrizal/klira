import type { StatusKunjungan } from '@klira/shared';

type StatusDb = 'planned' | 'arrived' | 'in_progress' | 'finished';

/** Enum Prisma tidak boleh memuat tanda hubung, jadi `in-progress` disimpan sebagai `in_progress` (dipetakan ke nama kolom). */
export const statusDariDb = (s: StatusDb): StatusKunjungan => (s === 'in_progress' ? 'in-progress' : s);
export const statusKeDb = (s: StatusKunjungan): StatusDb => (s === 'in-progress' ? 'in_progress' : s);
