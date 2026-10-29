export const TAHAP_STATISTIK = [
    { kode: 'menunggu_skrining', nama: 'Skrining', target: 15 },
    { kode: 'pemeriksaan', nama: 'Pemeriksaan', target: 30 },
    { kode: 'resep', nama: 'Farmasi', target: 20 },
    { kode: 'kasir', nama: 'Pembayaran', target: 10 },
] as const;
export type StatistikTahap = {
    kode: string;
    nama: string;
    target: number;
    aktif: number;
    tanpa_waktu: number;
    median: number | null;
    p90: number | null;
    sampel: number;
    terlama: number | null;
    masuk_jam: number;
    selesai_jam: number;
    perhatian: boolean;
};
export type StatistikDto = {
    diperbarui: string;
    total: number;
    pasien_unik: number;
    poli: {
        id: number;
        nama: string;
    }[];
    tahap: StatistikTahap[];
    tren: {
        tanggal: string;
        jumlah: number;
    }[];
    jam: number[];
    hari: {
        nama: string;
        rata: number;
    }[];
    kepadatan: number[][];
    penumpukan: {
        jam: string;
        jumlah: number[];
    }[];
    terlambat: {
        id: number;
        nomor: string;
        poli: string;
        tahap: string;
        menit: number;
        target: number;
    }[];
};
