import type {
  DpiaDto, DpiaForm, HakForm, HakDto, HalamanHakDto, HalamanPdp, HalamanPersetujuanPdpDto, InsidenDto, InsidenForm, KebijakanRetensiDto, PemberitahuanMasukan, PemusnahanDto, PemusnahanForm, ProsesHakForm, ProsesorDto, ProsesorForm, ProsesPemusnahanForm, RopaDto,
  RopaMasukan, TeksPemberitahuanDto,
} from '@klira/shared';
import { panggilApi } from './klien';

const kueri = (o: Record<string, string | number | undefined>): string => {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(o)) if (v !== undefined && v !== '') q.set(k, String(v));
  return q.toString();
};
const hal = (h: number, u = 20) => kueri({ halaman: h, ukuran: u });

export const daftarHak = (f: { status?: string; cari?: string; halaman?: number }) => panggilApi<HalamanHakDto>('GET', `/pdp/hak?${kueri({ halaman: f.halaman ?? 1, ukuran: 20, status: f.status, cari: f.cari?.trim() })}`);
export const catatHak = (m: HakForm) => panggilApi<HakDto>('POST', '/pdp/hak', m);
export const prosesHak = (id: number, m: ProsesHakForm) => panggilApi<HakDto>('POST', `/pdp/hak/${id}/proses`, m);

export const daftarPemberitahuan = () => panggilApi<TeksPemberitahuanDto[]>('GET', '/pdp/pemberitahuan');
export const buatPemberitahuan = (m: PemberitahuanMasukan) => panggilApi<{ id: number }>('POST', '/pdp/pemberitahuan', m);
export const daftarPersetujuanPdp = (f: { status?: string; cari?: string; halaman?: number }) => panggilApi<HalamanPersetujuanPdpDto>('GET', `/pdp/persetujuan?${kueri({ halaman: f.halaman ?? 1, ukuran: 20, status: f.status, cari: f.cari?.trim() })}`);
export const tarikPersetujuan = (m: { persetujuan_id: number; alasan: string }) => panggilApi<{ batas_henti: string }>('POST', '/pdp/persetujuan/tarik', m);

export const daftarRopa = (halaman: number) => panggilApi<HalamanPdp<RopaDto>>('GET', `/pdp/ropa?${hal(halaman)}`);
export const simpanRopa = (id: number | null, m: Partial<RopaMasukan>) => panggilApi<{ id: number }>(id ? 'PUT' : 'POST', id ? `/pdp/ropa/${id}` : '/pdp/ropa', m);
export const daftarDpia = (halaman: number) => panggilApi<HalamanPdp<DpiaDto>>('GET', `/pdp/dpia?${hal(halaman)}`);
export const simpanDpia = (id: number | null, m: DpiaForm) => panggilApi<{ id: number }>(id ? 'PUT' : 'POST', id ? `/pdp/dpia/${id}` : '/pdp/dpia', m);
export const daftarInsiden = (halaman: number) => panggilApi<HalamanPdp<InsidenDto>>('GET', `/pdp/insiden?${hal(halaman)}`);
export const simpanInsiden = (id: number | null, m: InsidenForm) => panggilApi<InsidenDto>(id ? 'PUT' : 'POST', id ? `/pdp/insiden/${id}` : '/pdp/insiden', m);
export const ambilKebijakan = () => panggilApi<KebijakanRetensiDto[]>('GET', '/pdp/retensi');
export const daftarPemusnahan = (halaman: number) => panggilApi<HalamanPdp<PemusnahanDto>>('GET', `/pdp/pemusnahan?${hal(halaman)}`);
export const rencanaPemusnahan = (m: PemusnahanForm) => panggilApi<PemusnahanDto>('POST', '/pdp/pemusnahan', m);
export const prosesPemusnahan = (id: number, m: ProsesPemusnahanForm) => panggilApi<PemusnahanDto>('POST', `/pdp/pemusnahan/${id}/proses`, m);
export const daftarProsesor = (halaman: number) => panggilApi<HalamanPdp<ProsesorDto>>('GET', `/pdp/prosesor?${hal(halaman)}`);
export const opsiProsesor = () => panggilApi<{ id: number; nama: string }[]>('GET', '/pdp/prosesor/opsi');
export const simpanProsesor = (id: number | null, m: ProsesorForm) => panggilApi<{ id: number }>(id ? 'PUT' : 'POST', id ? `/pdp/prosesor/${id}` : '/pdp/prosesor', m);
