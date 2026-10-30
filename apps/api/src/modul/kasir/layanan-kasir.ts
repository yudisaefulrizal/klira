import { kabarkanLayarPanggilan } from '../layar-panggilan/kanal';
import { KASIR } from '@klira/shared';
import type { BukaShiftMasukan, HasilBayarDto, KasirKunjunganDto, PenggunaSaya, RekapHarianDto, ResepDto, ShiftDto, TutupKunjunganMasukan, TutupShiftMasukan } from '@klira/shared';
import type { PenampungAudit } from '../../middleware/audit';
import type { RepositoriFarmasiPrisma } from '../farmasi/repositori';
import { gagal } from '../hasil';
import type { Hasil } from '../hasil';
import { hariWib } from './repositori-kasir';
import type { RepositoriKasirPrisma } from './repositori-kasir';

type Pelaku = Pick<PenggunaSaya, 'id' | 'fasyankes_id'>;
const G = KASIR.galat;
const rp = (n: number): string => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

/** Kasir (4.5, 7): shift, pembayaran, dan tutup kunjungan. Semua tindakan tercatat di audit; tidak ada rute ubah atau hapus. */
export function buatLayananKasir({ repo, farmasi, audit }: { repo: RepositoriKasirPrisma; farmasi: Pick<RepositoriFarmasiPrisma, 'resepKunjungan'>; audit: PenampungAudit }) {
  const catat = (p: Pelaku, aksi: 'input' | 'perbaikan' | 'lihat', entitas: string, id: number | null, keterangan: string, alamat?: string) =>
    audit.catat({ fasyankes_id: p.fasyankes_id, pengguna_id: p.id, aksi, entitas, entitas_id: id, keterangan, alamat });

  async function gambaran(p: Pelaku, kunjunganId: number): Promise<KasirKunjunganDto | null> {
    const k = await repo.kunjungan(p.fasyankes_id, kunjunganId);
    if (!k) return null;
    const [tagihan, resep, shift] = await Promise.all([repo.tagihan(p.fasyankes_id, kunjunganId), farmasi.resepKunjungan(p.fasyankes_id, kunjunganId), repo.shiftTerbuka(p.fasyankes_id, p.id)]);
    return {
      kunjungan: k, tagihan, resep, shift_terbuka: !!shift,
      syarat: {
        tahap_kasir: k.tahap_layanan === 'kasir', tagihan_lengkap: tagihan.status_tagihan === 'lengkap', resep_diserahkan: resep.every((r: ResepDto) => r.status === 'diserahkan'), lunas: tagihan.sisa === 0,
      },
    };
  }

  return {
    async kunjungan(p: Pelaku, kunjunganId: number, alamat?: string): Promise<Hasil<KasirKunjunganDto>> {
      const g = await gambaran(p, kunjunganId);
      if (!g) return gagal('tidak_ditemukan', G.kunjunganTidakAda);
      await catat(p, 'lihat', 'tagihan', kunjunganId, 'Membuka kasir kunjungan', alamat);
      return { ok: true, data: g };
    },

    async shiftSaya(p: Pelaku): Promise<ShiftDto | null> {
      return repo.shiftTerbuka(p.fasyankes_id, p.id);
    },

    async bukaShift(p: Pelaku, m: { kas_awal: number }, alamat?: string): Promise<Hasil<ShiftDto>> {
      const s = await repo.bukaShift(p.fasyankes_id, p.id, m.kas_awal);
      if (s === 'sudah_ada') return gagal('konflik', G.shiftSudahAda);
      await catat(p, 'input', 'shift_kasir', s.id, `Shift dibuka, kas awal ${rp(s.kas_awal)}`, alamat);
      return { ok: true, data: s };
    },

    async tutupShift(p: Pelaku, m: { kas_akhir: number; alasan_selisih?: string | null }, alamat?: string): Promise<Hasil<ShiftDto>> {
      const sebelum = await repo.shiftTerbuka(p.fasyankes_id, p.id);
      if (!sebelum) return gagal('konflik', G.shiftTidakAda);
      if (m.kas_akhir !== sebelum.kas_seharusnya && !(m.alasan_selisih && m.alasan_selisih.trim())) return gagal('tidak_valid', G.alasanWajib, 'alasan_selisih');
      const s = await repo.tutupShift(p.fasyankes_id, p.id, { kas_akhir: m.kas_akhir, alasan_selisih: m.alasan_selisih?.trim() || null });
      if (s === 'tidak_ada') return gagal('konflik', G.shiftTidakAda);
      await catat(p, 'perbaikan', 'shift_kasir', s.id, `Shift ditutup, kas seharusnya ${rp(s.kas_seharusnya)}, kas akhir ${rp(s.kas_akhir ?? 0)}, selisih ${s.selisih ?? 0}${s.alasan_selisih ? ` (${s.alasan_selisih})` : ''}`, alamat);
      return { ok: true, data: s };
    },

    async rekap(p: Pelaku, tanggal?: string): Promise<RekapHarianDto> {
      return repo.rekap(p.fasyankes_id, tanggal ?? hariWib());
    },

    async bayar(p: Pelaku, kunjunganId: number, m: { metode: 'tunai' | 'transfer' | 'qris'; jumlah: number }, alamat?: string): Promise<Hasil<HasilBayarDto>> {
      if (!(await repo.kunjungan(p.fasyankes_id, kunjunganId))) return gagal('tidak_ditemukan', G.kunjunganTidakAda);
      const h = await repo.bayar(p.fasyankes_id, p.id, kunjunganId, m.metode, m.jumlah);
      if (!h.ok) {
        const pesan = { tahap_salah: G.tahapSalah, tagihan_kosong: G.tagihanKosong, tagihan_belum_lengkap: G.tagihanBelumLengkap, sudah_lunas: G.sudahLunas, tanpa_shift: G.tanpaShift }[h.sebab];
        return gagal('konflik', pesan);
      }
      await catat(p, 'input', 'pembayaran', h.pembayaran.id, `Pembayaran ${m.metode} ${rp(h.pembayaran.jumlah)} untuk kunjungan ${kunjunganId}, sisa ${rp(h.tagihan.sisa)}`, alamat);
      return { ok: true, data: { pembayaran: h.pembayaran, tagihan: h.tagihan, kembalian: h.kembalian } };
    },

    async tutup(p: Pelaku, kunjunganId: number, m: TutupKunjunganMasukan, alamat?: string): Promise<Hasil<KasirKunjunganDto>> {
      if (!(await repo.kunjungan(p.fasyankes_id, kunjunganId))) return gagal('tidak_ditemukan', G.kunjunganTidakAda);
      const h = await repo.tutup(p.fasyankes_id, kunjunganId, m.alasan?.trim() || null);
      if (!h.ok) {
        const pesan = { tahap_salah: G.tahapSalah, tagihan_belum_lengkap: G.tagihanBelumLengkap, resep_belum: G.resepBelumDiserahkan, belum_lunas_alasan: G.belumLunasAlasan, bentrok: G.bentrok }[h.sebab];
        return gagal('konflik', pesan, h.sebab === 'belum_lunas_alasan' ? 'alasan' : undefined);
      }
      kabarkanLayarPanggilan(p.fasyankes_id);
      await catat(p, 'perbaikan', 'kunjungan', kunjunganId, `Kunjungan ditutup${m.alasan?.trim() ? ` belum lunas (${m.alasan.trim()})` : ''}`, alamat);
      return { ok: true, data: (await gambaran(p, kunjunganId))! };
    },
  };
}
export type LayananKasir = ReturnType<typeof buatLayananKasir>;
export type { BukaShiftMasukan, TutupShiftMasukan };
