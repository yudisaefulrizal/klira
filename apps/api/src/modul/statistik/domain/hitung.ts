import { TAHAP_STATISTIK, tanggalWib } from '@klira/shared';
import type { StatistikDto } from '@klira/shared';
export type KunjunganStat = {
    id: number;
    pasien_id: number;
    mulai: Date;
    tahap_layanan: string;
    lokasi_id: number | null;
    antrean: {
        nomor: number;
        status: string;
    } | null;
};
export type RiwayatStat = {
    kunjungan_id: number;
    tahap: string;
    masuk: Date;
    keluar: Date | null;
};
export function persentil(nilai: number[], p: number): number | null {
    if (!nilai.length)
        return null;
    const urut = [...nilai].sort((a, b) => a - b);
    return Math.round(urut[Math.max(0, Math.ceil(p * urut.length) - 1)] * 10) / 10;
}
const menit = (a: Date, b: Date) => Math.max(0, (b.getTime() - a.getTime()) / 60000);
const hariNama = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const bagianWib = (d: Date) => { const w = new Date(d.getTime() + 7 * 3600000); return { hari: (w.getUTCDay() + 6) % 7, jam: w.getUTCHours() }; };
export function hitungStatistik(kunjungan: KunjunganStat[], aktif: KunjunganStat[], riwayat: RiwayatStat[], poli: StatistikDto['poli'], awal: Date, akhir: Date, sekarang: Date): StatistikDto {
    const terpilih = kunjungan.filter(k => k.antrean?.status !== 'batal');
    const berjalan = aktif.filter(k => k.antrean?.status !== 'batal');
    const tren = new Map<string, number>();
    const pembagi = Array(7).fill(0) as number[];
    for (let t = awal.getTime(); t < akhir.getTime(); t += 86400000) {
        const d = new Date(t);
        tren.set(tanggalWib(d), 0);
        pembagi[bagianWib(d).hari]++;
    }
    const jam = Array(24).fill(0) as number[];
    const hari = Array(7).fill(0) as number[];
    const kepadatan = Array.from({ length: 7 }, () => Array(24).fill(0) as number[]);
    for (const k of terpilih) {
        const t = tanggalWib(k.mulai);
        tren.set(t, (tren.get(t) ?? 0) + 1);
        const b = bagianWib(k.mulai);
        jam[b.jam]++;
        hari[b.hari]++;
        kepadatan[b.hari][b.jam]++;
    }
    const batal = new Set([...kunjungan, ...aktif].filter(k => k.antrean?.status === 'batal').map(k => k.id));
    const histori = riwayat.filter(r => !batal.has(r.kunjungan_id));
    const batasJam = new Date(sekarang.getTime() - 3600000);
    const terbuka = new Map(histori.filter(r => !r.keluar).map(r => [r.kunjungan_id, r]));
    const tahap = TAHAP_STATISTIK.map(t => {
        const antre = berjalan.filter(k => k.tahap_layanan === t.kode);
        const diketahui = antre.flatMap(k => { const r = terbuka.get(k.id); return r?.tahap === t.kode ? [menit(r.masuk, sekarang)] : []; });
        const sampel = histori.filter(r => r.tahap === t.kode && r.keluar && r.keluar >= awal && r.keluar < akhir && r.keluar <= sekarang && r.keluar >= r.masuk).map(r => menit(r.masuk, r.keluar!));
        const masuk = histori.filter(r => r.tahap === t.kode && r.masuk >= batasJam && r.masuk <= sekarang).length;
        const selesai = histori.filter(r => r.tahap === t.kode && r.keluar && r.keluar >= batasJam && r.keluar <= sekarang).length;
        const median = persentil(sampel, .5);
        return { kode: t.kode, nama: t.nama, target: t.target, aktif: antre.length, tanpa_waktu: antre.length - diketahui.length, median, p90: persentil(sampel, .9), sampel: sampel.length, terlama: diketahui.length ? Math.round(diketahui.reduce((a, b) => Math.max(a, b), 0)) : null, masuk_jam: masuk, selesai_jam: selesai, perhatian: diketahui.some(n => n > t.target) || (median !== null && median > t.target) || (antre.length > 0 && masuk > selesai) };
    });
    const terlambat = berjalan.flatMap(k => { const r = terbuka.get(k.id); const t = TAHAP_STATISTIK.find(t => t.kode === k.tahap_layanan); if (!r || !t || r.tahap !== t.kode)
        return []; const n = Math.floor(menit(r.masuk, sekarang)); return n > t.target ? [{ id: k.id, nomor: k.antrean ? `A-${String(k.antrean.nomor).padStart(3, '0')}` : `K-${k.id}`, poli: poli.find(p => p.id === k.lokasi_id)?.nama ?? '—', tahap: t.nama, menit: n, target: t.target }] : []; }).sort((a, b) => b.menit - a.menit);
    const jumlahTahap = new Map<string, number>();
    const tindakLanjut = terlambat.filter(r => { const n = jumlahTahap.get(r.tahap) ?? 0; jumlahTahap.set(r.tahap, n + 1); return n < 20; });
    const penumpukan = Array.from({ length: 8 }, (_, i) => { const d = new Date(sekarang.getTime() - (7 - i) * 3600000); return { jam: new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' }).format(d), jumlah: TAHAP_STATISTIK.map(t => histori.filter(r => r.tahap === t.kode && r.masuk <= d && (!r.keluar || r.keluar > d)).length) }; });
    return { diperbarui: sekarang.toISOString(), total: terpilih.length, pasien_unik: new Set(terpilih.map(k => k.pasien_id)).size, poli, tahap, tren: [...tren].map(([tanggal, jumlah]) => ({ tanggal, jumlah })), jam, hari: hari.map((n, i) => ({ nama: hariNama[i], rata: pembagi[i] ? Math.round(n / pembagi[i] * 10) / 10 : 0 })), kepadatan: kepadatan.map((row, i) => row.map(n => pembagi[i] ? n / pembagi[i] : 0)), penumpukan, terlambat: tindakLanjut };
}
