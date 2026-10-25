import { REKAM_MEDIS } from '@klira/shared';
import type {
  BagianKlinis, DokumenKunjunganDto, FilterLaporan, FilterPembukaan, FilterPenyampaian, HalamanPembukaanDto, HalamanPenyampaianDto, KeputusanPerbaikanMasukan, LaporanDto, PembukaanDto, PembukaanMasukan, PenggunaSaya,
  PenyampaianMasukan, ResumeMasukan, SuratDto, SuratMasukan,
} from '@klira/shared';
import type { PenampungAudit } from '../../middleware/audit';
import { gagal } from '../hasil';
import type { Hasil } from '../hasil';
import { keDto } from './layanan';
import type { LayananPengesahan } from './layanan';
import type { RepositoriDokumenPrisma } from './repositori-dokumen';
import type { RepositoriRmPrisma } from './repositori-rm';

type Pelaku = Pick<PenggunaSaya, 'id' | 'fasyankes_id'>;
type BacaKlinis = { bacaBagian: (fasyankesId: number, kunjunganId: number, bagian: BagianKlinis) => Promise<unknown> };
type DiagnosisDokter = { item?: { kode: string; nama: string; peran: 'utama' | 'penyerta' }[] };
type TindakanDokter = { item?: { kode: string; nama: string }[] };
const G = REKAM_MEDIS.galat;

export type DependensiDokumen = {
  repo: RepositoriDokumenPrisma; repoRm: Pick<RepositoriRmPrisma, 'kunjungan' | 'pengkodean'>; pengesahan: LayananPengesahan; baca: BacaKlinis; audit: PenampungAudit;
};

/**
 * Dokumen Rekam medis (4.2, 4.4): resume medis (pengesahan entitas `resume_medis`, ubah butuh alasan), surat klinis bernomor, permintaan pembukaan tanpa persetujuan
 * (ditinjau orang lain), penyampaian rekam medis, dan laporan. Semua tercatat di audit; tidak ada hapus.
 */
export function buatLayananDokumen({ repo, repoRm, pengesahan, baca, audit }: DependensiDokumen) {
  pengesahan.daftarkanPenyedia('resume_medis', async (fas, id) => (await repo.resume(fas, id))?.isi ?? null);
  const catat = (p: Pelaku, aksi: 'input' | 'perbaikan' | 'lihat', entitas: string, id: number | null, keterangan: string, alamat?: string) =>
    audit.catat({ fasyankes_id: p.fasyankes_id, pengguna_id: p.id, aksi, entitas, entitas_id: id, keterangan, alamat });

  async function dokumen(p: Pelaku, kunjunganId: number): Promise<Hasil<DokumenKunjunganDto>> {
    const k = await repoRm.kunjungan(p.fasyankes_id, kunjunganId);
    if (!k) return gagal('tidak_ditemukan', G.kunjunganTidakAda);
    const [r, kead, diag, tind, final, surat] = await Promise.all([
      repo.resume(p.fasyankes_id, kunjunganId),
      pengesahan.keadaan(p.fasyankes_id, 'resume_medis', kunjunganId),
      baca.bacaBagian(p.fasyankes_id, kunjunganId, 'diagnosis') as Promise<DiagnosisDokter | null>,
      baca.bacaBagian(p.fasyankes_id, kunjunganId, 'tindakan') as Promise<TindakanDokter | null>,
      repoRm.pengkodean(p.fasyankes_id, kunjunganId),
      repo.daftarSurat(p.fasyankes_id, kunjunganId),
    ]);
    const utama = final?.isi.diagnosis.find((d) => d.peran === 'utama') ?? diag?.item?.find((d) => d.peran === 'utama');
    return {
      ok: true,
      data: {
        kunjungan: { id: k.id, pasien_id: k.pasien_id, pasien_nama: k.pasien_nama, pasien_nomor_rm: k.pasien_nomor_rm, tahap_layanan: k.tahap_layanan },
        resume: r && { isi: r.isi, versi: kead.pengesahan?.versi ?? 1, pengesahan: kead.pengesahan ? keDto(kead.pengesahan) : null, verifikasi: kead.status === 'sah' ? 'sah' : kead.status === 'berubah' ? 'berubah' : 'belum_disahkan', diperbarui_pada: r.diperbarui_pada.toISOString() },
        saran: { diagnosis_akhir: utama ? `${utama.kode} ${utama.nama}` : '', terapi: (tind?.item ?? []).map((t) => t.nama).join(', '), kondisi_pulang: '' },
        surat,
      },
    };
  }

  return {
    dokumen: async (p: Pelaku, kunjunganId: number, alamat?: string): Promise<Hasil<DokumenKunjunganDto>> => {
      const h = await dokumen(p, kunjunganId);
      if (h.ok) await catat(p, 'lihat', 'resume_medis', kunjunganId, 'Membuka resume dan surat kunjungan', alamat);
      return h;
    },

    /** Simpan resume setelah kunjungan ditutup. Mengubah resume yang sudah ada butuh alasan dan membentuk versi baru (versi lama tersimpan). */
    async simpanResume(p: Pelaku, kunjunganId: number, m: ResumeMasukan, alamat?: string): Promise<Hasil<DokumenKunjunganDto>> {
      const k = await repoRm.kunjungan(p.fasyankes_id, kunjunganId);
      if (!k) return gagal('tidak_ditemukan', G.kunjunganTidakAda);
      if (k.tahap_layanan !== 'ditutup') return gagal('konflik', G.belumDitutup2);
      const { alasan, ...isi } = m;
      const siap = await pengesahan.siapkan({
        fasyankesId: p.fasyankes_id, pelakuId: p.id, fitur: 'klinis', entitas: 'resume_medis', entitasId: kunjunganId, isiBaru: isi, alasan: alasan ?? null, lewatiBatas: true,
        bacaIsiSekarang: async () => (await repo.resume(p.fasyankes_id, kunjunganId))?.isi ?? null,
      });
      if (!siap.ok) return siap;
      if (siap.data.jenis === 'baru') {
        await repo.simpanResume({ fasyankesId: p.fasyankes_id, kunjunganId, isi, oleh: p.id, pengesahan: siap.data.rencana });
        await catat(p, siap.data.rencana.versi > 1 ? 'perbaikan' : 'input', 'resume_medis', kunjunganId, `Resume medis kunjungan ${kunjunganId} versi ${siap.data.rencana.versi}`, alamat);
      }
      return dokumen(p, kunjunganId);
    },

    async buatSurat(p: Pelaku, kunjunganId: number, m: SuratMasukan, alamat?: string): Promise<Hasil<SuratDto>> {
      if (!(await repoRm.kunjungan(p.fasyankes_id, kunjunganId))) return gagal('tidak_ditemukan', G.kunjunganTidakAda);
      const s = await repo.buatSurat({ fasyankesId: p.fasyankes_id, kunjunganId, jenis: m.jenis, tujuan: m.tujuan ?? null, isi: m.isi, dokterId: p.id });
      await catat(p, 'input', 'surat', s.id, `Surat ${m.jenis} ${s.nomor} kunjungan ${kunjunganId}`, alamat);
      const dibuat = (await repo.daftarSurat(p.fasyankes_id, kunjunganId)).find((x) => x.id === s.id);
      return dibuat ? { ok: true, data: dibuat } : gagal('tidak_ditemukan', G.suratTidakAda);
    },

    async ajukanPembukaan(p: Pelaku, m: PembukaanMasukan, alamat?: string): Promise<Hasil<{ id: number }>> {
      if (!(await repo.pasien(p.fasyankes_id, m.pasien_id))) return gagal('tidak_ditemukan', G.pasienTidakAda);
      const id = await repo.buatPembukaan(p.fasyankes_id, m, p.id);
      await catat(p, 'input', 'pembukaan_rm', id, `Permintaan pembukaan rekam medis pasien ${m.pasien_id} (${m.dasar})`, alamat);
      return { ok: true, data: { id } };
    },

    daftarPembukaan: (p: Pelaku, f: FilterPembukaan): Promise<HalamanPembukaanDto> => repo.daftarPembukaan(p.fasyankes_id, f),

    /** Keputusan atas permintaan pembukaan: penyetuju harus orang lain dari pemohon; menolak butuh catatan. */
    async putuskanPembukaan(p: Pelaku, id: number, m: KeputusanPerbaikanMasukan, alamat?: string): Promise<Hasil<PembukaanDto>> {
      const q = await repo.pembukaan(p.fasyankes_id, id);
      if (!q) return gagal('tidak_ditemukan', G.pembukaanTidakAda);
      if (q.status !== 'diajukan') return gagal('konflik', G.sudahDiputuskan);
      if (q.diminta_oleh === p.id) return gagal('konflik', G.penyetujuSama);
      const status = m.keputusan === 'setujui' ? 'disetujui' : 'ditolak';
      if (!(await repo.putuskanPembukaan(p.fasyankes_id, id, status, p.id, m.catatan?.trim() || null))) return gagal('konflik', G.sudahDiputuskan);
      await catat(p, 'perbaikan', 'pembukaan_rm', id, `Permintaan pembukaan rekam medis ${status}`, alamat);
      const h = (await repo.daftarPembukaan(p.fasyankes_id, { halaman: 1, ukuran: 100 })).data.find((x) => x.id === id);
      return h ? { ok: true, data: h } : gagal('tidak_ditemukan', G.pembukaanTidakAda);
    },

    async catatPenyampaian(p: Pelaku, m: PenyampaianMasukan, alamat?: string): Promise<Hasil<{ id: number }>> {
      if (!(await repo.pasien(p.fasyankes_id, m.pasien_id))) return gagal('tidak_ditemukan', G.pasienTidakAda);
      if (m.kunjungan_id && !(await repo.kunjunganAda(p.fasyankes_id, m.kunjungan_id, m.pasien_id))) return gagal('tidak_ditemukan', G.kunjunganTidakAda);
      const id = await repo.buatPenyampaian(p.fasyankes_id, m, p.id);
      await catat(p, 'input', 'penyampaian_rm', id, `Penyampaian rekam medis pasien ${m.pasien_id} kepada ${m.hubungan} (${m.bentuk})`, alamat);
      return { ok: true, data: { id } };
    },

    daftarPenyampaian: (p: Pelaku, f: FilterPenyampaian): Promise<HalamanPenyampaianDto> => repo.daftarPenyampaian(p.fasyankes_id, f),

    async laporan(p: Pelaku, f: FilterLaporan, alamat?: string): Promise<LaporanDto> {
      const l = await repo.laporan(p.fasyankes_id, f);
      await catat(p, 'lihat', 'laporan_rm', null, `Laporan ${f.jenis} ${l.dari} s.d. ${l.sampai}`, alamat);
      return l;
    },
  };
}
export type LayananDokumen = ReturnType<typeof buatLayananDokumen>;
