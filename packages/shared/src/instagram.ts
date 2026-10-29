import type { KoneksiWaDto, PercakapanWaDto } from './whatsapp';
export type KoneksiInstagramDto = KoneksiWaDto & { dikonfigurasi: boolean; token_berakhir: string | null };

export type PercakapanInstagramDto = PercakapanWaDto & { foto_profil: string | null };
