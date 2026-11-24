import { pengaturanKeamananEfektif } from '@klira/shared';
const keDto = (b) => ({
    ...pengaturanKeamananEfektif(b),
    bawaan: b === null,
    diubah_pada: b ? b.diubah_pada.toISOString() : null,
});
/** Nilai yang dibaca auth (sesi, pembatas, kata sandi); bawaan aman bila belum ada pengaturan. */
export async function bacaPengaturanKeamanan(repo) {
    return pengaturanKeamananEfektif(await repo.ambilPengaturan());
}
export function buatLayananKeamanan({ repo, audit }) {
    return {
        async ambil(p) {
            return keDto();
        },
        async simpan(p, nilai, alamat) {
            const baris = await repo.simpanPengaturan(nilai, p.id);
            await audit.catat({
                pengguna_id: p.id, aksi: 'perbaikan', entitas: 'pengaturan_keamanan', entitas_id: null,
                keterangan: `Kebijakan akses: sesi ${nilai.masa_sesi_jam} jam, batas percobaan ${nilai.batas_percobaan_masuk}, kata sandi minimal ${nilai.panjang_minimum_kata_sandi}`,
                alamat,
            });
            return keDto(baris);
        },
        async daftarBackup(p, halaman, ukuran) {
            const { total, baris } = await repo.daftarBackup((halaman - 1) * ukuran, ukuran);
            return {
                data: baris.map((b) => ({ id: b.id, waktu: b.waktu.toISOString(), status: b.status, ukuran_byte: b.ukuran_byte, lokasi: b.lokasi })),
                halaman, ukuran, total,
            };
        },
    };
}
