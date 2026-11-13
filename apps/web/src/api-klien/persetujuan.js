import { panggilApi } from './klien.js';
export const siapPersetujuanTindakan = (kunjunganId) => panggilApi('GET', `/kunjungan/${kunjunganId}/persetujuan-tindakan/siap`);
export const daftarPersetujuanTindakan = (kunjunganId) => panggilApi('GET', `/kunjungan/${kunjunganId}/persetujuan-tindakan`);
export const catatPersetujuanTindakan = (kunjunganId, m) => panggilApi('POST', `/kunjungan/${kunjunganId}/persetujuan-tindakan`, m);
