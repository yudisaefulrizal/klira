import { kabarkanLayarPanggilan } from '../layar-panggilan/kanal';
import { RAWAT_INAP } from '@klira/shared';
import type {
  AdmisiMasukan, AsalAdmisiDto, CatatanHarianDto, CatatanHarianMasukan, HasilAdmisiDto, HasilPemulanganDto, OpsiRawatInapDto, PapanDto, PemulanganMasukan, PenempatanMasukan, PenggunaSaya, RawatInapDto, ResumeMasukan,
} from '@klira/shared';
import type { PenampungAudit } from '../../middleware/audit';
import { gagal } from '../hasil';
import type { Hasil } from '../hasil';
import { keDto } from '../rekam-medis/layanan';
import type { LayananPengesahan } from '../rekam-medis/layanan';
import { GalatRi } from './repositori';
import type { KodeGalatRi, RepositoriRawatInapPrisma } from './repositori';

type Pelaku = Pick<PenggunaSaya, 'id' | 'fasyankes_id'>;
const G = RAWAT_INAP.galat;
const PESAN: Record<KodeGalatRi, { kode: 'konflik' | 'tidak_ditemukan' | 'tidak_valid'; pesan: string }> = {
  sudah_inap: { kode: 'konflik', pesan: G.sudahInap }, ada_pembayaran: { kode: 'konflik', pesan: G.adaPembayaran }, bed_tidak_sah: { kode: 'tidak_valid', pesan: G.bedTidakSah }, bed_terisi: { kode: 'konflik', pesan: G.bedTerisi },
  bukan_inap: { kode: 'konflik', pesan: G.bukanInap }, sudah_pulang: { kode: 'konflik', pesan: G.sudahPulang }, tidak_terisi: { kode: 'konflik', pesan: G.tidakTerisi }, tidak_ditemukan: { kode: 'tidak_ditemukan', pesan: G.kunjunganTidakAda },
  alasan_pindah: { kode: 'tidak_valid', pesan: G.alasanPindah }, tarif_tidak_sah: { kode: 'tidak_valid', pesan: G.tarifTidakSah },
};
const dariGalat = (e: unknown): Hasil<never> | null => (e instanceof GalatRi ? gagal(PESAN[e.kode].kode, PESAN[e.kode].pesan) : null);

export type DependensiRawatInap = {
  repo: RepositoriRawatInapPrisma; pengesahan: LayananPengesahan; audit: PenampungAudit;
  /** Menyimpan resume medis (layanan dokumen Rekam medis) dari isian pemulangan. */
  simpanResume: (p: Pelaku, kunjunganId: number, isi: ResumeMasukan, alamat?: string) => Promise<Hasil<unknown>>;
  sekarang?: () => Date;
};

/**
 * Rawat inap (3.1, 3.3): papan bed, admisi (dari rawat jalan atau langsung), ubah penempatan dan DPJP, catatan harian (CPPT, tiap catatan disahkan),
 * dan pemulangan (bed dikosongkan, biaya kamar ke tagihan, lanjut ke kasir). Semua tercatat di audit; tidak ada hapus.
 */
export function buatLayananRawatInap({ repo, pengesahan, audit, simpanResume, sekarang = () => new Date() }: DependensiRawatInap) {
  pengesahan.daftarkanPenyedia('cppt', async (fas, id) => repo.isiCatatan(fas, id));
  const catat = (p: Pelaku, aksi: 'input' | 'perbaikan' | 'lihat', entitas: string, id: number | null, keterangan: string, alamat?: string) =>
    audit.catat({ fasyankes_id: p.fasyankes_id, pengguna_id: p.id, aksi, entitas, entitas_id: id, keterangan, alamat });
  const pelaku = (p: Pelaku) => ({ fasyankesId: p.fasyankes_id, oleh: p.id });

  async function detail(p: Pelaku, id: number): Promise<Hasil<RawatInapDto>> {
    const d = await repo.detail(p.fasyankes_id, id);
    return d ? { ok: true, data: d } : gagal('tidak_ditemukan', G.kunjunganTidakAda);
  }

  return {
    papan: (p: Pelaku): Promise<PapanDto> => repo.papan(p.fasyankes_id),
    opsi: (p: Pelaku): Promise<OpsiRawatInapDto> => repo.opsi(p.fasyankes_id),

    async asal(p: Pelaku, pasienId: number): Promise<Hasil<AsalAdmisiDto>> {
      if (!(await repo.pasienAda(p.fasyankes_id, pasienId))) return gagal('tidak_ditemukan', G.pasienTidakAda);
      return { ok: true, data: await repo.asal(p.fasyankes_id, pasienId) };
    },

    async admisi(p: Pelaku, m: AdmisiMasukan, alamat?: string): Promise<Hasil<HasilAdmisiDto>> {
      if (!(await repo.pasienAda(p.fasyankes_id, m.pasien_id))) return gagal('tidak_ditemukan', G.pasienTidakAda);
      if (!(await repo.dpjpSah(p.fasyankes_id, [m.dpjp_id, ...m.dpjp_bersama]))) return gagal('tidak_valid', G.dpjpTidakSah);
      try {
        const h = await repo.admisi(pelaku(p), m, sekarang());
        kabarkanLayarPanggilan(p.fasyankes_id);
        await catat(p, 'input', 'rawat_inap', h.kunjungan_id, `Admisi rawat inap pasien ${m.pasien_id}${h.menunggu_ruangan ? ' (menunggu ruangan)' : ''}`, alamat);
        return { ok: true, data: h };
      } catch (e) {
        const g = dariGalat(e);
        if (g) return g;
        throw e;
      }
    },

    detail: async (p: Pelaku, id: number, alamat?: string): Promise<Hasil<RawatInapDto>> => {
      const h = await detail(p, id);
      if (h.ok) await catat(p, 'lihat', 'rawat_inap', id, 'Membuka data rawat inap', alamat);
      return h;
    },

    async ubahPenempatan(p: Pelaku, id: number, m: PenempatanMasukan, alamat?: string): Promise<Hasil<RawatInapDto>> {
      if (!(await repo.dpjpSah(p.fasyankes_id, [m.dpjp_id, ...m.dpjp_bersama]))) return gagal('tidak_valid', G.dpjpTidakSah);
      try {
        await repo.ubahPenempatan(pelaku(p), id, m, sekarang());
      } catch (e) {
        const g = dariGalat(e);
        if (g) return g;
        throw e;
      }
      await catat(p, 'perbaikan', 'penempatan', id, `Ubah penempatan atau DPJP kunjungan ${id}`, alamat);
      return detail(p, id);
    },

    async daftarCatatan(p: Pelaku, kunjunganId: number): Promise<Hasil<CatatanHarianDto[]>> {
      const k = await repo.kunjungan(p.fasyankes_id, kunjunganId);
      if (!k || k.jenis !== 'IMP') return gagal('tidak_ditemukan', G.kunjunganTidakAda);
      const baris = await repo.daftarCatatan(p.fasyankes_id, kunjunganId);
      const nama = await repo.namaPengguna(baris.map((b) => b.dibuat_oleh));
      const data: CatatanHarianDto[] = [];
      for (const b of baris) {
        const k2 = await pengesahan.keadaan(p.fasyankes_id, 'cppt', b.id);
        data.push({
          id: b.id, ...b.isi, tanda_vital: b.isi.tanda_vital ?? null, dibuat_oleh_nama: nama.get(b.dibuat_oleh) ?? null, waktu: b.dibuat_pada.toISOString(),
          pengesahan: k2.pengesahan ? keDto(k2.pengesahan) : null, verifikasi: k2.status === 'sah' ? 'sah' : k2.status === 'berubah' ? 'berubah' : 'belum_disahkan',
        });
      }
      return { ok: true, data };
    },

    async tambahCatatan(p: Pelaku, kunjunganId: number, m: CatatanHarianMasukan, alamat?: string): Promise<Hasil<{ id: number }>> {
      const k = await repo.kunjungan(p.fasyankes_id, kunjunganId);
      if (!k || k.jenis !== 'IMP') return gagal('tidak_ditemukan', G.kunjunganTidakAda);
      if (k.tahap_layanan === 'kasir' || k.tahap_layanan === 'ditutup') return gagal('konflik', G.sudahPulang);
      // Pengesahan tiap catatan: hash isi, versi 1; id catatan baru diketahui saat disimpan, maka rencananya disusun per id.
      const siap = await pengesahan.siapkan({ fasyankesId: p.fasyankes_id, pelakuId: p.id, fitur: 'klinis', entitas: 'cppt', entitasId: 0, isiBaru: m, bacaIsiSekarang: async () => null });
      if (!siap.ok) return siap;
      if (siap.data.jenis !== 'baru') return gagal('konflik', G.bentrok);
      const rencana = siap.data.rencana;
      const id = await repo.tambahCatatan(p.fasyankes_id, kunjunganId, m, p.id, () => rencana);
      await catat(p, 'input', 'cppt', id, `Catatan harian kunjungan ${kunjunganId}`, alamat);
      return { ok: true, data: { id } };
    },

    async pulangkan(p: Pelaku, kunjunganId: number, m: PemulanganMasukan, alamat?: string): Promise<Hasil<HasilPemulanganDto>> {
      let r;
      try {
        r = await repo.pulangkan(pelaku(p), kunjunganId, m, sekarang());
      } catch (e) {
        const g = dariGalat(e);
        if (g) return g;
        throw e;
      }
      await catat(p, 'input', 'pemulangan', kunjunganId, `Pemulangan rawat inap kunjungan ${kunjunganId} (${m.disposisi})`, alamat);
      let resumeDibuat = false;
      if (m.buat_resume) {
        const h = await simpanResume(p, kunjunganId, { ringkasan: m.ringkasan, diagnosis_akhir: m.diagnosis_akhir, terapi: m.terapi, kondisi_pulang: m.kondisi_pulang, anjuran: m.tindak_lanjut, alasan: null }, alamat);
        resumeDibuat = h.ok;
      }
      const d = await repo.detail(p.fasyankes_id, kunjunganId);
      return d?.pemulangan ? { ok: true, data: { pemulangan: d.pemulangan, resume_dibuat: resumeDibuat, tagihan_kamar: r.tagihanKamar } } : gagal('tidak_ditemukan', G.kunjunganTidakAda);
    },
  };
}
export type LayananRawatInap = ReturnType<typeof buatLayananRawatInap>;
