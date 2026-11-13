import * as db from '@klira/db';
import { hitungAksesEfektif } from '../domain/mesin-izin.js';
import { RepositoriIzinMysql } from './repositori-izin.js';
export class KonflikUsername extends Error {
}
export class RepositoriAksesMysql {
    async cariAkunByUsername(username) {
        return db.cariPenggunaUntukCariAkunByUsername(username, true);
    }
    /** Akses efektif (2.0): gabungan jenis akun aktif + tambahan - pengurangan pada waktu `sekarang`. */
    async ambilAkses(penggunaId, sekarang) {
        const snap = await new RepositoriIzinMysql().ambilSnapshot(penggunaId);
        if (!snap)
            return { jenis_akun: [], fitur: [], izin: [] };
        const { jenis_akun, fitur, izin } = hitungAksesEfektif(snap, sekarang);
        return { jenis_akun, fitur, izin };
    }
    async buatSesi(data) {
        await db.tambahSesiUntukBuatSesi(data.akun.fasyankes_id, data.akun.id, data.idHash, data.alamat?.slice(0, 64), data.kedaluwarsa);
    }
    async cariSesi(idHash, sekarang) {
        const sesi = await db.cariSesiUntukCariSesi(idHash, sekarang, true);
        return sesi ? { akun: sesi.pengguna } : null;
    }
    async hapusSesi(idHash) {
        await db.hapusSesiUntukHapusSesi(idHash);
    }
    async hapusKedaluwarsa(sekarang) {
        await db.hapusSesiKedaluwarsa(sekarang);
    }
    async usernameDipakai(username, kecualiPenggunaId) {
        const ada = await db.cariPenggunaUntukUsernameDipakai(username, kecualiPenggunaId);
        return ada !== null;
    }
    async gantiKredensial(data) {
        try {
            await db.transaksi(async (tx) => {
                await db.ubahPenggunaUntukGantiKredensial(data.username, data.kataSandiHash, false, data.akun.id, tx);
                await db.hapusSesiPengguna(data.akun.id, tx);
                await db.tambahSesiUntukBuatSesi(data.akun.fasyankes_id, data.akun.id, data.sesiBaru.idHash, data.sesiBaru.alamat?.slice(0, 64), data.sesiBaru.kedaluwarsa, tx);
            });
        }
        catch (galat) {
            if (db.bentrokUnik(galat))
                throw new KonflikUsername();
            throw galat;
        }
    }
}
