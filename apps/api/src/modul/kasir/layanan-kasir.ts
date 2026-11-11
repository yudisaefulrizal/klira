import { kabarkanLayarPanggilan } from '../layar-panggilan/kanal';
import { KASIR } from '@klira/shared';
import type { BarisBayar, BukaShiftMasukan, HasilBayarDto, KasirKunjunganDto, PenggunaSaya, RekapHarianDto, ResepDto, ShiftDto, TutupKunjunganMasukan, TutupShiftMasukan } from '@klira/shared';
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
    const [tagihan, resep, shift, tarif] = await Promise.all([
      repo.tagihan(p.fasyankes_id, kunjunganId), farmasi.resepKunjungan(p.fasyankes_id, kunjunganId), repo.shiftTerbuka(p.fasyankes_id, p.id), repo.tarifAktif(p.fasyankes_id, k.cara_pembayaran),
    ]);
    return {
      kunjungan: k, tagihan, resep, shift_terbuka: !!shift, tarif,
      syarat: {
        tahap_kasir: k.tahap_layanan === 'kasir', tagihan_lengkap: tagihan.status_tagihan === 'lengkap', resep_diserahkan: resep.every((r: ResepDto) => r.status === 'diserahkan'), lunas: tagihan.sisa === 0,
        ditanggung_jkn: k.cara_pembayaran === 'jkn',
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

    /** Satu tagihan dibayar 1-3 metode: dicatat dalam satu transaksi dengan satu entri audit. */
    async bayar(p: Pelaku, kunjunganId: number, m: { pembayaran: BarisBayar[] }, alamat?: string): Promise<Hasil<HasilBayarDto>> {
      if (!(await repo.kunjungan(p.fasyankes_id, kunjunganId))) return gagal('tidak_ditemukan', G.kunjunganTidakAda);
      const h = await repo.bayar(p.fasyankes_id, p.id, kunjunganId, m.pembayaran);
      if (!h.ok) {
        if (h.sebab === 'non_tunai_lebih') return gagal('tidak_valid', G.nonTunaiLebih, 'pembayaran');
        const pesan = { tahap_salah: G.tahapSalah, tagihan_kosong: G.tagihanKosong, tagihan_belum_lengkap: G.tagihanBelumLengkap, sudah_lunas: G.sudahLunas, tanpa_shift: G.tanpaShift }[h.sebab];
        return gagal('konflik', pesan);
      }
      const rincian = h.pembayaran.map((x) => `${x.metode} ${rp(x.jumlah)}`).join(', ');
      const kemb = h.kembalian ? `, kembalian ${rp(h.kembalian)}` : '';
      await catat(p, 'input', 'pembayaran', h.pembayaran[0]?.id ?? null, `Pembayaran ${rincian} untuk kunjungan ${kunjunganId}${kemb}, sisa ${rp(h.tagihan.sisa)}`, alamat);
      return { ok: true, data: { pembayaran: h.pembayaran, tagihan: h.tagihan, diterima: h.diterima, diterapkan: h.diterapkan, kembalian: h.kembalian } };
    },

    async lengkapiHarga(p: Pelaku, kunjunganId: number, itemId: number, m: { harga: number }, alamat?: string): Promise<Hasil<KasirKunjunganDto>> {
      if (!(await repo.kunjungan(p.fasyankes_id, kunjunganId))) return gagal('tidak_ditemukan', G.kunjunganTidakAda);
      const h = await repo.lengkapiHarga(p.fasyankes_id, kunjunganId, itemId, m.harga);
      if (!h.ok) {
        if (h.sebab === 'tidak_ada') return gagal('tidak_ditemukan', G.itemTidakAda);
        return gagal('konflik', h.sebab === 'terkunci' ? G.tagihanTerkunci : G.hargaSudahAda);
      }
      await catat(p, 'perbaikan', 'item_tagihan', itemId, `Harga item "${h.nama}" dilengkapi ${rp(m.harga)}`, alamat);
      return { ok: true, data: (await gambaran(p, kunjunganId))! };
    },

    async tambahItem(p: Pelaku, kunjunganId: number, m: { tarif_id: number; jumlah: number }, alamat?: string): Promise<Hasil<KasirKunjunganDto>> {
      if (!(await repo.kunjungan(p.fasyankes_id, kunjunganId))) return gagal('tidak_ditemukan', G.kunjunganTidakAda);
      const h = await repo.tambahItem(p.fasyankes_id, p.id, kunjunganId, m.tarif_id, m.jumlah);
      if (!h.ok) return h.sebab === 'terkunci' ? gagal('konflik', G.tagihanTerkunci) : gagal('tidak_valid', G.tarifTidakAda, 'tarif_id');
      await catat(p, 'input', 'item_tagihan', kunjunganId, `Item tagihan ditambah kasir: ${h.nama} x${h.jumlah} @ ${rp(h.harga)}`, alamat);
      return { ok: true, data: (await gambaran(p, kunjunganId))! };
    },

    async hapusItem(p: Pelaku, kunjunganId: number, itemId: number, alamat?: string): Promise<Hasil<KasirKunjunganDto>> {
      if (!(await repo.kunjungan(p.fasyankes_id, kunjunganId))) return gagal('tidak_ditemukan', G.kunjunganTidakAda);
      const h = await repo.hapusItem(p.fasyankes_id, kunjunganId, itemId);
      if (!h.ok) {
        if (h.sebab === 'tidak_ada') return gagal('tidak_ditemukan', G.itemTidakAda);
        return gagal('konflik', { bukan_manual: G.itemBukanManual, terkunci: G.tagihanTerkunci, melebihi_bayar: G.hapusMelebihiBayar }[h.sebab]);
      }
      await catat(p, 'perbaikan', 'item_tagihan', itemId, `Item tagihan tambahan dihapus: ${h.nama} (kunjungan ${kunjunganId})`, alamat);
      return { ok: true, data: (await gambaran(p, kunjunganId))! };
    },

    async tutup(p: Pelaku, kunjunganId: number, m: TutupKunjunganMasukan, alamat?: string): Promise<Hasil<KasirKunjunganDto>> {
      if (!(await repo.kunjungan(p.fasyankes_id, kunjunganId))) return gagal('tidak_ditemukan', G.kunjunganTidakAda);
      const h = await repo.tutup(p.fasyankes_id, kunjunganId, m.alasan?.trim() || null, KASIR.jkn.alasan);
      if (!h.ok) {
        const pesan = { tahap_salah: G.tahapSalah, tagihan_belum_lengkap: G.tagihanBelumLengkap, resep_belum: G.resepBelumDiserahkan, belum_lunas_alasan: G.belumLunasAlasan, bentrok: G.bentrok }[h.sebab];
        return gagal('konflik', pesan, h.sebab === 'belum_lunas_alasan' ? 'alasan' : undefined);
      }
      kabarkanLayarPanggilan(p.fasyankes_id);
      const g = (await gambaran(p, kunjunganId))!;
      const alasanTutup = g.tagihan.alasan_tutup_belum_lunas;
      await catat(p, 'perbaikan', 'kunjungan', kunjunganId, `Kunjungan ditutup${alasanTutup ? ` belum lunas (${alasanTutup})` : ''}`, alamat);
      return { ok: true, data: g };
    },
  };
}
export type LayananKasir = ReturnType<typeof buatLayananKasir>;
export type { BukaShiftMasukan, TutupShiftMasukan };
