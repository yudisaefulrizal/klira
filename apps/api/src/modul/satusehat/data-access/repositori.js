import * as db from '@klira/db';
export class RepositoriSatusehatMysql {
    pasienUntukSinkron(pasienId) {
        return db.ambilPasienUntukSinkronIhs(pasienId);
    }
    async isiIhs(pasienId, ihs) {
        await db.ubahPasienUntukIsiIhs(ihs, pasienId);
    }
}
