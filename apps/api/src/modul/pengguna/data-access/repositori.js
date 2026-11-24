import * as db from '@klira/db';
export class RepositoriPenggunaMysql {
    async daftar(f, sekarang) {
        const [total, data] = await Promise.all([
            db.hitungPenggunaUntukDaftar(f.cari, (f.cari) && (true), f.status === 'aktif', (f.status !== 'semua') && (true), f.jenis_akun_id, true, sekarang, null, sekarang, (f.jenis_akun_id) && (true)),
            db.daftarPenggunaUntukDaftar(f.cari, (f.cari) && (true), f.status === 'aktif', (f.status !== 'semua') && (true), f.jenis_akun_id, true, sekarang, null, sekarang, (f.jenis_akun_id) && (true), f.ukuran, (f.halaman - 1) * f.ukuran, 'tambah', false, 'terima'),
        ]);
        return {
            total,
            baris: data.map((p) => ({
                id: p.id, nama: p.nama, username: p.username, aktif: p.aktif,
                jenis_akun_aktif: [...new Set(p.penugasan_jenis.map((x) => x.jenis_akun.nama))],
                jumlah_izin_tambahan: p.izin_per_akun.length,
                jumlah_peringatan_terbuka: p.peringatan_izin.length,
            })),
        };
    }
    async ubahAktif(id, aktif) {
        const p = await db.cariPenggunaUntukUbahAktif(id);
        if (!p)
            return null;
        if (p.aktif !== aktif)
            await db.ubahPenggunaUntukUbahAktif(aktif, id);
        return { id: p.id, nama: p.nama, aktif, aktifSebelumnya: p.aktif };
    }
}
