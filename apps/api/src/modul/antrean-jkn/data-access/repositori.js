import * as db from '@klira/db';
import { formatNomorRm } from '@klira/shared';
import { tglDb } from '../../../umum/nilai.js';
/** NIK sudah dipakai pasien lain di fasyankes ini. */
export class NikDipakaiError extends Error {
}
export class RepositoriAntreanJknMysql {
    pengaturan() {
        return db.ambilPengaturanAntreanJkn();
    }
    pemetaan() {
        return db.daftarPemetaanBpjs();
    }
    /** Pengaturan dan seluruh pemetaan disimpan dalam satu transaksi (pemetaan lama diganti). */
    async simpan(d, pemetaan, oleh) {
        await db.transaksi(async (tx) => {
            await db.simpanPengaturanAntreanJkn(d, oleh, tx);
            await db.hapusPemetaanBpjs(tx);
            for (const m of pemetaan)
                await db.tambahPemetaanBpjs(m.jenis, m.kunci, m.kode, m.nama ?? null, tx);
        });
    }
    cariPasien(nomorKartu, nik) {
        return db.cariPasienUntukAntreanJkn(nomorKartu, nik);
    }
    async isiNomorKartu(pasienId, nomorKartu) {
        await db.isiNomorKartuJknPasien(pasienId, nomorKartu);
    }
    /** Pasien baru dari data peserta BPJS; nomor RM berurutan per fasyankes seperti registrasi di loket. */
    async buatPasien(d) {
        try {
            await db.tambahUrutanNomorRmUntukDaftarkan(0);
        }
        catch (e) {
            if (!db.bentrokUnik(e))
                throw e;
        }
        try {
            return await db.transaksi(async (tx) => {
                await db.ubahUrutanNomorRmUntukDaftarkan(1, tx);
                const urutan = await db.ubahUrutanNomorRmUntukDaftarkanHasil(tx);
                const hasil = await db.tambahPasienUntukDaftarkan(formatNomorRm(urutan.terakhir), d.nik, d.nama, d.nomor_hp, null, null, tglDb(d.tanggal_lahir), d.jenis_kelamin, null, null, null, null, null, null, d.alamat, null, null, null, d.jkn_nomor_kartu, null, null, d.nik ? 'lengkap' : 'sementara', d.nik ? 'nik' : 'tanpa_identitas', false, null, tx);
                const pasien = await db.tambahPasienUntukDaftarkanHasil(hasil.id, tx);
                return { id: pasien.id, nomor_rm: pasien.nomor_rm };
            });
        }
        catch (e) {
            if (db.bentrokUnik(e) && db.pesanGalat(e).includes('nik'))
                throw new NikDipakaiError();
            throw e;
        }
    }
    /** Antrean terbaru seorang pasien pada jenis poli dan tanggal itu. */
    antreanPasien(pasienId, jenisPoli, tanggal) {
        return db.cariAntreanPasienUntukJkn(pasienId, jenisPoli, tglDb(tanggal));
    }
    /** Antrean pada tanggal itu yang sudah berasal dari (atau dikaitkan dengan) pendaftaran PCare. */
    antreanPcare(tanggal) {
        return db.daftarAntreanPcareUntukTanggal(tglDb(tanggal));
    }
    async kaitkanPcare(antreanId, noUrut) {
        await db.isiNomorUrutPcareAntrean(antreanId, noUrut);
    }
    antreanUntukBpjs(antreanId) {
        return db.ambilAntreanUntukBpjs(antreanId);
    }
    antreanIdKunjungan(kunjunganId) {
        return db.ambilAntreanIdUntukKunjungan(kunjunganId);
    }
    async catatSinkron(antreanId, status, pesan) {
        await db.catatSinkronAntreanBpjs(antreanId, status, pesan);
    }
    sesiAntreanAktif() {
        return db.ambilSesiAntreanAktif();
    }
    daftarSementaraJkn() {
        return db.daftarAntreanSementaraJkn('menunggu');
    }
    cariSementaraJkn(jenisPoli, noUrut, nomorKartu) {
        return db.cariAntreanSementaraJkn(jenisPoli, noUrut, nomorKartu);
    }
    tambahSementaraJkn(d) {
        return db.tambahAntreanSementaraJkn({ ...d, tanggal_daftar: tglDb(d.tanggal_daftar) });
    }
    batalkanSementaraJkn(id, waktu) {
        return db.batalkanAntreanSementaraJkn(id, waktu);
    }
}
