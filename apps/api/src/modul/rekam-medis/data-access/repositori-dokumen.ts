import * as db from '@klira/db';
import type { AlasanHukum, FilterLaporan, FilterPembukaan, FilterPenyampaian, HalamanPembukaanDto, HalamanPenyampaianDto, JenisSurat, LaporanDto, PembukaanDto, PembukaanMasukan, PenyampaianDto, PenyampaianMasukan, ResumeIsi, SuratDto,  } from '@klira/shared';
import { tulisPengesahanDalam } from './repositori';
import type { TulisPengesahan } from './repositori';

const tglIso = (d: Date): string => d.toISOString().slice(0, 10);
const awalHariUtc = (): Date => new Date(`${tglIso(new Date())}T00:00:00.000Z`);
const rentangWib = (tanggal: string): Date => new Date(`${tanggal}T00:00:00.000+07:00`);

export type ResumeBaris = { isi: ResumeIsi; diperbarui_pada: Date };
export type PasienMini = { id: number; nama: string; nomor_rm: string };
export type PembukaanBaris = { id: number; status: 'diajukan' | 'disetujui' | 'ditolak'; diminta_oleh: number };

/** Akses data dokumen Rekam medis: resume, surat, pembukaan, penyampaian, laporan. Hanya INSERT, dan UPDATE terkontrol atas resume dan keputusan pembukaan; tidak ada hapus. */
export class RepositoriDokumenMysql {
  async pasien(fasyankesId: number, id: number): Promise<PasienMini | null> {
    return db.cariPasienUntukBuatRuteInstagram(id, fasyankesId);
  }

  async kunjunganAda(fasyankesId: number, id: number, pasienId: number): Promise<boolean> {
    return (await db.hitungKunjunganUntukKunjunganAda2(id, fasyankesId, pasienId)) > 0;
  }

  // ---- Resume ----
  async resume(fasyankesId: number, kunjunganId: number): Promise<ResumeBaris | null> {
    const r = await db.cariResumeMedisUntukResume(fasyankesId, kunjunganId);
    return r && { isi: r.isi as ResumeIsi, diperbarui_pada: r.diperbarui_pada };
  }

  /** Kunjungan (dari daftar) yang sudah punya resume medis. */
  async resumeAda(fasyankesId: number, kunjunganIds: number[]): Promise<Set<number>> {
    return new Set((await db.daftarResumeMedisUntukResumeAda(fasyankesId, kunjunganIds)).map((r) => r.kunjungan_id));
  }

  async simpanResume(d: { fasyankesId: number; kunjunganId: number; isi: ResumeIsi; oleh: number; pengesahan: Omit<TulisPengesahan, 'fasyankesId' | 'entitas' | 'entitasId'> }): Promise<void> {
    await db.transaksi(async (tx) => {
      const isi = d.isi as unknown as db.NilaiJson;
      await db.simpanResumeMedisUntukSimpanResume(d.fasyankesId, d.kunjunganId, isi, d.oleh, new Date(), tx);
      await tulisPengesahanDalam(tx, { ...d.pengesahan, fasyankesId: d.fasyankesId, entitas: 'resume_medis', entitasId: d.kunjunganId });
    });
  }

  // ---- Surat ----
  async daftarSurat(fasyankesId: number, kunjunganId: number): Promise<SuratDto[]> {
    const baris = await db.daftarSuratUntukDaftarSurat(fasyankesId, kunjunganId);
    const orang = new Map((await db.daftarPenggunaUntukNamaPengguna([...new Set(baris.map((b) => b.dokter_id))])).map((u) => [u.id, u.nama]));
    return baris.map((b) => ({ id: b.id, jenis: b.jenis as JenisSurat, nomor_surat: b.nomor_surat, tujuan: b.tujuan, isi: b.isi, dokter_nama: orang.get(b.dokter_id) ?? null, dibuat_pada: b.dibuat_pada.toISOString() }));
  }

  /** Nomor berurutan per hari (S-TTTTBBHH-NNN); bila dua pengajuan serempak mendapat nomor sama, keunikan memaksa ulang. */
  async buatSurat(d: { fasyankesId: number; kunjunganId: number; jenis: JenisSurat; tujuan: string | null; isi: string; dokterId: number }): Promise<{ id: number; nomor: string }> {
    for (let percobaan = 0; ; percobaan++) {
      try {
        const awal = awalHariUtc();
        const urut = (await db.hitungSuratUntukBuatSurat(d.fasyankesId, awal)) + 1 + percobaan;
        const nomor = `S-${tglIso(awal).replaceAll('-', '')}-${String(urut).padStart(3, '0')}`;
        const s = await db.transaksi(async koneksiBaru => { const _hasil = await db.tambahSuratUntukBuatSurat(d.fasyankesId, d.kunjunganId, d.jenis, nomor, d.tujuan, d.isi, d.dokterId, koneksiBaru); return db.tambahSuratUntukBuatSuratHasil(_hasil.id, koneksiBaru); });
        return { id: s.id, nomor };
      } catch (e) {
        if (db.bentrokUnik(e) && percobaan < 5) continue;
        throw e;
      }
    }
  }

  // ---- Pembukaan ----
  async buatPembukaan(fasyankesId: number, m: PembukaanMasukan, olehId: number): Promise<number> {
    return (await db.transaksi(async koneksiBaru => { const _hasil = await db.tambahPembukaanRmUntukBuatPembukaan(fasyankesId, m.pasien_id, m.pemohon_nama, m.pemohon_instansi ?? null, m.dasar, m.dasar === 'hukum' ? (m.alasan_hukum ?? null) : null, m.dasar_rinci, m.cakupan, m.identitas_disamarkan ?? true, olehId, koneksiBaru); return db.tambahPembukaanRmUntukBuatPembukaanHasil(_hasil.id, koneksiBaru); })).id;
  }

  async pembukaan(fasyankesId: number, id: number): Promise<PembukaanBaris | null> {
    const p = await db.cariPembukaanRmUntukPembukaan(id, fasyankesId);
    return p;
  }

  /** Keputusan atomik: hanya bila masih diajukan. */
  async putuskanPembukaan(fasyankesId: number, id: number, status: 'disetujui' | 'ditolak', penyetujuId: number, catatan: string | null): Promise<boolean> {
    const r = await db.ubahPembukaanRmUntukPutuskanPembukaan(status, penyetujuId, catatan, new Date(), id, fasyankesId, 'diajukan');
    return r.count > 0;
  }

  async daftarPembukaan(fasyankesId: number, f: FilterPembukaan): Promise<HalamanPembukaanDto> {

    const [total, menunggu, baris] = await Promise.all([
      db.hitungPembukaanRmUntukDaftarPembukaan(fasyankesId, (f.status) ? (f.status) : undefined),
      db.hitungPembukaanRmUntukDaftarPembukaan(fasyankesId, 'diajukan'),
      db.daftarPembukaanRmUntukDaftarPembukaan(fasyankesId, (f.status) ? (f.status) : undefined, f.ukuran, (f.halaman - 1) * f.ukuran),
    ]);
    const pasien = new Map((await db.daftarPasienUntukDaftarPembukaan([...new Set(baris.map((b) => b.pasien_id))])).map((p) => [p.id, p]));
    const orang = new Map((await db.daftarPenggunaUntukNamaPengguna([...new Set(baris.flatMap((b) => [b.diminta_oleh, ...(b.penyetuju_id ? [b.penyetuju_id] : [])]))])).map((u) => [u.id, u.nama]));
    const data: PembukaanDto[] = baris.map((b) => ({
      id: b.id, pasien_id: b.pasien_id, pasien_nama: pasien.get(b.pasien_id)?.nama ?? '-', pasien_nomor_rm: pasien.get(b.pasien_id)?.nomor_rm ?? '-', pemohon_nama: b.pemohon_nama, pemohon_instansi: b.pemohon_instansi,
      dasar: b.dasar, alasan_hukum: b.alasan_hukum as AlasanHukum | null, dasar_rinci: b.dasar_rinci, cakupan: b.cakupan, identitas_disamarkan: b.identitas_disamarkan, status: b.status,
      penyetuju_nama: b.penyetuju_id ? orang.get(b.penyetuju_id) ?? null : null, catatan_keputusan: b.catatan_keputusan, waktu_keputusan: b.waktu_keputusan?.toISOString() ?? null,
      diminta_oleh_nama: orang.get(b.diminta_oleh) ?? null, dibuat_pada: b.dibuat_pada.toISOString(),
    }));
    return { data, halaman: f.halaman, ukuran: f.ukuran, total, menunggu };
  }

  // ---- Penyampaian ----
  async buatPenyampaian(fasyankesId: number, m: PenyampaianMasukan, petugasId: number): Promise<number> {
    return (await db.transaksi(async koneksiBaru => { const _hasil = await db.tambahPenyampaianRmUntukBuatPenyampaian(fasyankesId, m.pasien_id, m.kunjungan_id ?? null, m.penerima_nama, m.hubungan, m.bentuk, m.bukti_persetujuan ?? null, m.catatan ?? null, petugasId, koneksiBaru); return db.tambahPenyampaianRmUntukBuatPenyampaianHasil(_hasil.id, koneksiBaru); })).id;
  }

  async daftarPenyampaian(fasyankesId: number, f: FilterPenyampaian): Promise<HalamanPenyampaianDto> {
    const cari = f.cari?.trim();

    const [total, baris] = await Promise.all([
      db.hitungPenyampaianRmUntukDaftarPenyampaian(fasyankesId, cari, (await db.daftarPasienUntukDaftarPenyampaian(fasyankesId, cari)).map((p) => p.id), cari),
      db.daftarPenyampaianRmUntukDaftarPenyampaian(fasyankesId, cari, (await db.daftarPasienUntukDaftarPenyampaian(fasyankesId, cari)).map((p) => p.id), cari, f.ukuran, (f.halaman - 1) * f.ukuran),
    ]);
    const pasien = new Map((await db.daftarPasienUntukDaftarPembukaan([...new Set(baris.map((b) => b.pasien_id))])).map((p) => [p.id, p]));
    const orang = new Map((await db.daftarPenggunaUntukNamaPengguna([...new Set(baris.map((b) => b.petugas_id))])).map((u) => [u.id, u.nama]));
    const data: PenyampaianDto[] = baris.map((b) => ({
      id: b.id, pasien_id: b.pasien_id, pasien_nama: pasien.get(b.pasien_id)?.nama ?? '-', pasien_nomor_rm: pasien.get(b.pasien_id)?.nomor_rm ?? '-', kunjungan_id: b.kunjungan_id, penerima_nama: b.penerima_nama,
      hubungan: b.hubungan as PenyampaianDto['hubungan'], bentuk: b.bentuk, bukti_persetujuan: b.bukti_persetujuan, catatan: b.catatan, petugas_nama: orang.get(b.petugas_id) ?? null, waktu: b.waktu.toISOString(),
    }));
    return { data, halaman: f.halaman, ukuran: f.ukuran, total };
  }

  // ---- Laporan (kunjungan yang sudah ditutup, rentang menurut waktu tutup; bawaan 30 hari terakhir) ----
  async laporan(fasyankesId: number, f: FilterLaporan): Promise<LaporanDto> {
    const sampai = f.sampai ?? tglIso(new Date(Date.now() + 7 * 3_600_000));
    const dari = f.dari ?? tglIso(new Date(new Date(`${sampai}T00:00:00Z`).getTime() - 29 * 86_400_000));



    if (f.jenis === 'kunjungan_per_poli') {
      const g = await db.kelompokKunjunganUntukLaporan(fasyankesId, 'ditutup' as const, rentangWib(dari), new Date(rentangWib(sampai).getTime() + 86_400_000));
      const lokasi = new Map((await db.daftarLokasiUntukLaporan(g.flatMap((x) => (x.lokasi_id ? [x.lokasi_id] : [])))).map((l) => [l.id, l.nama]));
      const baris = g.map((x): [string, number] => [x.lokasi_id ? lokasi.get(x.lokasi_id) ?? '-' : 'Tanpa poli', x._count._all]).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
      return { jenis: f.jenis, dari, sampai, kolom: ['Poli', 'Kunjungan'], baris, total: baris.reduce((s, b) => s + b[1], 0) };
    }
    // Diagnosis terbanyak: diagnosis utama dokter versi terakhir.
    const ditutup = await db.daftarKunjunganUntukLaporan(fasyankesId, 'ditutup' as const, rentangWib(dari), new Date(rentangWib(sampai).getTime() + 86_400_000));
    const ids = ditutup.map((k) => k.id);
    const diag = await db.daftarDiagnosisUntukLaporan(fasyankesId, ids, 'utama');
    const terakhir = new Map(diag.map((d) => [d.kunjungan_id, { kode: d.kode_icd10, nama: d.nama }]));
    const hitung = new Map<string, { nama: string; n: number }>();
    for (const d of terakhir.values()) hitung.set(d.kode, { nama: d.nama, n: (hitung.get(d.kode)?.n ?? 0) + 1 });
    const baris = [...hitung].map(([kode, v]): [string, string, number] => [kode, v.nama, v.n]).sort((a, b) => b[2] - a[2] || a[0].localeCompare(b[0])).slice(0, 20);
    return { jenis: f.jenis, dari, sampai, kolom: ['Kode ICD-10', 'Diagnosis', 'Kunjungan'], baris, total: terakhir.size };
  }
}
