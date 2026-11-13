function buat(peta) {
    const nilai = Object.keys(peta);
    return {
        nilai,
        peta,
        /** Opsi pilihan (nilai + label) untuk komponen Pilihan, berurutan sesuai peta. */
        opsi: nilai.map((n) => ({ nilai: n, label: peta[n].label })),
        info: (status) => peta[status],
        label: (status) => peta[status].label,
        warna: (status) => peta[status].warna,
    };
}
export const STATUS_KUNJUNGAN = buat({
    planned: { label: 'Terencana', warna: 'abu' },
    arrived: { label: 'Tiba', warna: 'biru' },
    'in-progress': { label: 'Sedang dilayani', warna: 'kuning' },
    finished: { label: 'Selesai', warna: 'hijau' },
});
export const TAHAP_LAYANAN = buat({
    menunggu_skrining: { label: 'Menunggu skrining', warna: 'abu' },
    pemeriksaan: { label: 'Pemeriksaan', warna: 'biru' },
    resep: { label: 'Resep', warna: 'ungu' },
    kasir: { label: 'Kasir', warna: 'kuning' },
    ditutup: { label: 'Ditutup', warna: 'hijau' },
});
export const STATUS_TAGIHAN = buat({
    belum_lengkap: { label: 'Belum lengkap', warna: 'kuning' },
    lengkap: { label: 'Lengkap', warna: 'hijau' },
});
export const STATUS_PEMBAYARAN = buat({
    belum: { label: 'Belum dibayar', warna: 'merah' },
    sebagian: { label: 'Dibayar sebagian', warna: 'kuning' },
    lunas: { label: 'Lunas', warna: 'hijau' },
});
export const STATUS_KLAIM = buat({
    menunggu_sep: { label: 'Menunggu SEP atau berkas', warna: 'abu' },
    siap_diajukan: { label: 'Siap diajukan', warna: 'biru' },
    diajukan: { label: 'Diajukan', warna: 'ungu' },
    dikembalikan: { label: 'Dikembalikan', warna: 'kuning' },
    diajukan_ulang: { label: 'Diajukan ulang', warna: 'ungu' },
    ditolak: { label: 'Ditolak', warna: 'merah' },
    dibayar: { label: 'Dibayar', warna: 'hijau' },
    lewat_batas_waktu: { label: 'Lewat batas waktu', warna: 'merah' },
});
export const STATUS_KIRIM_SATUSEHAT = buat({
    menunggu: { label: 'Menunggu kirim', warna: 'abu' },
    dikirim: { label: 'Sedang dikirim', warna: 'biru' },
    terkirim: { label: 'Terkirim', warna: 'hijau' },
    gagal: { label: 'Gagal kirim', warna: 'merah' },
});
export const STATUS_ORDER_PENUNJANG = buat({
    dipesan: { label: 'Dipesan', warna: 'abu' },
    spesimen_diambil: { label: 'Spesimen diambil', warna: 'biru' },
    menunggu_hasil: { label: 'Menunggu hasil', warna: 'kuning' },
    divalidasi: { label: 'Divalidasi', warna: 'hijau' },
});
export const STATUS_RESEP = buat({
    diajukan: { label: 'Diajukan', warna: 'abu' },
    ditelaah: { label: 'Ditelaah', warna: 'biru' },
    siap: { label: 'Siap', warna: 'kuning' },
    diserahkan: { label: 'Diserahkan di kasir', warna: 'hijau' },
});
export const STATUS_STOK = buat({
    aman: { label: 'Aman', warna: 'hijau' },
    menipis: { label: 'Menipis', warna: 'kuning' },
    kedaluwarsa_dekat: { label: 'Kedaluwarsa dekat', warna: 'merah' },
    habis: { label: 'Habis', warna: 'abu' },
});
export const STATUS_PERBAIKAN = buat({
    diajukan: { label: 'Menunggu persetujuan', warna: 'kuning' },
    disetujui: { label: 'Disetujui', warna: 'hijau' },
    ditolak: { label: 'Ditolak', warna: 'merah' },
});
export const METODE_BAYAR = buat({
    tunai: { label: 'Tunai', warna: 'hijau' },
    transfer: { label: 'Transfer', warna: 'biru' },
    qris: { label: 'QRIS', warna: 'ungu' },
});
export const JENIS_MUTASI = buat({
    terima: { label: 'Terima', warna: 'hijau' },
    keluar: { label: 'Keluar', warna: 'kuning' },
    koreksi: { label: 'Koreksi', warna: 'biru' },
});
export const STATUS_ANTREAN = buat({
    menunggu: { label: 'Menunggu', warna: 'abu' },
    dipanggil: { label: 'Dipanggil', warna: 'kuning' },
    dilayani: { label: 'Dilayani', warna: 'biru' },
    selesai: { label: 'Selesai', warna: 'hijau' },
    batal: { label: 'Batal', warna: 'merah' },
});
/** Status layanan gabungan untuk satu kunjungan (antrean + tahap), dipakai kolom status Daftar pasien. */
export const STATUS_LAYANAN = buat({
    menunggu: { label: 'Menunggu', warna: 'abu' },
    dipanggil: { label: 'Dipanggil', warna: 'kuning' },
    skrining: { label: 'Skrining', warna: 'biru' },
    diperiksa: { label: 'Diperiksa', warna: 'biru' },
    menunggu_obat: { label: 'Menunggu obat', warna: 'ungu' },
    pembayaran: { label: 'Pembayaran', warna: 'kuning' },
    selesai: { label: 'Selesai', warna: 'hijau' },
    batal: { label: 'Batal', warna: 'merah' },
});
/** Kunci STATUS_LAYANAN untuk kunjungan berbentuk { tahap_layanan, antrean: { status } | null }. */
export function statusLayananDari(kunjungan) {
    const antrean = kunjungan?.antrean?.status;
    if (antrean === 'batal')
        return 'batal';
    switch (kunjungan?.tahap_layanan) {
        case 'ditutup': return 'selesai';
        case 'kasir': return 'pembayaran';
        case 'resep': return 'menunggu_obat';
        case 'pemeriksaan': return antrean === 'dipanggil' ? 'dipanggil' : antrean === 'menunggu' ? 'menunggu' : 'diperiksa';
        default: return antrean === 'dipanggil' ? 'dipanggil' : antrean === 'dilayani' ? 'skrining' : 'menunggu';
    }
}
export const STATUS_AKUN = buat({
    aktif: { label: 'Aktif', warna: 'hijau' },
    nonaktif: { label: 'Dinonaktifkan', warna: 'abu' },
});
export const STATUS_OPERASIONAL = buat({
    O: { label: 'Operasional', warna: 'hijau' },
    U: { label: 'Tidak operasional', warna: 'abu' },
});
/** Status periode penugasan jenis akun atau izin per akun terhadap hari ini. */
export const STATUS_PERIODE = buat({
    akan_datang: { label: 'Akan datang', warna: 'biru' },
    berjalan: { label: 'Berjalan', warna: 'hijau' },
    berakhir: { label: 'Berakhir', warna: 'abu' },
});
export const STATUS_BACKUP = buat({
    berhasil: { label: 'Berhasil', warna: 'hijau' },
    gagal: { label: 'Gagal', warna: 'merah' },
    berjalan: { label: 'Berjalan', warna: 'biru' },
});
/** Status identitas pasien (4.9): lengkap, atau sementara (pasien tanpa identitas, menunggu dilengkapi). */
export const STATUS_IDENTITAS = buat({
    lengkap: { label: 'Identitas lengkap', warna: 'hijau' },
    sementara: { label: 'Identitas sementara', warna: 'kuning' },
});
/** Jenis kunjungan (4.2): AMB rawat jalan, IMP rawat inap. */
export const JENIS_KUNJUNGAN = buat({
    AMB: { label: 'Rawat jalan', warna: 'biru' },
    IMP: { label: 'Rawat inap', warna: 'ungu' },
});
/** Cara pembayaran kunjungan. */
export const CARA_PEMBAYARAN = buat({
    umum: { label: 'Umum', warna: 'abu' },
    jkn: { label: 'JKN', warna: 'biru' },
    asuransi: { label: 'Asuransi lain', warna: 'ungu' },
});
/** Keadaan pengesahan catatan (4.2): belum disahkan, sah (hash isi cocok), atau berubah setelah disahkan (hash tidak cocok). */
export const STATUS_PENGESAHAN = buat({
    belum_disahkan: { label: 'Belum disahkan', warna: 'abu' },
    sah: { label: 'Disahkan', warna: 'hijau' },
    berubah: { label: 'Berubah setelah disahkan', warna: 'merah' },
});
/** Peran diagnosis (4.2): tepat satu utama per kunjungan, lainnya penyerta. */
export const STATUS_PERAN_DIAGNOSIS = buat({
    utama: { label: 'Utama', warna: 'hijau' },
    penyerta: { label: 'Penyerta', warna: 'abu' },
});
/** Skrining keperawatan (P6): jenis nyeri, hasil risiko gizi (dihitung), skrining visual. */
export const STATUS_JENIS_NYERI = buat({
    tidak: { label: 'Tidak nyeri', warna: 'hijau' },
    akut: { label: 'Nyeri akut', warna: 'kuning' },
    kronis: { label: 'Nyeri kronis', warna: 'kuning' },
});
export const STATUS_RISIKO_GIZI = buat({
    tidak_berisiko: { label: 'Tidak berisiko malnutrisi', warna: 'hijau' },
    berisiko: { label: 'Berisiko malnutrisi', warna: 'merah' },
});
export const STATUS_SKRINING_VISUAL = buat({
    hijau: { label: 'Hijau', warna: 'hijau' },
    kuning: { label: 'Kuning', warna: 'kuning' },
    merah: { label: 'Merah', warna: 'merah' },
});
/** Keadaan satu bagian catatan pada ringkasan akhir pemeriksaan klinis. */
export const STATUS_RINGKASAN_BAGIAN = buat({
    berubah: { label: 'Isi berubah setelah pengesahan', warna: 'kuning' },
    belum_diisi: { label: 'Belum diisi', warna: 'abu' },
    tanpa_perubahan: { label: 'Tanpa perubahan', warna: 'abu' },
    akan_disimpan: { label: 'Akan disimpan', warna: 'biru' },
    sudah_sah: { label: 'Sudah disahkan', warna: 'hijau' },
});
/** Prioritas order penunjang (4.3). */
export const PRIORITAS_ORDER = buat({
    rutin: { label: 'Normal', warna: 'abu' },
    segera: { label: 'Segera (cito)', warna: 'merah' },
});
/** Interpretasi hasil penunjang terhadap rentang rujukan. */
export const INTERPRETASI_HASIL = buat({
    normal: { label: 'Normal', warna: 'hijau' },
    rendah: { label: 'Rendah', warna: 'kuning' },
    tinggi: { label: 'Tinggi', warna: 'kuning' },
    abnormal: { label: 'Abnormal', warna: 'kuning' },
    kritis: { label: 'Kritis', warna: 'merah' },
});
/** Bentuk persetujuan (4.4): tertulis atau lisan. */
export const LABEL_BENTUK_PERSETUJUAN = buat({
    tertulis: { label: 'Tertulis', warna: 'biru' },
    lisan: { label: 'Lisan', warna: 'ungu' },
});
/** Penandatangan persetujuan (4.4): pasien sendiri atau wali. */
export const LABEL_PENANDATANGAN = buat({
    pasien: { label: 'Pasien sendiri', warna: 'abu' },
    wali: { label: 'Wali', warna: 'biru' },
});
export const STATUS_BED = buat({
    kosong: { label: 'Kosong', warna: 'hijau' },
    terisi: { label: 'Terisi', warna: 'biru' },
    tidak_operasional: { label: 'Tidak operasional', warna: 'abu' },
});
export const KELAS_RAWAT = buat({
    satu: { label: 'Kelas 1', warna: 'biru' },
    dua: { label: 'Kelas 2', warna: 'biru' },
    tiga: { label: 'Kelas 3', warna: 'biru' },
    vip: { label: 'VIP', warna: 'ungu' },
    vvip: { label: 'VVIP', warna: 'ungu' },
});
export const INDIKATOR_KELAS = buat({
    kelas_tetap: { label: 'Kelas tetap', warna: 'abu' },
    naik_kelas: { label: 'Naik kelas', warna: 'kuning' },
    turun_kelas: { label: 'Turun kelas', warna: 'kuning' },
    titip_rawat: { label: 'Titip rawat', warna: 'kuning' },
});
export const DISPOSISI_PULANG = buat({
    home: { label: 'Pulang ke rumah', warna: 'hijau' },
    aadvice: { label: 'Pulang atas permintaan sendiri', warna: 'kuning' },
    'other-hcf': { label: 'Dirujuk ke fasilitas lain', warna: 'biru' },
    'exp-lt48h': { label: 'Meninggal kurang dari 48 jam', warna: 'merah' },
    'exp-gt48h': { label: 'Meninggal lebih dari 48 jam', warna: 'merah' },
    oth: { label: 'Lainnya', warna: 'abu' },
});
