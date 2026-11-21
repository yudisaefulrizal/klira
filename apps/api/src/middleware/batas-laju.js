/**
 * Pembatas laju per alamat klien, dalam memori proses (jendela tetap). Staf satu klinik biasanya berbagi satu alamat publik,
 * jadi batas umum sengaja longgar; yang ketat hanya untuk jalur publik dan jalur berat.
 */
export function buatBatasLaju({ jendelaMs, maks, sekarang = Date.now, maksCatatan = 10_000 }) {
    const catatan = new Map();
    let terakhirBersih = 0;
    function bersihkan(t) {
        terakhirBersih = t;
        for (const [k, c] of catatan) if (t - c.mulai >= jendelaMs) catatan.delete(k);
    }
    return (req, res, next) => {
        const t = sekarang();
        if (t - terakhirBersih >= jendelaMs || catatan.size >= maksCatatan) bersihkan(t);
        const kunci = req.ip ?? 'tak-dikenal';
        let c = catatan.get(kunci);
        if (!c || t - c.mulai >= jendelaMs) {
            c = { jumlah: 0, mulai: t };
            catatan.set(kunci, c);
        }
        c.jumlah += 1;
        if (c.jumlah > maks) {
            res.setHeader('Retry-After', String(Math.max(1, Math.ceil((c.mulai + jendelaMs - t) / 1000))));
            res.status(429).json({ galat: { kode: 'terlalu_sering', pesan: 'Terlalu banyak permintaan. Coba lagi sebentar lagi.' } });
            return;
        }
        next();
    };
}
