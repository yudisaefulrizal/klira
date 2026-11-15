import { z } from 'zod';
import { LAYANAN_UJI } from '../layanan/katalog-endpoint.js';

export const layananUji = z.enum(LAYANAN_UJI);

/** Permintaan Test endpoint: hanya id endpoint dari katalog, isian parameter, dan badan JSON (teks) untuk POST/PUT. */
export const ujiEndpointMasukan = z.object({
    layanan: layananUji,
    endpoint_id: z.string().trim().min(1).max(60),
    parameter: z.record(z.string().max(60), z.string().max(300)).default({}),
    badan: z.string().max(90000).optional(),
});
export const layananUjiParam = z.object({ layanan: layananUji });
