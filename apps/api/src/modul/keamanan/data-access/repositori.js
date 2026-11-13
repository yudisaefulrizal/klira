import * as db from '@klira/db';
export class RepositoriKeamananMysql {
    ambilPengaturan(fasyankesId) {
        return db.ambilPengaturanKeamananUntukAmbilPengaturan(fasyankesId);
    }
    simpanPengaturan(fasyankesId, nilai, oleh) {
        const sekarang = new Date();
        return db.transaksi(async (koneksiBaru) => { (await db.simpanPengaturanKeamananUntukSimpanPengaturan(fasyankesId, (nilai)?.masa_sesi_jam, (nilai)?.batas_percobaan_masuk, (nilai)?.panjang_minimum_kata_sandi, oleh, sekarang, koneksiBaru)); return db.simpanPengaturanKeamananUntukSimpanPengaturanHasil(fasyankesId, koneksiBaru); });
    }
    async daftarBackup(fasyankesId, lewati, ambil) {
        const [total, baris] = await Promise.all([
            db.hitungRiwayatBackupUntukDaftarBackup(fasyankesId),
            db.daftarRiwayatBackupUntukDaftarBackup(fasyankesId, ambil, lewati),
        ]);
        return { total, baris: baris.map((b) => ({ ...b, ukuran_byte: b.ukuran_byte === null ? null : Number(b.ukuran_byte) })) };
    }
}
