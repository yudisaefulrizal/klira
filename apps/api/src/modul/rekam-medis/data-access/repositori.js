import * as db from '@klira/db';
/**
 * Tulis pengesahan di dalam transaksi pemanggil (repositori modul klinis, CPPT, resume, hasil lab nanti memakainya agar isi dan
 * pengesahannya tersimpan atomik). Hanya INSERT: versi catatan dan pengesahan tidak pernah diubah atau dihapus.
 */
export async function tulisPengesahanDalam(tx, d) {
    if (d.versiLama) {
        await db.tambahVersiCatatanUntukTulisPengesahanDalam(d.fasyankesId, d.entitas, d.entitasId, d.versiLama.versi, d.versiLama.isi_lama, d.versiLama.alasan, d.versiLama.disetujui_oleh, d.penggunaId, tx);
    }
    await db.tambahPengesahanCatatanUntukTulisPengesahanDalam(d.fasyankesId, d.entitas, d.entitasId, d.versi, d.penggunaId, d.jenisAkun?.id ?? null, d.jenisAkun?.nama ?? null, d.waktu, d.hash, d.penggunaId, tx);
}
export class RepositoriPengesahanMysql {
    async terakhir(fasyankesId, entitas, entitasId) {
        const p = await db.cariPengesahanCatatanUntukTerakhir(fasyankesId, entitas, entitasId);
        if (!p)
            return null;
        const pengguna = await db.ambilPenggunaUntukTerakhir(p.pengguna_id);
        return {
            versi: p.versi, pengguna_id: p.pengguna_id, pengguna_nama: pengguna?.nama ?? '-', jenis_akun_id: p.jenis_akun_id, jenis_akun_nama: p.jenis_akun_nama, waktu: p.waktu, hash: p.hash,
        };
    }
    async jenisAkunPemberiHak(fasyankesId, penggunaId, fitur, aksi, sekarang) {
        const baris = await db.daftarPenugasanJenisUntukJenisAkunPemberiHak(fasyankesId, penggunaId, sekarang, null, sekarang, true, fitur, aksi);
        return baris.map((b) => b.jenis_akun);
    }
    async riwayatVersi(fasyankesId, entitas, entitasId) {
        const baris = await db.daftarVersiCatatanUntukRiwayatVersi(fasyankesId, entitas, entitasId, 100);
        return baris.map((v) => ({ versi: v.versi, alasan: v.alasan, disetujui_oleh: v.disetujui_oleh, dibuat_oleh: v.dibuat_oleh, dibuat_pada: v.dibuat_pada.toISOString() }));
    }
}
