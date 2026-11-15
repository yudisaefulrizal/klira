import * as db from '@klira/db';
export class RepositoriSatusehatMysql {
    async organizationId(fasyankesId) {
        return (await db.ambilFasyankesUntukAmbil(fasyankesId))?.organization_id ?? null;
    }
    daftar(fasyankesId) {
        return db.daftarKredensialSatusehat(fasyankesId);
    }
    ambil(fasyankesId, environment) {
        return db.ambilKredensialSatusehat(fasyankesId, environment);
    }
    ambilAktif(fasyankesId) {
        return db.ambilKredensialSatusehatAktif(fasyankesId);
    }
    async tambah(fasyankesId, d, oleh) {
        await db.tambahKredensialSatusehat(fasyankesId, d.environment, d.client_id, d.client_secret_terenkripsi, d.base_url, oleh);
    }
    async ubah(id, d) {
        await db.ubahKredensialSatusehat(id, d.client_id, d.client_secret_terenkripsi, d.base_url);
    }
    async aktifkan(fasyankesId, id) {
        await db.aturKredensialSatusehatAktif(fasyankesId, id);
    }
    async catatUji(id, hasil, waktu) {
        await db.catatUjiKredensialSatusehat(id, hasil, waktu);
    }
    pasienUntukSinkron(fasyankesId, pasienId) {
        return db.ambilPasienUntukSinkronIhs(pasienId, fasyankesId);
    }
    async isiIhs(fasyankesId, pasienId, ihs) {
        await db.ubahPasienUntukIsiIhs(ihs, pasienId, fasyankesId);
    }
}
