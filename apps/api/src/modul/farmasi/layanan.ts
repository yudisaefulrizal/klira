import { FARMASI } from '@klira/shared';
import type {
  FilterKfa, FilterMasterObat, FilterRiwayatObat, HalamanMasterObatDto, HasilBuatResepDto, HasilSiapDto, MasterObatDto, MasterObatMasukan, MutasiStokDto, MutasiStokMasukan, PenggunaSaya,
  ReferensiKfaDto, ResepDto, ResepMasukan, RiwayatObatDto, StokObatDto, TelaahMasukan, UbahMasterObatMasukan,
} from '@klira/shared';
import type { PenampungAudit } from '../../middleware/audit';
import { gagal } from '../hasil';
import type { Hasil } from '../hasil';
import type { RepositoriFarmasiPrisma } from './repositori';

type Pelaku = Pick<PenggunaSaya, 'id' | 'fasyankes_id'>;
export type DependensiFarmasi = { repo: Pick<RepositoriFarmasiPrisma, keyof RepositoriFarmasiPrisma>; audit: PenampungAudit };
const G = FARMASI.galat;

export function buatLayananFarmasi({ repo, audit }: DependensiFarmasi) {
  const catat = (p: Pelaku, aksi: 'input' | 'perbaikan' | 'lihat', entitas: string, id: number | null, keterangan: string, alamat?: string) =>
    audit.catat({ fasyankes_id: p.fasyankes_id, pengguna_id: p.id, aksi, entitas, entitas_id: id, keterangan, alamat });

  return {
    cariKfa: (f: FilterKfa): Promise<ReferensiKfaDto[]> => repo.cariKfa(f),
    daftarMaster: (p: Pelaku, f: FilterMasterObat): Promise<HalamanMasterObatDto> => repo.daftarMaster(p.fasyankes_id, f),

    async buatMaster(p: Pelaku, m: MasterObatMasukan, alamat?: string): Promise<Hasil<MasterObatDto>> {
      const k = await repo.kfa(m.kfa_id);
      if (!k) return gagal('tidak_valid', G.kfaTidakAda, 'kfa_id');
      if (k.status !== 'aktif') return gagal('tidak_valid', G.kfaTidakAktif, 'kfa_id');
      const hasil = await repo.buatMaster(p.fasyankes_id, p.id, m);
      if (hasil === 'duplikat') return gagal('konflik', G.obatTertaut, 'kfa_id');
      await catat(p, 'input', 'master_obat', hasil.id, `Obat ${hasil.nama_tampil} (KFA ${hasil.kfa_kode}) ditambahkan ke master`, alamat);
      return { ok: true, data: hasil };
    },

    async ubahMaster(p: Pelaku, id: number, m: UbahMasterObatMasukan, alamat?: string): Promise<Hasil<MasterObatDto>> {
      const hasil = await repo.ubahMaster(p.fasyankes_id, id, m);
      if (!hasil) return gagal('tidak_ditemukan', G.obatTidakAda);
      await catat(p, 'perbaikan', 'master_obat', id, `Master obat ${hasil.nama_tampil} diubah (${Object.keys(m).join(', ')})`, alamat);
      return { ok: true, data: hasil };
    },

    async stok(p: Pelaku, masterId: number): Promise<Hasil<{ stok: StokObatDto[]; mutasi: MutasiStokDto[] }>> {
      if (!(await repo.master(p.fasyankes_id, masterId))) return gagal('tidak_ditemukan', G.obatTidakAda);
      return { ok: true, data: { stok: await repo.stokMaster(p.fasyankes_id, masterId), mutasi: await repo.riwayatMutasi(p.fasyankes_id, masterId) } };
    },

    async mutasi(p: Pelaku, m: MutasiStokMasukan, alamat?: string): Promise<Hasil<StokObatDto>> {
      const h = await repo.mutasi(p.fasyankes_id, p.id, m);
      if (!h.ok) {
        return h.sebab === 'obat_tidak_ada' ? gagal('tidak_ditemukan', G.obatTidakAda) : h.sebab === 'batch_tidak_ada' ? gagal('tidak_valid', G.batchTidakAda, 'batch') : gagal('konflik', G.stokTidakCukup, 'jumlah');
      }
      await catat(p, 'input', 'mutasi_stok', h.stok.id, `${m.jenis} batch ${m.batch}, stok sekarang ${h.stok.jumlah}${m.alasan ? ` (${m.alasan})` : ''}`, alamat);
      return { ok: true, data: h.stok };
    },

    /** Resep dari dokter: obat harus aktif di master klinik; biaya masuk tagihan saat diajukan (4.5, 7). */
    async buatResep(p: Pelaku, kunjunganId: number, m: ResepMasukan, alamat?: string): Promise<Hasil<HasilBuatResepDto>> {
      const k = await repo.kunjungan(p.fasyankes_id, kunjunganId);
      if (!k) return gagal('tidak_ditemukan', G.kunjunganTidakAda);
      if (k.tahap_layanan === 'ditutup') return gagal('konflik', G.kunjunganDitutup);
      const item = m.item.map((i) => ({ master_obat_id: i.master_obat_id, aturan_pakai: i.aturan_pakai.trim(), bentuk: i.bentuk?.trim() || null, rute: i.rute?.trim() || null, jumlah: Number(i.jumlah) }));
      const obat = await repo.obatAktifDari(p.fasyankes_id, item.map((i) => i.master_obat_id));
      if (new Set(obat.map((o) => o.id)).size !== new Set(item.map((i) => i.master_obat_id)).size) return gagal('tidak_valid', G.obatTidakAda, 'item');
      const { resepId, tagihan } = await repo.buatResep({ fasyankesId: p.fasyankes_id, kunjungan: k, dpjpId: p.id, oleh: p.id, item, obat });
      const resep = (await repo.resep(p.fasyankes_id, resepId))!;
      await catat(p, 'input', 'resep', resepId, `Resep ${resep.nomor_resep} (${item.length} obat) untuk kunjungan ${kunjunganId}, tagihan obat dibuat`, alamat);
      return { ok: true, data: { resep, tagihan } };
    },

    async resepKunjungan(p: Pelaku, kunjunganId: number, alamat?: string): Promise<Hasil<ResepDto[]>> {
      if (!(await repo.kunjungan(p.fasyankes_id, kunjunganId))) return gagal('tidak_ditemukan', G.kunjunganTidakAda);
      await catat(p, 'lihat', 'resep', null, `Resep kunjungan ${kunjunganId} dibuka`, alamat);
      return { ok: true, data: await repo.resepKunjungan(p.fasyankes_id, kunjunganId) };
    },

    async telaah(p: Pelaku, resepId: number, m: TelaahMasukan, alamat?: string): Promise<Hasil<ResepDto>> {
      const r = await repo.resep(p.fasyankes_id, resepId);
      if (!r) return gagal('tidak_ditemukan', G.resepTidakAda);
      if (r.status === 'siap' || r.status === 'diserahkan') return gagal('konflik', G.statusTidakSah);
      if (!(await repo.catatTelaah(p.fasyankes_id, resepId, p.id, m))) return gagal('konflik', G.statusTidakSah);
      await catat(p, 'input', 'telaah_resep', resepId, `Telaah resep ${r.nomor_resep}: ${m.administratif && m.farmasetik && m.klinis ? 'terpenuhi' : 'belum terpenuhi'}`, alamat);
      return { ok: true, data: (await repo.resep(p.fasyankes_id, resepId))! };
    },

    /** Tandai siap (setelah telaah terpenuhi). Stok kurang tidak memblokir: kekurangannya dilaporkan agar apoteker menyiapkan sendiri (3.2 Peringatan stok kurang). */
    async siap(p: Pelaku, resepId: number, alamat?: string): Promise<Hasil<HasilSiapDto>> {
      const r = await repo.resep(p.fasyankes_id, resepId);
      if (!r) return gagal('tidak_ditemukan', G.resepTidakAda);
      if (r.status === 'diajukan') return gagal('konflik', G.telaahBelumLengkap);
      if (r.status !== 'ditelaah') return gagal('konflik', G.statusTidakSah);
      const hasil = await repo.tandaiSiap(p.fasyankes_id, resepId);
      if (!hasil) return gagal('konflik', G.statusTidakSah);
      const baru = (await repo.resep(p.fasyankes_id, resepId))!;
      const kekurangan = baru.item.filter((i) => i.stok_tersedia < i.jumlah).map((i) => ({ master_obat_id: i.master_obat_id, nama: i.nama, butuh: i.jumlah, tersedia: i.stok_tersedia }));
      await catat(p, 'perbaikan', 'resep', resepId, `Resep ${baru.nomor_resep} siap${kekurangan.length ? `, stok kurang ${kekurangan.length} obat` : ''}`, alamat);
      return { ok: true, data: { resep: baru, kekurangan, tahap_kunjungan: hasil.tahap } };
    },

    riwayat: (p: Pelaku, f: FilterRiwayatObat): Promise<RiwayatObatDto> => repo.riwayat(p.fasyankes_id, f),
  };
}
export type LayananFarmasi = ReturnType<typeof buatLayananFarmasi>;
