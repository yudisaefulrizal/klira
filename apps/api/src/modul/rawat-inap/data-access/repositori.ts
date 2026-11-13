import * as db from '@klira/db';
import { selesaiAntreanDalam } from '../../kunjungan/domain/antrean-otomatis';
import { hargaTarif, TAHAP_BERJALAN, tanggalRetensi } from '@klira/shared';
import type { CaraPembayaran, AdmisiMasukan, AsalAdmisiDto, BedDto, CatatanHarianMasukan, HasilAdmisiDto, KelasRawat, MenungguRuanganDto, OpsiRawatInapDto, PapanDto, PemulanganDto, PemulanganMasukan, PenempatanDto, PenempatanMasukan, RawatInapDto,  } from '@klira/shared';
import { tambahItemTagihanDalam } from '../../kasir/data-access/repositori';
import { tulisPengesahanDalam } from '../../rekam-medis/data-access/repositori';
import type { TulisPengesahan } from '../../rekam-medis/data-access/repositori';

/** Penolakan aturan alur yang terdeteksi di dalam transaksi (aman dari permintaan serempak); dipetakan ke pesan oleh layanan. */
export type KodeGalatRi = 'sudah_inap' | 'ada_pembayaran' | 'bed_tidak_sah' | 'bed_terisi' | 'bukan_inap' | 'sudah_pulang' | 'tidak_terisi' | 'tidak_ditemukan' | 'alasan_pindah' | 'tarif_tidak_sah';
export class GalatRi extends Error {
  constructor(public readonly kode: KodeGalatRi) {
    super(kode);
  }
}

const tahapBerjalan = [...TAHAP_BERJALAN];
const kunci = (tx: db.Koneksi, tabel: 'pasien' | 'lokasi' | 'kunjungan', fasyankesId: number, id: number) =>
  tabel === 'pasien' ? db.kunciPasienRawatInap(id, fasyankesId, tx) : tabel === 'lokasi' ? db.kunciLokasiRawatInap(id, fasyankesId, tx) : db.kunciKunjunganRawatInap(id, fasyankesId, tx);

export type PelakuRi = { fasyankesId: number; oleh: number };
export type KunjunganRi = { id: number; pasien_id: number; jenis: 'AMB' | 'IMP'; tahap_layanan: string; cara_pembayaran: CaraPembayaran };

/** Akses data Rawat inap: papan bed, admisi, penempatan, DPJP, catatan harian (CPPT), pemulangan. Hanya INSERT dan penutupan periode; tidak ada hapus. */
export class RepositoriRawatInapMysql {
  async pasienAda(fasyankesId: number, id: number): Promise<boolean> {
    return (await db.hitungPasienUntukPasienAda(id, fasyankesId)) > 0;
  }

  async dpjpSah(fasyankesId: number, ids: number[]): Promise<boolean> {
    const n = await db.hitungPenggunaUntukDpjpSah2(ids, fasyankesId, true);
    return n === new Set(ids).size;
  }

  async tarifKamarSah(fasyankesId: number, id: number): Promise<boolean> {
    return (await db.hitungTarifLayananUntukTarifKamarSah(id, fasyankesId, 'kamar', true)) > 0;
  }

  async kunjungan(fasyankesId: number, id: number): Promise<KunjunganRi | null> {
    const k = await db.cariKunjunganUntukKunjungan4(id, fasyankesId);
    return k;
  }

  // ---- Opsi dan papan ----
  async opsi(fasyankesId: number): Promise<OpsiRawatInapDto> {
    const [bed, tarif, praktisi] = await Promise.all([
      this.bedSemua(fasyankesId),
      db.daftarTarifLayananUntukOpsi(fasyankesId, 'kamar', true, 200),
      db.daftarPenggunaUntukOpsi3(fasyankesId, true, 500, 1),
    ]);
    return {
      bed_kosong: bed.filter((b) => b.status === 'kosong').map((b) => ({ id: b.id, nama: b.nama, ruang_nama: b.ruang_nama })),
      tarif_kamar: tarif.map((t) => ({ id: t.id, kode: t.kode, nama: t.nama, harga_umum: t.harga_umum, harga_jkn: t.harga_jkn })),
      dpjp: praktisi.map((p) => ({ id: p.id, nama: p.nama, profesi: p.profil_profesi[0]?.profesi ?? '' })),
    };
  }

  private async bedSemua(fasyankesId: number): Promise<BedDto[]> {
    const lokasi = await db.daftarLokasiUntukBedSemua(fasyankesId, 'bed', 1000);
    const ruang = new Map((await db.daftarLokasiUntukPetakanAntrean(fasyankesId, lokasi.flatMap((l) => (l.induk_id ? [l.induk_id] : [])))).map((r) => [r.id, r.nama]));
    const aktif = await db.daftarPenempatanUntukBedSemua(fasyankesId, null);
    const kunj = await db.daftarKunjunganUntukBedSemua(aktif.map((a) => a.kunjungan_id), 'ATND', null, 1);
    const orang = new Map((await db.daftarPenggunaUntukNamaPengguna(kunj.flatMap((k) => k.peserta.map((p) => p.pengguna_id)))).map((u) => [u.id, u.nama]));
    return lokasi.map((l): BedDto => {
      const a = aktif.find((x) => x.lokasi_id === l.id);
      const k = a && kunj.find((x) => x.id === a.kunjungan_id);
      return {
        id: l.id, nama: l.nama, ruang_id: l.induk_id, ruang_nama: l.induk_id ? ruang.get(l.induk_id) ?? null : null,
        status: a ? 'terisi' : l.status_operasional === 'O' ? 'kosong' : 'tidak_operasional',
        penghuni: a && k ? { kunjungan_id: k.id, pasien_id: k.pasien_id, pasien_nama: k.pasien.nama, pasien_nomor_rm: k.pasien.nomor_rm, kelas: a.kelas, indikator: a.indikator, mulai: a.mulai.toISOString(), dpjp_nama: k.peserta[0] ? orang.get(k.peserta[0].pengguna_id) ?? null : null } : null,
      };
    });
  }

  async papan(fasyankesId: number): Promise<PapanDto> {
    const bed = await this.bedSemua(fasyankesId);
    const menunggu = await db.daftarKunjunganUntukPapan(fasyankesId, 'IMP', 'planned', tahapBerjalan, 200, 'ATND', null, 1);
    const orang = new Map((await db.daftarPenggunaUntukNamaPengguna(menunggu.flatMap((k) => k.peserta.map((p) => p.pengguna_id)))).map((u) => [u.id, u.nama]));
    return {
      bed,
      menunggu: menunggu.map((k): MenungguRuanganDto => ({ kunjungan_id: k.id, pasien_id: k.pasien_id, pasien_nama: k.pasien.nama, pasien_nomor_rm: k.pasien.nomor_rm, mulai: k.mulai.toISOString(), dpjp_nama: k.peserta[0] ? orang.get(k.peserta[0].pengguna_id) ?? null : null })),
      ringkasan: { total: bed.length, terisi: bed.filter((b) => b.status === 'terisi').length, kosong: bed.filter((b) => b.status === 'kosong').length, tidak_operasional: bed.filter((b) => b.status === 'tidak_operasional').length },
    };
  }

  // ---- Asal admisi ----
  async asal(fasyankesId: number, pasienId: number): Promise<AsalAdmisiDto> {
    const berjalan = await db.daftarKunjunganUntukAsal(fasyankesId, pasienId, tahapBerjalan);
    const imp = berjalan.find((k) => k.jenis === 'IMP');
    const amb = berjalan.find((k) => k.jenis === 'AMB');
    if (!amb) return { asal: null, rawat_inap_id: imp?.id ?? null, ada_pembayaran: false };
    const [poli, tl, bayar] = await Promise.all([
      amb.lokasi_id ? db.cariLokasiUntukAsal(amb.lokasi_id) : null,
      db.cariTindakLanjutUntukAsal(amb.id, 'rawat_inap'),
      db.hitungPembayaranUntukAsal(amb.id),
    ]);
    return { asal: { kunjungan_id: amb.id, tahap_layanan: amb.tahap_layanan, poli_nama: poli?.nama ?? null, cara_pembayaran: amb.cara_pembayaran, spri: tl?.spri ?? null }, rawat_inap_id: imp?.id ?? null, ada_pembayaran: bayar > 0 };
  }

  // ---- Admisi ----
  /**
   * Admisi dalam satu transaksi (pasien dikunci): kunjungan rawat inap, DPJP, penempatan, dan bila berasal dari rawat jalan: kunjungan asal ditutup
   * dan tagihan serta resep belum diserahkan dipindah ke rawat inap. Bed dikunci agar tidak terisi dua pasien.
   */
  async admisi(p: PelakuRi, d: AdmisiMasukan, sekarang: Date): Promise<HasilAdmisiDto> {
    return db.transaksi(async (tx) => {
      await kunci(tx, 'pasien', p.fasyankesId, d.pasien_id);
      const berjalan = await db.daftarKunjunganUntukAsal(p.fasyankesId, d.pasien_id, tahapBerjalan, tx);
      if (berjalan.some((k) => k.jenis === 'IMP')) throw new GalatRi('sudah_inap');
      const asal = berjalan.find((k) => k.jenis === 'AMB') ?? null;
      if (asal && (await db.hitungPembayaranUntukAsal(asal.id, tx)) > 0) throw new GalatRi('ada_pembayaran');
      if (d.bed_id) await this.pastikanBedBebas(tx, p.fasyankesId, d.bed_id);
      const tl = asal && (await db.cariTindakLanjutUntukAsal(asal.id, 'rawat_inap', tx));
      const k = await (async () => { const _hasil = await db.tambahKunjunganUntukAdmisi(p.fasyankesId, d.pasien_id, 'IMP', d.bed_id ? 'in-progress' : 'planned', 'pemeriksaan', asal?.id ?? null, asal?.cara_pembayaran ?? d.cara_pembayaran, asal?.nomor_sep ?? null, d.spri ?? tl?.spri ?? null, d.keluhan_singkat ?? asal?.keluhan_singkat ?? null, sekarang, p.oleh, tx); return db.tambahKunjunganUntukDaftarkanHasil(_hasil.id, tx); })();
      await db.tambahPesertaKunjunganUntukDaftarkan(p.fasyankesId, k.id, d.dpjp_id, 'ATND', sekarang, p.oleh, tx);
      for (const id of d.dpjp_bersama) await db.tambahPesertaKunjunganUntukDaftarkan(p.fasyankesId, k.id, id, 'SPRF', sekarang, p.oleh, tx);
      if (d.bed_id) await this.tempatkan(tx, p, k.id, d.bed_id, d, sekarang);
      if (asal) await this.teruskanDariRawatJalan(tx, p, asal.id, k.id, sekarang);
      return { kunjungan_id: k.id, menunggu_ruangan: !d.bed_id };
    });
  }

  /** Bed harus ada, operasional, dan belum dihuni. Pengecekan hunian memakai pembacaan terkunci (data terbaru), karena salinan data transaksi bisa lebih tua dari kunci bed. */
  private async pastikanBedBebas(tx: db.Koneksi, fasyankesId: number, bedId: number): Promise<void> {
    await kunci(tx, 'lokasi', fasyankesId, bedId);
    const bed = await db.cariLokasiUntukPastikanBedBebas(bedId, fasyankesId, 'bed', tx);
    if (!bed) throw new GalatRi('bed_tidak_sah');
    const dihuni = (await db.kunciPenempatanAktif(fasyankesId, bedId, tx)).length > 0;
    if (dihuni) throw new GalatRi('bed_terisi');
    if (bed.status_operasional !== 'O') throw new GalatRi('bed_tidak_sah');
  }

  private async tempatkan(tx: db.Koneksi, p: PelakuRi, kunjunganId: number, bedId: number, d: { kelas: KelasRawat; indikator: 'kelas_tetap' | 'naik_kelas' | 'turun_kelas' | 'titip_rawat'; tarif_id?: number | null }, sekarang: Date): Promise<void> {
    if (d.tarif_id && !(await db.hitungTarifLayananUntukTarifKamarSah(d.tarif_id, p.fasyankesId, 'kamar', true, tx))) throw new GalatRi('tarif_tidak_sah');
    await db.tambahPenempatanUntukTempatkan(p.fasyankesId, kunjunganId, bedId, d.kelas, d.indikator, d.tarif_id ?? null, sekarang, p.oleh, tx);
    await db.ubahLokasiUntukTempatkan('U', bedId, tx);
  }

  private async teruskanDariRawatJalan(tx: db.Koneksi, p: PelakuRi, asalId: number, baruId: number, sekarang: Date): Promise<void> {
    const lama = await db.ambilTagihanUntukTeruskanDariRawatJalan(asalId, tx);
    if (lama) {
      const baru = await (async () => { (await db.simpanTagihanUntukTambahItemTagihanDalam(p.fasyankesId, baruId, p.oleh, tx)); return db.simpanTagihanUntukTambahItemTagihanDalamHasil(baruId, tx); })();
      await db.ubahItemTagihanUntukTeruskanDariRawatJalan(baru.id, lama.id, tx);
      const semua = await db.daftarItemTagihanUntukTambahItemTagihanDalam(baru.id, tx);
      await db.ubahTagihanUntukTambahItemTagihanDalam(semua.every((x) => x.harga !== null) ? 'lengkap' : 'belum_lengkap', baru.id, tx);
    }
    await db.ubahResepUntukTeruskanDariRawatJalan(baruId, asalId, p.fasyankesId, 'diserahkan', tx);
    await selesaiAntreanDalam(tx, p.fasyankesId, asalId, sekarang);
    await db.ubahKunjunganUntukTeruskanDariRawatJalan('finished', 'ditutup', sekarang, tanggalRetensi(sekarang), asalId, tx);
  }

  // ---- Detail dan penempatan ----
  async detail(fasyankesId: number, kunjunganId: number): Promise<RawatInapDto | null> {
    const k = await db.cariKunjunganUntukDetail(kunjunganId, fasyankesId, 'IMP');
    if (!k) return null;
    const [pen, peserta, pulang] = await Promise.all([
      db.daftarPenempatanUntukDetail(k.id),
      db.daftarPesertaKunjunganUntukDetail(k.id, null),
      db.ambilPemulanganUntukDetail(k.id),
    ]);
    const bed = new Map((await db.daftarLokasiUntukDetail(pen.map((x) => x.lokasi_id))).map((l) => [l.id, l]));
    const ruang = new Map((await db.daftarLokasiUntukLaporan([...bed.values()].flatMap((b) => (b.induk_id ? [b.induk_id] : [])))).map((l) => [l.id, l.nama]));
    const tarif = new Map((await db.daftarTarifLayananUntukDetail(pen.flatMap((x) => (x.tarif_id ? [x.tarif_id] : [])))).map((t) => [t.id, t.nama]));
    const orang = new Map((await db.daftarPenggunaUntukNamaPengguna([...peserta.map((x) => x.pengguna_id), ...(pulang ? [pulang.dibuat_oleh] : [])])).map((u) => [u.id, u.nama]));
    return {
      kunjungan: { id: k.id, pasien_id: k.pasien_id, pasien_nama: k.pasien.nama, pasien_nomor_rm: k.pasien.nomor_rm, status: k.status, tahap_layanan: k.tahap_layanan, cara_pembayaran: k.cara_pembayaran, mulai: k.mulai.toISOString(), spri: k.spri },
      penempatan: pen.map((x): PenempatanDto => ({
        id: x.id, bed_id: x.lokasi_id, bed_nama: bed.get(x.lokasi_id)?.nama ?? null, ruang_nama: ruang.get(bed.get(x.lokasi_id)?.induk_id ?? 0) ?? null, kelas: x.kelas, indikator: x.indikator,
        tarif_id: x.tarif_id, tarif_nama: x.tarif_id ? tarif.get(x.tarif_id) ?? null : null, mulai: x.mulai.toISOString(), selesai: x.selesai?.toISOString() ?? null,
      })),
      dpjp: peserta.map((x) => ({ id: x.pengguna_id, nama: orang.get(x.pengguna_id) ?? '-', tipe: x.tipe })),
      pemulangan: pulang && ({ disposisi: pulang.disposisi, kondisi_pulang: pulang.kondisi_pulang, diagnosis_akhir: pulang.diagnosis_akhir, ringkasan: pulang.ringkasan, tindak_lanjut: pulang.tindak_lanjut, waktu: pulang.waktu.toISOString(), dibuat_oleh_nama: orang.get(pulang.dibuat_oleh) ?? null } satisfies PemulanganDto),
    };
  }

  /** Pindah bed/kelas (menutup periode lama, membuka yang baru) dan/atau ganti DPJP; kunjungan dikunci agar perubahan serempak berurutan. */
  async ubahPenempatan(p: PelakuRi, kunjunganId: number, d: PenempatanMasukan, sekarang: Date): Promise<void> {
    await db.transaksi(async (tx) => {
      await kunci(tx, 'kunjungan', p.fasyankesId, kunjunganId);
      const k = await db.cariKunjunganUntukUbahPenempatan(kunjunganId, p.fasyankesId, tx);
      if (!k) throw new GalatRi('tidak_ditemukan');
      if (k.jenis !== 'IMP') throw new GalatRi('bukan_inap');
      if (k.tahap_layanan === 'kasir' || k.tahap_layanan === 'ditutup') throw new GalatRi('sudah_pulang');
      const sekarangAktif = await db.cariPenempatanUntukUbahPenempatan(kunjunganId, null, tx);
      const bedTujuan = d.bed_id ?? sekarangAktif?.lokasi_id ?? null;
      if (bedTujuan) {
        const sama = sekarangAktif && sekarangAktif.lokasi_id === bedTujuan;
        const kelasSama = sama && sekarangAktif.kelas === d.kelas && sekarangAktif.indikator === d.indikator && (sekarangAktif.tarif_id ?? null) === (d.tarif_id ?? null);
        if (!kelasSama) {
          if (sekarangAktif && !d.alasan?.trim()) throw new GalatRi('alasan_pindah');
          if (!sama) await this.pastikanBedBebas(tx, p.fasyankesId, bedTujuan);
          if (sekarangAktif) {
            await db.ubahPenempatanUntukUbahPenempatan(sekarang, sekarangAktif.id, tx);
            if (!sama) await db.ubahLokasiUntukTempatkan('O', sekarangAktif.lokasi_id, tx);
          }
          if (sama) {
            await db.tambahPenempatanUntukTempatkan(p.fasyankesId, kunjunganId, bedTujuan, d.kelas, d.indikator, d.tarif_id ?? null, sekarang, p.oleh, tx);
          } else {
            await this.tempatkan(tx, p, kunjunganId, bedTujuan, d, sekarang);
          }
          if (k.status === 'planned') await db.ubahKunjunganUntukUbahPenempatan('in-progress', kunjunganId, tx);
        }
      }
      await this.terapkanDpjp(tx, p, kunjunganId, d.dpjp_id, d.dpjp_bersama, sekarang);
    });
  }

  private async terapkanDpjp(tx: db.Koneksi, p: PelakuRi, kunjunganId: number, utama: number, bersama: number[], sekarang: Date): Promise<void> {
    const aktif = await db.daftarPesertaKunjunganUntukTerapkanDpjp(kunjunganId, null, tx);
    const inginkan: { id: number; tipe: 'ATND' | 'SPRF' }[] = [{ id: utama, tipe: 'ATND' }, ...bersama.map((id) => ({ id, tipe: 'SPRF' as const }))];
    for (const a of aktif) {
      if (!inginkan.some((x) => x.id === a.pengguna_id && x.tipe === a.tipe)) await db.ubahPesertaKunjunganUntukTerapkanDpjp(sekarang, a.id, tx);
    }
    for (const x of inginkan) {
      if (!aktif.some((a) => a.pengguna_id === x.id && a.tipe === x.tipe)) {
        await db.tambahPesertaKunjunganUntukDaftarkan(p.fasyankesId, kunjunganId, x.id, x.tipe, sekarang, p.oleh, tx);
      }
    }
  }

  // ---- Catatan harian (CPPT) ----
  async daftarCatatan(fasyankesId: number, kunjunganId: number): Promise<{ id: number; isi: CatatanHarianMasukan; dibuat_oleh: number; dibuat_pada: Date }[]> {
    const baris = await db.daftarCatatanHarianUntukDaftarCatatan(fasyankesId, kunjunganId, 200);
    return baris.map((b) => ({ id: b.id, isi: isiCatatan(b), dibuat_oleh: b.dibuat_oleh, dibuat_pada: b.dibuat_pada }));
  }

  async isiCatatan(fasyankesId: number, id: number): Promise<CatatanHarianMasukan | null> {
    const b = await db.cariCatatanHarianUntukIsiCatatan(id, fasyankesId);
    return b && isiCatatan(b);
  }

  async namaPengguna(ids: number[]): Promise<Map<number, string>> {
    return new Map((await db.daftarPenggunaUntukNamaPengguna([...new Set(ids)])).map((u) => [u.id, u.nama]));
  }

  async tambahCatatan(fasyankesId: number, kunjunganId: number, isi: CatatanHarianMasukan, oleh: number, pengesahan: (id: number) => Omit<TulisPengesahan, 'fasyankesId' | 'entitas' | 'entitasId'>): Promise<number> {
    return db.transaksi(async (tx) => {
      const b = await (async () => { const _hasil = await db.tambahCatatanHarianUntukTambahCatatan(fasyankesId, kunjunganId, isi.subjektif, isi.objektif, isi.asesmen, isi.rencana, isi.instruksi, isi.tanda_vital ? (isi.tanda_vital as db.NilaiJson) : undefined, oleh, tx); return db.tambahCatatanHarianUntukTambahCatatanHasil(_hasil.id, tx); })();
      await tulisPengesahanDalam(tx, { ...pengesahan(b.id), fasyankesId, entitas: 'cppt', entitasId: b.id });
      return b.id;
    });
  }

  // ---- Pemulangan ----
  /** Pemulangan atomik: catat pemulangan, tutup penempatan dan periode DPJP, kosongkan bed, tambah biaya kamar, lanjutkan kunjungan ke kasir. */
  async pulangkan(p: PelakuRi, kunjunganId: number, d: PemulanganMasukan, sekarang: Date): Promise<{ pemulangan: Date; tagihanKamar: number }> {
    return db.transaksi(async (tx) => {
      await kunci(tx, 'kunjungan', p.fasyankesId, kunjunganId);
      const k = await db.cariKunjunganUntukUbahPenempatan(kunjunganId, p.fasyankesId, tx);
      if (!k) throw new GalatRi('tidak_ditemukan');
      if (k.jenis !== 'IMP') throw new GalatRi('bukan_inap');
      if (k.tahap_layanan === 'kasir' || k.tahap_layanan === 'ditutup' || (await db.hitungPemulanganUntukPulangkan(kunjunganId, tx)) > 0) throw new GalatRi('sudah_pulang');
      await db.tambahPemulanganUntukPulangkan(p.fasyankesId, kunjunganId, d.disposisi, d.kondisi_pulang, d.diagnosis_akhir, d.ringkasan, d.tindak_lanjut, sekarang, p.oleh, tx);
      const aktif = await db.daftarPenempatanUntukPulangkan(kunjunganId, null, tx);
      for (const a of aktif) {
        await db.ubahPenempatanUntukUbahPenempatan(sekarang, a.id, tx);
        await db.ubahLokasiUntukTempatkan('O', a.lokasi_id, tx);
      }
      await db.ubahPesertaKunjunganUntukPulangkan(sekarang, kunjunganId, null, tx);
      const semua = await db.daftarPenempatanUntukPulangkan2(kunjunganId, null, tx);
      const tarif = new Map((await db.daftarTarifLayananUntukPulangkan(semua.flatMap((x) => (x.tarif_id ? [x.tarif_id] : [])), tx)).map((t) => [t.id, t]));
      const item = semua.map((x) => {
        const t = tarif.get(x.tarif_id!)!;
        const hari = Math.max(1, Math.ceil(((x.selesai ?? sekarang).getTime() - x.mulai.getTime()) / 86_400_000));
        return { jenis: 'kamar' as const, tarifId: t.id, kode: t.kode, nama: `${t.nama} (${hari} hari)`, harga: hargaTarif(t, k.cara_pembayaran), orderPenunjangId: null, jumlah: hari };
      });
      if (item.length) await tambahItemTagihanDalam(tx, p.fasyankesId, kunjunganId, p.oleh, item);
      await db.ubahKunjunganUntukPulangkan('finished', 'kasir', sekarang, kunjunganId, tx);
      return { pemulangan: sekarang, tagihanKamar: item.length };
    });
  }
}

function isiCatatan(b: { subjektif: string; objektif: string; asesmen: string; rencana: string; instruksi: string | null; tanda_vital: unknown }): CatatanHarianMasukan {
  return { subjektif: b.subjektif, objektif: b.objektif, asesmen: b.asesmen, rencana: b.rencana, instruksi: b.instruksi, tanda_vital: (b.tanda_vital as CatatanHarianMasukan['tanda_vital']) ?? null };
}
