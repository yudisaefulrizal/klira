import type { PersetujuanSiapDto, PersetujuanTindakanDto, PersetujuanTindakanKirim } from '@klira/shared';
import { panggilApi } from './klien';

export const siapPersetujuanTindakan = (kunjunganId: number) => panggilApi<PersetujuanSiapDto>('GET', `/kunjungan/${kunjunganId}/persetujuan-tindakan/siap`);
export const daftarPersetujuanTindakan = (kunjunganId: number) => panggilApi<PersetujuanTindakanDto[]>('GET', `/kunjungan/${kunjunganId}/persetujuan-tindakan`);
export const catatPersetujuanTindakan = (kunjunganId: number, m: PersetujuanTindakanKirim) =>
  panggilApi<PersetujuanTindakanDto>('POST', `/kunjungan/${kunjunganId}/persetujuan-tindakan`, m);
