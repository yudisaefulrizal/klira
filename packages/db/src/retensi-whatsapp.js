import * as db from './data-access/index.js';
export const BATAS_PESAN_WHATSAPP = 10;
export const STATUS_ANTRE_WHATSAPP = ['antre', 'mengirim'];
/** Semua penulis pesan mengunci percakapan yang sama sebelum membuat/menghapus pesan. */
export async function kunciPercakapanWhatsapp(tx, id) {
    await db.kunciWaPercakapan(id, tx);
}
/** Dipanggil dalam transaksi yang sudah mengunci percakapan. Antrean belum dihitung sebagai riwayat selesai. */
export async function pangkasPesanWhatsapp(tx, id) {
    const lama = await db.daftarWaPesanUntukPangkasPesanWhatsapp(id, STATUS_ANTRE_WHATSAPP, BATAS_PESAN_WHATSAPP, tx);
    if (!lama.length)
        return 0;
    await db.hapusWaPesanUntukPangkasPesanWhatsapp(lama.map((p) => p.id), STATUS_ANTRE_WHATSAPP, tx);
    const kandidat = [...new Set(lama.flatMap((p) => (p.media_id ? [p.media_id] : [])))];
    if (kandidat.length) {
        const dipakai = await db.daftarWaPesanUntukPangkasPesanWhatsapp2(kandidat, tx);
        const masihDipakai = new Set(dipakai.map((p) => p.media_id));
        await db.hapusWaMediaUntukPangkasPesanWhatsapp(kandidat.filter((id) => !masihDipakai.has(id)), tx);
    }
    return lama.length;
}
/** Menyesuaikan riwayat lama saat engine mulai, termasuk ketika halaman tidak dibuka. */
export async function rapikanRiwayatWhatsapp(fasyankesId) {
    let sesudah = 0;
    let dihapus = 0;
    while (true) {
        const baris = await db.daftarWaPercakapanUntukRapikanRiwayatWhatsapp(sesudah, (fasyankesId) ? (fasyankesId) : undefined, 100);
        if (!baris.length)
            return dihapus;
        for (const row of baris)
            dihapus += await db.transaksi(async (tx) => {
                await kunciPercakapanWhatsapp(tx, row.id);
                return pangkasPesanWhatsapp(tx, row.id);
            });
        sesudah = baris[baris.length - 1].id;
    }
}
