const HARI_MS = 86_400_000;

/**
 * Hari kamar per penempatan. Satu hari kamar = satu blok 24 jam sejak penempatan pertama (minimal satu blok untuk seluruh rawat inap).
 * Tiap blok ditagihkan ke penempatan yang aktif pada awal blok itu, jadi pindah bed pada hari yang sama tidak menambah hari.
 * Penempatan tanpa blok awal tidak menghasilkan baris. Kembalian: [{ id, hari }] berurutan menurut waktu mulai.
 */
export function hitungHariKamar(penempatan, sekarang) {
    const urut = [...penempatan].sort((a, b) => a.mulai.getTime() - b.mulai.getTime());
    if (!urut.length)
        return [];
    const awal = urut[0].mulai.getTime();
    const akhir = Math.max(sekarang.getTime(), ...urut.map((x) => (x.selesai ?? sekarang).getTime()));
    const blok = Math.max(1, Math.ceil((akhir - awal) / HARI_MS));
    const jumlah = new Map();
    for (let n = 0; n < blok; n++) {
        const mulaiBlok = awal + n * HARI_MS;
        let pemilik = urut[0];
        for (const x of urut)
            if (x.mulai.getTime() <= mulaiBlok)
                pemilik = x;
        jumlah.set(pemilik.id, (jumlah.get(pemilik.id) ?? 0) + 1);
    }
    return urut.filter((x) => jumlah.has(x.id)).map((x) => ({ id: x.id, hari: jumlah.get(x.id) }));
}
