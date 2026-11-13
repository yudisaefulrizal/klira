import { keCsv } from './csv.js';
export const BATAS_EKSPOR = 10_000;
const KOLOM_CSV = ['id', 'waktu_utc', 'pengguna_id', 'pengguna_nama', 'aksi', 'entitas', 'entitas_id', 'alamat', 'keterangan'];
const saringan = (p, f) => ({
    fasyankes_id: p.fasyankes_id,
    pengguna_id: f.pengguna_id,
    aksi: f.aksi,
    entitas: f.entitas,
    dari: f.dari,
    sampai: f.sampai,
});
export function buatLayananAudit({ repo, audit }) {
    async function keDto(baris) {
        const nama = await repo.namaPengguna(baris.flatMap((b) => (b.pengguna_id ? [b.pengguna_id] : [])));
        return baris.map((b) => ({
            id: b.id,
            fasyankes_id: b.fasyankes_id,
            pengguna_id: b.pengguna_id,
            pengguna_nama: b.pengguna_id ? (nama.get(b.pengguna_id) ?? null) : null,
            aksi: b.aksi,
            entitas: b.entitas,
            entitas_id: b.entitas_id,
            keterangan: b.keterangan,
            waktu: b.waktu.toISOString(),
            alamat: b.alamat,
        }));
    }
    const ringkasFilter = (f) => ['pengguna_id', 'aksi', 'entitas', 'dari', 'sampai']
        .filter((k) => f[k] !== undefined)
        .map((k) => {
        const n = f[k];
        return `${k}=${n instanceof Date ? n.toISOString() : String(n)}`;
    })
        .join(' ');
    return {
        async daftar(p, f) {
            const { total, baris } = await repo.cari(saringan(p, f), (f.halaman - 1) * f.ukuran, f.ukuran);
            return { data: await keDto(baris), halaman: f.halaman, ukuran: f.ukuran, total };
        },
        async detail(p, id) {
            const c = await repo.ambil(id, p.fasyankes_id);
            return c ? (await keDto([c]))[0] : null;
        },
        /** Ekspor CSV; tercatat sebagai aksi `ekspor` SEBELUM berkas dilepas (gagal catat = gagal ekspor). */
        async ekspor(p, f, alamat) {
            const { baris } = await repo.cari(saringan(p, f), 0, BATAS_EKSPOR);
            const dto = await keDto(baris);
            await audit.catat({
                fasyankes_id: p.fasyankes_id,
                pengguna_id: p.id,
                aksi: 'ekspor',
                entitas: 'log_audit',
                keterangan: `Ekspor CSV ${dto.length} baris; filter: ${ringkasFilter(f) || 'tanpa'}`,
                alamat,
            });
            const csv = keCsv(KOLOM_CSV, dto.map((d) => [d.id, d.waktu, d.pengguna_id, d.pengguna_nama, d.aksi, d.entitas, d.entitas_id, d.alamat, d.keterangan]));
            return { csv, jumlah: dto.length };
        },
    };
}
