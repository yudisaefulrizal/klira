// Menghapus data kunjungan (antrean, catatan klinis, resep, tagihan, order lab, dst.) dari database dev TANPA menyentuh akun, master, pasien, stok, dan log audit.
// Pemakaian: node skrip/dengan-env.mjs node skrip/hapus-data-kunjungan.mjs --ya      (tanpa --ya hanya menampilkan rencana)
// Setelah itu data demo dapat diisi ulang dengan: node skrip/data-demo.mjs
import { pool, tutupPool } from '../packages/db/src/koneksi.js';

if (process.env.NODE_ENV === 'production') throw new Error('Skrip ini menolak berjalan di lingkungan produksi.');
const ya = process.argv.includes('--ya');

/** Tabel data kunjungan: yang bertautan langsung (kunjungan_id) dan anak-anaknya. Urutan tidak penting (pemeriksaan kunci asing dimatikan sementara). */
const TABEL = [
    'event_panggilan', 'antrean', 'antrean_sementara_jkn', 'peserta_kunjungan', 'penempatan', 'riwayat_tahap_layanan',
    'pemeriksaan', 'observasi', 'diagnosis', 'tindakan', 'tindak_lanjut', 'narasi_klinis', 'addendum', 'versi_catatan', 'pengesahan_catatan', 'draf',
    'odontogram_pasien', 'kia_kunjungan', 'ugd_kunjungan',
    'resep', 'item_resep', 'telaah_resep', 'pengeluaran_obat',
    'tagihan', 'item_tagihan', 'pembayaran', 'piutang_kunjungan', 'klaim', 'riwayat_klaim',
    'order_penunjang', 'hasil_penunjang', 'spesimen', 'penyerahan_hasil',
    'persetujuan', 'surat', 'resume_medis', 'pemulangan', 'permintaan_perbaikan', 'penyampaian_rm',
    'kunjungan',
];

/** Tabel yang hanya sebagian barisnya milik kunjungan (draf lain, mis. pendaftaran pasien, dibiarkan). */
const SYARAT = { draf: 'kunjungan_id IS NOT NULL' };
const koneksi = await pool.getConnection();
try {
    const [nama] = await koneksi.query('SELECT DATABASE() AS db');
    // Pengaman: setiap tabel ber-kunjungan_id harus ada di daftar, supaya tidak ada data kunjungan yatim tertinggal.
    const [tertaut] = await koneksi.query("SELECT DISTINCT table_name AS t FROM information_schema.columns WHERE table_schema = DATABASE() AND column_name = 'kunjungan_id'");
    const tidakTercakup = tertaut.map((x) => x.t).filter((t) => !TABEL.includes(t));
    if (tidakTercakup.length) throw new Error(`Tabel ber-kunjungan_id belum ada di daftar hapus: ${tidakTercakup.join(', ')}`);
    // Pengaman kedua: tabel di luar daftar tidak boleh merujuk (kunci asing) ke tabel yang akan dihapus.
    const [perujuk] = await koneksi.query("SELECT DISTINCT table_name AS t, referenced_table_name AS r FROM information_schema.key_column_usage WHERE table_schema = DATABASE() AND referenced_table_name IS NOT NULL");
    const merujuk = perujuk.filter((x) => TABEL.includes(x.r) && !TABEL.includes(x.t));
    if (merujuk.length) throw new Error(`Tabel di luar daftar merujuk tabel yang akan dihapus: ${merujuk.map((x) => `${x.t} -> ${x.r}`).join(', ')}`);
    const hitung = async (t) => Number((await koneksi.query(`SELECT COUNT(*) AS c FROM \`${t}\`${SYARAT[t] ? ` WHERE ${SYARAT[t]}` : ''}`))[0][0].c);
    const sebelum = {};
    for (const t of TABEL) sebelum[t] = await hitung(t);
    console.log(`Database: ${nama[0].db}`);
    console.log(Object.entries(sebelum).filter(([, c]) => c).map(([t, c]) => `  ${t}: ${c}`).join('\n') || '  (tidak ada data kunjungan)');
    if (!ya) { console.log('\nHanya rencana. Jalankan dengan --ya untuk menghapus.'); }
    else {
        await koneksi.query('SET FOREIGN_KEY_CHECKS = 0');
        await koneksi.beginTransaction();
        try {
            for (const t of TABEL) await koneksi.query(`DELETE FROM \`${t}\`${SYARAT[t] ? ` WHERE ${SYARAT[t]}` : ''}`);
            await koneksi.commit();
        }
        catch (e) { await koneksi.rollback(); throw e; }
        finally { await koneksi.query('SET FOREIGN_KEY_CHECKS = 1'); }
        const sisa = [];
        for (const t of TABEL) { const c = await hitung(t); if (c) sisa.push(`${t}: ${c}`); }
        console.log(sisa.length ? `\nMasih tersisa: ${sisa.join(', ')}` : '\nSelesai: data kunjungan terhapus. Akun, master, pasien, stok, dan log audit tidak disentuh.');
    }
}
finally { koneksi.release(); await tutupPool(); }
