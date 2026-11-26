import { z } from 'zod';
export const LINGKUNGAN_SATUSEHAT = ['sandbox', 'produksi'];
export const lingkunganSatusehat = z.enum(LINGKUNGAN_SATUSEHAT);
export const lingkunganParam = z.object({ environment: lingkunganSatusehat });
