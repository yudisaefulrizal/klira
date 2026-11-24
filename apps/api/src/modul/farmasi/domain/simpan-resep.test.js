import { jest } from '@jest/globals';

const { buatLayananFarmasi } = await import('./layanan.js');

const dokter = { id: 7 };
const masukan = { item: [{ master_obat_id: 3, aturan_pakai: ' 3 x 1 ', jumlah: 10 }], catatan: ' Dibuat puyer ' };

function buat(sisa = {}) {
    const repo = {
        kunjungan: async () => ({ id: 5, tahap_layanan: 'pemeriksaan', cara_pembayaran: 'umum' }),
        obatAktifDari: async (_f, ids) => ids.filter((i) => i === 3).map((id) => ({ id, nama_tampil: 'Parasetamol 500 mg', harga: 500, rute: 'Oral' })),
        simpanResep: jest.fn(async () => ({ resepId: 9, diubah: false, tagihan: { total: 5000 } })),
        resep: async () => ({ id: 9, nomor_resep: 'R-20261116-001', item: [] }),
        ...sisa,
    };
    const audit = { catat: jest.fn(async () => {}) };
    return { l: buatLayananFarmasi({ repo, audit }), repo, audit };
}

describe('satu resep per kunjungan: simpan (buat atau ganti)', () => {
    it('membuat resep: item dan catatan dirapikan, rute bawaan dari master obat, audit input', async () => {
        const { l, repo, audit } = buat();
        const h = await l.simpanResep(dokter, 5, masukan, '');
        expect(h).toMatchObject({ ok: true, data: { diubah: false } });
        expect(repo.simpanResep).toHaveBeenCalledWith(expect.objectContaining({ catatan: 'Dibuat puyer', item: [{ master_obat_id: 3, aturan_pakai: '3 x 1', bentuk: null, rute: 'Oral', jumlah: 10 }] }));
        expect(audit.catat).toHaveBeenCalledWith(expect.objectContaining({ aksi: 'input', entitas: 'resep' }));
    });
    it('mengganti resep yang ada: dicatat sebagai perbaikan', async () => {
        const { l, audit } = buat({ simpanResep: jest.fn(async () => ({ resepId: 9, diubah: true, tagihan: {} })) });
        expect(await l.simpanResep(dokter, 5, masukan, '')).toMatchObject({ ok: true, data: { diubah: true } });
        expect(audit.catat).toHaveBeenCalledWith(expect.objectContaining({ aksi: 'perbaikan' }));
    });
    it('masih boleh pada tahap resep (pemeriksaan selesai tetapi belum ditelaah); repositori menolak bila sudah ditelaah', async () => {
        const { l, repo } = buat({ kunjungan: async () => ({ id: 5, tahap_layanan: 'resep', cara_pembayaran: 'umum' }) });
        expect(await l.simpanResep(dokter, 5, masukan, '')).toMatchObject({ ok: true });
        expect(repo.simpanResep).toHaveBeenCalled();
    });
    it('ditolak setelah diteruskan ke kasir', async () => {
        const { l, repo } = buat({ kunjungan: async () => ({ id: 5, tahap_layanan: 'kasir' }) });
        expect(await l.simpanResep(dokter, 5, masukan, '')).toMatchObject({ ok: false, kode: 'konflik' });
        expect(repo.simpanResep).not.toHaveBeenCalled();
    });
    it('ditolak bila kunjungan ditutup, tidak ada, atau obat tidak aktif', async () => {
        expect(await buat({ kunjungan: async () => ({ id: 5, tahap_layanan: 'ditutup' }) }).l.simpanResep(dokter, 5, masukan, '')).toMatchObject({ ok: false, kode: 'konflik' });
        expect(await buat({ kunjungan: async () => null }).l.simpanResep(dokter, 5, masukan, '')).toMatchObject({ ok: false, kode: 'tidak_ditemukan' });
        const { l, repo } = buat();
        expect(await l.simpanResep(dokter, 5, { item: [{ master_obat_id: 99, aturan_pakai: '3 x 1', jumlah: 1 }] }, '')).toMatchObject({ ok: false, kode: 'tidak_valid' });
        expect(repo.simpanResep).not.toHaveBeenCalled();
    });
    it('resep yang sudah ditelaah atau tagihan yang sudah dibayar menolak perubahan', async () => {
        expect(await buat({ simpanResep: async () => 'resep_terkunci' }).l.simpanResep(dokter, 5, masukan, '')).toMatchObject({ ok: false, kode: 'konflik' });
        expect(await buat({ simpanResep: async () => 'tagihan_terkunci' }).l.simpanResep(dokter, 5, masukan, '')).toMatchObject({ ok: false, kode: 'konflik' });
    });
});
