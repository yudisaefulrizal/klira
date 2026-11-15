import { GalatIntegrasi } from '@klira/integrasi';
import { konfigurasiPcareMasukan } from '@klira/shared';

const { buatLayananPcare, URL_RESMI_PCARE } = await import("./layanan.js");

const P = { fasyankes_id: 1, id: 9 };

function buat(opsi = {}) {
    const baris = new Map();
    let urut = 0;
    const catatan = [];
    const klienDibuat = [];
    const repo = {
        daftar: async () => [...baris.values()],
        ambil: async (_f, e) => baris.get(e) ?? null,
        ambilAktif: async () => [...baris.values()].find((k) => k.aktif) ?? null,
        tambah: async (f, d) => { urut += 1; baris.set(d.environment, { id: urut, fasyankes_id: f, aktif: false, diuji_pada: null, hasil_uji: null, ...d }); },
        ubah: async (id, d) => {
            const k = [...baris.values()].find((x) => x.id === id);
            for (const [kunci, nilai] of Object.entries(d)) if (nilai !== null || ['base_url'].includes(kunci)) k[kunci] = nilai;
            k.diuji_pada = null; k.hasil_uji = null;
        },
        aktifkan: async (_f, id) => { for (const k of baris.values()) k.aktif = k.id === id; },
        catatUji: async (id, hasil, waktu) => { const k = [...baris.values()].find((x) => x.id === id); k.hasil_uji = hasil; k.diuji_pada = waktu; },
    };
    const l = buatLayananPcare({
        repo,
        audit: { catat: async (e) => void catatan.push(e) },
        buatKlien: (konfig) => { klienDibuat.push(konfig); return { uji: opsi.uji ?? (async () => ({ ok: true })) }; },
        enkripsi: (t) => `enc(${t})`,
        dekripsi: (t) => t.replace(/^enc\((.*)\)$/, '$1'),
        nodeEnv: opsi.nodeEnv ?? 'development',
        izinUrlKustom: false,
        sekarang: () => new Date('2026-11-14T08:00:00Z'),
    });
    return { l, baris, catatan, klienDibuat };
}
const masukan = (ubah = {}) => konfigurasiPcareMasukan.parse({ environment: 'sandbox', cons_id: '2112121', secret_key: 'sk', user_key: 'uk', username: 'user', password: 'pw', app_code: '012', ...ubah });

describe('skema masukan', () => {
    it('service_name kosong memakai pcare-rest; karakter aneh ditolak', () => {
        expect(masukan({ service_name: '' }).service_name).toBe('pcare-rest');
        expect(konfigurasiPcareMasukan.safeParse({ ...masukan(), service_name: '../x' }).success).toBe(false);
    });
    it('rahasia dan alamat kosong dihilangkan', () => {
        const m = masukan({ secret_key: '', user_key: ' ', password: '', base_url: '' });
        expect(m).toMatchObject({ secret_key: undefined, user_key: undefined, password: undefined, base_url: undefined });
    });
    it('cons_id, username, dan app_code wajib', () => {
        for (const k of ['cons_id', 'username', 'app_code'])
            expect(konfigurasiPcareMasukan.safeParse({ ...masukan(), [k]: '' }).success).toBe(false);
    });
});

describe('ambil', () => {
    it('kosong: dua lingkungan dengan alamat resmi dan tanpa rahasia', async () => {
        const h = await buat().l.ambil(P);
        expect(h.aktif).toBeNull();
        expect(h.lingkungan.map((x) => [x.environment, x.base_url_efektif, x.service_name, x.secret_key_terisi])).toEqual([
            ['sandbox', URL_RESMI_PCARE.sandbox, 'pcare-rest', false], ['produksi', URL_RESMI_PCARE.produksi, 'pcare-rest', false],
        ]);
    });
    it('tidak pernah membocorkan rahasia, terenkripsi maupun tidak', async () => {
        const { l } = buat();
        await l.simpan(P, masukan({ secret_key: 'RAHASIA-SK', user_key: 'RAHASIA-UK', password: 'RAHASIA-PW' }), '::1');
        const json = JSON.stringify(await l.ambil(P));
        for (const x of ['RAHASIA-SK', 'RAHASIA-UK', 'RAHASIA-PW', 'enc(', '_terenkripsi']) expect(json).not.toContain(x);
        expect(json).toContain('"secret_key_terisi":true');
    });
});

describe('simpan', () => {
    it('lingkungan baru wajib ketiga rahasia', async () => {
        for (const r of ['secret_key', 'user_key', 'password']) {
            const { l, baris } = buat();
            const h = await l.simpan(P, masukan({ [r]: undefined }), '::1');
            expect(h).toMatchObject({ ok: false, kode: 'tidak_valid', bidang: r });
            expect(baris.size).toBe(0);
        }
    });
    it('menyimpan rahasia terenkripsi dan audit tanpa nilai rahasia', async () => {
        const { l, baris, catatan } = buat();
        const h = await l.simpan(P, masukan(), '::1');
        expect(h).toMatchObject({ ok: true, data: { cons_id: '2112121', secret_key_terisi: true, user_key_terisi: true, password_terisi: true } });
        expect(baris.get('sandbox')).toMatchObject({ secret_key_terenkripsi: 'enc(sk)', user_key_terenkripsi: 'enc(uk)', password_terenkripsi: 'enc(pw)' });
        expect(catatan[0]).toMatchObject({ aksi: 'perbaikan', entitas: 'kredensial_pcare' });
        expect(JSON.stringify(catatan)).not.toMatch(/enc\(|"sk"|"uk"|"pw"/);
    });
    it('rahasia kosong saat mengubah dipertahankan; yang diisi diganti; hasil uji dihapus', async () => {
        const { l, baris } = buat();
        await l.simpan(P, masukan(), '::1');
        await l.uji(P, 'sandbox');
        await l.simpan(P, masukan({ cons_id: '999', secret_key: undefined, user_key: undefined, password: 'pw-baru' }), '::1');
        expect(baris.get('sandbox')).toMatchObject({ cons_id: '999', secret_key_terenkripsi: 'enc(sk)', user_key_terenkripsi: 'enc(uk)', password_terenkripsi: 'enc(pw-baru)', hasil_uji: null });
    });
    it('alamat tidak sah ditolak; alamat lokal boleh di pengembangan tetapi tidak di server produksi', async () => {
        expect(await buat().l.simpan(P, masukan({ base_url: 'ftp://x' }), '::1')).toMatchObject({ ok: false, bidang: 'base_url' });
        expect((await buat().l.simpan(P, masukan({ base_url: 'http://localhost:8075' }), '::1')).ok).toBe(true);
        expect((await buat({ nodeEnv: 'production' }).l.simpan(P, masukan({ base_url: 'http://localhost:8075' }), '::1')).ok).toBe(false);
        expect((await buat({ nodeEnv: 'production' }).l.simpan(P, masukan({ base_url: URL_RESMI_PCARE.sandbox }), '::1')).ok).toBe(true);
    });
    it('produksi wajib https', async () => {
        expect((await buat().l.simpan(P, masukan({ environment: 'produksi', base_url: 'http://x.test' }), '::1')).ok).toBe(false);
    });
});

describe('aktifkan, uji, klienAktif', () => {
    it('hanya satu lingkungan aktif; belum tersimpan ditolak', async () => {
        const { l } = buat();
        expect(await l.aktifkan(P, 'sandbox', '::1')).toMatchObject({ ok: false, kode: 'belum_lengkap' });
        await l.simpan(P, masukan(), '::1');
        await l.simpan(P, masukan({ environment: 'produksi' }), '::1');
        await l.aktifkan(P, 'sandbox', '::1');
        await l.aktifkan(P, 'produksi', '::1');
        const h = await l.ambil(P);
        expect(h.aktif).toBe('produksi');
        expect(h.lingkungan.filter((x) => x.aktif)).toHaveLength(1);
    });
    it('uji berhasil: klien dibuat dengan rahasia terdekripsi, hasil tersimpan', async () => {
        const { l, klienDibuat, baris } = buat();
        await l.simpan(P, masukan({ base_url: 'http://localhost:8075' }), '::1');
        const h = await l.uji(P, 'sandbox');
        expect(klienDibuat[0]).toEqual({ baseUrl: 'http://localhost:8075', serviceName: 'pcare-rest', consId: '2112121', userKey: 'uk', secretKey: 'sk', username: 'user', password: 'pw', appCode: '012' });
        expect(h).toMatchObject({ ok: true, data: { berhasil: true, pesan: 'Terhubung ke PCare.' } });
        expect(baris.get('sandbox').hasil_uji).toBe('Terhubung ke PCare.');
    });
    it('uji gagal: pesan layanan disimpan; galat tak terduga tidak dibocorkan', async () => {
        const a = buat({ uji: async () => { throw new GalatIntegrasi('Unauthorized: user_key salah', { layanan: 'pcare', status: 401 }); } });
        await a.l.simpan(P, masukan(), '::1');
        expect((await a.l.uji(P, 'sandbox')).data.pesan).toBe('Uji koneksi gagal: Unauthorized: user_key salah');
        const b = buat({ uji: async () => { throw new Error('ECONNREFUSED 10.0.0.5 secret=abc'); } });
        await b.l.simpan(P, masukan(), '::1');
        const h = await b.l.uji(P, 'sandbox');
        expect(h.data.pesan).toBe('Uji koneksi gagal: kesalahan tak terduga');
        expect(JSON.stringify(h)).not.toContain('10.0.0.5');
    });
    it('klienAktif: null sebelum ada yang aktif, lalu klien lingkungan aktif', async () => {
        const { l } = buat();
        await l.simpan(P, masukan(), '::1');
        expect(await l.klienAktif(1)).toBeNull();
        await l.aktifkan(P, 'sandbox', '::1');
        expect(await l.klienAktif(1)).toMatchObject({ environment: 'sandbox' });
    });
});
