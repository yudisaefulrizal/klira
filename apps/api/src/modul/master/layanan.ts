import { GALAT, MASTER } from '@klira/shared';
import type { BarisMaster, FilterMaster, Halaman, JenisMaster, JenisMasterUbah, OpsiMasterDto, PenggunaSaya, SumberOpsiMaster } from '@klira/shared';
import type { PenampungAudit } from '../../middleware/audit';
import type { MasukanMaster, RepositoriMaster } from './repositori';

export type DependensiMaster = { repo: RepositoriMaster; audit: PenampungAudit };
export type Rincian = { jalur: string; pesan: string };
export type HasilMaster<T> =
  | { ok: true; data: T }
  | { ok: false; kode: 'tidak_valid' | 'konflik' | 'tidak_ditemukan'; pesan: string; rincian?: Rincian[] };

type Pelaku = Pick<PenggunaSaya, 'id' | 'fasyankes_id'>;

const ENTITAS: Record<JenisMasterUbah, string> = {
  poli: 'lokasi', ruang: 'lokasi', bed: 'lokasi', praktisi: 'profil_profesi', jadwal: 'jadwal_praktik', tarif: 'tarif_layanan',
};
const tidakValid = (jalur: string, pesan: string): HasilMaster<never> => ({ ok: false, kode: 'tidak_valid', pesan: GALAT.tidakValid, rincian: [{ jalur, pesan }] });
const tidakDitemukan: HasilMaster<never> = { ok: false, kode: 'tidak_ditemukan', pesan: GALAT.tidakDitemukan };
const tampil = (v: unknown) => (v === null || v === undefined || v === '' ? '-' : v instanceof Date ? v.toISOString().slice(0, 10) : String(v));

/** Ringkasan perubahan SIP tenaga untuk riwayat_profil; null bila SIP, masa berlaku, dan profesi tidak berubah. */
export function ringkasanSip(sebelum: BarisMaster | null, sesudah: { profesi?: string; nomor_sip?: string | null; masa_berlaku_sip?: Date | string | null }): string | null {
  const bagian: string[] = [];
  const bandingkan = (label: string, lama: unknown, baru: unknown) => {
    if (tampil(lama) !== tampil(baru)) bagian.push(`${label}: ${tampil(lama)} menjadi ${tampil(baru)}`);
  };
  bandingkan('Nomor SIP', sebelum?.nomor_sip, sesudah.nomor_sip);
  bandingkan('Masa berlaku SIP', sebelum?.masa_berlaku_sip, sesudah.masa_berlaku_sip);
  if (sesudah.profesi !== undefined) bandingkan('Profesi', sebelum?.profesi, sesudah.profesi);
  return bagian.length ? bagian.join('; ') : null;
}

export function buatLayananMaster({ repo, audit }: DependensiMaster) {
  /** Rujukan harus milik fasyankes yang sama (lintas klinik ditolak). */
  async function periksaRujukan(f: number, jenis: JenisMasterUbah, d: Record<string, unknown>, id?: number): Promise<HasilMaster<never> | null> {
    if (jenis === 'ruang' && d.induk_id && !(await repo.lokasiAda(f, d.induk_id as number, 'poli'))) return tidakValid('induk_id', MASTER.galat.bukanMilikKlinik);
    if (jenis === 'bed' && !(await repo.lokasiAda(f, d.induk_id as number, 'ruang'))) return tidakValid('induk_id', MASTER.galat.bukanMilikKlinik);
    if (jenis === 'jadwal') {
      if (!(await repo.penggunaAda(f, d.pengguna_id as number)) || !(await repo.punyaProfil(f, d.pengguna_id as number))) return tidakValid('pengguna_id', MASTER.galat.bukanMilikKlinik);
      if (!(await repo.lokasiAda(f, d.lokasi_id as number, 'poli'))) return tidakValid('lokasi_id', MASTER.galat.bukanMilikKlinik);
    }
    if (jenis === 'tarif' && (await repo.tarifKodeAda(f, d.kode as string, id))) return { ok: false, kode: 'konflik', pesan: MASTER.galat.kodeKembar };
    return null;
  }

  return {
    async daftar(p: Pelaku, jenis: JenisMaster, filter: FilterMaster): Promise<Halaman<BarisMaster>> {
      const { total, baris } = await repo.daftar(p.fasyankes_id, jenis, filter);
      return { data: baris, halaman: filter.halaman, ukuran: filter.ukuran, total };
    },

    opsi(p: Pelaku, sumber: SumberOpsiMaster, cari?: string): Promise<OpsiMasterDto[]> {
      return repo.opsi(p.fasyankes_id, sumber, cari);
    },

    async buat(p: Pelaku, jenis: JenisMasterUbah, data: MasukanMaster[JenisMasterUbah], alamat?: string): Promise<HasilMaster<BarisMaster>> {
      const f = p.fasyankes_id;
      if (jenis === 'praktisi') {
        const d = data as MasukanMaster['praktisi'];
        if (!(await repo.penggunaAda(f, d.pengguna_id))) return tidakValid('pengguna_id', MASTER.galat.bukanMilikKlinik);
        if (await repo.punyaProfil(f, d.pengguna_id)) return { ok: false, kode: 'konflik', pesan: MASTER.galat.penggunaSudahPunyaProfil };
      } else {
        const salah = await periksaRujukan(f, jenis, data as Record<string, unknown>);
        if (salah) return salah;
      }
      const baris = await repo.buat(f, jenis, data, p.id);
      if (jenis === 'praktisi') {
        const ringkasan = ringkasanSip(null, data as MasukanMaster['praktisi']);
        if (ringkasan) await repo.tambahRiwayatProfil(f, 'sip', baris.pengguna_id as number, ringkasan, p.id);
      }
      await audit.catat({ fasyankes_id: f, pengguna_id: p.id, aksi: 'input', entitas: ENTITAS[jenis], entitas_id: baris.id, keterangan: `Tambah master ${jenis}`, alamat });
      return { ok: true, data: baris };
    },

    async ubah(p: Pelaku, jenis: JenisMasterUbah, id: number, data: Partial<MasukanMaster[JenisMasterUbah]>, alamat?: string): Promise<HasilMaster<BarisMaster>> {
      const f = p.fasyankes_id;
      const lama = await repo.ambil(f, jenis, id);
      if (!lama) return tidakDitemukan;
      const salah = await periksaRujukan(f, jenis, data as Record<string, unknown>, id);
      if (salah) return salah;
      const baris = await repo.ubah(f, jenis, id, data);
      if (jenis === 'praktisi') {
        const ringkasan = ringkasanSip(lama, data as { profesi?: string; nomor_sip?: string | null; masa_berlaku_sip?: Date | null });
        if (ringkasan) await repo.tambahRiwayatProfil(f, 'sip', lama.pengguna_id as number, ringkasan, p.id);
      }
      await audit.catat({ fasyankes_id: f, pengguna_id: p.id, aksi: 'perbaikan', entitas: ENTITAS[jenis], entitas_id: id, keterangan: `Ubah master ${jenis}`, alamat });
      return { ok: true, data: baris };
    },

    async ubahAktif(p: Pelaku, jenis: JenisMasterUbah, id: number, aktif: boolean, alamat?: string): Promise<HasilMaster<BarisMaster>> {
      const f = p.fasyankes_id;
      const lama = await repo.ambil(f, jenis, id);
      if (!lama) return tidakDitemukan;
      const baris = lama.aktif === aktif ? lama : await repo.setAktif(f, jenis, id, aktif);
      if (lama.aktif !== aktif) {
        await audit.catat({ fasyankes_id: f, pengguna_id: p.id, aksi: 'perbaikan', entitas: ENTITAS[jenis], entitas_id: id, keterangan: `${aktif ? 'Aktifkan' : 'Nonaktifkan'} master ${jenis}`, alamat });
      }
      return { ok: true, data: baris };
    },
  };
}

export type LayananMaster = ReturnType<typeof buatLayananMaster>;
