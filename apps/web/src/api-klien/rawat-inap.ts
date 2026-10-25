import type {
  AdmisiForm, AsalAdmisiDto, CatatanHarianDto, CatatanHarianForm, HasilAdmisiDto, HasilPemulanganDto, OpsiRawatInapDto, PapanDto, PemulanganForm, PenempatanForm, RawatInapDto,
} from '@klira/shared';
import { panggilApi } from './klien';

export const ambilPapan = () => panggilApi<PapanDto>('GET', '/rawat-inap/papan');
export const ambilOpsiRawatInap = () => panggilApi<OpsiRawatInapDto>('GET', '/rawat-inap/opsi');
export const ambilAsalAdmisi = (pasienId: number) => panggilApi<AsalAdmisiDto>('GET', `/rawat-inap/asal?pasien_id=${pasienId}`);
export const admisiRawatInap = (m: AdmisiForm) => panggilApi<HasilAdmisiDto>('POST', '/rawat-inap/admisi', m);
export const ambilRawatInap = (kunjunganId: number) => panggilApi<RawatInapDto>('GET', `/kunjungan/${kunjunganId}/rawat-inap`);
export const ubahPenempatan = (kunjunganId: number, m: PenempatanForm) => panggilApi<RawatInapDto>('PUT', `/kunjungan/${kunjunganId}/penempatan`, m);
export const daftarCatatanHarian = (kunjunganId: number) => panggilApi<CatatanHarianDto[]>('GET', `/kunjungan/${kunjunganId}/cppt`);
export const tambahCatatanHarian = (kunjunganId: number, m: CatatanHarianForm) => panggilApi<{ id: number }>('POST', `/kunjungan/${kunjunganId}/cppt`, m);
export const pulangkanPasien = (kunjunganId: number, m: PemulanganForm) => panggilApi<HasilPemulanganDto>('POST', `/kunjungan/${kunjunganId}/pemulangan`, m);
