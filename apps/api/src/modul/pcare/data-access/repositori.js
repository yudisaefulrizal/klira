import * as db from '@klira/db';
export class RepositoriPcareMysql {
    daftar() {
        return db.daftarKredensialPcare();
    }
    ambil(environment) {
        return db.ambilKredensialPcare(environment);
    }
    ambilAktif() {
        return db.ambilKredensialPcareAktif();
    }
    async tambah(d, oleh) {
        await db.tambahKredensialPcare(d, oleh);
    }
    async ubah(id, d) {
        await db.ubahKredensialPcare(id, d);
    }
    async aktifkan(id) {
        await db.aturKredensialPcareAktif(id);
    }
    async catatUji(id, hasil, waktu) {
        await db.catatUjiKredensialPcare(id, hasil, waktu);
    }
}
