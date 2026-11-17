import { jest } from '@jest/globals';
import { PassThrough, Readable } from 'node:stream';

const { CadanganLewatWebMati, buatLayananCadangan, pulihkanLewatWebAktif, BATAS_UNGGAH_CADANGAN } = await import('./layanan-cadangan.js');

const p = { id: 7, fasyankes_id: 3, username: 'pimpinan' };

function siapkan({ lewatWeb = true } = {}) {
    const urutan = [];
    const audit = { catat: jest.fn(async (e) => void urutan.push(`audit:${e.aksi}`)) };
    const repo = {
        catatBackup: jest.fn(async (_f, status) => { urutan.push(`riwayat:${status}`); return 11; }),
        selesaiBackup: jest.fn(async (_id, _f, status) => void urutan.push(`riwayat:${status}`)),
    };
    const alat = {
        mulaiUnduhBackup: jest.fn(),
        pulihkanBackup: jest.fn(async () => { urutan.push('pulihkan'); return { ukuranByte: 42 }; }),
        resetSistem: jest.fn(async () => void urutan.push('reset')),
        catatSetelahGantiData: jest.fn(async () => void urutan.push('jejak-akhir')),
    };
    return { urutan, audit, repo, alat, layanan: buatLayananCadangan({ repo, audit, lewatWeb, alat }) };
}
const baca = async (aliran) => { let isi = ''; for await (const potongan of aliran) isi += potongan; return isi; };

describe('saklar pemulihan lewat web', () => {
    it('mati secara bawaan, hidup hanya dengan nilai 1', () => {
        expect(pulihkanLewatWebAktif({})).toBe(false);
        expect(pulihkanLewatWebAktif({ KLIRA_PULIHKAN_LEWAT_WEB: 'true' })).toBe(false);
        expect(pulihkanLewatWebAktif({ KLIRA_PULIHKAN_LEWAT_WEB: '1' })).toBe(true);
    });
});

describe('unduh cadangan', () => {
    it('audit dan riwayat ditulis sebelum data dialirkan; ukuran dan status berhasil dicatat saat selesai', async () => {
        const { urutan, audit, repo, alat, layanan } = siapkan();
        alat.mulaiUnduhBackup.mockImplementation(async () => { urutan.push('dump'); return { aliran: Readable.from(['abc', 'de']), selesai: Promise.resolve(), batal: jest.fn() }; });
        const { aliran, selesai } = await layanan.mulaiUnduh(p, '203.0.113.9');
        expect(urutan.slice(0, 3)).toEqual(['audit:ekspor', 'riwayat:berjalan', 'dump']);
        expect(audit.catat).toHaveBeenCalledWith(expect.objectContaining({ aksi: 'ekspor', entitas: 'cadangan', pengguna_id: 7, fasyankes_id: 3, alamat: '203.0.113.9' }));
        expect(repo.catatBackup).toHaveBeenCalledWith(3, 'berjalan', 'Unduhan lewat web', 7);
        expect(await baca(aliran)).toBe('abcde');
        await selesai;
        expect(repo.selesaiBackup).toHaveBeenCalledWith(11, 3, 'berhasil', 5);
    });
    it('gagal mencatat audit berarti dump tidak pernah dimulai', async () => {
        const { audit, repo, alat, layanan } = siapkan();
        audit.catat.mockRejectedValue(new Error('audit mati'));
        await expect(layanan.mulaiUnduh(p, 'x')).rejects.toThrow('audit mati');
        expect(repo.catatBackup).not.toHaveBeenCalled();
        expect(alat.mulaiUnduhBackup).not.toHaveBeenCalled();
    });
    it('dump yang putus menandai riwayat gagal', async () => {
        const { repo, alat, layanan } = siapkan();
        const sumber = new PassThrough();
        alat.mulaiUnduhBackup.mockResolvedValue({ aliran: sumber, selesai: Promise.reject(new Error('putus')), batal: jest.fn() });
        const { selesai } = await layanan.mulaiUnduh(p, 'x');
        sumber.end('ab');
        await expect(selesai).rejects.toThrow('putus');
        expect(repo.selesaiBackup).toHaveBeenCalledWith(11, 3, 'gagal', expect.any(Number));
    });
    it('penerima yang memutus sebelum tuntas menandai riwayat gagal dan menghentikan dump', async () => {
        const { repo, alat, layanan } = siapkan();
        const sumber = new PassThrough();
        const hentikan = jest.fn();
        alat.mulaiUnduhBackup.mockResolvedValue({ aliran: sumber, selesai: Promise.resolve(), batal: hentikan });
        const { selesai, batal } = await layanan.mulaiUnduh(p, 'x');
        sumber.write('ab');
        batal();
        await expect(selesai).rejects.toThrow();
        expect(hentikan).toHaveBeenCalled();
        expect(repo.selesaiBackup).toHaveBeenCalledWith(11, 3, 'gagal', expect.any(Number));
    });
});

describe('pulihkan dan reset lewat web', () => {
    it('ditolak tanpa menyentuh apa pun selama saklar mati', async () => {
        const { urutan, layanan } = siapkan({ lewatWeb: false });
        await expect(layanan.pulihkan(p, Readable.from(['x']), 'x')).rejects.toBeInstanceOf(CadanganLewatWebMati);
        await expect(layanan.reset(p, 'x')).rejects.toBeInstanceOf(CadanganLewatWebMati);
        expect(urutan).toEqual([]);
    });
    it('pulihkan: audit lebih dulu, isi dibatasi dan dimuat tanpa perintah sistem, lalu jejak ditulis ke data baru', async () => {
        const { urutan, alat, layanan } = siapkan();
        const isi = Readable.from(['x']);
        await layanan.pulihkan(p, isi, '203.0.113.9');
        expect(urutan).toEqual(['audit:perbaikan', 'pulihkan', 'jejak-akhir']);
        expect(alat.pulihkanBackup).toHaveBeenCalledWith(isi, { batasByte: BATAS_UNGGAH_CADANGAN, wajibTanpaPerintahSistem: true });
        expect(alat.catatSetelahGantiData).toHaveBeenCalledWith({ lokasi: 'Pemulihan lewat web', keterangan: 'Sistem dipulihkan dari cadangan unggahan oleh pimpinan', alamat: '203.0.113.9', ukuranByte: 42 });
    });
    it('pulihkan yang gagal dicatat gagal dan galatnya diteruskan', async () => {
        const { repo, alat, layanan } = siapkan();
        alat.pulihkanBackup.mockRejectedValue(new Error('bukan dump'));
        await expect(layanan.pulihkan(p, Readable.from(['x']), 'x')).rejects.toThrow('bukan dump');
        expect(repo.catatBackup).toHaveBeenCalledWith(3, 'gagal', 'Pemulihan lewat web', 7);
        expect(alat.catatSetelahGantiData).not.toHaveBeenCalled();
    });
    it('reset: audit lebih dulu, lalu jejak ditulis ke data baru', async () => {
        const { urutan, alat, layanan } = siapkan();
        await layanan.reset(p, 'x');
        expect(urutan).toEqual(['audit:perbaikan', 'reset', 'jejak-akhir']);
        expect(alat.catatSetelahGantiData).toHaveBeenCalledWith(expect.objectContaining({ lokasi: 'Reset lewat web', keterangan: 'Sistem direset ke keadaan awal oleh pimpinan' }));
    });
    it('jejak akhir yang gagal tidak membatalkan operasi yang sudah selesai', async () => {
        const { alat, layanan } = siapkan();
        const log = jest.spyOn(console, 'error').mockImplementation(() => { });
        alat.catatSetelahGantiData.mockRejectedValue(new Error('tabel belum ada'));
        try {
            await expect(layanan.reset(p, 'x')).resolves.toBeUndefined();
        }
        finally {
            log.mockRestore();
        }
    });
});
