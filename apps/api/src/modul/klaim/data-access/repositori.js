import * as db from '@klira/db';
import { STATUS_KLAIM } from '@klira/shared';
/** Penolakan aturan yang terdeteksi saat menulis (keunikan klaim per kunjungan, status berubah di antara baca dan tulis). */
export class GalatKlaim extends Error {
    kode;
    constructor(kode) {
        super(kode);
        this.kode = kode;
    }
}
const dariDb = (k) => ({
    ...k, diagnosis: k.diagnosis, tindakan: k.tindakan, berkas: k.berkas,
});
/**
 * Kondisi basis data untuk status efektif: lewat batas waktu mencakup yang tersimpan sebagai lewat batas dan yang belum diajukan melewati batas pengajuan
 * atau dikembalikan melewati batas ajukan ulang; status lain tidak termasuk yang sudah melewati batas itu.
 */
/** Akses data klaim JKN/BPJS. Hanya INSERT dan pembaruan status berpagar (status asal harus sama); riwayat status hanya ditambah; tidak ada hapus. */
export class RepositoriKlaimMysql {
    async kunjungan(fasyankesId, id) {
        const k = await db.cariKunjunganUntukKunjungan2(id, fasyankesId);
        return k && { id: k.id, pasien_id: k.pasien_id, pasien_nama: k.pasien.nama, pasien_nomor_rm: k.pasien.nomor_rm, jenis: k.jenis, tahap_layanan: k.tahap_layanan, cara_pembayaran: k.cara_pembayaran, nomor_sep: k.nomor_sep, spri: k.spri, waktu_tutup: k.waktu_tutup };
    }
    async kunjunganBanyak(fasyankesId, ids) {
        const baris = await db.daftarKunjunganUntukKunjunganBanyak(fasyankesId, ids);
        return new Map(baris.map((k) => [k.id, { id: k.id, pasien_id: k.pasien_id, pasien_nama: k.pasien.nama, pasien_nomor_rm: k.pasien.nomor_rm, jenis: k.jenis, tahap_layanan: k.tahap_layanan, cara_pembayaran: k.cara_pembayaran, nomor_sep: k.nomor_sep, spri: k.spri, waktu_tutup: k.waktu_tutup }]));
    }
    /** Kunjungan JKN yang sudah ditutup dan belum punya klaim, terbaru lebih dulu. */
    async kandidat(fasyankesId, batas = 200) {
        const ids = (await db.daftarKunjunganSiapKlaim(fasyankesId, batas)).map((r) => r.id);
        const peta = await this.kunjunganBanyak(fasyankesId, ids);
        return ids.flatMap((id) => (peta.has(id) ? [peta.get(id)] : []));
    }
    async klaim(fasyankesId, id) {
        const k = await db.cariKlaimUntukKlaim(id, fasyankesId);
        return k && dariDb(k);
    }
    async ringkasan(fasyankesId, sekarang) {
        const hasil = await Promise.all(STATUS_KLAIM.nilai.map(async (s) => [s, await db.hitungKlaimUntukRingkasan(fasyankesId, 'lewat_batas_waktu', ['menunggu_sep', 'siap_diajukan'], sekarang, 'dikembalikan', sekarang, s === 'lewat_batas_waktu', ((!(s === 'lewat_batas_waktu')) && (s === 'menunggu_sep' || s === 'siap_diajukan')) ? (s) : undefined, ((!(s === 'lewat_batas_waktu')) && (s === 'menunggu_sep' || s === 'siap_diajukan')) ? (sekarang) : undefined, (((!(s === 'lewat_batas_waktu')) && (!(s === 'menunggu_sep' || s === 'siap_diajukan'))) && (s === 'dikembalikan')) ? (s) : undefined, null, ((!(s === 'lewat_batas_waktu')) && (!(s === 'menunggu_sep' || s === 'siap_diajukan'))) && (s === 'dikembalikan'), (((!(s === 'lewat_batas_waktu')) && (!(s === 'menunggu_sep' || s === 'siap_diajukan'))) && (!(s === 'dikembalikan'))) ? (s) : undefined)]));
        return Object.fromEntries(hasil);
    }
    async daftar(fasyankesId, f, sekarang) {
        const cari = f.cari?.trim();
        const cocok = cari
            ? [{ nomor_sep: { contains: cari } }, { kunjungan_id: { in: (await db.daftarKunjunganUntukDaftar(fasyankesId, cari, 1000)).map((k) => k.id) } }]
            : null;
        const [total, baris] = await Promise.all([db.hitungKlaimUntukDaftar(fasyankesId, 'lewat_batas_waktu', ['menunggu_sep', 'siap_diajukan'], sekarang, 'dikembalikan', sekarang, f.status === 'lewat_batas_waktu', ((!(f.status === 'lewat_batas_waktu')) && (f.status === 'menunggu_sep' || f.status === 'siap_diajukan')) ? (f.status) : undefined, ((!(f.status === 'lewat_batas_waktu')) && (f.status === 'menunggu_sep' || f.status === 'siap_diajukan')) ? (sekarang) : undefined, (((!(f.status === 'lewat_batas_waktu')) && (!(f.status === 'menunggu_sep' || f.status === 'siap_diajukan'))) && (f.status === 'dikembalikan')) ? (f.status) : undefined, null, ((!(f.status === 'lewat_batas_waktu')) && (!(f.status === 'menunggu_sep' || f.status === 'siap_diajukan'))) && (f.status === 'dikembalikan'), (((!(f.status === 'lewat_batas_waktu')) && (!(f.status === 'menunggu_sep' || f.status === 'siap_diajukan'))) && (!(f.status === 'dikembalikan'))) ? (f.status) : undefined, (f.status) && (true), cari, (cari) && (true), (await db.daftarKunjunganUntukDaftar(fasyankesId, cari, 1000)).map((k) => k.id), (cocok) && (true)), db.daftarKlaimUntukDaftar(fasyankesId, 'lewat_batas_waktu', ['menunggu_sep', 'siap_diajukan'], sekarang, 'dikembalikan', sekarang, f.status === 'lewat_batas_waktu', ((!(f.status === 'lewat_batas_waktu')) && (f.status === 'menunggu_sep' || f.status === 'siap_diajukan')) ? (f.status) : undefined, ((!(f.status === 'lewat_batas_waktu')) && (f.status === 'menunggu_sep' || f.status === 'siap_diajukan')) ? (sekarang) : undefined, (((!(f.status === 'lewat_batas_waktu')) && (!(f.status === 'menunggu_sep' || f.status === 'siap_diajukan'))) && (f.status === 'dikembalikan')) ? (f.status) : undefined, null, ((!(f.status === 'lewat_batas_waktu')) && (!(f.status === 'menunggu_sep' || f.status === 'siap_diajukan'))) && (f.status === 'dikembalikan'), (((!(f.status === 'lewat_batas_waktu')) && (!(f.status === 'menunggu_sep' || f.status === 'siap_diajukan'))) && (!(f.status === 'dikembalikan'))) ? (f.status) : undefined, (f.status) && (true), cari, (cari) && (true), (await db.daftarKunjunganUntukDaftar(fasyankesId, cari, 1000)).map((k) => k.id), (cocok) && (true), f.ukuran, (f.halaman - 1) * f.ukuran)]);
        return { total, baris: baris.map(dariDb) };
    }
    async riwayat(fasyankesId, klaimIds) {
        return db.daftarRiwayatKlaimUntukRiwayat(fasyankesId, klaimIds);
    }
    async namaPengguna(ids) {
        return new Map((await db.daftarPenggunaUntukNamaPengguna([...new Set(ids)])).map((u) => [u.id, u.nama]));
    }
    async buat(d) {
        try {
            return await db.transaksi(async (tx) => {
                const k = await (async () => { const _hasil = await db.tambahKlaimUntukBuat(d.fasyankesId, d.kunjunganId, d.nomorSep, d.status, d.tanggalSelesai, d.batas, d.diagnosis, d.tindakan, d.berkas, d.catatan, d.oleh, tx); return db.tambahKlaimUntukBuatHasil(_hasil.id, tx); })();
                await db.tambahRiwayatKlaimUntukBuat(d.fasyankesId, k.id, null, d.status, d.oleh, tx);
                return k.id;
            });
        }
        catch (e) {
            if (db.bentrokUnik(e))
                throw new GalatKlaim('sudah_ada');
            throw e;
        }
    }
    /** Ubah SEP, berkas, dan catatan (status ikut bila berubah) hanya bila status tersimpan masih `dari`. */
    async ubahBerkas(fasyankesId, id, dari, d) {
        await db.transaksi(async (tx) => {
            const n = await db.ubahKlaimUntukUbahBerkas(d.nomorSep, d.status, d.berkas, d.catatan, new Date(), id, fasyankesId, dari, tx);
            if (n.count !== 1)
                throw new GalatKlaim('bentrok');
            if (d.status !== dari)
                await db.tambahRiwayatKlaimUntukBuat(fasyankesId, id, dari, d.status, d.oleh, tx);
        });
    }
    /** Pindah status secara atomik: hanya bila status tersimpan masih `dari` (dua petugas serempak tidak sama-sama berhasil). */
    async ubahStatus(fasyankesId, id, dari, ke, d, oleh, alasanRiwayat) {
        await db.transaksi(async (tx) => {
            const n = await db.ubahKlaimUntukUbahStatus(ke, (d)?.diajukan_pada, (d)?.dikembalikan_pada, (d)?.berita_acara, (d)?.batas_ajukan_ulang, (d)?.alasan, (d)?.jumlah_dibayar, (d)?.dibayar_pada, new Date(), id, fasyankesId, dari, tx);
            if (n.count !== 1)
                throw new GalatKlaim('bentrok');
            await db.tambahRiwayatKlaimUntukUbahStatus(fasyankesId, id, dari, ke, alasanRiwayat, oleh, tx);
        });
    }
}
