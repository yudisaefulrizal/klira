/** Bentuk bukti pembayaran dari gambaran kasir satu kunjungan (fungsi murni, tanpa DOM). */
export function susunBuktiBayar(g) {
    const t = g.tagihan, bayar = [...t.pembayaran].sort((a, b) => a.waktu.localeCompare(b.waktu));
    const terakhir = bayar.at(-1) ?? null;
    return {
        klinik: g.kunjungan.fasyankes_nama ?? '',
        pasien: g.kunjungan.pasien_nama,
        nomorRm: g.kunjungan.pasien_nomor_rm,
        kunjunganId: g.kunjungan.id,
        waktu: terakhir?.waktu ?? null,
        kasir: terakhir?.kasir_nama ?? null,
        item: t.item.map((i) => ({ nama: i.nama, jumlah: i.jumlah, harga: i.harga, subtotal: i.jumlah * i.harga })),
        pembayaran: bayar.map((p) => ({ metode: p.metode, jumlah: p.jumlah })),
        total: t.total, dibayar: t.dibayar, sisa: t.sisa, lunas: t.sisa === 0,
    };
}
/** Bukti hanya bermakna bila sudah ada pembayaran tercatat. */
export const bisaCetakBayar = (g) => !!g && g.tagihan.pembayaran.length > 0;
