import * as db from '@klira/db';
export class RepositoriKeamananMysql {
    ambilPengaturan() {
        return db.ambilPengaturanKeamananUntukAmbilPengaturan();
    }
    simpanPengaturan(nilai, oleh) {
        const sekarang = new Date();
        return db.transaksi(async (koneksiBaru) => { (await db.simpanPengaturanKeamananUntukSimpanPengaturan((nilai)?.masa_sesi_jam, (nilai)?.batas_percobaan_masuk, (nilai)?.panjang_minimum_kata_sandi, oleh, sekarang, koneksiBaru)); return db.simpanPengaturanKeamananUntukSimpanPengaturanHasil(koneksiBaru); });
    }
    async daftarBackup(lewati, ambil) {
        const [total, baris] = await Promise.all([
            db.hitungRiwayatBackupUntukDaftarBackup(),
            db.daftarRiwayatBackupUntukDaftarBackup(ambil, lewati),
        ]);
        return { total, baris: baris.map((b) => ({ ...b, ukuran_byte: b.ukuran_byte === null ? null : Number(b.ukuran_byte) })) };
    }
    /** Catat operasi cadangan; mengembalikan id baris riwayat. */
    catatBackup(status, lokasi, oleh) {
        return db.tambahRiwayatBackup(status, lokasi, oleh);
    }
    selesaiBackup(id, status, ukuranByte) {
        return db.ubahStatusRiwayatBackup(id, status, ukuranByte);
    }
}
