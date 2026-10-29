import { FITUR_IZIN, JENIS_AKUN, LABEL_IZIN, jenisAkunBaru, jenisAkunUbah } from '@klira/shared';
import type { JenisAkunDto } from '../../api-klien/izin';
import { galatSkema } from './keadaan-akun';
import type { GalatBidang, IzinKatalog } from './keadaan-akun';

export type FormJenis = { nama: string; syarat: string; izin: number[]; alasan: string };
export type KelompokIzin = { fitur: string; label: string; izin: IzinKatalog[] };

export const awalJenis = (j?: Pick<JenisAkunDto, 'nama' | 'syarat_profesi' | 'izin'>): FormJenis => ({
  nama: j?.nama ?? '', syarat: j?.syarat_profesi ?? '', izin: j ? j.izin.map((i) => i.id).sort((a, b) => a - b) : [], alasan: '',
});

const urut = (ids: readonly number[]) => [...ids].sort((a, b) => a - b);

/** Isi paket, nama, atau syarat berubah dibanding keadaan awal (alasan tidak dihitung). */
export const adaPerubahanJenis = (awal: FormJenis, f: FormJenis): boolean =>
  awal.nama.trim() !== f.nama.trim() || awal.syarat.trim() !== f.syarat.trim() || urut(awal.izin).join() !== urut(f.izin).join();

export const labelFitur = (fitur: string): string => LABEL_IZIN.fitur[fitur] ?? fitur;
export const labelAksiCakupan = (i: Pick<IzinKatalog, 'aksi' | 'cakupan'> & { fitur?: string }): string =>
  i.fitur === 'instagram' ? 'Semua fitur Instagram' : i.fitur === 'whatsapp' ? 'Semua fitur WhatsApp' : `${LABEL_IZIN.aksi[i.aksi] ?? i.aksi} · ${LABEL_IZIN.cakupan[i.cakupan] ?? i.cakupan}`;

/** Pemilih izin dikelompokkan per fitur menurut urutan katalog fitur; fitur tak dikenal di akhir. */
export function kelompokkanIzin(katalog: readonly IzinKatalog[]): KelompokIzin[] {
  const peta = new Map<string, IzinKatalog[]>();
  for (const i of katalog) peta.set(i.fitur, [...(peta.get(i.fitur) ?? []), i]);
  const urutan = [...FITUR_IZIN as readonly string[], ...[...peta.keys()].filter((f) => !(FITUR_IZIN as readonly string[]).includes(f))];
  return urutan.filter((f) => peta.has(f)).map((f) => ({ fitur: f, label: labelFitur(f), izin: peta.get(f) ?? [] }));
}

export const alihIzin = (terpilih: readonly number[], id: number): number[] =>
  terpilih.includes(id) ? terpilih.filter((x) => x !== id) : [...terpilih, id];

/** Pilih atau lepas semua izin satu fitur sekaligus. */
export function setKelompok(terpilih: readonly number[], k: KelompokIzin, pilih: boolean): number[] {
  const ids = new Set(k.izin.map((i) => i.id));
  const sisa = terpilih.filter((id) => !ids.has(id));
  return pilih ? [...sisa, ...ids] : sisa;
}

export const semuaTerpilih = (terpilih: readonly number[], k: KelompokIzin): boolean => k.izin.length > 0 && k.izin.every((i) => terpilih.includes(i.id));

/** Galat per bidang (nama, alasan_perubahan) memakai skema shared; alasan wajib hanya saat ubah. */
export function galatJenis(f: FormJenis, ubah: boolean): GalatBidang {
  if (ubah) {
    const g = galatSkema(jenisAkunUbah, { nama: f.nama, izin_ids: f.izin, alasan_perubahan: f.alasan });
    delete g._;
    return g;
  }
  return galatSkema(jenisAkunBaru, { nama: f.nama, syarat_profesi: f.syarat, izin_ids: f.izin, alasan_perubahan: f.alasan });
}

export const bentukBuat = (f: FormJenis) => ({
  nama: f.nama.trim(),
  syarat_profesi: f.syarat.trim() || null,
  izin_ids: urut(f.izin),
  ...(f.alasan.trim() ? { alasan_perubahan: f.alasan.trim() } : {}),
});

/** Hanya bidang yang berubah dikirim; alasan selalu ikut. */
export function bentukUbah(awal: FormJenis, f: FormJenis) {
  return {
    ...(awal.nama.trim() !== f.nama.trim() ? { nama: f.nama.trim() } : {}),
    ...(awal.syarat.trim() !== f.syarat.trim() ? { syarat_profesi: f.syarat.trim() || null } : {}),
    ...(urut(awal.izin).join() !== urut(f.izin).join() ? { izin_ids: urut(f.izin) } : {}),
    alasan_perubahan: f.alasan.trim(),
  };
}

/** Teks ringkas untuk satu entri riwayat. */
export const barisRiwayat = (r: { ringkasan: string; alasan: string | null; dibuat_oleh: number | null }) => ({
  perubahan: r.ringkasan,
  alasan: r.alasan?.trim() || JENIS_AKUN.riwayatTanpaAlasan,
  oleh: JENIS_AKUN.riwayatOleh(r.dibuat_oleh),
});
