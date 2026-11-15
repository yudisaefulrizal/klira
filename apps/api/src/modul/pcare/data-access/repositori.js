import * as db from '@klira/db';
export class RepositoriPcareMysql {
    daftar(fasyankesId) {
        return db.daftarKredensialPcare(fasyankesId);
    }
    ambil(fasyankesId, environment) {
        return db.ambilKredensialPcare(fasyankesId, environment);
    }
    ambilAktif(fasyankesId) {
        return db.ambilKredensialPcareAktif(fasyankesId);
    }
    async tambah(fasyankesId, d, oleh) {
        await db.tambahKredensialPcare(fasyankesId, d, oleh);
    }
    async ubah(id, d) {
        await db.ubahKredensialPcare(id, d);
    }
    async aktifkan(fasyankesId, id) {
        await db.aturKredensialPcareAktif(fasyankesId, id);
    }
    async catatUji(id, hasil, waktu) {
        await db.catatUjiKredensialPcare(id, hasil, waktu);
    }
}
