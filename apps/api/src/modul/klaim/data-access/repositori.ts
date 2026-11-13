import * as db from '@klira/db';
import type { CaraPembayaran, FilterKlaim, KodeKlaim, RingkasanKlaimDto, StatusKlaim } from '@klira/shared';
import { STATUS_KLAIM } from '@klira/shared';

export type KunjunganKlaim = {
  id: number; pasien_id: number; pasien_nama: string; pasien_nomor_rm: string; jenis: 'AMB' | 'IMP'; tahap_layanan: string; cara_pembayaran: CaraPembayaran; nomor_sep: string | null; spri: string | null; waktu_tutup: Date | null;
};
export type KlaimBaris = {
  id: number; kunjungan_id: number; nomor_sep: string | null; status: StatusKlaim; tanggal_selesai: Date; batas_pengajuan: Date; diagnosis: KodeKlaim[]; tindakan: KodeKlaim[]; berkas: string[]; catatan: string | null;
  diajukan_pada: Date | null; dikembalikan_pada: Date | null; berita_acara: string | null; batas_ajukan_ulang: Date | null; alasan: string | null; jumlah_dibayar: number | null; dibayar_pada: Date | null;
};
export type RiwayatBaris = { klaim_id: number; dari: StatusKlaim | null; ke: StatusKlaim; alasan: string | null; oleh: number; waktu: Date };
export type DataBaruKlaim = { fasyankesId: number; kunjunganId: number; nomorSep: string | null; status: StatusKlaim; tanggalSelesai: Date; batas: Date; diagnosis: KodeKlaim[]; tindakan: KodeKlaim[]; berkas: string[]; catatan: string | null; oleh: number };
export type PerubahanStatus = Partial<Pick<KlaimBaris, 'diajukan_pada' | 'dikembalikan_pada' | 'berita_acara' | 'batas_ajukan_ulang' | 'alasan' | 'jumlah_dibayar' | 'dibayar_pada'>>;

/** Penolakan aturan yang terdeteksi saat menulis (keunikan klaim per kunjungan, status berubah di antara baca dan tulis). */
export class GalatKlaim extends Error {
  constructor(public readonly kode: 'sudah_ada' | 'bentrok') {
    super(kode);
  }
}

const dariDb = (k: { id: number; kunjungan_id: number; nomor_sep: string | null; status: StatusKlaim; tanggal_selesai: Date; batas_pengajuan: Date; diagnosis: unknown; tindakan: unknown; berkas: unknown; catatan: string | null; diajukan_pada: Date | null; dikembalikan_pada: Date | null; berita_acara: string | null; batas_ajukan_ulang: Date | null; alasan: string | null; jumlah_dibayar: number | null; dibayar_pada: Date | null }): KlaimBaris => ({
  ...k, diagnosis: k.diagnosis as KodeKlaim[], tindakan: k.tindakan as KodeKlaim[], berkas: k.berkas as string[],
});

/**
 * Kondisi basis data untuk status efektif: lewat batas waktu mencakup yang tersimpan sebagai lewat batas dan yang belum diajukan melewati batas pengajuan
 * atau dikembalikan melewati batas ajukan ulang; status lain tidak termasuk yang sudah melewati batas itu.
 */


/** Akses data klaim JKN/BPJS. Hanya INSERT dan pembaruan status berpagar (status asal harus sama); riwayat status hanya ditambah; tidak ada hapus. */
export class RepositoriKlaimMysql {
  async kunjungan(fasyankesId: number, id: number): Promise<KunjunganKlaim | null> {
    const k = await db.cariKunjunganUntukKunjungan2(id, fasyankesId);
    return k && { id: k.id, pasien_id: k.pasien_id, pasien_nama: k.pasien.nama, pasien_nomor_rm: k.pasien.nomor_rm, jenis: k.jenis, tahap_layanan: k.tahap_layanan, cara_pembayaran: k.cara_pembayaran, nomor_sep: k.nomor_sep, spri: k.spri, waktu_tutup: k.waktu_tutup };
  }

  async kunjunganBanyak(fasyankesId: number, ids: number[]): Promise<Map<number, KunjunganKlaim>> {
    const baris = await db.daftarKunjunganUntukKunjunganBanyak(fasyankesId, ids);
    return new Map(baris.map((k) => [k.id, { id: k.id, pasien_id: k.pasien_id, pasien_nama: k.pasien.nama, pasien_nomor_rm: k.pasien.nomor_rm, jenis: k.jenis, tahap_layanan: k.tahap_layanan, cara_pembayaran: k.cara_pembayaran, nomor_sep: k.nomor_sep, spri: k.spri, waktu_tutup: k.waktu_tutup }]));
  }

  /** Kunjungan JKN yang sudah ditutup dan belum punya klaim, terbaru lebih dulu. */
  async kandidat(fasyankesId: number, batas = 200): Promise<KunjunganKlaim[]> {
    const ids = (await db.daftarKunjunganSiapKlaim(fasyankesId, batas)).map((r) => r.id);
    const peta = await this.kunjunganBanyak(fasyankesId, ids);
    return ids.flatMap((id) => (peta.has(id) ? [peta.get(id)!] : []));
  }

  async klaim(fasyankesId: number, id: number): Promise<KlaimBaris | null> {
    const k = await db.cariKlaimUntukKlaim(id, fasyankesId);
    return k && dariDb(k);
  }

  async ringkasan(fasyankesId: number, sekarang: Date): Promise<RingkasanKlaimDto> {
    const hasil = await Promise.all(STATUS_KLAIM.nilai.map(async (s) => [s, await db.hitungKlaimUntukRingkasan(fasyankesId, 'lewat_batas_waktu' as const, ['menunggu_sep' as const, 'siap_diajukan' as const], sekarang, 'dikembalikan' as const, sekarang, s === 'lewat_batas_waktu', ((!(s === 'lewat_batas_waktu')) && (s === 'menunggu_sep' || s === 'siap_diajukan')) ? (s) : undefined, ((!(s === 'lewat_batas_waktu')) && (s === 'menunggu_sep' || s === 'siap_diajukan')) ? (sekarang) : undefined, (((!(s === 'lewat_batas_waktu')) && (!(s === 'menunggu_sep' || s === 'siap_diajukan'))) && (s === 'dikembalikan')) ? (s) : undefined, null, ((!(s === 'lewat_batas_waktu')) && (!(s === 'menunggu_sep' || s === 'siap_diajukan'))) && (s === 'dikembalikan'), (((!(s === 'lewat_batas_waktu')) && (!(s === 'menunggu_sep' || s === 'siap_diajukan'))) && (!(s === 'dikembalikan'))) ? (s) : undefined)] as const));
    return Object.fromEntries(hasil) as RingkasanKlaimDto;
  }

  async daftar(fasyankesId: number, f: FilterKlaim, sekarang: Date): Promise<{ total: number; baris: KlaimBaris[] }> {
    const cari = f.cari?.trim();
    const cocok = cari
      ? [{ nomor_sep: { contains: cari } }, { kunjungan_id: { in: (await db.daftarKunjunganUntukDaftar(fasyankesId, cari, 1000)).map((k) => k.id) } }]
      : null;

    const [total, baris] = await Promise.all([db.hitungKlaimUntukDaftar(fasyankesId, 'lewat_batas_waktu' as const, ['menunggu_sep' as const, 'siap_diajukan' as const], sekarang, 'dikembalikan' as const, sekarang, f.status === 'lewat_batas_waktu', ((!(f.status === 'lewat_batas_waktu')) && (f.status === 'menunggu_sep' || f.status === 'siap_diajukan')) ? (f.status) : undefined, ((!(f.status === 'lewat_batas_waktu')) && (f.status === 'menunggu_sep' || f.status === 'siap_diajukan')) ? (sekarang) : undefined, (((!(f.status === 'lewat_batas_waktu')) && (!(f.status === 'menunggu_sep' || f.status === 'siap_diajukan'))) && (f.status === 'dikembalikan')) ? (f.status) : undefined, null, ((!(f.status === 'lewat_batas_waktu')) && (!(f.status === 'menunggu_sep' || f.status === 'siap_diajukan'))) && (f.status === 'dikembalikan'), (((!(f.status === 'lewat_batas_waktu')) && (!(f.status === 'menunggu_sep' || f.status === 'siap_diajukan'))) && (!(f.status === 'dikembalikan'))) ? (f.status) : undefined, (f.status) && (true), cari, (cari) && (true), (await db.daftarKunjunganUntukDaftar(fasyankesId, cari, 1000)).map((k) => k.id), (cocok) && (true)), db.daftarKlaimUntukDaftar(fasyankesId, 'lewat_batas_waktu' as const, ['menunggu_sep' as const, 'siap_diajukan' as const], sekarang, 'dikembalikan' as const, sekarang, f.status === 'lewat_batas_waktu', ((!(f.status === 'lewat_batas_waktu')) && (f.status === 'menunggu_sep' || f.status === 'siap_diajukan')) ? (f.status) : undefined, ((!(f.status === 'lewat_batas_waktu')) && (f.status === 'menunggu_sep' || f.status === 'siap_diajukan')) ? (sekarang) : undefined, (((!(f.status === 'lewat_batas_waktu')) && (!(f.status === 'menunggu_sep' || f.status === 'siap_diajukan'))) && (f.status === 'dikembalikan')) ? (f.status) : undefined, null, ((!(f.status === 'lewat_batas_waktu')) && (!(f.status === 'menunggu_sep' || f.status === 'siap_diajukan'))) && (f.status === 'dikembalikan'), (((!(f.status === 'lewat_batas_waktu')) && (!(f.status === 'menunggu_sep' || f.status === 'siap_diajukan'))) && (!(f.status === 'dikembalikan'))) ? (f.status) : undefined, (f.status) && (true), cari, (cari) && (true), (await db.daftarKunjunganUntukDaftar(fasyankesId, cari, 1000)).map((k) => k.id), (cocok) && (true), f.ukuran, (f.halaman - 1) * f.ukuran)]);
    return { total, baris: baris.map(dariDb) };
  }

  async riwayat(fasyankesId: number, klaimIds: number[]): Promise<RiwayatBaris[]> {
    return db.daftarRiwayatKlaimUntukRiwayat(fasyankesId, klaimIds);
  }

  async namaPengguna(ids: number[]): Promise<Map<number, string>> {
    return new Map((await db.daftarPenggunaUntukNamaPengguna([...new Set(ids)])).map((u) => [u.id, u.nama]));
  }

  async buat(d: DataBaruKlaim): Promise<number> {
    try {
      return await db.transaksi(async (tx) => {
        const k = await (async () => { const _hasil = await db.tambahKlaimUntukBuat(d.fasyankesId, d.kunjunganId, d.nomorSep, d.status, d.tanggalSelesai, d.batas, d.diagnosis as unknown as db.NilaiJson, d.tindakan as unknown as db.NilaiJson, d.berkas, d.catatan, d.oleh, tx); return db.tambahKlaimUntukBuatHasil(_hasil.id, tx); })();
        await db.tambahRiwayatKlaimUntukBuat(d.fasyankesId, k.id, null, d.status, d.oleh, tx);
        return k.id;
      });
    } catch (e) {
      if (db.bentrokUnik(e)) throw new GalatKlaim('sudah_ada');
      throw e;
    }
  }

  /** Ubah SEP, berkas, dan catatan (status ikut bila berubah) hanya bila status tersimpan masih `dari`. */
  async ubahBerkas(fasyankesId: number, id: number, dari: StatusKlaim, d: { nomorSep: string | null; berkas: string[]; catatan: string | null; status: StatusKlaim; oleh: number }): Promise<void> {
    await db.transaksi(async (tx) => {
      const n = await db.ubahKlaimUntukUbahBerkas(d.nomorSep, d.status, d.berkas, d.catatan, new Date(), id, fasyankesId, dari, tx);
      if (n.count !== 1) throw new GalatKlaim('bentrok');
      if (d.status !== dari) await db.tambahRiwayatKlaimUntukBuat(fasyankesId, id, dari, d.status, d.oleh, tx);
    });
  }

  /** Pindah status secara atomik: hanya bila status tersimpan masih `dari` (dua petugas serempak tidak sama-sama berhasil). */
  async ubahStatus(fasyankesId: number, id: number, dari: StatusKlaim, ke: StatusKlaim, d: PerubahanStatus, oleh: number, alasanRiwayat: string | null): Promise<void> {
    await db.transaksi(async (tx) => {
      const n = await db.ubahKlaimUntukUbahStatus(ke, (d)?.diajukan_pada, (d)?.dikembalikan_pada, (d)?.berita_acara, (d)?.batas_ajukan_ulang, (d)?.alasan, (d)?.jumlah_dibayar, (d)?.dibayar_pada, new Date(), id, fasyankesId, dari, tx);
      if (n.count !== 1) throw new GalatKlaim('bentrok');
      await db.tambahRiwayatKlaimUntukUbahStatus(fasyankesId, id, dari, ke, alasanRiwayat, oleh, tx);
    });
  }
}
