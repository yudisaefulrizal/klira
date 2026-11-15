import { barisDariTindakan, barisTindakanKosong, bentukIsiTindakan, galatTindakan, gabungHasil, hapusBarisTindakan, isiDariPilihan, ubahBarisTindakan } from './keadaan-tindakan.js';

const tersimpan = [{ kode: '93.94', nama: 'Nebulisasi', tarif_layanan_id: 7, jumlah: 2, performer_id: 9, mulai: '2026-11-16T03:00:00.000Z', selesai: null }];
const baris = (p = {}) => ({ ...barisTindakanKosong(), kode: '93.94', nama: 'Nebulisasi', jumlah: '1', mulai: '2026-11-16T03:00:00.000Z', ...p });

describe('editor tindakan: keadaan', () => {
    it('dari catatan tersimpan: baris mengikuti isi; tanpa isi ada satu baris kosong', () => {
        expect(barisDariTindakan(tersimpan)).toEqual([{ kode: '93.94', nama: 'Nebulisasi', tarif_layanan_id: 7, jumlah: '2', performer_id: 9, mulai: '2026-11-16T03:00:00.000Z', selesai: null }]);
        expect(barisDariTindakan([])).toEqual([barisTindakanKosong()]);
        expect(barisDariTindakan(undefined)).toHaveLength(1);
    });
    it('bentuk simpan: baris kosong diabaikan, tindakan baru dimulai sekarang, pelaksana lama dipertahankan', () => {
        const sekarang = '2026-11-16T05:00:00.000Z';
        const h = bentukIsiTindakan([barisTindakanKosong(), ...barisDariTindakan(tersimpan), baris({ kode: '86.59', nama: 'Jahit luka', mulai: '' })], sekarang);
        expect(h.item).toEqual([
            { kode: '93.94', nama: 'Nebulisasi', tarif_layanan_id: 7, jumlah: '2', performer_id: 9, mulai: '2026-11-16T03:00:00.000Z', selesai: null },
            { kode: '86.59', nama: 'Jahit luka', jumlah: '1', mulai: sekarang, selesai: null },
        ]);
    });
    it('galat: jumlah 1 sampai 100 per baris (urutan editor), tindakan ganda pada daftar, daftar kosong sah', () => {
        expect(galatTindakan([baris()])).toEqual({});
        expect(galatTindakan([barisTindakanKosong()])).toEqual({});
        expect(galatTindakan([barisTindakanKosong(), baris({ jumlah: '0' })])['item.1.jumlah']).toBeTruthy();
        expect(galatTindakan([baris({ jumlah: '101' })])['item.0.jumlah']).toBeTruthy();
        expect(galatTindakan([baris({ jumlah: '1.5' })])['item.0.jumlah']).toBeTruthy();
        expect(galatTindakan([baris(), baris()]).item).toBeTruthy();
        // kode sama tetapi tindakan klinik berbeda boleh
        expect(galatTindakan([baris({ tarif_layanan_id: 1 }), baris({ tarif_layanan_id: 2 })])).toEqual({});
    });
    it('ubah dan hapus baris; pilihan pencarian menjadi isian baris', () => {
        const b = [baris(), baris({ kode: '86.59' })];
        expect(ubahBarisTindakan(b, 1, { jumlah: '3' })[1].jumlah).toBe('3');
        expect(hapusBarisTindakan(b, 0).map((x) => x.kode)).toEqual(['86.59']);
        expect(isiDariPilihan({ kode: '93.94', nama: 'Nebulisasi', tarif_layanan_id: 7 })).toEqual({ kode: '93.94', nama: 'Nebulisasi', tarif_layanan_id: 7 });
        expect(isiDariPilihan({ kode: '89.52', nama: 'EKG' })).toEqual({ kode: '89.52', nama: 'EKG', tarif_layanan_id: null });
        expect(isiDariPilihan(null)).toEqual({ kode: '', nama: '', tarif_layanan_id: null });
    });
    it('hasil pencarian: tindakan klinik dulu, kamus tanpa kode yang sudah dicakup klinik, tarif tanpa kode ICD-9 dibuang', () => {
        const klinik = [{ id: 7, nama: 'Nebulisasi', kode_icd9cm: '93.94', harga_umum: 50000, harga_jkn: null }, { id: 8, nama: 'Tanpa kode', kode_icd9cm: null }];
        const kamus = [{ kode: '93.94', nama: 'Respiratory medication administered by nebulizer' }, { kode: '89.52', nama: 'Electrocardiogram' }];
        expect(gabungHasil(klinik, kamus).map((x) => [x.sumber, x.kode, x.tarif_layanan_id ?? null])).toEqual([['klinik', '93.94', 7], ['kamus', '89.52', null]]);
    });
});
