import * as db from './data-access/index.js';
export const BATAS_PESAN_INSTAGRAM = 10;
export const STATUS_ANTRE_INSTAGRAM = ['antre', 'mengirim'];
/** Semua penulis pesan mengunci percakapan yang sama sebelum membuat/menghapus pesan. */
export async function kunciPercakapanInstagram(tx, id) {
    await db.kunciIgPercakapan(id, tx);
}
/** Dipanggil dalam transaksi yang sudah mengunci percakapan. Antrean belum dihitung sebagai riwayat selesai. */
export async function pangkasPesanInstagram(tx, id) {
    const lama = await db.daftarIgPesanUntukPangkasPesanInstagram(id, STATUS_ANTRE_INSTAGRAM, BATAS_PESAN_INSTAGRAM, tx);
    if (!lama.length)
        return 0;
    await db.hapusIgPesanUntukPangkasPesanInstagram(lama.map((p) => p.id), STATUS_ANTRE_INSTAGRAM, tx);
    const kandidat = [...new Set(lama.flatMap((p) => (p.media_id ? [p.media_id] : [])))];
    if (kandidat.length) {
        const dipakai = await db.daftarIgPesanUntukPangkasPesanInstagram2(kandidat, tx);
        const masihDipakai = new Set(dipakai.map((p) => p.media_id));
        await db.hapusIgMediaUntukPangkasPesanInstagram(kandidat.filter((id) => !masihDipakai.has(id)), tx);
    }
    return lama.length;
}
/** Menyesuaikan riwayat lama saat engine mulai, termasuk ketika halaman tidak dibuka. */
export async function rapikanRiwayatInstagram(fasyankesId) {
    let sesudah = 0;
    let dihapus = 0;
    while (true) {
        const baris = await db.daftarIgPercakapanUntukRapikanRiwayatInstagram(sesudah, (fasyankesId) ? (fasyankesId) : undefined, 100);
        if (!baris.length)
            return dihapus;
        for (const row of baris)
            dihapus += await db.transaksi(async (tx) => {
                await kunciPercakapanInstagram(tx, row.id);
                return pangkasPesanInstagram(tx, row.id);
            });
        sesudah = baris[baris.length - 1].id;
    }
}
