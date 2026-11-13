import * as db from '@klira/db';
import { statusStokDari } from '@klira/shared';
import type { CaraPembayaran, FilterKfa, FilterMasterObat, FilterRiwayatObat, HalamanMasterObatDto, MasterObatDto, MasterObatMasukan, MutasiStokDto, MutasiStokMasukan, ReferensiKfaDto, ResepDto, RiwayatObatDto, StatusResep, StokObatDto, TelaahMasukan, UbahMasterObatMasukan,  } from '@klira/shared';
import { gantiItemObatResepDalam, totalTagihan } from '../../kasir/data-access/repositori';
import { ambilKatalogKfa, cariKatalogKfa } from './katalog-kfa';

export type Kekurangan = { master_obat_id: number; nama: string; butuh: number; tersedia: number };
export type HasilSerahRepo =
  | { ok: true; kekurangan: Kekurangan[] }
  | { ok: false; sebab: 'tidak_ada_resep' | 'belum_siap' | 'sudah_diserahkan' | 'tahap_salah' }
  | { ok: false; sebab: 'stok_kurang'; kekurangan: Kekurangan[] };

export type KunjunganResep = { id: number; pasien_id: number; tahap_layanan: string; cara_pembayaran: CaraPembayaran };
export type ObatMini = { id: number; nama_tampil: string; satuan: string; harga: number };
export type ItemBaruResep = { master_obat_id: number; aturan_pakai: string; bentuk: string | null; rute: string | null; jumlah: number };
export type HasilTelaahRepo = 'ok' | 'status_berubah' | 'tagihan_terkunci';
export type HasilMutasi = { ok: true; stok: StokObatDto } | { ok: false; sebab: 'obat_tidak_ada' | 'batch_tidak_ada' | 'stok_tidak_cukup' };

type ItemBanding = { master_obat_id: number; aturan_pakai: string; bentuk: string | null; rute: string | null; jumlah: number };
/** Daftar item sama persis (urutan, obat, jumlah, aturan, bentuk, rute): item dan tagihan tidak perlu diganti. */
export const samaItemResep = (a: readonly ItemBanding[], b: readonly ItemBanding[]): boolean =>
  a.length === b.length && a.every((x, n) => x.master_obat_id === b[n].master_obat_id && x.jumlah === b[n].jumlah && x.aturan_pakai === b[n].aturan_pakai && (x.bentuk ?? null) === (b[n].bentuk ?? null) && (x.rute ?? null) === (b[n].rute ?? null));

const tglIso = (d: Date): string => d.toISOString().slice(0, 10);
const awalHariUtc = (): Date => new Date(`${tglIso(new Date())}T00:00:00.000Z`);

export class RepositoriFarmasiMysql {
  // ---- Serah terima obat ----
  /**
   * Serah terima semua resep siap kunjungan ini. Stok dikurangi per batch (kedaluwarsa terdekat lebih dulu, batch kedaluwarsa dilewati) dengan kunci baris,
   * dicatat sebagai mutasi keluar dan pengeluaran obat. Stok kurang hanya diteruskan bila diizinkan (peringatan); jumlah pengeluaran tetap sesuai resep.
   */
  async serahTerima(fasyankesId: number, petugasId: number, kunjunganId: number, izinkan: boolean, alasan: string | null): Promise<HasilSerahRepo> {
    return db.transaksi(async (tx) => {
      // Kunci baris resep kunjungan sebagai pernyataan pertama agar dua penyerahan serempak tidak sama-sama membaca status siap.
      await db.kunciResepKunjungan(kunjunganId, fasyankesId, tx);
      const k = await db.cariKunjunganUntukTahapSekarang(kunjunganId, fasyankesId, tx);
      if (!k || k.tahap_layanan === 'ditutup') return { ok: false, sebab: 'tahap_salah' } as const;
      const reseps = await db.daftarResepUntukSerahTerima(kunjunganId, fasyankesId, tx);
      if (!reseps.length) return { ok: false, sebab: 'tidak_ada_resep' } as const;
      if (reseps.some((r) => r.status === 'diajukan' || r.status === 'ditelaah')) return { ok: false, sebab: 'belum_siap' } as const;
      const siap = reseps.filter((r) => r.status === 'siap');
      if (!siap.length) return { ok: false, sebab: 'sudah_diserahkan' } as const;
      const alokasi: { resepId: number; itemId: number; masterId: number; harga: number; butuh: number; ambil: { stokId: number; jumlah: number }[]; kurang: number; nama: string; nomor: string }[] = [];
      const terpakai = new Map<number, number>();
      const hariIni = new Date(`${tglIso(new Date())}T00:00:00.000Z`);
      for (const r of siap) {
        for (const i of r.item) {
          const stok = await db.kunciStokObatTersedia(i.master_obat_id, fasyankesId, hariIni, tx);
          let sisa = i.jumlah;
          const ambil: { stokId: number; jumlah: number }[] = [];
          for (const s of stok) {
            const tersedia = s.jumlah - (terpakai.get(s.id) ?? 0);
            if (sisa <= 0 || tersedia <= 0) continue;
            const a = Math.min(tersedia, sisa);
            ambil.push({ stokId: s.id, jumlah: a });
            terpakai.set(s.id, (terpakai.get(s.id) ?? 0) + a);
            sisa -= a;
          }
          alokasi.push({ resepId: r.id, itemId: i.id, masterId: i.master_obat_id, harga: i.master.harga, butuh: i.jumlah, ambil, kurang: sisa, nama: i.master.nama_tampil, nomor: r.nomor_resep });
        }
      }
      const kekurangan = alokasi.filter((a) => a.kurang > 0).map((a) => ({ master_obat_id: a.masterId, nama: a.nama, butuh: a.butuh, tersedia: a.butuh - a.kurang }));
      if (kekurangan.length && !izinkan) return { ok: false, sebab: 'stok_kurang', kekurangan } as const;
      for (const a of alokasi) {
        for (const x of a.ambil) {
          await db.ubahStokObatUntukSerahTerima(x.jumlah, new Date(), x.stokId, tx);
          await db.tambahMutasiStokUntukSerahTerima(fasyankesId, x.stokId, 'keluar', -x.jumlah, `Serah terima resep ${a.nomor}`, petugasId, tx);
        }
        await db.tambahPengeluaranObatUntukSerahTerima(fasyankesId, a.resepId, a.itemId, a.masterId, a.butuh, a.harga, a.kurang > 0, a.kurang > 0 ? alasan : null, petugasId, tx);
      }
      await db.ubahResepUntukSerahTerima('diserahkan', siap.map((r) => r.id), 'siap', tx);
      return { ok: true, kekurangan } as const;
    });
  }

  private kfaLokal(fasyankesId: number, kode?: string) {
    return db.daftarKfaLokalUntukKfaLokal(fasyankesId, (kode) ? (kode) : undefined);
  }

  /** Katalog KFA (JSON statis) digabung dengan tambahan/ubahan klinik (tabel `kfa_lokal`): pencarian per kata, dibatasi jumlah hasil. */
  async cariKfa(fasyankesId: number, f: FilterKfa): Promise<ReferensiKfaDto[]> {
    return cariKatalogKfa(f.cari, f.batas, await this.kfaLokal(fasyankesId));
  }

  async kfa(fasyankesId: number, kode: string): Promise<ReferensiKfaDto | null> {
    return ambilKatalogKfa(kode, await this.kfaLokal(fasyankesId, kode));
  }

  /** Stok yang belum kedaluwarsa dijumlah per obat; kedaluwarsa terdekat hanya dari batch yang masih berisi. */
  private async ringkasStok(fasyankesId: number, ids: readonly number[]): Promise<Map<number, { total: number; terdekat: string | null }>> {
    const hasil = new Map<number, { total: number; terdekat: string | null }>();
    if (!ids.length) return hasil;
    const stok = await db.daftarStokObatUntukRingkasStok(fasyankesId, [...ids], 0);
    const hariIni = awalHariUtc().getTime();
    for (const s of stok) {
      const sekarang = hasil.get(s.master_obat_id) ?? { total: 0, terdekat: null };
      if (s.kedaluwarsa.getTime() >= hariIni) sekarang.total += s.jumlah;
      sekarang.terdekat ??= tglIso(s.kedaluwarsa);
      hasil.set(s.master_obat_id, sekarang);
    }
    return hasil;
  }

  private keMasterDto(m: { id: number; kfa_kode: string; kfa_nama: string; bentuk_sediaan: string | null; rute: string | null; nama_tampil: string; satuan: string; harga: number; aktif: boolean }, ringkas?: { total: number; terdekat: string | null }): MasterObatDto {
    const total = ringkas?.total ?? 0;
    const terdekat = ringkas?.terdekat ?? null;
    return {
      id: m.id, kfa_kode: m.kfa_kode, kfa_nama: m.kfa_nama, nama_tampil: m.nama_tampil, satuan: m.satuan, harga: m.harga, aktif: m.aktif,
      bentuk_sediaan: m.bentuk_sediaan, rute: m.rute,
      stok_total: total, kedaluwarsa_terdekat: terdekat, status_stok: statusStokDari(total, terdekat),
    };
  }

  async daftarMaster(fasyankesId: number, f: FilterMasterObat): Promise<HalamanMasterObatDto> {

    const [total, baris] = await Promise.all([
      db.hitungMasterObatUntukDaftarMaster(fasyankesId, (!(f.aktif === undefined)) ? (f.aktif) : undefined, f.cari, f.cari),
      db.daftarMasterObatUntukDaftarMaster(fasyankesId, (!(f.aktif === undefined)) ? (f.aktif) : undefined, f.cari, f.cari, f.ukuran, (f.halaman - 1) * f.ukuran),
    ]);
    const ringkas = await this.ringkasStok(fasyankesId, baris.map((b) => b.id));
    return { data: baris.map((b) => this.keMasterDto(b, ringkas.get(b.id))), halaman: f.halaman, ukuran: f.ukuran, total };
  }

  async master(fasyankesId: number, id: number): Promise<MasterObatDto | null> {
    const m = await db.cariMasterObatUntukMaster(id, fasyankesId);
    if (!m) return null;
    return this.keMasterDto(m, (await this.ringkasStok(fasyankesId, [m.id])).get(m.id));
  }

  /** 'duplikat' bila kode KFA sudah ada di master klinik ini. */
  async buatMaster(fasyankesId: number, oleh: number, d: MasterObatMasukan, kfa: ReferensiKfaDto): Promise<MasterObatDto | 'duplikat'> {
    try {
      const m = await db.transaksi(async koneksiBaru => { const _hasil = await db.tambahMasterObatUntukBuatMaster(fasyankesId, kfa.kode, kfa.nama, kfa.bentuk_sediaan, d.rute || null, d.nama_tampil, d.satuan, d.harga, d.aktif, oleh, koneksiBaru); return db.tambahMasterObatUntukBuatMasterHasil(_hasil.id, koneksiBaru); });
      return this.keMasterDto(m);
    } catch (e) {
      if (db.bentrokUnik(e)) return 'duplikat';
      throw e;
    }
  }

  async ubahMaster(fasyankesId: number, id: number, d: UbahMasterObatMasukan): Promise<MasterObatDto | null> {
    const ada = await db.ubahMasterObatUntukUbahMaster(d.rute || null, (d)?.nama_tampil, (d)?.satuan, (d)?.harga, (d)?.aktif, new Date(), id, fasyankesId);
    return ada.count ? this.master(fasyankesId, id) : null;
  }

  async stokMaster(fasyankesId: number, masterId: number): Promise<StokObatDto[]> {
    const stok = await db.daftarStokObatUntukStokMaster(fasyankesId, masterId);
    return stok.map((s) => ({ id: s.id, master_obat_id: s.master_obat_id, batch: s.batch, kedaluwarsa: tglIso(s.kedaluwarsa), jumlah: s.jumlah }));
  }

  async riwayatMutasi(fasyankesId: number, masterId: number, batas = 50): Promise<MutasiStokDto[]> {
    const m = await db.daftarMutasiStokUntukRiwayatMutasi(fasyankesId, masterId, batas);
    const nama = new Map((await db.daftarPenggunaUntukNamaPengguna([...new Set(m.map((x) => x.pengguna_id))])).map((u) => [u.id, u.nama]));
    return m.map((x) => ({ id: x.id, stok_id: x.stok_id, batch: x.stok.batch, jenis: x.jenis, jumlah: x.jumlah, alasan: x.alasan, pengguna_nama: nama.get(x.pengguna_id) ?? null, waktu: x.waktu.toISOString() }));
  }

  /**
   * Mutasi stok dalam satu transaksi dengan kunci baris batch. Terima menambah (batch baru dibuat), keluar mengurangi (tidak boleh melebihi stok),
   * koreksi menjadikan jumlah batch sama dengan nilai sebenarnya; selisihnya dicatat bertanda di mutasi_stok (hanya ditambah, tidak diubah).
   */
  async mutasi(fasyankesId: number, penggunaId: number, d: MutasiStokMasukan): Promise<HasilMutasi> {
    return db.transaksi(async (tx) => {
      const obat = await db.cariMasterObatUntukMutasi(d.master_obat_id, fasyankesId, tx);
      if (!obat) return { ok: false, sebab: 'obat_tidak_ada' } as const;
      const kunci = await db.kunciBatchStokObat(d.master_obat_id, d.batch, fasyankesId, tx);
      let stokId = kunci[0]?.id;
      const sebelum = kunci[0]?.jumlah ?? 0;
      let sesudah: number;
      if (d.jenis === 'terima') {
        sesudah = sebelum + d.jumlah;
        if (stokId) await db.ubahStokObatUntukMutasi((d.kedaluwarsa) ? (new Date(`${d.kedaluwarsa}T00:00:00.000Z`)) : (undefined), sesudah, new Date(), stokId, tx);
        else stokId = (await (async () => { const _hasil = await db.tambahStokObatUntukMutasi(fasyankesId, d.master_obat_id, d.batch, new Date(`${d.kedaluwarsa}T00:00:00.000Z`), sesudah, penggunaId, tx); return db.tambahStokObatUntukMutasiHasil(_hasil.id, tx); })()).id;
      } else {
        if (!stokId) return { ok: false, sebab: 'batch_tidak_ada' } as const;
        if (d.jenis === 'keluar' && d.jumlah > sebelum) return { ok: false, sebab: 'stok_tidak_cukup' } as const;
        sesudah = d.jenis === 'keluar' ? sebelum - d.jumlah : d.jumlah;
        await db.ubahStokObatUntukMutasi2(sesudah, new Date(), stokId, tx);
      }
      await db.tambahMutasiStokUntukSerahTerima(fasyankesId, stokId!, d.jenis, sesudah - sebelum, d.alasan?.trim() || null, penggunaId, tx);
      const s = await db.tambahStokObatUntukMutasiHasil(stokId!, tx);
      return { ok: true, stok: { id: s.id, master_obat_id: s.master_obat_id, batch: s.batch, kedaluwarsa: tglIso(s.kedaluwarsa), jumlah: s.jumlah } } as const;
    });
  }

  // ---- Resep ----
  kunjungan(fasyankesId: number, id: number): Promise<KunjunganResep | null> {
    return db.cariKunjunganUntukKunjungan5(id, fasyankesId);
  }

  /** Obat aktif milik klinik dari daftar id (urutan tidak dijamin). */
  obatAktifDari(fasyankesId: number, ids: readonly number[]): Promise<ObatMini[]> {
    return db.daftarMasterObatUntukObatAktifDari(fasyankesId, true, [...ids]);
  }

  private async keResepDto(fasyankesId: number, ids: readonly number[]): Promise<ResepDto[]> {
    if (!ids.length) return [];
    const baris = await db.daftarResepUntukKeResepDto([...ids], fasyankesId);
    const orang = await db.daftarPenggunaUntukNamaPengguna([...new Set([...baris.map((b) => b.dpjp_id), ...baris.flatMap((b) => (b.telaah ? [b.telaah.apoteker_id] : []))])]);
    const nama = new Map(orang.map((o) => [o.id, o.nama]));
    const ringkas = await this.ringkasStok(fasyankesId, [...new Set(baris.flatMap((b) => b.item.map((i) => i.master_obat_id)))]);
    return baris.map((r) => ({
      id: r.id, kunjungan_id: r.kunjungan_id, nomor_resep: r.nomor_resep, teks: r.teks, status: r.status, jenis_pembiayaan: r.jenis_pembiayaan, dpjp_nama: nama.get(r.dpjp_id) ?? null,
      dibuat_pada: r.dibuat_pada.toISOString(), waktu_siap: r.waktu_siap?.toISOString() ?? null,
      item: r.item.map((i) => ({
        id: i.id, master_obat_id: i.master_obat_id, nama: i.master.nama_tampil, satuan: i.master.satuan, aturan_pakai: i.aturan_pakai, bentuk: i.bentuk, rute: i.rute, jumlah: i.jumlah,
        harga: i.master.harga, stok_tersedia: ringkas.get(i.master_obat_id)?.total ?? 0,
      })),
      telaah: r.telaah && { apoteker_nama: nama.get(r.telaah.apoteker_id) ?? null, administratif: r.telaah.administratif, farmasetik: r.telaah.farmasetik, klinis: r.telaah.klinis, catatan: r.telaah.catatan, waktu: r.telaah.waktu.toISOString() },
    }));
  }

  async resepKunjungan(fasyankesId: number, kunjunganId: number): Promise<ResepDto[]> {
    const ids = (await db.daftarResepUntukResepKunjungan(fasyankesId, kunjunganId)).map((r) => r.id);
    return this.keResepDto(fasyankesId, ids);
  }

  async resep(fasyankesId: number, id: number): Promise<ResepDto | null> {
    return (await this.keResepDto(fasyankesId, [id]))[0] ?? null;
  }

  /**
   * Resep teks dokter dibuat tanpa item dan tanpa item tagihan (P3): item obat dan tagihannya diisi apoteker saat telaah. Nomor resep berurutan
   * per hari (R-TTTTBBHH-NNN); bila dua pengajuan serempak mendapat nomor sama, keunikan memaksa ulang.
   */
  async buatResep(d: { fasyankesId: number; kunjungan: KunjunganResep; dpjpId: number; oleh: number; teks: string }): Promise<{ resepId: number; tagihan: { status_tagihan: string; status_pembayaran: string; total: number } }> {
    for (let percobaan = 0; ; percobaan++) {
      try {
        return await db.transaksi(async (tx) => {
          const awal = awalHariUtc();
          const urut = (await db.hitungResepUntukBuatResep(d.fasyankesId, awal, tx)) + 1;
          const nomor = `R-${tglIso(awal).replaceAll('-', '')}-${String(urut + percobaan).padStart(3, '0')}`;
          const resep = await (async () => { const _hasil = await db.tambahResepUntukBuatResep(d.fasyankesId, d.kunjungan.id, d.dpjpId, nomor, d.teks, d.kunjungan.cara_pembayaran, d.oleh, tx); return db.tambahResepUntukBuatResepHasil(_hasil.id, tx); })();
          const t = await db.cariTagihanUntukBuatResep(d.kunjungan.id, d.fasyankesId, tx);
          return { resepId: resep.id, tagihan: { status_tagihan: t?.status_tagihan ?? 'lengkap', status_pembayaran: t?.status_pembayaran ?? 'belum', total: t ? totalTagihan(t.item) : 0 } };
        });
      } catch (e) {
        if (db.bentrokUnik(e) && percobaan < 5) continue;
        throw e;
      }
    }
  }

  /**
   * Telaah dan item obat disimpan dalam satu transaksi bila resep masih diajukan atau ditelaah (status ditelaah hanya bila ketiganya terpenuhi).
   * Bila daftar item berubah, item resep lama diganti dan item tagihan obat resep itu disinkronkan ulang (harga master obat); perubahan item
   * ditolak bila tagihan kunjungan sudah ada pembayaran atau kunjungan ditutup. item null (tidak dikirim) = item resep dan tagihan obat tidak disentuh.
   */
  async catatTelaah(fasyankesId: number, resepId: number, apotekerId: number, d: TelaahMasukan, item: readonly ItemBaruResep[] | null, obat: readonly ObatMini[]): Promise<HasilTelaahRepo> {
    const lengkap = d.administratif && d.farmasetik && d.klinis;
    return db.transaksi(async (tx) => {
      const kunci = await db.kunciResep(resepId, fasyankesId, tx);
      const r = kunci[0];
      if (!r || (r.status !== 'diajukan' && r.status !== 'ditelaah')) return 'status_berubah' as const;
      // item null = permintaan tanpa daftar item: hanya telaah yang dicatat.
      const lama = item ? await db.daftarItemResepUntukCatatTelaah(resepId, tx) : [];
      if (item && !samaItemResep(lama, item)) {
        const k = await db.cariKunjunganUntukTahapSekarang(r.kunjungan_id, fasyankesId, tx);
        if (!k || k.tahap_layanan === 'ditutup') return 'tagihan_terkunci' as const;
        if (await db.hitungPembayaranUntukCatatTelaah(r.kunjungan_id, fasyankesId, tx)) return 'tagihan_terkunci' as const;
        const idLama = lama.map((x) => x.id);
        await db.hapusItemTagihanUntukGantiItemObatResepDalam(fasyankesId, idLama, tx);
        await db.hapusItemResepUntukCatatTelaah(resepId, tx);
        const baru = [];
        for (const i of item) {
          const baris = await (async () => { const _hasil = await db.tambahItemResepUntukCatatTelaah(fasyankesId, resepId, i.master_obat_id, i.aturan_pakai, i.bentuk, i.rute, i.jumlah, apotekerId, tx); return db.tambahItemResepUntukCatatTelaahHasil(_hasil.id, tx); })();
          const o = obat.find((x) => x.id === i.master_obat_id)!;
          baru.push({ itemResepId: baris.id, master_obat_id: o.id, nama: o.nama_tampil, harga: o.harga, jumlah: i.jumlah });
        }
        await gantiItemObatResepDalam(tx, fasyankesId, r.kunjungan_id, apotekerId, [], baru);
      }
      await db.ubahResepUntukCatatTelaah(lengkap ? 'ditelaah' : 'diajukan', resepId, tx);

      await db.simpanTelaahResepUntukCatatTelaah(fasyankesId, resepId, apotekerId, d.administratif, d.farmasetik, d.klinis, d.catatan?.trim() || null, new Date(), tx);
      return 'ok' as const;
    });
  }

  /** Resep ditelaah menjadi siap; bila semua resep kunjungan siap dan kunjungan masih di tahap resep, tahap maju ke kasir. null bila status bukan ditelaah. */
  async tandaiSiap(fasyankesId: number, resepId: number): Promise<{ kunjunganId: number; tahap: string } | null> {
    return db.transaksi(async (tx) => {
      const r = await db.cariResepUntukTandaiSiap(resepId, fasyankesId, tx);
      if (!r) return null;
      const ubah = await db.ubahResepUntukTandaiSiap('siap', new Date(), resepId, fasyankesId, 'ditelaah', tx);
      if (!ubah.count) return null;
      const belum = await db.hitungResepUntukTandaiSiap(fasyankesId, r.kunjungan_id, ['diajukan', 'ditelaah'], tx);
      if (!belum) await db.ubahKunjunganUntukUbahTahap('kasir', r.kunjungan_id, fasyankesId, 'resep', tx);
      const k = await db.wajibKunjunganUntukTandaiSiap(r.kunjungan_id, tx);
      return { kunjunganId: r.kunjungan_id, tahap: k.tahap_layanan };
    });
  }

  async riwayat(fasyankesId: number, f: FilterRiwayatObat): Promise<RiwayatObatDto> {


    const [total, baris] = await Promise.all([
      db.hitungResepUntukRiwayat(fasyankesId, (f.status) ? (f.status as StatusResep) : undefined, ((f.dari || f.sampai) && (f.dari)) ? (new Date(`${f.dari}T00:00:00.000+07:00`)) : undefined, ((f.dari || f.sampai) && (f.sampai)) ? (new Date(new Date(`${f.sampai}T00:00:00.000+07:00`).getTime() + 86_400_000)) : undefined),
      db.daftarResepUntukRiwayat(fasyankesId, (f.status) ? (f.status as StatusResep) : undefined, ((f.dari || f.sampai) && (f.dari)) ? (new Date(`${f.dari}T00:00:00.000+07:00`)) : undefined, ((f.dari || f.sampai) && (f.sampai)) ? (new Date(new Date(`${f.sampai}T00:00:00.000+07:00`).getTime() + 86_400_000)) : undefined, f.ukuran, (f.halaman - 1) * f.ukuran),
    ]);
    const nama = new Map((await db.daftarPenggunaUntukNamaPengguna([...new Set(baris.map((b) => b.dpjp_id))])).map((u) => [u.id, u.nama]));
    return {
      data: baris.map((r) => ({
        id: r.id, kunjungan_id: r.kunjungan_id, nomor_resep: r.nomor_resep, pasien_nama: r.kunjungan.pasien.nama, pasien_nomor_rm: r.kunjungan.pasien.nomor_rm, status: r.status,
        jumlah_item: r.item.length, dibuat_pada: r.dibuat_pada.toISOString(), dpjp_nama: nama.get(r.dpjp_id) ?? null,
        teks: r.teks, item: r.item.map((i) => ({ nama: i.master.nama_tampil, jumlah: i.jumlah, satuan: i.master.satuan })),
      })),
      halaman: f.halaman, ukuran: f.ukuran, total,
    };
  }
}
