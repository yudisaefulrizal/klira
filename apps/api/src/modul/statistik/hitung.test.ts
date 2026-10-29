import { hitungStatistik, persentil } from './hitung';
import type { KunjunganStat, RiwayatStat } from './hitung';
const awal = new Date('2026-10-25T17:00:00Z'), akhir = new Date('2026-10-26T17:00:00Z'), sekarang = new Date('2026-10-26T03:00:00Z');
const k = (id: number, opsi: Partial<KunjunganStat> = {}): KunjunganStat => ({ id, pasien_id: 1, mulai: new Date('2026-10-26T02:00:00Z'), tahap_layanan: 'pemeriksaan', lokasi_id: 1, antrean: { nomor: id, status: 'menunggu' }, ...opsi });
const r = (id: number, masuk: string, keluar: string | null = null): RiwayatStat => ({ kunjungan_id: id, tahap: 'pemeriksaan', masuk: new Date(masuk), keluar: keluar ? new Date(keluar) : null });
const hitung = (ks: KunjunganStat[], aktif: KunjunganStat[], rs: RiwayatStat[]) => hitungStatistik(ks, aktif, rs, [{ id: 1, nama: 'Poli umum' }], awal, akhir, sekarang);
test('persentil nearest rank dan sampel kosong', () => { expect(persentil([], .5)).toBeNull(); expect(persentil([50, 10, 20, 30, 40], .9)).toBe(50); expect(persentil([50, 10, 20, 30, 40], .5)).toBe(30); });
test('durasi selesai tidak mencampur pasien aktif; waktu masuk lama tidak direkayasa', () => {
    const data = hitung([k(1), k(2), k(3)], [k(2), k(3)], [r(1, '2026-10-26T01:00:00Z', '2026-10-26T01:20:00Z'), r(2, '2026-10-26T02:10:00Z')]);
    expect(data.tahap[1]).toMatchObject({ aktif: 2, median: 20, p90: 20, sampel: 1, terlama: 50, tanpa_waktu: 1, perhatian: true });
    expect(data.terlambat).toHaveLength(1);
    expect(data.terlambat[0]).toMatchObject({ menit: 50, nomor: 'A-002' });
});
test('WIB, pasien unik, dan antrean batal', () => {
    const data = hitung([k(1, { mulai: awal }), k(2), k(3, { antrean: { nomor: 3, status: 'batal' } })], [], []);
    expect(data.total).toBe(2);
    expect(data.pasien_unik).toBe(1);
    expect(data.tren).toEqual([{ tanggal: '2026-10-26', jumlah: 2 }]);
    expect(data.jam[0]).toBe(1);
    expect(data.hari[0].rata).toBe(2);
});
test('tahap selesai dihitung menurut waktu keluar meski kunjungan dimulai sebelum periode', () => {
    const data = hitung([], [], [r(9, '2026-10-25T16:50:00Z', '2026-10-25T17:10:00Z')]);
    expect(data.total).toBe(0);
    expect(data.tahap[1]).toMatchObject({ sampel: 1, median: 20 });
});
test('snapshot tidak menghitung tahap yang sudah keluar pada titik tersebut; arus 60 menit', () => {
    const data = hitung([k(1), k(2)], [k(2)], [r(1, '2026-10-26T02:00:00Z', '2026-10-26T03:00:00Z'), r(2, '2026-10-26T02:30:00Z')]);
    expect(data.penumpukan.at(-1)?.jumlah[1]).toBe(1);
    expect(data.tahap[1]).toMatchObject({ masuk_jam: 2, selesai_jam: 1 });
});
test('hari sibuk dinormalisasi jumlah kemunculan hari pada periode', () => {
    const data = hitungStatistik([k(1)], [], [], [], awal, new Date(akhir.getTime() + 7 * 86400000), sekarang);
    expect(data.hari[0].rata).toBe(.5);
    expect(data.kepadatan[0][9]).toBe(.5);
});
