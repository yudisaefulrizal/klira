import * as db from '@klira/db';
export class RepositoriAuditMysql {
    klien;
    constructor(klien = db.pool) {
        this.klien = klien;
    }
    async tambah(c) {
        await db.tambahLogAuditUntukTambah((c)?.fasyankes_id, (c)?.pengguna_id, (c)?.aksi, (c)?.entitas, (c)?.entitas_id, (c)?.keterangan, (c)?.waktu, (c)?.alamat, this.klien);
    }
    async cari(f, lewati, ambil) {
        const [total, baris] = await Promise.all([
            db.hitungLogAuditUntukCari(f.fasyankes_id, f.pengguna_id, f.aksi, f.entitas, f.dari, f.sampai),
            db.daftarLogAuditUntukCari(f.fasyankes_id, f.pengguna_id, f.aksi, f.entitas, f.dari, f.sampai, ambil, lewati),
        ]);
        return { total, baris };
    }
    ambil(id, fasyankesId) {
        return db.cariLogAuditUntukAmbil(id, fasyankesId);
    }
    async namaPengguna(ids) {
        const unik = [...new Set(ids)];
        if (!unik.length)
            return new Map();
        const p = await db.daftarPenggunaUntukNamaPengguna(unik);
        return new Map(p.map((x) => [x.id, x.nama]));
    }
}
