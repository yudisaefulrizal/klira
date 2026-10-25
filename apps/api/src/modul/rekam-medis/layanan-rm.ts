import { REKAM_MEDIS, SKEMA_BAGIAN } from '@klira/shared';
import type {
  BagianKlinis, FilterBerkas, FilterPerbaikan, HalamanBerkasDto, HalamanPerbaikanDto, HasilPerbaikanDto, KeputusanPerbaikanMasukan, PengkodeanDto, PengkodeanIsi, PenggunaSaya, PerbaikanMasukan,
  PermintaanPerbaikanDto,
} from '@klira/shared';
import type { PenampungAudit } from '../../middleware/audit';
import { gagal } from '../hasil';
import type { Hasil } from '../hasil';
import type { LayananPengesahan } from './layanan';
import { bolehPerbaikiSendiri } from './pengesahan';
import type { RepositoriPengesahan } from './repositori';
import type { RepositoriRmPrisma } from './repositori-rm';

type Pelaku = Pick<PenggunaSaya, 'id' | 'fasyankes_id'>;
type Terapkan = (p: Pelaku, kunjunganId: number, bagian: BagianKlinis, isi: unknown, alasan: string | undefined, alamat?: string, opsi?: { perbaikan?: boolean; disetujuiOleh?: number }) => Promise<Hasil<unknown>>;
type Klinis = { simpanBagian: Terapkan };
type BacaKlinis = { bacaBagian: (fasyankesId: number, kunjunganId: number, bagian: BagianKlinis) => Promise<unknown> };
const G = REKAM_MEDIS.galat;

type DiagnosisDokter = { item?: { kode: string; nama: string; peran: 'utama' | 'penyerta' }[] };
type TindakanDokter = { item?: { kode: string; nama: string }[] };

export type DependensiRm = { repo: RepositoriRmPrisma; pengesahanRepo: Pick<RepositoriPengesahan, 'terakhir'>; pengesahan: LayananPengesahan; klinis: Klinis; baca: BacaKlinis; audit: PenampungAudit; sekarang?: () => Date };

/**
 * Rekam medis (3.1, 4.2): perbaikan catatan (langsung oleh pembuat dalam 2x24 jam, selebihnya lewat persetujuan orang lain), pengkodean ICD final,
 * arsip (mengikuti pengkodean, retensi 25 tahun), dan daftar berkas. Semua tercatat di audit; tidak ada hapus.
 */
export function buatLayananRm({ repo, pengesahanRepo, pengesahan, klinis, baca, audit, sekarang = () => new Date() }: DependensiRm) {
  pengesahan.daftarkanPenyedia('pengkodean', async (fas, id) => (await repo.pengkodean(fas, id))?.isi ?? null);

  const catat = (p: Pelaku, aksi: 'input' | 'perbaikan' | 'lihat', entitas: string, id: number | null, keterangan: string, alamat?: string) =>
    audit.catat({ fasyankes_id: p.fasyankes_id, pengguna_id: p.id, aksi, entitas, entitas_id: id, keterangan, alamat });
  const bacaIsi = (fas: number) => (kunjunganId: number, bagian: BagianKlinis) => baca.bacaBagian(fas, kunjunganId, bagian);

  async function kePermintaanDto(fas: number, id: number): Promise<PermintaanPerbaikanDto | null> {
    const h = await repo.daftarPermintaan(fas, { halaman: 1, ukuran: 100 }, bacaIsi(fas));
    return h.data.find((x) => x.id === id) ?? null;
  }

  return {
    /** Ajukan perbaikan satu bagian: pembuat pengesahan terakhir dalam 2x24 jam langsung diterapkan; selain itu menjadi permintaan yang menunggu persetujuan. */
    async ajukanPerbaikan(p: Pelaku, kunjunganId: number, m: PerbaikanMasukan, alamat?: string): Promise<Hasil<HasilPerbaikanDto>> {
      if (!(await repo.kunjungan(p.fasyankes_id, kunjunganId))) return gagal('tidak_ditemukan', G.kunjunganTidakAda);
      const h = SKEMA_BAGIAN[m.bagian].safeParse(m.isi);
      if (!h.success) return { ok: false, kode: 'tidak_valid', pesan: G.isiTidakSah, rincian: h.error.issues.map((i) => ({ jalur: ['isi', ...i.path].join('.'), pesan: i.message })) };
      const terakhir = await pengesahanRepo.terakhir(p.fasyankes_id, m.bagian, kunjunganId);
      if (!terakhir) return gagal('konflik', G.belumDisahkan);
      if (await repo.adaMenunggu(p.fasyankes_id, kunjunganId, m.bagian)) return gagal('konflik', G.sudahMenunggu);
      if (bolehPerbaikiSendiri(terakhir, p.id, sekarang())) {
        const r = await klinis.simpanBagian(p, kunjunganId, m.bagian, h.data, m.alasan, alamat, { perbaikan: true });
        if (!r.ok) return r;
        return { ok: true, data: { jenis: 'diterapkan', permintaan: null } };
      }
      const id = await repo.buatPermintaan({ fasyankesId: p.fasyankes_id, kunjunganId, bagian: m.bagian, isi: h.data, alasan: m.alasan, pemohonId: p.id });
      await catat(p, 'input', 'permintaan_perbaikan', id, `Permintaan perbaikan ${m.bagian} kunjungan ${kunjunganId}`, alamat);
      return { ok: true, data: { jenis: 'diajukan', permintaan: await kePermintaanDto(p.fasyankes_id, id) } };
    },

    daftarPerbaikan: (p: Pelaku, f: FilterPerbaikan): Promise<HalamanPerbaikanDto> => repo.daftarPermintaan(p.fasyankes_id, f, bacaIsi(p.fasyankes_id)),

    /** Keputusan atas permintaan: penyetuju harus orang lain; setuju menerapkan isi atas nama pemohon dengan penyetuju tercatat di versi lama. */
    async putuskan(p: Pelaku, id: number, m: KeputusanPerbaikanMasukan, alamat?: string): Promise<Hasil<PermintaanPerbaikanDto>> {
      const q = await repo.permintaan(p.fasyankes_id, id);
      if (!q) return gagal('tidak_ditemukan', G.permintaanTidakAda);
      if (q.status !== 'diajukan') return gagal('konflik', G.sudahDiputuskan);
      const catatan = m.catatan?.trim() || null;
      if (m.keputusan === 'tolak') {
        if (!(await repo.putuskan(p.fasyankes_id, id, 'ditolak', p.id, catatan))) return gagal('konflik', G.sudahDiputuskan);
        await catat(p, 'perbaikan', 'permintaan_perbaikan', id, `Permintaan perbaikan ${q.bagian} kunjungan ${q.kunjungan_id} ditolak`, alamat);
        return { ok: true, data: (await kePermintaanDto(p.fasyankes_id, id)) ?? ({ id } as PermintaanPerbaikanDto) };
      }
      if (q.pemohon_id === p.id) return gagal('konflik', G.penyetujuSama);
      if (!(await repo.putuskan(p.fasyankes_id, id, 'disetujui', p.id, catatan))) return gagal('konflik', G.sudahDiputuskan);
      const r = await klinis.simpanBagian({ id: q.pemohon_id, fasyankes_id: p.fasyankes_id }, q.kunjungan_id, q.bagian, q.isi_baru, q.alasan, alamat, { perbaikan: true, disetujuiOleh: p.id });
      if (!r.ok) {
        await repo.kembalikan(p.fasyankes_id, id);
        return r;
      }
      await catat(p, 'perbaikan', 'permintaan_perbaikan', id, `Permintaan perbaikan ${q.bagian} kunjungan ${q.kunjungan_id} disetujui dan diterapkan`, alamat);
      return { ok: true, data: (await kePermintaanDto(p.fasyankes_id, id)) ?? ({ id } as PermintaanPerbaikanDto) };
    },

    async kode(p: Pelaku, kunjunganId: number, alamat?: string): Promise<Hasil<PengkodeanDto>> {
      const k = await repo.kunjungan(p.fasyankes_id, kunjunganId);
      if (!k) return gagal('tidak_ditemukan', G.kunjunganTidakAda);
      const [diag, tind, final, terakhir] = await Promise.all([
        baca.bacaBagian(p.fasyankes_id, kunjunganId, 'diagnosis') as Promise<DiagnosisDokter | null>,
        baca.bacaBagian(p.fasyankes_id, kunjunganId, 'tindakan') as Promise<TindakanDokter | null>,
        repo.pengkodean(p.fasyankes_id, kunjunganId),
        pengesahanRepo.terakhir(p.fasyankes_id, 'pengkodean', kunjunganId),
      ]);
      await catat(p, 'lihat', 'pengkodean', kunjunganId, 'Membuka pengkodean kunjungan', alamat);
      return {
        ok: true,
        data: {
          kunjungan_id: kunjunganId, pasien_nama: k.pasien_nama, pasien_nomor_rm: k.pasien_nomor_rm, tahap_layanan: k.tahap_layanan,
          dokter: { diagnosis: (diag?.item ?? []).map((d) => ({ kode: d.kode, nama: d.nama, peran: d.peran })), tindakan: (tind?.item ?? []).map((t) => ({ kode: t.kode, nama: t.nama })) },
          final: final?.isi ?? null, versi: terakhir?.versi ?? null, pengode_nama: final?.pengode_nama ?? null, diperbarui_pada: final?.diperbarui_pada.toISOString() ?? null,
          diarsipkan_pada: k.diarsipkan_pada?.toISOString() ?? null, retensi_sampai: k.retensi_sampai?.toISOString().slice(0, 10) ?? null,
        },
      };
    },

    /** Simpan kode final (setelah kunjungan ditutup). Mengubah kode yang sudah ada butuh catatan sebagai alasan dan membentuk versi baru. Arsip mengikuti pengkodean. */
    async simpanKode(p: Pelaku, kunjunganId: number, isi: PengkodeanIsi, alamat?: string): Promise<Hasil<PengkodeanDto>> {
      const k = await repo.kunjungan(p.fasyankes_id, kunjunganId);
      if (!k) return gagal('tidak_ditemukan', G.kunjunganTidakAda);
      if (k.tahap_layanan !== 'ditutup') return gagal('konflik', G.belumDitutup);
      const siap = await pengesahan.siapkan({
        fasyankesId: p.fasyankes_id, pelakuId: p.id, fitur: 'rekam-medis', entitas: 'pengkodean', entitasId: kunjunganId, isiBaru: isi, alasan: isi.catatan ?? null, lewatiBatas: true,
        bacaIsiSekarang: async () => (await repo.pengkodean(p.fasyankes_id, kunjunganId))?.isi ?? null,
      });
      if (!siap.ok) return siap;
      if (siap.data.jenis === 'baru') {
        const h = await repo.simpanPengkodean({ fasyankesId: p.fasyankes_id, kunjunganId, isi, pengodeId: p.id, pengesahan: siap.data.rencana });
        await catat(p, siap.data.rencana.versi > 1 ? 'perbaikan' : 'input', 'pengkodean', kunjunganId, `Pengkodean kunjungan ${kunjunganId} versi ${siap.data.rencana.versi}${h.diarsipkan ? ', diarsipkan' : ''}`, alamat);
      }
      const hasil = await this.kode(p, kunjunganId);
      return hasil;
    },

    berkas(p: Pelaku, f: FilterBerkas): Promise<HalamanBerkasDto> {
      return repo.berkas(p.fasyankes_id, f, async (ids) => {
        const peta = new Map<number, string | null>();
        for (const id of ids) {
          const d = (await baca.bacaBagian(p.fasyankes_id, id, 'diagnosis')) as DiagnosisDokter | null;
          const utama = d?.item?.find((x) => x.peran === 'utama');
          peta.set(id, utama ? `${utama.kode} ${utama.nama}` : null);
        }
        return peta;
      });
    },
  };
}
export type LayananRm = ReturnType<typeof buatLayananRm>;
