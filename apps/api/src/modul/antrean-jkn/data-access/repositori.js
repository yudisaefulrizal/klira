import * as db from '@klira/db';
import { formatNomorRm } from '@klira/shared';
const tglDb = (t) => new Date(`${t}T00:00:00.000Z`);
/** NIK sudah dipakai pasien lain di fasyankes ini. */
export class NikDipakaiError extends Error {
}
export class RepositoriAntreanJknMysql {
    pengaturan(fasyankesId) {
        return db.ambilPengaturanAntreanJkn(fasyankesId);
    }
    fasyankesAktif() {
        return db.daftarFasyankesAntreanJknAktif();
    }
    pemetaan(fasyankesId) {
        return db.daftarPemetaanBpjs(fasyankesId);
    }
    /** Pengaturan dan seluruh pemetaan disimpan dalam satu transaksi (pemetaan lama diganti). */
    async simpan(fasyankesId, d, pemetaan, oleh) {
        await db.transaksi(async (tx) => {
            await db.simpanPengaturanAntreanJkn(fasyankesId, d, oleh, tx);
            await db.hapusPemetaanBpjs(fasyankesId, tx);
            for (const m of pemetaan)
                await db.tambahPemetaanBpjs(fasyankesId, m.jenis, m.kunci, m.kode, m.nama ?? null, tx);
        });
    }
    cariPasien(fasyankesId, nomorKartu, nik) {
        return db.cariPasienUntukAntreanJkn(fasyankesId, nomorKartu, nik);
    }
    async isiNomorKartu(fasyankesId, pasienId, nomorKartu) {
        await db.isiNomorKartuJknPasien(pasienId, fasyankesId, nomorKartu);
    }
    /** Pasien baru dari data peserta BPJS; nomor RM berurutan per fasyankes seperti registrasi di loket. */
    async buatPasien(fasyankesId, d) {
        try {
            await db.tambahUrutanNomorRmUntukDaftarkan(fasyankesId, 0);
        }
        catch (e) {
            if (!db.bentrokUnik(e))
                throw e;
        }
        try {
            return await db.transaksi(async (tx) => {
                await db.ubahUrutanNomorRmUntukDaftarkan(1, fasyankesId, tx);
                const urutan = await db.ubahUrutanNomorRmUntukDaftarkanHasil(fasyankesId, tx);
                const hasil = await db.tambahPasienUntukDaftarkan(fasyankesId, formatNomorRm(urutan.terakhir), d.nik, d.nama, d.nomor_hp, null, null, tglDb(d.tanggal_lahir), d.jenis_kelamin, null, null, null, null, null, null, d.alamat, null, null, null, d.jkn_nomor_kartu, null, null, d.nik ? 'lengkap' : 'sementara', d.nik ? 'nik' : 'tanpa_identitas', false, null, tx);
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
    antreanPasien(fasyankesId, pasienId, jenisPoli, tanggal) {
        return db.cariAntreanPasienUntukJkn(fasyankesId, pasienId, jenisPoli, tglDb(tanggal));
    }
    /** Antrean pada tanggal itu yang sudah berasal dari (atau dikaitkan dengan) pendaftaran PCare. */
    antreanPcare(fasyankesId, tanggal) {
        return db.daftarAntreanPcareUntukTanggal(fasyankesId, tglDb(tanggal));
    }
    async kaitkanPcare(fasyankesId, antreanId, noUrut) {
        await db.isiNomorUrutPcareAntrean(antreanId, fasyankesId, noUrut);
    }
    antreanUntukBpjs(fasyankesId, antreanId) {
        return db.ambilAntreanUntukBpjs(fasyankesId, antreanId);
    }
    antreanIdKunjungan(fasyankesId, kunjunganId) {
        return db.ambilAntreanIdUntukKunjungan(fasyankesId, kunjunganId);
    }
    async catatSinkron(fasyankesId, antreanId, status, pesan) {
        await db.catatSinkronAntreanBpjs(antreanId, fasyankesId, status, pesan);
    }
    sesiAntreanAktif(fasyankesId) {
        return db.ambilSesiAntreanAktif(fasyankesId);
    }
    daftarSementaraJkn(fasyankesId) {
        return db.daftarAntreanSementaraJkn(fasyankesId, 'menunggu');
    }
    cariSementaraJkn(fasyankesId, jenisPoli, noUrut, nomorKartu) {
        return db.cariAntreanSementaraJkn(fasyankesId, jenisPoli, noUrut, nomorKartu);
    }
    tambahSementaraJkn(d) {
        return db.tambahAntreanSementaraJkn({ ...d, tanggal_daftar: tglDb(d.tanggal_daftar) });
    }
    batalkanSementaraJkn(id, fasyankesId, waktu) {
        return db.batalkanAntreanSementaraJkn(id, fasyankesId, waktu);
    }
}
