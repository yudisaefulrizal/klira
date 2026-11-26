import { jest } from '@jest/globals';
import { daftarPasienUntukCari } from '@klira/db';
import { tingkatUrutanKunjungan, urutkanKunjungan } from '../data-access/repositori.js';

const buatKunjungan = (id, { tahap = 'pemeriksaan', antrean = 'menunggu', jenis = 'AMB', mulai = '2026-11-24T01:00:00Z' } = {}) => ({
    id,
    jenis,
    tahap_layanan: tahap,
    antrean: antrean === null ? null : { status: antrean },
    mulai: new Date(mulai),
});

describe('urutkanKunjungan (mode antrean / pasien saya)', () => {
    it('mengurutkan tahap layanan sesuai prioritas klinis', () => {
        const acak = [
            buatKunjungan(1, { tahap: 'menunggu_skrining', antrean: 'batal' }),
            buatKunjungan(2, { tahap: 'ditutup', antrean: 'selesai' }),
            buatKunjungan(3, { tahap: 'pemeriksaan', antrean: null, jenis: 'IMP' }),
            buatKunjungan(4, { tahap: 'kasir', antrean: 'selesai' }),
            buatKunjungan(5, { tahap: 'resep', antrean: 'selesai' }),
            buatKunjungan(6, { tahap: 'pemeriksaan', antrean: 'dilewati' }),
            buatKunjungan(7, { tahap: 'menunggu_skrining', antrean: 'menunggu' }),
            buatKunjungan(8, { tahap: 'pemeriksaan', antrean: 'menunggu' }),
            buatKunjungan(9, { tahap: 'pemeriksaan', antrean: 'dipanggil' }),
            buatKunjungan(10, { tahap: 'pemeriksaan', antrean: 'dilayani' }),
        ];

        const hasil = acak.slice().sort(urutkanKunjungan).map((k) => k.id);
        expect(hasil).toEqual([10, 9, 8, 7, 6, 4, 5, 3, 2, 1]);
        expect(tingkatUrutanKunjungan(buatKunjungan(11, { tahap: 'resep', antrean: 'selesai' }))).toBe(5);
    });

    it('mengurutkan antrean aktif secara FIFO (datang lebih awal di atas) dan selesai/batal secara LIFO', () => {
        const aktif = [
            buatKunjungan(20, { tahap: 'pemeriksaan', antrean: 'menunggu', mulai: '2026-11-24T02:00:00Z' }),
            buatKunjungan(10, { tahap: 'pemeriksaan', antrean: 'menunggu', mulai: '2026-11-24T01:00:00Z' }),
            buatKunjungan(15, { tahap: 'pemeriksaan', antrean: 'menunggu', mulai: '2026-11-24T01:00:00Z' }),
        ];
        expect(aktif.slice().sort(urutkanKunjungan).map((k) => k.id)).toEqual([10, 15, 20]);

        const selesai = [
            buatKunjungan(10, { tahap: 'ditutup', antrean: 'selesai', mulai: '2026-11-24T01:00:00Z' }),
            buatKunjungan(20, { tahap: 'ditutup', antrean: 'selesai', mulai: '2026-11-24T02:00:00Z' }),
            buatKunjungan(15, { tahap: 'ditutup', antrean: 'selesai', mulai: '2026-11-24T01:00:00Z' }),
        ];
        expect(selesai.slice().sort(urutkanKunjungan).map((k) => k.id)).toEqual([20, 15, 10]);
    });
});

describe('daftarPasienUntukCari (panel list pasien)', () => {
    it('mengirim SQL urutan multi-tahap dengan jumlah parameter yang cocok', async () => {
        const query = jest.fn().mockResolvedValue([[]]);
        await daftarPasienUntukCari(
            ['menunggu_skrining', 'pemeriksaan', 'resep', 'kasir'],
            'batal',
            false,
            'Siti',
            'Siti',
            true,
            undefined,
            undefined,
            false,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            false,
            false,
            20,
            0,
            1,
            'ATND',
            { query },
        );

        expect(query).toHaveBeenCalledTimes(1);
        const [sql, params] = query.mock.calls[0];
        const placeholders = (sql.match(/\?/g) ?? []).length;
        expect(params).toHaveLength(placeholders);
        expect(sql).toContain('`_prioritas_tahap`');
        expect(sql).toContain('`_cocok_cari`');
        expect(sql).toContain('`_waktu_antrean`');
        expect(sql).toContain('`_kunjungan_terakhir`');
        expect(sql).toContain('ORDER BY `_prioritas_tahap` ASC, `_cocok_cari` ASC, `_waktu_antrean` ASC, `_kunjungan_terakhir` DESC, t0.`dibuat_pada` DESC, t0.`nama` ASC, t0.`id` ASC');
        expect(params.slice(0, 5)).toEqual([false, 'Siti', 'Siti', 'Siti', 'Siti%']);
    });
});
