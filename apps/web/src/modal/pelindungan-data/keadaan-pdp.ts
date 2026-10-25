import {
  BUTIR_PERJANJIAN, dpiaMasukan, hakMasukan, insidenMasukan, pemberitahuanMasukan, pemusnahanMasukan, prosesHakMasukan, prosesorMasukan, prosesPemusnahanMasukan, ropaMasukan, tarikMasukan,
} from '@klira/shared';
import type {
  ButirPerjanjian, DpiaDto, HakForm, InsidenDto, InsidenForm, PemusnahanForm, ProsesHakForm, ProsesorDto, ProsesorForm, ProsesPemusnahanForm, RopaDto, TahapHak, TahapMusnah,
} from '@klira/shared';

type Isu = { path: PropertyKey[]; message: string };
const petakan = (isu: readonly Isu[] | undefined): Record<string, string> => {
  const g: Record<string, string> = {};
  for (const i of isu ?? []) g[i.path.map(String).join('.') || ''] ??= i.message;
  return g;
};
const idAtauNull = (v: string): number | null => (v ? Number(v) : null);
/** Waktu dari ISO ke bentuk datetime-local (WIB) untuk isian. */
export const keIsianWaktu = (iso: string | null): string => (iso ? new Date(new Date(iso).getTime() + 7 * 3_600_000).toISOString().slice(0, 16) : '');

// ---- Permintaan hak ----
export type KeadaanHak = { pasien_id: number | null; jenis: HakForm['jenis'] | ''; saluran: HakForm['saluran'] | ''; pemohon_nama: string; pemohon_hubungan: HakForm['pemohon_hubungan'] | ''; verifikasi: string; rincian: string };
export const awalHak = (): KeadaanHak => ({ pasien_id: null, jenis: '', saluran: 'langsung', pemohon_nama: '', pemohon_hubungan: 'pasien', verifikasi: '', rincian: '' });
export const bentukHak = (k: KeadaanHak): HakForm => ({ ...k, pasien_id: k.pasien_id ?? 0, jenis: k.jenis as HakForm['jenis'], saluran: k.saluran as HakForm['saluran'], pemohon_hubungan: k.pemohon_hubungan as HakForm['pemohon_hubungan'] });
export const galatHak = (k: KeadaanHak): Record<string, string> => petakan(hakMasukan.safeParse(bentukHak(k)).error?.issues);
export function langkahBermasalahHak(g: Record<string, string>): number {
  if (g.pasien_id || g.pemohon_nama || g.pemohon_hubungan || g.saluran || g.verifikasi) return 0;
  if (g.jenis || g.rincian) return 1;
  return -1;
}

export type KeadaanProsesHak = { keputusan: 'setujui' | 'tolak' | ''; alasan: string; pelaksanaan: string; catatan: string };
export const awalProsesHak = (): KeadaanProsesHak => ({ keputusan: '', alasan: '', pelaksanaan: '', catatan: '' });
export function bentukProsesHak(tahap: TahapHak, k: KeadaanProsesHak): ProsesHakForm {
  if (tahap === 'keputusan') return { tahap, keputusan: k.keputusan as 'setujui' | 'tolak', alasan: k.alasan };
  if (tahap === 'pelaksanaan') return { tahap, pelaksanaan: k.pelaksanaan };
  return { tahap, catatan: k.catatan };
}
export const galatProsesHak = (tahap: TahapHak, k: KeadaanProsesHak): Record<string, string> => petakan(prosesHakMasukan.safeParse(bentukProsesHak(tahap, k)).error?.issues);
/** Indeks langkah modal proses (0 tinjau, 1 keputusan, 2 pelaksanaan, 3 notifikasi) untuk tahap berikutnya. */
export const indeksTahapHak = (tahap: TahapHak | null): number => (tahap === 'keputusan' ? 1 : tahap === 'pelaksanaan' ? 2 : tahap === 'notifikasi' ? 3 : 0);

// ---- Teks pemberitahuan dan tarik persetujuan ----
export type KeadaanPemberitahuan = { judul: string; tujuan: string; isi: string };
export const awalPemberitahuan = (dari?: { judul: string; tujuan: string; isi: string } | null): KeadaanPemberitahuan => ({ judul: dari?.judul ?? '', tujuan: dari?.tujuan ?? '', isi: dari?.isi ?? '' });
export const galatPemberitahuan = (k: KeadaanPemberitahuan): Record<string, string> => petakan(pemberitahuanMasukan.safeParse(k).error?.issues);
export const galatTarik = (persetujuanId: number, alasan: string): Record<string, string> => petakan(tarikMasukan.safeParse({ persetujuan_id: persetujuanId, alasan }).error?.issues);

// ---- ROPA ----
export const KUNCI_ROPA = ['nama_kegiatan', 'ppdp_nama', 'sumber_tujuan', 'dasar', 'tujuan', 'jenis_data', 'kategori_subjek', 'pihak_akses', 'pemenuhan_hak', 'aliran', 'masa_retensi', 'pengamanan', 'transfer'] as const;
export type KeadaanRopa = Record<(typeof KUNCI_ROPA)[number], string>;
export const awalRopa = (r?: RopaDto | null): KeadaanRopa => Object.fromEntries(KUNCI_ROPA.map((k) => [k, (r?.[k] as string | null | undefined) ?? (k === 'transfer' && !r ? 'Tidak ada transfer ke luar negeri' : '')])) as KeadaanRopa;
export const galatRopa = (k: KeadaanRopa): Record<string, string> => petakan(ropaMasukan.safeParse(k).error?.issues);
export function langkahBermasalahRopa(g: Record<string, string>): number {
  if (g.nama_kegiatan || g.ppdp_nama || g.sumber_tujuan) return 0;
  if (g.dasar || g.tujuan || g.jenis_data || g.kategori_subjek) return 1;
  if (g.pihak_akses || g.pemenuhan_hak || g.aliran) return 2;
  if (g.masa_retensi || g.pengamanan || g.transfer) return 3;
  return -1;
}

// ---- DPIA ----
export type KeadaanDpia = { pemrosesan: string; ropa_id: string; risiko: string; mitigasi: string; saran_ppdp: string; tinjau_ulang_pada: string; tandai_ditinjau: boolean };
export const awalDpia = (d?: DpiaDto | null): KeadaanDpia => ({ pemrosesan: d?.pemrosesan ?? '', ropa_id: d?.ropa_id ? String(d.ropa_id) : '', risiko: d?.risiko ?? '', mitigasi: d?.mitigasi ?? '', saran_ppdp: d?.saran_ppdp ?? '', tinjau_ulang_pada: d?.tinjau_ulang_pada ?? '', tandai_ditinjau: false });
export const bentukDpia = (k: KeadaanDpia) => ({ ...k, ropa_id: idAtauNull(k.ropa_id) });
export const galatDpia = (k: KeadaanDpia): Record<string, string> => petakan(dpiaMasukan.safeParse(bentukDpia(k)).error?.issues);
export function langkahBermasalahDpia(g: Record<string, string>): number {
  if (g.pemrosesan || g.risiko) return 0;
  if (g.mitigasi) return 1;
  if (g.saran_ppdp) return 2;
  if (g.tinjau_ulang_pada) return 3;
  return -1;
}

// ---- Insiden ----
export type PasienTerdampak = { id: number; nama: string; nomor_rm: string };
export type KeadaanInsiden = {
  waktu_kejadian: string; waktu_diketahui: string; siber: boolean; uraian: string; data_terungkap: string; pasien: PasienTerdampak[]; penanganan: string; pemulihan: string; kontak_ppdp: string;
  notifikasi_pasien_pada: string; notifikasi_lembaga_pada: string;
};
export const awalInsiden = (i?: InsidenDto | null): KeadaanInsiden => ({
  waktu_kejadian: keIsianWaktu(i?.waktu_kejadian ?? null), waktu_diketahui: keIsianWaktu(i?.waktu_diketahui ?? null), siber: i?.siber ?? false, uraian: i?.uraian ?? '', data_terungkap: i?.data_terungkap ?? '', pasien: i?.pasien ?? [],
  penanganan: i?.penanganan ?? '', pemulihan: i?.pemulihan ?? '', kontak_ppdp: i?.kontak_ppdp ?? '', notifikasi_pasien_pada: keIsianWaktu(i?.notifikasi_pasien_pada ?? null), notifikasi_lembaga_pada: keIsianWaktu(i?.notifikasi_lembaga_pada ?? null),
});
export const bentukInsiden = (k: KeadaanInsiden): InsidenForm => ({ ...k, pasien_ids: k.pasien.map((p) => p.id) });
export const galatInsiden = (k: KeadaanInsiden): Record<string, string> => petakan(insidenMasukan.safeParse(bentukInsiden(k)).error?.issues);
export const tambahPasienTerdampak = (k: KeadaanInsiden, p: PasienTerdampak): KeadaanInsiden => (k.pasien.some((x) => x.id === p.id) ? k : { ...k, pasien: [...k.pasien, p] });
export const buangPasienTerdampak = (k: KeadaanInsiden, id: number): KeadaanInsiden => ({ ...k, pasien: k.pasien.filter((p) => p.id !== id) });
export function langkahBermasalahInsiden(g: Record<string, string>): number {
  if (g.waktu_kejadian || g.waktu_diketahui || g.uraian) return 0;
  if (g.data_terungkap || g.pasien_ids) return 1;
  if (g.penanganan || g.pemulihan || g.kontak_ppdp) return 2;
  if (g.notifikasi_pasien_pada || g.notifikasi_lembaga_pada) return 3;
  return -1;
}

// ---- Pemusnahan ----
export type KeadaanRencanaMusnah = { cakupan: string; dasar: PemusnahanForm['dasar'] | ''; permintaan_hak_id: string; pasien_id: number | null; jadwal: string };
export const awalRencanaMusnah = (): KeadaanRencanaMusnah => ({ cakupan: '', dasar: 'retensi_habis', permintaan_hak_id: '', pasien_id: null, jadwal: '' });
export const bentukRencanaMusnah = (k: KeadaanRencanaMusnah): PemusnahanForm => ({ ...k, dasar: k.dasar as PemusnahanForm['dasar'], permintaan_hak_id: idAtauNull(k.permintaan_hak_id) });
export const galatRencanaMusnah = (k: KeadaanRencanaMusnah): Record<string, string> => petakan(pemusnahanMasukan.safeParse(bentukRencanaMusnah(k)).error?.issues);

export type KeadaanProsesMusnah = { prosesor_id: string; nomor_perintah: string; pelaksana: string; metode: string; mencakup_cadangan: boolean; pelaksanaan_pada: string; berita_acara: string };
export const awalProsesMusnah = (): KeadaanProsesMusnah => ({ prosesor_id: '', nomor_perintah: '', pelaksana: '', metode: '', mencakup_cadangan: false, pelaksanaan_pada: '', berita_acara: '' });
export function bentukProsesMusnah(tahap: TahapMusnah, k: KeadaanProsesMusnah): ProsesPemusnahanForm {
  if (tahap === 'perintah') return { tahap, prosesor_id: Number(k.prosesor_id) || 0, nomor_perintah: k.nomor_perintah };
  if (tahap === 'pelaksanaan') return { tahap, pelaksana: k.pelaksana, metode: k.metode, mencakup_cadangan: k.mencakup_cadangan, pelaksanaan_pada: k.pelaksanaan_pada };
  return { tahap, berita_acara: k.berita_acara };
}
/** Tahap pelaksanaan menuntut cadangan dan salinan prosesor ikut dimusnahkan. */
export function galatProsesMusnah(tahap: TahapMusnah, k: KeadaanProsesMusnah, pesanCadangan: string): Record<string, string> {
  const g = petakan(prosesPemusnahanMasukan.safeParse(bentukProsesMusnah(tahap, k)).error?.issues);
  if (tahap === 'pelaksanaan' && !k.mencakup_cadangan) g.mencakup_cadangan = pesanCadangan;
  return g;
}
/** Indeks langkah modal pemusnahan (0 data, 1 perintah, 2 pelaksanaan, 3 berita acara) untuk tahap berikutnya. */
export const indeksTahapMusnah = (tahap: TahapMusnah | null): number => (tahap === 'perintah' ? 1 : tahap === 'pelaksanaan' ? 2 : tahap === 'berita_acara' ? 3 : 0);

// ---- Prosesor ----
export type SubProsesorIsian = { nama: string; layanan: string; persetujuan_pada: string };
export type KeadaanProsesor = { nama: string; layanan: string; lokasi_data: string; nomor_perjanjian: string; butir: ButirPerjanjian[]; sub: SubProsesorIsian[]; sla: string; aktif: boolean };
export const awalProsesor = (p?: ProsesorDto | null): KeadaanProsesor => ({
  nama: p?.nama ?? '', layanan: p?.layanan ?? '', lokasi_data: p?.lokasi_data ?? '', nomor_perjanjian: p?.nomor_perjanjian ?? '', butir: p?.butir_perjanjian ?? [], sub: p?.sub_prosesor ?? [], sla: p?.sla_lapor_jam ? String(p.sla_lapor_jam) : '', aktif: p?.aktif ?? true,
});
export const bentukProsesor = (k: KeadaanProsesor): ProsesorForm => ({ nama: k.nama, layanan: k.layanan, lokasi_data: k.lokasi_data, nomor_perjanjian: k.nomor_perjanjian, butir_perjanjian: k.butir, sub_prosesor: k.sub, sla_lapor_jam: k.sla as unknown as number | undefined, aktif: k.aktif });
export const galatProsesor = (k: KeadaanProsesor): Record<string, string> => petakan(prosesorMasukan.safeParse(bentukProsesor(k)).error?.issues);
export function alihButir(k: KeadaanProsesor, butir: ButirPerjanjian, ada: boolean): KeadaanProsesor {
  const set = new Set(k.butir);
  if (ada) set.add(butir);
  else set.delete(butir);
  return { ...k, butir: BUTIR_PERJANJIAN.filter((b) => set.has(b)) };
}
export function langkahBermasalahProsesor(g: Record<string, string>): number {
  if (g.nama || g.layanan || g.lokasi_data || g.nomor_perjanjian) return 0;
  if (g.butir_perjanjian) return 1;
  if (Object.keys(g).some((x) => x.startsWith('sub_prosesor') || x === 'sla_lapor_jam')) return 2;
  return -1;
}
