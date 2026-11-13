import { z } from 'zod';
import { KASIR } from '../umum/teks.js';
import { teksOpsional } from './umum.js';
const bulat = (maks, min = 0) => z.preprocess((v) => (v === '' || v === null ? undefined : v), z.coerce.number({ error: KASIR.galat.angka }).int(KASIR.galat.angka).min(min, min > 0 ? KASIR.galat.jumlahMinimal : KASIR.galat.negatif).max(maks));
export const NILAI_METODE_BAYAR = ['tunai', 'transfer', 'qris'];
export const MAKS_BARIS_BAYAR = 3;
const barisBayar = z.object({ metode: z.enum(NILAI_METODE_BAYAR, { error: KASIR.galat.metode }), jumlah: bulat(1_000_000_000, 1) });
/**
 * Pembayaran satu tagihan dengan 1 sampai 3 metode (metode tidak boleh ganda). Jumlah adalah yang DITERIMA per metode;
 * non-tunai total tidak boleh melebihi sisa (diperiksa server terhadap sisa terkini), kelebihan tunai menjadi kembalian.
 */
export const bayarMasukan = z
    .object({ pembayaran: z.array(barisBayar, { error: KASIR.galat.barisMinimal }).min(1, KASIR.galat.barisMinimal).max(MAKS_BARIS_BAYAR, KASIR.galat.barisMaksimal) })
    .superRefine((d, ctx) => {
    const terlihat = new Set();
    d.pembayaran.forEach((b, i) => {
        if (terlihat.has(b.metode))
            ctx.addIssue({ code: 'custom', path: ['pembayaran', i, 'metode'], message: KASIR.galat.metodeGanda });
        terlihat.add(b.metode);
    });
});
/**
 * Non-tunai diterapkan penuh (totalnya wajib <= sisa); tunai diterapkan sebatas sisa setelah non-tunai, kelebihannya kembalian.
 * Kembalian hanya berasal dari tunai dan tidak dicatat sebagai pembayaran.
 */
export function rincianBayar(baris, sisa) {
    const nonTunai = baris.filter((b) => b.metode !== 'tunai').reduce((s, b) => s + b.jumlah, 0);
    const ruangTunai = Math.max(0, sisa - nonTunai);
    const tunai = baris.filter((b) => b.metode === 'tunai').reduce((s, b) => s + b.jumlah, 0);
    const tunaiDiterapkan = Math.min(tunai, ruangTunai);
    const per_baris = baris.map((b) => ({ ...b, diterapkan: b.metode === 'tunai' ? tunaiDiterapkan : b.jumlah }));
    return { diterima: nonTunai + tunai, non_tunai: nonTunai, diterapkan: nonTunai + tunaiDiterapkan, kembalian: tunai - tunaiDiterapkan, non_tunai_lebih: nonTunai > sisa, per_baris };
}
/** Serah terima obat: stok kurang hanya boleh dilanjutkan dengan persetujuan eksplisit dan alasan (Peringatan stok kurang, 3.2). */
export const serahTerimaMasukan = z
    .object({ izinkan_stok_kurang: z.boolean().default(false), alasan: teksOpsional(300) })
    .superRefine((d, ctx) => {
    if (d.izinkan_stok_kurang && !(d.alasan && d.alasan.trim()))
        ctx.addIssue({ code: 'custom', path: ['alasan'], message: KASIR.galat.alasanWajib });
});
/** Tutup kunjungan: bila belum lunas, alasan wajib (peringatan, tercatat di audit). */
export const tutupKunjunganMasukan = z.object({ alasan: teksOpsional(300) });
/** Melengkapi harga item tagihan yang belum berharga (mis. pemeriksaan tanpa tarif). Harga yang sudah terisi tidak dapat diubah lewat jalur ini. */
export const lengkapiHargaMasukan = z.object({ harga: bulat(100_000_000) });
/** Kasir menambah item tagihan dari master tarif (konsultasi, visite, tindakan, kamar, lab); harga mengikuti tarif dan cara pembayaran. */
export const tambahItemTarifMasukan = z.object({ tarif_id: z.number({ error: KASIR.galat.pilihTarif }).int().positive(KASIR.galat.pilihTarif), jumlah: bulat(1000, 1) });
/** Ubah harga item tagihan per kunjungan (bukan obat) sebelum ada pembayaran; alasan wajib dan tercatat di audit. */
export const ubahHargaMasukan = z.object({
    harga: bulat(100_000_000),
    alasan: z.string({ error: KASIR.galat.alasanWajib }).trim().min(1, KASIR.galat.alasanWajib).max(300),
});
/** Item yang boleh diubah harganya: bukan obat dan sudah berharga (item tanpa harga memakai Lengkapi harga). */
export const bolehUbahHarga = (i) => i.jenis !== 'obat' && i.harga !== null;
export const bukaShiftMasukan = z.object({ kas_awal: bulat(1_000_000_000) });
export const tutupShiftMasukan = z.object({ kas_akhir: bulat(1_000_000_000), alasan_selisih: teksOpsional(300) });
export const filterRekap = z.object({ tanggal: z.preprocess((v) => (v === '' ? undefined : v), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, KASIR.galat.tanggal).optional()) });
