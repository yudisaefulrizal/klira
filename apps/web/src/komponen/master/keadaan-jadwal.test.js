import { petaDokter, petaPoli, saringDokter, saringPoli } from './keadaan-jadwal.js';
const pagi = { shift_id: 1, shift_nama: 'Pagi', jam_mulai: '07:00', jam_selesai: '14:00' }, siang = { shift_id: 2, shift_nama: 'Siang', jam_mulai: '14:00', jam_selesai: '21:00' };
const data = [
    { id: 1, hari: 2, ...pagi, pengguna_id: 2, pengguna_nama: 'dr. B', lokasi_id: 20, lokasi_nama: 'Poli Gigi' },
    { id: 2, hari: 1, ...siang, pengguna_id: 1, pengguna_nama: 'dr. A', lokasi_id: 10, lokasi_nama: 'Poli Umum' },
    { id: 3, hari: 1, ...pagi, pengguna_id: 1, pengguna_nama: 'dr. A', lokasi_id: 10, lokasi_nama: 'Poli Umum' },
    { id: 4, hari: 1, ...pagi, pengguna_id: 2, pengguna_nama: 'dr. B', lokasi_id: 10, lokasi_nama: 'Poli Umum' },
];
const shift = [{ id: 1 }, { id: 2 }, { id: 3 }];
test('saring dokter dan poli; kosong berarti semua', () => {
    expect(saringDokter(data, '1').map((b) => b.id)).toEqual([2, 3]);
    expect(saringDokter(data, '').length).toBe(4);
    expect(saringPoli(data, '20').map((b) => b.id)).toEqual([1]);
    expect(saringPoli(data, '').length).toBe(4);
});
test('peta poli: semua poli tampil, sel kosong atau berisi beberapa dokter', () => {
    const p = petaPoli(data, [{ id: 10, nama: 'Poli Umum' }, { id: 20, nama: 'Poli Gigi' }, { id: 30, nama: 'Poli KIA' }], shift);
    expect(p[0].sel[1][1].map((b) => b.id)).toEqual([3, 4]);
    expect(p[0].sel[2][1].map((b) => b.id)).toEqual([2]);
    expect(p[0].sel[3][1]).toEqual([]);
    expect(p[1].sel[1][2].map((b) => b.id)).toEqual([1]);
    expect(Object.values(p[2].sel).every((h) => Object.values(h).every((c) => c.length === 0))).toBe(true);
});
test('peta dokter: semua dokter tampil, sel berisi poli tempat bertugas', () => {
    const p = petaDokter(data, [{ id: 1, nama: 'dr. A' }, { id: 2, nama: 'dr. B' }, { id: 3, nama: 'dr. C' }], shift);
    expect(p[0].sel[1][1].map((b) => b.lokasi_nama)).toEqual(['Poli Umum']);
    expect(p[1].sel[1][2].map((b) => b.id)).toEqual([1]);
    expect(p[1].sel[1][1].map((b) => b.id)).toEqual([4]);
    expect(Object.values(p[2].sel).every((h) => Object.values(h).every((c) => c.length === 0))).toBe(true);
});
