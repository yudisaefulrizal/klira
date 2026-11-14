import { jest } from '@jest/globals';

const { buatLayananKasir } = await import("./layanan-kasir.js");

describe('penyerahan hasil lab (penunjang saja) di kasir', () => {
    const p = { id: 4, fasyankes_id: 1 };
    const catatan = [];
    const buat = (sisa = {}) => {
        const repo = {
            kunjungan: async () => ({ id: 20, pasien_id: 3, pasien_nama: 'Putu', pasien_nomor_rm: '00-00-007', tahap_layanan: 'ditutup', cara_pembayaran: 'umum' }),
            hasilLab: async () => ({ status: 'belum_diserahkan', total: 2, divalidasi: 2, diserahkan_pada: null, penerima_nama: null }),
            tagihan: async () => ({ status_tagihan: 'lengkap', sisa: 0, item: [], dibayar: 60000, total: 60000 }),
            shiftTerbuka: async () => null,
            tarifAktif: async () => [],
            serahHasil: jest.fn(async () => ({ ok: true })),
            ...sisa,
        };
        return { repo, l: buatLayananKasir({ repo, farmasi: { resepKunjungan: async () => [] }, audit: { catat: async (e) => void catatan.push(e) } }) };
    };
    beforeEach(() => { catatan.length = 0; });
    it('mencatat penyerahan bila hasil siap dan tagihan lunas, dengan audit', async () => {
        const { repo, l } = buat();
        const h = await l.serahHasil(p, 20, { penerima_nama: 'Putu', hubungan: 'Pasien' }, '127.0.0.1');
        expect(h).toMatchObject({ ok: true });
        expect(repo.serahHasil).toHaveBeenCalledWith(1, 4, 20, { penerima_nama: 'Putu', hubungan: 'Pasien' });
        expect(catatan).toEqual([expect.objectContaining({ aksi: 'input', entitas: 'penyerahan_hasil', entitas_id: 20 })]);
    });
    it('ditolak untuk kunjungan yang bukan penunjang saja dan kunjungan yang tidak ada', async () => {
        const { l, repo } = buat({ hasilLab: async () => null });
        expect(await l.serahHasil(p, 20, { penerima_nama: 'X' })).toMatchObject({ ok: false, kode: 'konflik' });
        expect(repo.serahHasil).not.toHaveBeenCalled();
        expect(await buat({ kunjungan: async () => null }).l.serahHasil(p, 99, { penerima_nama: 'X' })).toMatchObject({ ok: false, kode: 'tidak_ditemukan' });
    });
    it('hasil ditahan sampai lunas; pasien JKN boleh tanpa pelunasan', async () => {
        const belumLunas = buat({ tagihan: async () => ({ status_tagihan: 'lengkap', sisa: 10000, item: [] }) });
        expect(await belumLunas.l.serahHasil(p, 20, { penerima_nama: 'X' })).toMatchObject({ ok: false, kode: 'konflik' });
        expect(belumLunas.repo.serahHasil).not.toHaveBeenCalled();
        const jkn = buat({ tagihan: async () => ({ status_tagihan: 'lengkap', sisa: 10000, item: [] }), kunjungan: async () => ({ id: 20, tahap_layanan: 'ditutup', cara_pembayaran: 'jkn' }) });
        expect(await jkn.l.serahHasil(p, 20, { penerima_nama: 'X' })).toMatchObject({ ok: true });
    });
    it('hasil belum divalidasi dan penyerahan ganda ditolak dengan pesan berbeda', async () => {
        const belumSiap = buat({ serahHasil: async () => ({ ok: false, sebab: 'belum_siap' }) });
        const sudah = buat({ serahHasil: async () => ({ ok: false, sebab: 'sudah' }) });
        const a = await belumSiap.l.serahHasil(p, 20, { penerima_nama: 'X' }), b = await sudah.l.serahHasil(p, 20, { penerima_nama: 'X' });
        expect(a).toMatchObject({ ok: false, kode: 'konflik' });
        expect(b).toMatchObject({ ok: false, kode: 'konflik' });
        expect(a.pesan).not.toBe(b.pesan);
        expect(catatan).toHaveLength(0);
    });
});
