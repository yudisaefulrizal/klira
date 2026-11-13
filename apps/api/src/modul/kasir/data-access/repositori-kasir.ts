import * as db from '@klira/db';
import { selesaiAntreanDalam } from '../../kunjungan/domain/antrean-otomatis';
import { hargaTarif, rincianBayar, tanggalRetensi } from '@klira/shared';
import type { BarisBayar, CaraPembayaran, MetodeBayar, PembayaranDto, RekapHarianDto, ShiftDto, TagihanDto, TarifKasirDto } from '@klira/shared';
import { totalTagihan, keItemDto, statusTagihanDari } from './repositori';

export type KunjunganKasir = { id: number; pasien_id: number; pasien_nama: string; pasien_nomor_rm: string; tahap_layanan: string; cara_pembayaran: CaraPembayaran };
export type TagihanKasir = TagihanDto & { pembayaran: PembayaranDto[]; dibayar: number; sisa: number };
export type HasilBayarRepo =
  | { ok: true; pembayaran: PembayaranDto[]; tagihan: TagihanKasir; diterima: number; diterapkan: number; kembalian: number }
  | { ok: false; sebab: 'tahap_salah' | 'tagihan_kosong' | 'tagihan_belum_lengkap' | 'sudah_lunas' | 'tanpa_shift' | 'non_tunai_lebih' };
export type HasilLengkapiHargaRepo = { ok: true; nama: string } | { ok: false; sebab: 'tidak_ada' | 'sudah_berharga' | 'terkunci' };
export type HasilTambahItemRepo = { ok: true; nama: string; harga: number | null; jumlah: number } | { ok: false; sebab: 'tarif_tidak_ada' | 'terkunci' };
export type HasilUbahHargaRepo =
  | { ok: true; nama: string; lama: number; baru: number }
  | { ok: false; sebab: 'tidak_ada' | 'obat' | 'tanpa_harga' | 'sama' | 'terkunci' | 'sudah_bayar' };
export type HasilHapusItemRepo = { ok: true; nama: string } | { ok: false; sebab: 'tidak_ada' | 'bukan_manual' | 'terkunci' | 'melebihi_bayar' };
export type HasilTutupRepo = { ok: true } | { ok: false; sebab: 'tahap_salah' | 'tagihan_belum_lengkap' | 'resep_belum' | 'belum_lunas_alasan' | 'bentrok' };


const rentangWib = (tanggal: string): { dari: Date; sampai: Date } => {
  const dari = new Date(`${tanggal}T00:00:00.000+07:00`);
  return { dari, sampai: new Date(dari.getTime() + 86_400_000) };
};

export class RepositoriKasirMysql {
  async kunjungan(fasyankesId: number, id: number): Promise<KunjunganKasir | null> {
    const k = await db.cariKunjunganUntukKunjungan2(id, fasyankesId);
    return k && { id: k.id, pasien_id: k.pasien_id, pasien_nama: k.pasien.nama, pasien_nomor_rm: k.pasien.nomor_rm, tahap_layanan: k.tahap_layanan, cara_pembayaran: k.cara_pembayaran };
  }

  /** Tagihan lengkap dengan pembayaran; kunjungan tanpa tagihan menghasilkan tagihan kosong (lunas, total 0). */
  async tagihan(fasyankesId: number, kunjunganId: number): Promise<TagihanKasir> {
    const t = await db.cariTagihanUntukTagihan(kunjunganId, fasyankesId);
    if (!t) return { id: null, kunjungan_id: kunjunganId, status_tagihan: 'lengkap', status_pembayaran: 'lunas', total: 0, item: [], pembayaran: [], dibayar: 0, sisa: 0, alasan_tutup_belum_lunas: null };
    const nama = new Map((await db.daftarPenggunaUntukNamaPengguna([...new Set(t.pembayaran.map((p) => p.kasir_id))])).map((u) => [u.id, u.nama]));
    const total = totalTagihan(t.item);
    const dibayar = t.pembayaran.reduce((s, p) => s + p.jumlah, 0);
    return {
      id: t.id, kunjungan_id: t.kunjungan_id, status_tagihan: t.status_tagihan, status_pembayaran: t.status_pembayaran, total, item: t.item.map(keItemDto),
      pembayaran: t.pembayaran.map((p) => ({ id: p.id, metode: p.metode, jumlah: p.jumlah, waktu: p.waktu.toISOString(), kasir_nama: nama.get(p.kasir_id) ?? null })),
      dibayar, sisa: Math.max(0, total - dibayar), alasan_tutup_belum_lunas: t.alasan_tutup_belum_lunas,
    };
  }

  // ---- Shift ----
  private async keShiftDto(fasyankesId: number, shifts: { id: number; kasir_id: number; buka: Date; tutup: Date | null; kas_awal: number; kas_akhir: number | null; selisih: number | null; alasan_selisih: string | null }[]): Promise<ShiftDto[]> {
    if (!shifts.length) return [];
    const bayar = await db.kelompokPembayaranUntukKeShiftDto(fasyankesId, shifts.map((s) => s.id));
    const nama = new Map((await db.daftarPenggunaUntukNamaPengguna([...new Set(shifts.map((s) => s.kasir_id))])).map((u) => [u.id, u.nama]));
    return shifts.map((s) => {
      const per = { tunai: 0, transfer: 0, qris: 0 } as Record<MetodeBayar, number>;
      let jumlah = 0;
      for (const b of bayar.filter((x) => x.shift_id === s.id)) {
        per[b.metode] = b._sum.jumlah ?? 0;
        jumlah += b._count._all;
      }
      return {
        id: s.id, kasir_id: s.kasir_id, kasir_nama: nama.get(s.kasir_id) ?? null, buka: s.buka.toISOString(), tutup: s.tutup?.toISOString() ?? null, kas_awal: s.kas_awal, kas_akhir: s.kas_akhir,
        selisih: s.selisih, alasan_selisih: s.alasan_selisih, tunai: per.tunai, transfer: per.transfer, qris: per.qris, jumlah_pembayaran: jumlah, kas_seharusnya: s.kas_awal + per.tunai,
      };
    });
  }

  async shiftTerbuka(fasyankesId: number, kasirId: number): Promise<ShiftDto | null> {
    const s = await db.cariShiftKasirUntukShiftTerbuka(fasyankesId, kasirId, null);
    return s ? (await this.keShiftDto(fasyankesId, [s]))[0] : null;
  }

  /** 'sudah_ada' bila kasir ini masih punya shift terbuka (pengecekan dalam transaksi dengan kunci baris pengguna). */
  async bukaShift(fasyankesId: number, kasirId: number, kasAwal: number): Promise<ShiftDto | 'sudah_ada'> {
    const id = await db.transaksi(async (tx) => {
      await db.kunciPengguna(kasirId, tx);
      if (await db.hitungShiftKasirUntukBukaShift(fasyankesId, kasirId, null, tx)) return null;
      return (await (async () => { const _hasil = await db.tambahShiftKasirUntukBukaShift(fasyankesId, kasirId, kasAwal, tx); return db.tambahShiftKasirUntukBukaShiftHasil(_hasil.id, tx); })()).id;
    });
    if (id === null) return 'sudah_ada';
    return (await this.keShiftDto(fasyankesId, [await db.tambahShiftKasirUntukBukaShiftHasil(id)]))[0];
  }

  async tutupShift(fasyankesId: number, kasirId: number, d: { kas_akhir: number; alasan_selisih: string | null }): Promise<ShiftDto | 'tidak_ada'> {
    const s = await db.cariShiftKasirUntukShiftTerbuka(fasyankesId, kasirId, null);
    if (!s) return 'tidak_ada';
    const [dto] = await this.keShiftDto(fasyankesId, [s]);
    const baru = await db.ubahShiftKasirUntukTutupShift(new Date(), d.kas_akhir, d.kas_akhir - dto.kas_seharusnya, d.alasan_selisih, s.id, null);
    if (!baru.count) return 'tidak_ada';
    return (await this.keShiftDto(fasyankesId, [await db.tambahShiftKasirUntukBukaShiftHasil(s.id)]))[0];
  }

  /** Rekap per hari (zona Asia/Jakarta): pembayaran per metode dan shift yang dibuka pada hari itu. */
  async rekap(fasyankesId: number, tanggal: string): Promise<RekapHarianDto> {
    const { dari, sampai } = rentangWib(tanggal);
    const [bayar, shifts] = await Promise.all([
      db.kelompokPembayaranUntukRekap(fasyankesId, dari, sampai),
      db.daftarShiftKasirUntukRekap(fasyankesId, dari, sampai),
    ]);
    const per = { tunai: 0, transfer: 0, qris: 0 } as Record<MetodeBayar, number>;
    let jumlah = 0;
    for (const b of bayar) {
      per[b.metode] = b._sum.jumlah ?? 0;
      jumlah += b._count._all;
    }
    return { tanggal, per_metode: per, total: per.tunai + per.transfer + per.qris, jumlah_pembayaran: jumlah, shift: await this.keShiftDto(fasyankesId, shifts) };
  }

  // ---- Pembayaran ----
  /**
   * Pembayaran beberapa metode dalam SATU transaksi dengan kunci baris tagihan (gagal satu, gagal semua). Non-tunai total wajib <= sisa;
   * tunai diterapkan sebatas sisa setelah non-tunai (selebihnya kembalian, tidak dicatat). Satu baris Pembayaran per metode yang diterapkan > 0;
   * status pembayaran dihitung ulang (belum, sebagian, lunas). Hanya ditambah, tidak pernah diubah atau dihapus.
   */
  async bayar(fasyankesId: number, kasirId: number, kunjunganId: number, baris: BarisBayar[]): Promise<HasilBayarRepo> {
    const hasil = await db.transaksi(async (tx) => {
      // Kunci baris tagihan HARUS pernyataan pertama: pembacaan biasa sebelum kunci mengambil potret (REPEATABLE READ) yang sudah usang setelah menunggu.
      const kunci = await db.kunciTagihanKunjungan(kunjunganId, fasyankesId, tx);
      const k = await db.cariKunjunganUntukTahapSekarang(kunjunganId, fasyankesId, tx);
      if (!k || k.tahap_layanan !== 'kasir') return { ok: false, sebab: 'tahap_salah' } as const;
      if (!kunci.length) return { ok: false, sebab: 'tagihan_kosong' } as const;
      const t = await db.wajibTagihanUntukBayar(kunci[0].id, tx);
      if (t.status_tagihan !== 'lengkap') return { ok: false, sebab: 'tagihan_belum_lengkap' } as const;
      const total = totalTagihan(t.item);
      const dibayar = t.pembayaran.reduce((s, p) => s + p.jumlah, 0);
      const sisa = total - dibayar;
      if (sisa <= 0) return { ok: false, sebab: 'sudah_lunas' } as const;
      const shift = await db.cariShiftKasirUntukShiftTerbuka(fasyankesId, kasirId, null, tx);
      if (!shift) return { ok: false, sebab: 'tanpa_shift' } as const;
      const r = rincianBayar(baris, sisa);
      if (r.non_tunai_lebih) return { ok: false, sebab: 'non_tunai_lebih' } as const;
      const ids: number[] = [];
      for (const b of r.per_baris) {
        if (b.diterapkan <= 0) continue; // tunai seluruhnya kembalian (non-tunai sudah menutup sisa)
        const p = await (async () => { const _hasil = await db.tambahPembayaranUntukBayar(fasyankesId, t.id, shift.id, b.metode, b.diterapkan, kasirId, tx); return db.tambahPembayaranUntukBayarHasil(_hasil.id, tx); })();
        ids.push(p.id);
      }
      await db.ubahTagihanUntukBayar(dibayar + r.diterapkan >= total ? 'lunas' : 'sebagian', t.id, tx);
      return { ok: true, ids, diterima: r.diterima, diterapkan: r.diterapkan, kembalian: r.kembalian } as const;
    });
    if (!hasil.ok) return hasil;
    const tagihan = await this.tagihan(fasyankesId, kunjunganId);
    const pembayaran = hasil.ids.map((id) => tagihan.pembayaran.find((x) => x.id === id)!);
    return { ok: true, pembayaran, tagihan, diterima: hasil.diterima, diterapkan: hasil.diterapkan, kembalian: hasil.kembalian };
  }

  // ---- Melengkapi harga item ----
  /** Mengisi harga item yang masih kosong (tidak menimpa harga yang ada) lalu menghitung ulang status tagihan; tidak untuk kunjungan yang sudah ditutup. */
  async lengkapiHarga(fasyankesId: number, kunjunganId: number, itemId: number, harga: number): Promise<HasilLengkapiHargaRepo> {
    return db.transaksi(async (tx) => {
      const item = await db.cariItemTagihanUntukLengkapiHarga(itemId, fasyankesId, kunjunganId, tx);
      if (!item) return { ok: false, sebab: 'tidak_ada' } as const;
      const k = await db.cariKunjunganUntukTahapSekarang(kunjunganId, fasyankesId, tx);
      if (!k || k.tahap_layanan === 'ditutup') return { ok: false, sebab: 'terkunci' } as const;
      const diubah = await db.ubahItemTagihanUntukLengkapiHarga(harga, itemId, null, tx);
      if (!diubah.count) return { ok: false, sebab: 'sudah_berharga' } as const;
      const semua = await db.daftarItemTagihanUntukTambahItemTagihanDalam(item.tagihan.id, tx);
      await db.ubahTagihanUntukTambahItemTagihanDalam(statusTagihanDari(semua.map((x) => x.harga)), item.tagihan.id, tx);
      return { ok: true, nama: item.nama } as const;
    });
  }

  // ---- Ubah harga per kunjungan ----
  /**
   * Kasir mengubah harga item yang sudah berharga (bukan obat) sebelum ada pembayaran dan sebelum kunjungan ditutup; harga acuan
   * (harga awal) dipertahankan untuk ditampilkan dicoret, alasan disimpan. Kunci baris tagihan agar tidak bersaing dengan pembayaran.
   */
  async ubahHarga(fasyankesId: number, kunjunganId: number, itemId: number, harga: number, alasan: string): Promise<HasilUbahHargaRepo> {
    return db.transaksi(async (tx) => {
      const kunci = await db.kunciTagihanKunjungan(kunjunganId, fasyankesId, tx);
      if (!kunci.length) return { ok: false, sebab: 'tidak_ada' } as const;
      const item = await db.cariItemTagihanUntukUbahHarga(itemId, kunci[0].id, tx);
      if (!item) return { ok: false, sebab: 'tidak_ada' } as const;
      const k = await db.cariKunjunganUntukTahapSekarang(kunjunganId, fasyankesId, tx);
      if (!k || k.tahap_layanan === 'ditutup') return { ok: false, sebab: 'terkunci' } as const;
      if (await db.hitungPembayaranUntukSinkronItemTindakanDalam(kunci[0].id, tx)) return { ok: false, sebab: 'sudah_bayar' } as const;
      if (item.jenis === 'obat') return { ok: false, sebab: 'obat' } as const;
      if (item.harga === null) return { ok: false, sebab: 'tanpa_harga' } as const;
      if (item.harga === harga) return { ok: false, sebab: 'sama' } as const;
      await db.ubahItemTagihanUntukUbahHarga(harga, item.harga_acuan ?? item.harga, alasan, item.id, tx);
      await this.hitungUlang(tx, kunci[0].id);
      return { ok: true, nama: item.nama, lama: item.harga, baru: harga } as const;
    });
  }

  // ---- Item tambahan dari tarif ----
  /** Tarif aktif yang boleh ditambahkan kasir (obat dikecualikan: obat lewat resep agar stok tercatat), harga sesuai cara pembayaran. */
  async tarifAktif(fasyankesId: number, caraPembayaran: CaraPembayaran): Promise<TarifKasirDto[]> {
    const t = await db.daftarTarifLayananUntukTarifAktif(fasyankesId, true, 'obat');
    return t.map((x) => ({ id: x.id, kode: x.kode, nama: x.nama, jenis: x.jenis as TarifKasirDto['jenis'], harga: hargaTarif(x, caraPembayaran) }));
  }

  /** Status pembayaran dihitung ulang setelah item berubah (lunas bisa kembali menjadi sebagian). */
  private async hitungUlang(tx: db.Koneksi, tagihanId: number): Promise<void> {
    const t = await db.wajibTagihanUntukBayar(tagihanId, tx);
    const total = totalTagihan(t.item);
    const dibayar = t.pembayaran.reduce((s, p) => s + p.jumlah, 0);
    await db.ubahTagihanUntukHitungUlang(statusTagihanDari(t.item.map((i) => i.harga)), dibayar <= 0 ? 'belum' : dibayar >= total ? 'lunas' : 'sebagian', tagihanId, tx);
  }

  /** Tambah item dari tarif ke tagihan kunjungan (tagihan dibuat bila belum ada); tidak untuk kunjungan yang sudah ditutup. */
  async tambahItem(fasyankesId: number, oleh: number, kunjunganId: number, tarifId: number, jumlah: number): Promise<HasilTambahItemRepo> {
    return db.transaksi(async (tx) => {
      const k = await db.cariKunjunganUntukSinkronItemTindakanDalam(kunjunganId, fasyankesId, tx);
      if (!k || k.tahap_layanan === 'ditutup') return { ok: false, sebab: 'terkunci' } as const;
      const tarif = await db.cariTarifLayananUntukTambahItem(tarifId, fasyankesId, true, 'obat', tx);
      if (!tarif) return { ok: false, sebab: 'tarif_tidak_ada' } as const;
      const harga = hargaTarif(tarif, k.cara_pembayaran); // tindakan tanpa harga acuan: null, dilengkapi kasir
      const tagihan = await (async () => { (await db.simpanTagihanUntukTambahItemTagihanDalam(fasyankesId, kunjunganId, oleh, tx)); return db.simpanTagihanUntukTambahItemTagihanDalamHasil(kunjunganId, tx); })();
      await db.tambahItemTagihanUntukTambahItem(fasyankesId, tagihan.id, tarif.jenis, tarif.id, tarif.kode, tarif.nama, jumlah, harga, true, oleh, tx);
      await this.hitungUlang(tx, tagihan.id);
      return { ok: true, nama: tarif.nama, harga, jumlah } as const;
    });
  }

  /** Hapus item tambahan kasir selama kunjungan belum ditutup dan total tidak menjadi lebih kecil dari yang sudah dibayar. */
  async hapusItem(fasyankesId: number, kunjunganId: number, itemId: number): Promise<HasilHapusItemRepo> {
    return db.transaksi(async (tx) => {
      const kunci = await db.kunciTagihanKunjungan(kunjunganId, fasyankesId, tx);
      if (!kunci.length) return { ok: false, sebab: 'tidak_ada' } as const;
      const item = await db.cariItemTagihanUntukUbahHarga(itemId, kunci[0].id, tx);
      if (!item) return { ok: false, sebab: 'tidak_ada' } as const;
      if (!item.manual) return { ok: false, sebab: 'bukan_manual' } as const;
      const k = await db.cariKunjunganUntukTahapSekarang(kunjunganId, fasyankesId, tx);
      if (!k || k.tahap_layanan === 'ditutup') return { ok: false, sebab: 'terkunci' } as const;
      const t = await db.wajibTagihanUntukBayar(kunci[0].id, tx);
      const dibayar = t.pembayaran.reduce((s, p) => s + p.jumlah, 0);
      if (totalTagihan(t.item) - (item.harga ?? 0) * item.jumlah < dibayar) return { ok: false, sebab: 'melebihi_bayar' } as const;
      await db.hapusItemTagihanUntukHapusItem(item.id, tx);
      await this.hitungUlang(tx, t.id);
      return { ok: true, nama: item.nama } as const;
    });
  }

  // ---- Tutup kunjungan ----
  /**
   * Tutup bila di tahap kasir, tagihan lengkap, semua resep diserahkan; belum lunas hanya dengan alasan, kecuali kunjungan JKN
   * (alasan otomatis `alasanJkn`: biaya diklaim ke BPJS). Pembaruan bersyarat tahap (gagal diam bila sudah berubah).
   */
  async tutup(fasyankesId: number, kunjunganId: number, alasan: string | null, alasanJkn: string): Promise<HasilTutupRepo> {
    return db.transaksi(async (tx) => {
      const k = await db.cariKunjunganUntukSinkronItemTindakanDalam(kunjunganId, fasyankesId, tx);
      if (!k || k.tahap_layanan !== 'kasir') return { ok: false, sebab: 'tahap_salah' } as const;
      const t = await db.ambilTagihanUntukTutup(kunjunganId, tx);
      if (t && t.status_tagihan !== 'lengkap') return { ok: false, sebab: 'tagihan_belum_lengkap' } as const;
      if (await db.hitungResepUntukTutup(kunjunganId, fasyankesId, 'diserahkan', tx)) return { ok: false, sebab: 'resep_belum' } as const;
      const total = t ? totalTagihan(t.item) : 0;
      const lunas = (t?.pembayaran.reduce((s, p) => s + p.jumlah, 0) ?? 0) >= total;
      if (!lunas && k.cara_pembayaran === 'jkn' && !(alasan && alasan.trim())) alasan = alasanJkn;
      if (!lunas && !(alasan && alasan.trim())) return { ok: false, sebab: 'belum_lunas_alasan' } as const;
      const tutup = new Date();
      const ubah = await db.ubahKunjunganUntukTutup('finished', 'ditutup', tutup, tanggalRetensi(tutup), kunjunganId, fasyankesId, 'kasir', tx);
      if (!ubah.count) return { ok: false, sebab: 'bentrok' } as const;
      await selesaiAntreanDalam(tx, fasyankesId, kunjunganId, new Date());
      if (t && !lunas) await db.ubahTagihanUntukTutup(alasan!.trim(), t.id, tx);
      return { ok: true } as const;
    });
  }
}

export const hariWib = (d = new Date()): string => new Date(d.getTime() + 7 * 3_600_000).toISOString().slice(0, 10);
