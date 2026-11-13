import * as db from '@klira/db';
import { tulisPengesahanDalam } from './repositori.js';
const tglIso = (d) => d.toISOString().slice(0, 10);
const awalHariUtc = () => new Date(`${tglIso(new Date())}T00:00:00.000Z`);
const rentangWib = (tanggal) => new Date(`${tanggal}T00:00:00.000+07:00`);
/** Akses data dokumen Rekam medis: resume, surat, pembukaan, penyampaian, laporan. Hanya INSERT, dan UPDATE terkontrol atas resume dan keputusan pembukaan; tidak ada hapus. */
export class RepositoriDokumenMysql {
    async pasien(fasyankesId, id) {
        return db.cariPasienUntukBuatRuteInstagram(id, fasyankesId);
    }
    async kunjunganAda(fasyankesId, id, pasienId) {
        return (await db.hitungKunjunganUntukKunjunganAda2(id, fasyankesId, pasienId)) > 0;
    }
    // ---- Resume ----
    async resume(fasyankesId, kunjunganId) {
        const r = await db.cariResumeMedisUntukResume(fasyankesId, kunjunganId);
        return r && { isi: r.isi, diperbarui_pada: r.diperbarui_pada };
    }
    /** Kunjungan (dari daftar) yang sudah punya resume medis. */
    async resumeAda(fasyankesId, kunjunganIds) {
        return new Set((await db.daftarResumeMedisUntukResumeAda(fasyankesId, kunjunganIds)).map((r) => r.kunjungan_id));
    }
    async simpanResume(d) {
        await db.transaksi(async (tx) => {
            const isi = d.isi;
            await db.simpanResumeMedisUntukSimpanResume(d.fasyankesId, d.kunjunganId, isi, d.oleh, new Date(), tx);
            await tulisPengesahanDalam(tx, { ...d.pengesahan, fasyankesId: d.fasyankesId, entitas: 'resume_medis', entitasId: d.kunjunganId });
        });
    }
    // ---- Surat ----
    async daftarSurat(fasyankesId, kunjunganId) {
        const baris = await db.daftarSuratUntukDaftarSurat(fasyankesId, kunjunganId);
        const orang = new Map((await db.daftarPenggunaUntukNamaPengguna([...new Set(baris.map((b) => b.dokter_id))])).map((u) => [u.id, u.nama]));
        return baris.map((b) => ({ id: b.id, jenis: b.jenis, nomor_surat: b.nomor_surat, tujuan: b.tujuan, isi: b.isi, dokter_nama: orang.get(b.dokter_id) ?? null, dibuat_pada: b.dibuat_pada.toISOString() }));
    }
    /** Nomor berurutan per hari (S-TTTTBBHH-NNN); bila dua pengajuan serempak mendapat nomor sama, keunikan memaksa ulang. */
    async buatSurat(d) {
        for (let percobaan = 0;; percobaan++) {
            try {
                const awal = awalHariUtc();
                const urut = (await db.hitungSuratUntukBuatSurat(d.fasyankesId, awal)) + 1 + percobaan;
                const nomor = `S-${tglIso(awal).replaceAll('-', '')}-${String(urut).padStart(3, '0')}`;
                const s = await db.transaksi(async (koneksiBaru) => { const _hasil = await db.tambahSuratUntukBuatSurat(d.fasyankesId, d.kunjunganId, d.jenis, nomor, d.tujuan, d.isi, d.dokterId, koneksiBaru); return db.tambahSuratUntukBuatSuratHasil(_hasil.id, koneksiBaru); });
                return { id: s.id, nomor };
            }
            catch (e) {
                if (db.bentrokUnik(e) && percobaan < 5)
                    continue;
                throw e;
            }
        }
    }
    // ---- Pembukaan ----
    async buatPembukaan(fasyankesId, m, olehId) {
        return (await db.transaksi(async (koneksiBaru) => { const _hasil = await db.tambahPembukaanRmUntukBuatPembukaan(fasyankesId, m.pasien_id, m.pemohon_nama, m.pemohon_instansi ?? null, m.dasar, m.dasar === 'hukum' ? (m.alasan_hukum ?? null) : null, m.dasar_rinci, m.cakupan, m.identitas_disamarkan ?? true, olehId, koneksiBaru); return db.tambahPembukaanRmUntukBuatPembukaanHasil(_hasil.id, koneksiBaru); })).id;
    }
    async pembukaan(fasyankesId, id) {
        const p = await db.cariPembukaanRmUntukPembukaan(id, fasyankesId);
        return p;
    }
    /** Keputusan atomik: hanya bila masih diajukan. */
    async putuskanPembukaan(fasyankesId, id, status, penyetujuId, catatan) {
        const r = await db.ubahPembukaanRmUntukPutuskanPembukaan(status, penyetujuId, catatan, new Date(), id, fasyankesId, 'diajukan');
        return r.count > 0;
    }
    async daftarPembukaan(fasyankesId, f) {
        const [total, menunggu, baris] = await Promise.all([
            db.hitungPembukaanRmUntukDaftarPembukaan(fasyankesId, (f.status) ? (f.status) : undefined),
            db.hitungPembukaanRmUntukDaftarPembukaan(fasyankesId, 'diajukan'),
            db.daftarPembukaanRmUntukDaftarPembukaan(fasyankesId, (f.status) ? (f.status) : undefined, f.ukuran, (f.halaman - 1) * f.ukuran),
        ]);
        const pasien = new Map((await db.daftarPasienUntukDaftarPembukaan([...new Set(baris.map((b) => b.pasien_id))])).map((p) => [p.id, p]));
        const orang = new Map((await db.daftarPenggunaUntukNamaPengguna([...new Set(baris.flatMap((b) => [b.diminta_oleh, ...(b.penyetuju_id ? [b.penyetuju_id] : [])]))])).map((u) => [u.id, u.nama]));
        const data = baris.map((b) => ({
            id: b.id, pasien_id: b.pasien_id, pasien_nama: pasien.get(b.pasien_id)?.nama ?? '-', pasien_nomor_rm: pasien.get(b.pasien_id)?.nomor_rm ?? '-', pemohon_nama: b.pemohon_nama, pemohon_instansi: b.pemohon_instansi,
            dasar: b.dasar, alasan_hukum: b.alasan_hukum, dasar_rinci: b.dasar_rinci, cakupan: b.cakupan, identitas_disamarkan: b.identitas_disamarkan, status: b.status,
            penyetuju_nama: b.penyetuju_id ? orang.get(b.penyetuju_id) ?? null : null, catatan_keputusan: b.catatan_keputusan, waktu_keputusan: b.waktu_keputusan?.toISOString() ?? null,
            diminta_oleh_nama: orang.get(b.diminta_oleh) ?? null, dibuat_pada: b.dibuat_pada.toISOString(),
        }));
        return { data, halaman: f.halaman, ukuran: f.ukuran, total, menunggu };
    }
    // ---- Penyampaian ----
    async buatPenyampaian(fasyankesId, m, petugasId) {
        return (await db.transaksi(async (koneksiBaru) => { const _hasil = await db.tambahPenyampaianRmUntukBuatPenyampaian(fasyankesId, m.pasien_id, m.kunjungan_id ?? null, m.penerima_nama, m.hubungan, m.bentuk, m.bukti_persetujuan ?? null, m.catatan ?? null, petugasId, koneksiBaru); return db.tambahPenyampaianRmUntukBuatPenyampaianHasil(_hasil.id, koneksiBaru); })).id;
    }
    async daftarPenyampaian(fasyankesId, f) {
        const cari = f.cari?.trim();
        const [total, baris] = await Promise.all([
            db.hitungPenyampaianRmUntukDaftarPenyampaian(fasyankesId, cari, (await db.daftarPasienUntukDaftarPenyampaian(fasyankesId, cari)).map((p) => p.id), cari),
            db.daftarPenyampaianRmUntukDaftarPenyampaian(fasyankesId, cari, (await db.daftarPasienUntukDaftarPenyampaian(fasyankesId, cari)).map((p) => p.id), cari, f.ukuran, (f.halaman - 1) * f.ukuran),
        ]);
        const pasien = new Map((await db.daftarPasienUntukDaftarPembukaan([...new Set(baris.map((b) => b.pasien_id))])).map((p) => [p.id, p]));
        const orang = new Map((await db.daftarPenggunaUntukNamaPengguna([...new Set(baris.map((b) => b.petugas_id))])).map((u) => [u.id, u.nama]));
        const data = baris.map((b) => ({
            id: b.id, pasien_id: b.pasien_id, pasien_nama: pasien.get(b.pasien_id)?.nama ?? '-', pasien_nomor_rm: pasien.get(b.pasien_id)?.nomor_rm ?? '-', kunjungan_id: b.kunjungan_id, penerima_nama: b.penerima_nama,
            hubungan: b.hubungan, bentuk: b.bentuk, bukti_persetujuan: b.bukti_persetujuan, catatan: b.catatan, petugas_nama: orang.get(b.petugas_id) ?? null, waktu: b.waktu.toISOString(),
        }));
        return { data, halaman: f.halaman, ukuran: f.ukuran, total };
    }
    // ---- Laporan (kunjungan yang sudah ditutup, rentang menurut waktu tutup; bawaan 30 hari terakhir) ----
    async laporan(fasyankesId, f) {
        const sampai = f.sampai ?? tglIso(new Date(Date.now() + 7 * 3_600_000));
        const dari = f.dari ?? tglIso(new Date(new Date(`${sampai}T00:00:00Z`).getTime() - 29 * 86_400_000));
        if (f.jenis === 'kunjungan_per_poli') {
            const g = await db.kelompokKunjunganUntukLaporan(fasyankesId, 'ditutup', rentangWib(dari), new Date(rentangWib(sampai).getTime() + 86_400_000));
            const lokasi = new Map((await db.daftarLokasiUntukLaporan(g.flatMap((x) => (x.lokasi_id ? [x.lokasi_id] : [])))).map((l) => [l.id, l.nama]));
            const baris = g.map((x) => [x.lokasi_id ? lokasi.get(x.lokasi_id) ?? '-' : 'Tanpa poli', x._count._all]).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
            return { jenis: f.jenis, dari, sampai, kolom: ['Poli', 'Kunjungan'], baris, total: baris.reduce((s, b) => s + b[1], 0) };
        }
        // Diagnosis terbanyak: diagnosis utama dokter versi terakhir.
        const ditutup = await db.daftarKunjunganUntukLaporan(fasyankesId, 'ditutup', rentangWib(dari), new Date(rentangWib(sampai).getTime() + 86_400_000));
        const ids = ditutup.map((k) => k.id);
        const diag = await db.daftarDiagnosisUntukLaporan(fasyankesId, ids, 'utama');
        const terakhir = new Map(diag.map((d) => [d.kunjungan_id, { kode: d.kode_icd10, nama: d.nama }]));
        const hitung = new Map();
        for (const d of terakhir.values())
            hitung.set(d.kode, { nama: d.nama, n: (hitung.get(d.kode)?.n ?? 0) + 1 });
        const baris = [...hitung].map(([kode, v]) => [kode, v.nama, v.n]).sort((a, b) => b[2] - a[2] || a[0].localeCompare(b[0])).slice(0, 20);
        return { jenis: f.jenis, dari, sampai, kolom: ['Kode ICD-10', 'Diagnosis', 'Kunjungan'], baris, total: terakhir.size };
    }
}
