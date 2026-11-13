import { z } from 'zod';
import { FARMASI } from '../umum/teks.js';
import { idPositif, teksOpsional, teksWajib } from './umum.js';
const kosongJadiTiada = (v) => (v === '' || v === null ? undefined : v);
const tglIso = z.preprocess(kosongJadiTiada, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, FARMASI.galat.tanggal).optional());
/** Bilangan bulat dari teks; isian kosong ditolak (tidak dibaca sebagai 0). */
const bilanganBulat = (maks) => z.preprocess((v) => (v === '' || v === null ? undefined : v), z.coerce.number({ error: FARMASI.galat.angka }).int(FARMASI.galat.angka).min(0, FARMASI.galat.negatif).max(maks));
export const NILAI_JENIS_MUTASI = ['terima', 'keluar', 'koreksi'];
/** Rute pemberian obat yang dipilih apoteker saat telaah (disimpan sebagai teks label; nilai lama di luar daftar tetap diterima). */
export const RUTE_PEMBERIAN = [
    'Oral', 'Sublingual', 'Bukal', 'Topikal', 'Transdermal', 'Mata', 'Telinga', 'Hidung', 'Inhalasi', 'Rektal', 'Vaginal',
    'Intravena (IV)', 'Intramuskular (IM)', 'Subkutan (SC)', 'Intrakutan (IC)',
];
/** Rute bawaan bila data farmasi tidak menyebutkan rute. */
export const RUTE_BAWAAN = 'Oral';
/** Aturan pakai bawaan untuk item resep baru (apoteker menyesuaikan dengan resep dokter). */
export const ATURAN_PAKAI_BAWAAN = '3 x 1';
/** Aturan tebakan rute dari bentuk sediaan KFA; urutan penting (yang lebih spesifik lebih dulu). */
const ATURAN_RUTE = [
    [/mata dan telinga|injeksi|implant|iud|obat kumur/, null], // lebih dari satu kemungkinan rute: biarkan apoteker memilih
    [/sublingual/, 'Sublingual'],
    [/vagina|ovula|pessary/, 'Vaginal'],
    [/supositoria|enema/, 'Rektal'],
    [/mata/, 'Mata'],
    [/telinga/, 'Telinga'],
    [/hidung/, 'Hidung'],
    [/inhal|metered dose/, 'Inhalasi'],
    [/infus/, 'Intravena (IV)'],
    [/patch/, 'Transdermal'],
    [/krim|salep|gel|obat luar|topical|tulle|plester|pasta|sampo|aerosol spray/, 'Topikal'],
    [/tablet|kaplet|kapsul|sirup|suspensi|oral|eliksir|emulsi|granula|effervescent|obat dalam|orodispersible/, 'Oral'],
];
/**
 * Rute bawaan dari bentuk sediaan (mis. Salep -> Topikal); bentuk kosong atau tidak dikenali -> Oral.
 * null bila bentuknya jelas bukan oral tetapi rutenya tidak pasti (mis. injeksi: IV/IM/SC), agar apoteker memilih sendiri.
 */
export function ruteDariBentuk(bentuk) {
    const b = (bentuk ?? '').toLowerCase();
    if (!b.trim())
        return RUTE_BAWAAN;
    for (const [pola, rute] of ATURAN_RUTE)
        if (pola.test(b))
            return rute;
    return RUTE_BAWAAN;
}
/** Ambang stok menipis (satuan) dan kedaluwarsa dekat (hari) untuk penanda di tabel. */
export const AMBANG_STOK_MENIPIS = 50;
export const AMBANG_HARI_KEDALUWARSA = 90;
/** Pencarian katalog KFA (baca-saja): minimal dua huruf, dibatasi hasilnya. */
export const filterKfa = z.object({
    cari: z.string().trim().min(2, FARMASI.galat.cariPendek).max(100),
    batas: z.coerce.number().int().min(1).max(50).default(20),
});
export const filterMasterObat = z.object({
    cari: z.string().trim().optional(),
    aktif: z.preprocess((v) => (v === 'true' ? true : v === 'false' ? false : undefined), z.boolean().optional()),
    halaman: z.coerce.number().int().min(1).default(1),
    ukuran: z.coerce.number().int().min(1).max(100).default(20),
});
/** Master obat klinik: satu kode KFA per baris (tanpa obat ketik bebas), satuan dan harga milik klinik. */
export const masterObatMasukan = z.object({
    kfa_kode: teksWajib(30),
    nama_tampil: teksWajib(200),
    satuan: teksWajib(50),
    /** Rute pemberian bawaan obat ini; dipakai otomatis saat apoteker menelaah resep. */
    rute: teksOpsional(50),
    harga: bilanganBulat(100_000_000),
    aktif: z.boolean().default(true),
});
/** Tanpa nilai bawaan: mengubah harga saja tidak boleh mengaktifkan kembali obat yang dinonaktifkan. */
export const ubahMasterObatMasukan = z
    .object({ nama_tampil: teksWajib(200), satuan: teksWajib(50), rute: teksOpsional(50), harga: bilanganBulat(100_000_000), aktif: z.boolean() })
    .partial()
    .refine((d) => Object.keys(d).length > 0, FARMASI.galat.tanpaPerubahan);
/**
 * Mutasi stok (3.3 MODAL-1: terima, keluar, koreksi): terima menambah (batch baru bertanggal kedaluwarsa), keluar mengurangi (alasan wajib),
 * koreksi mengubah jumlah ke nilai sebenarnya (alasan wajib). Jumlah mutasi disimpan bertanda.
 */
export const mutasiStokMasukan = z
    .object({
    master_obat_id: idPositif,
    jenis: z.enum(NILAI_JENIS_MUTASI),
    batch: teksWajib(60),
    kedaluwarsa: tglIso,
    jumlah: bilanganBulat(1_000_000),
    alasan: teksOpsional(300),
})
    .superRefine((d, ctx) => {
    if (d.jenis === 'terima' && d.jumlah < 1)
        ctx.addIssue({ code: 'custom', path: ['jumlah'], message: FARMASI.galat.jumlahMinimal });
    if (d.jenis === 'keluar' && d.jumlah < 1)
        ctx.addIssue({ code: 'custom', path: ['jumlah'], message: FARMASI.galat.jumlahMinimal });
    if (d.jenis === 'terima' && !d.kedaluwarsa)
        ctx.addIssue({ code: 'custom', path: ['kedaluwarsa'], message: FARMASI.galat.kedaluwarsaWajib });
    if (d.jenis !== 'terima' && !(d.alasan && d.alasan.trim()))
        ctx.addIssue({ code: 'custom', path: ['alasan'], message: FARMASI.galat.alasanWajib });
});
/** Item resep diisi apoteker dari master obat klinik; jumlah = unit terpakai dari stok (racikan: total unit, dibulatkan ke atas). Obat yang sama boleh lebih dari sekali. */
export const itemResepMasukan = z.object({
    master_obat_id: idPositif,
    aturan_pakai: teksWajib(200),
    bentuk: teksOpsional(50),
    rute: teksOpsional(50),
    jumlah: z.preprocess((v) => (v === '' || v === null ? undefined : v), z.coerce.number({ error: FARMASI.galat.angka }).int(FARMASI.galat.angka).min(1, FARMASI.galat.jumlahMinimal).max(10_000)),
});
/** Daftar item resep yang disiapkan apoteker (boleh kosong saat telaah dicatat). */
export const daftarItemResepMasukan = z.array(itemResepMasukan).max(50);
/** Resep ditulis dokter sebagai teks bebas (termasuk merek dan racikan); item obat diisi apoteker saat telaah (P3). */
export const resepMasukan = z.object({ teks: teksWajib(2000) });
export const filterRiwayatObat = z.object({
    status: z.preprocess(kosongJadiTiada, z.enum(['diajukan', 'ditelaah', 'siap', 'diserahkan']).optional()),
    dari: tglIso,
    sampai: tglIso,
    halaman: z.coerce.number().int().min(1).default(1),
    ukuran: z.coerce.number().int().min(1).max(100).default(20),
});
/**
 * Telaah resep (administratif, farmasetik, klinis) bersama item obat yang disiapkan apoteker; disimpan dalam satu transaksi.
 * Item boleh kosong saat telaah dicatat; bila `item` tidak dikirim, item resep yang ada tidak diubah. Resep hanya dapat ditandai siap bila ketiga telaah terpenuhi dan ada minimal satu item.
 */
export const telaahMasukan = z
    .object({ administratif: z.boolean(), farmasetik: z.boolean(), klinis: z.boolean(), catatan: teksOpsional(1000), item: daftarItemResepMasukan.optional() })
    .superRefine((d, ctx) => {
    if (!(d.administratif && d.farmasetik && d.klinis) && !(d.catatan && d.catatan.trim()))
        ctx.addIssue({ code: 'custom', path: ['catatan'], message: FARMASI.galat.catatanTelaahWajib });
});
/** Status stok sebuah obat dari jumlah total dan kedaluwarsa terdekat (tanggal ISO) pada tanggal acuan. */
export function statusStokDari(total, kedaluwarsaTerdekat, sekarang = new Date()) {
    if (total <= 0)
        return 'habis';
    if (kedaluwarsaTerdekat) {
        const hari = (new Date(`${kedaluwarsaTerdekat}T00:00:00.000Z`).getTime() - sekarang.getTime()) / 86_400_000;
        if (hari <= AMBANG_HARI_KEDALUWARSA)
            return 'kedaluwarsa_dekat';
    }
    return total <= AMBANG_STOK_MENIPIS ? 'menipis' : 'aman';
}
