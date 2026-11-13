import { jest } from '@jest/globals';

const { fileURLToPath: kliraFilePath } = await import("node:url");
const { kredensialAwal } = await import("@klira/shared");
const uji = await import("@klira/db/uji");
const { execFileSync } = await import("node:child_process");
const { default: path } = await import("node:path");
const { jalankanSeed } = await import("./seed/seed.js");

const __dirname = kliraFilePath(new URL('.', import.meta.url));

const url = (process.env.KLIRA_UJI_DB === '1' ? process.env.DATABASE_URL : undefined);

const d = url ? describe : describe.skip;

d('skema basis data (database pengujian)', () => {
    beforeAll(() => {
        const akar = path.resolve(__dirname, '..');
        const bin = path.resolve(akar, 'src/migrasi/entry-points/cli.js');
        execFileSync(process.execPath, [bin, 'fresh'], {
            cwd: akar, env: { ...process.env, DATABASE_URL: url, NODE_ENV: 'test' }, stdio: 'pipe',
        });
    }, 120000);
    afterAll(() => uji.tutupPool());
    it('seed idempoten membuat izin dan jenis akun', async () => {
        await jalankanSeed(uji.pool);
        await jalankanSeed(uji.pool);
        const fas = await uji.wajibFasyankesUntukSrcSkemaTest();
        expect(fas.fasyankes_id).toBe(fas.id);
        expect(await uji.hitungJenisAkunUntukSrcSkemaTest(fas.id)).toBe(12);
        // Teks general consent bawaan berversi, tidak ganda setelah seed berulang.
        const teks = await uji.daftarTeksPersetujuanUntukSrcSkemaTest(null, 'general');
        expect(teks).toHaveLength(1);
        expect(teks[0]).toMatchObject({ versi: 1, aktif: true });
    });
    it('seed membuat Pimpinan pertama dengan wajib ganti kredensial, hash bukan teks asli', async () => {
        await jalankanSeed(uji.pool);
        const p = await uji.wajibPenggunaUntukPenggunaPembuatanIntegrasiTest2(kredensialAwal(process.env).username);
        expect(p.wajib_ganti_kredensial).toBe(true);
        expect(p.kata_sandi_hash).not.toContain('klira-awal-2026');
        expect(await uji.hitungPenugasanJenisUntukSrcSkemaTest(p.id)).toBe(1);
    });
    it('username unik per fasyankes dan NIK unik', async () => {
        const fas = await uji.wajibFasyankesUntukSrcSkemaTest();
        await uji.tambahPenggunaUntukBuatPengguna2(fas.id, 'A', '3201010101010001', 'a', 'x');
        await expect(uji.transaksi(async (koneksiBaru) => { const _hasil = await uji.tambahPenggunaUntukBuatPengguna2(fas.id, 'A', '3201010101010002', 'a', 'x', koneksiBaru); return uji.tambahPenggunaUntukBuatPenggunaHasil(_hasil.id, koneksiBaru); })).rejects.toThrow();
        await expect(uji.transaksi(async (koneksiBaru) => { const _hasil = await uji.tambahPenggunaUntukBuatPengguna2(fas.id, 'A', '3201010101010001', 'b', 'x', koneksiBaru); return uji.tambahPenggunaUntukBuatPenggunaHasil(_hasil.id, koneksiBaru); })).rejects.toThrow();
    });
    it('penugasan memakai tanggal selesai, dan klien menyimpan waktu', async () => {
        const p = await uji.wajibPenggunaUntukSrcSkemaTest2();
        const j = await uji.wajibJenisAkunUntukSrcSkemaTest();
        const r = await uji.transaksi(async (koneksiBaru) => { const _hasil = await uji.tambahPenugasanJenisUntukAksesIzinIntegrasiTest(p.fasyankes_id, p.id, j.id, new Date('2026-01-01T00:00:00Z'), koneksiBaru); return uji.tambahPenugasanJenisUntukSrcSkemaTestHasil(_hasil.id, koneksiBaru); });
        expect(r.selesai).toBeNull();
        expect(r.dibuat_pada).toBeInstanceOf(Date);
    });
    it('kredensial satusehat menyimpan secret terenkripsi', async () => {
        const fas = await uji.wajibFasyankesUntukSrcSkemaTest();
        const k = await uji.transaksi(async (koneksiBaru) => { const _hasil = await uji.tambahKredensialSatusehatUntukSrcSkemaTest(fas.id, 'sandbox', 'c', 'v1:a:b:c', koneksiBaru); return uji.tambahKredensialSatusehatUntukSrcSkemaTestHasil(_hasil.id, koneksiBaru); });
        expect(k.client_secret_terenkripsi).toBe('v1:a:b:c');
    });
});