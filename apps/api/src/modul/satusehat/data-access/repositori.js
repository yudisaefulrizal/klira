import * as db from '@klira/db';
export class RepositoriSatusehatMysql {
    async organizationId() {
        return (await db.ambilFasyankesUntukAmbil())?.organization_id ?? null;
    }
    daftar() {
        return db.daftarKredensialSatusehat();
    }
    ambil(environment) {
        return db.ambilKredensialSatusehat(environment);
    }
    ambilAktif() {
        return db.ambilKredensialSatusehatAktif();
    }
    async tambah(d, oleh) {
        await db.tambahKredensialSatusehat(d.environment, d.client_id, d.client_secret_terenkripsi, d.base_url, oleh);
    }
    async ubah(id, d) {
        await db.ubahKredensialSatusehat(id, d.client_id, d.client_secret_terenkripsi, d.base_url);
    }
    async aktifkan(id) {
        await db.aturKredensialSatusehatAktif(id);
    }
    async catatUji(id, hasil, waktu) {
        await db.catatUjiKredensialSatusehat(id, hasil, waktu);
    }
    pasienUntukSinkron(pasienId) {
        return db.ambilPasienUntukSinkronIhs(pasienId);
    }
    async isiIhs(pasienId, ihs) {
        await db.ubahPasienUntukIsiIhs(ihs, pasienId);
    }
}
