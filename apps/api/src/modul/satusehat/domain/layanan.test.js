import { GalatIntegrasi } from '@klira/integrasi';

const { buatLayananSatusehat, periksaAlamat, URL_RESMI } = await import("./layanan.js");

const P = { fasyankes_id: 1, id: 9 };

/** Repositori memori: satu baris per lingkungan, organization_id dapat dikosongkan. */
function buat(opsi = {}) {
    const baris = new Map();
    let urut = 0;
    const catatan = [];
    const repo = {
        organizationId: async () => (opsi.organizationId === undefined ? 'org-1' : opsi.organizationId),
        daftar: async () => [...baris.values()],
        ambil: async (_f, e) => baris.get(e) ?? null,
        ambilAktif: async () => [...baris.values()].find((k) => k.aktif) ?? null,
        tambah: async (f, d, oleh) => { urut += 1; baris.set(d.environment, { id: urut, fasyankes_id: f, aktif: false, diuji_pada: null, hasil_uji: null, dibuat_oleh: oleh, ...d }); },
        ubah: async (id, d) => {
            const k = [...baris.values()].find((x) => x.id === id);
            Object.assign(k, { client_id: d.client_id, base_url: d.base_url, diuji_pada: null, hasil_uji: null });
            if (d.client_secret_terenkripsi) k.client_secret_terenkripsi = d.client_secret_terenkripsi;
        },
        aktifkan: async (_f, id) => { for (const k of baris.values()) k.aktif = k.id === id; },
        catatUji: async (id, hasil, waktu) => { const k = [...baris.values()].find((x) => x.id === id); k.hasil_uji = hasil; k.diuji_pada = waktu; },
    };
    const klienDibuat = [];
    const buatKlien = (konfig) => {
        klienDibuat.push(konfig);
        return { uji: opsi.uji ?? (async () => ({ ok: true, organisasi: { id: 'org-1', nama: 'Klinik Contoh' } })) };
    };
    const l = buatLayananSatusehat({
        repo,
        audit: { catat: async (e) => void catatan.push(e) },
        buatKlien,
        enkripsi: (t) => `enc(${t})`,
        dekripsi: (t) => t.replace(/^enc\((.*)\)$/, '$1'),
        nodeEnv: opsi.nodeEnv ?? 'development',
        izinUrlKustom: opsi.izinUrlKustom ?? false,
        sekarang: () => new Date('2026-11-14T08:00:00Z'),
    });
    return { l, baris, catatan, klienDibuat };
}

const masukan = (ubah = {}) => ({ environment: 'sandbox', client_id: 'cid', client_secret: 'rahasia', base_url: null, ...ubah });

describe('periksaAlamat', () => {
    it('kosong berarti alamat resmi', () => {
        expect(periksaAlamat('', 'sandbox')).toEqual({ ok: true, alamat: null });
        expect(periksaAlamat(null, 'produksi')).toEqual({ ok: true, alamat: null });
    });
    it('menerima http untuk sandbox di pengembangan dan membuang garis miring akhir', () => {
        expect(periksaAlamat('http://localhost:8076/', 'sandbox')).toEqual({ ok: true, alamat: 'http://localhost:8076' });
    });
    it('produksi wajib https', () => {
        expect(periksaAlamat('http://localhost:8076', 'produksi').ok).toBe(false);
        expect(periksaAlamat('https://api-satusehat.kemkes.go.id', 'produksi').ok).toBe(true);
    });
    it('menolak skema selain http/https dan teks bukan URL', () => {
        expect(periksaAlamat('ftp://x.test', 'sandbox').ok).toBe(false);
        expect(periksaAlamat('javascript:alert(1)', 'sandbox').ok).toBe(false);
        expect(periksaAlamat('bukan url', 'sandbox').ok).toBe(false);
    });
    it('di server produksi alamat kustom ditolak kecuali operator mengizinkan, alamat resmi tetap boleh', () => {
        expect(periksaAlamat('http://localhost:8076', 'sandbox', { nodeEnv: 'production' }).ok).toBe(false);
        expect(periksaAlamat('http://localhost:8076', 'sandbox', { nodeEnv: 'production', izinKustom: true }).ok).toBe(true);
        expect(periksaAlamat(URL_RESMI.sandbox, 'sandbox', { nodeEnv: 'production' }).ok).toBe(true);
    });
});

describe('ambil', () => {
    it('belum ada kredensial: dua lingkungan kosong, tanpa lingkungan aktif', async () => {
        const { l } = buat();
        const h = await l.ambil(P);
        expect(h.aktif).toBeNull();
        expect(h.organization_id).toBe('org-1');
        expect(h.lingkungan.map((x) => [x.environment, x.client_secret_terisi, x.base_url_efektif])).toEqual([
            ['sandbox', false, URL_RESMI.sandbox], ['produksi', false, URL_RESMI.produksi],
        ]);
    });

    it('tidak pernah membocorkan rahasia, terenkripsi maupun tidak', async () => {
        const { l } = buat();
        await l.simpan(P, masukan({ client_secret: 'sangat-rahasia' }), '::1');
        const json = JSON.stringify(await l.ambil(P));
        expect(json).not.toContain('sangat-rahasia');
        expect(json).not.toContain('enc(');
        expect(json).not.toContain('client_secret_terenkripsi');
    });
});

describe('simpan', () => {
    it('lingkungan baru wajib rahasia', async () => {
        const { l, baris } = buat();
        const h = await l.simpan(P, masukan({ client_secret: undefined }), '::1');
        expect(h).toMatchObject({ ok: false, kode: 'tidak_valid', bidang: 'client_secret' });
        expect(baris.size).toBe(0);
    });

    it('menyimpan rahasia terenkripsi, mencatat audit tanpa rahasia', async () => {
        const { l, baris, catatan } = buat();
        const h = await l.simpan(P, masukan(), '::1');
        expect(h).toMatchObject({ ok: true, data: { environment: 'sandbox', client_id: 'cid', client_secret_terisi: true, aktif: false } });
        expect(baris.get('sandbox').client_secret_terenkripsi).toBe('enc(rahasia)');
        expect(catatan).toHaveLength(1);
        expect(catatan[0]).toMatchObject({ aksi: 'perbaikan', entitas: 'kredensial_satusehat', pengguna_id: 9 });
        expect(JSON.stringify(catatan)).not.toContain('rahasia)');
    });

    it('rahasia kosong saat mengubah tetap memakai rahasia lama', async () => {
        const { l, baris } = buat();
        await l.simpan(P, masukan(), '::1');
        const h = await l.simpan(P, masukan({ client_id: 'baru', client_secret: undefined }), '::1');
        expect(h.ok).toBe(true);
        expect(baris.get('sandbox')).toMatchObject({ client_id: 'baru', client_secret_terenkripsi: 'enc(rahasia)' });
    });

    it('mengganti rahasia menghapus hasil uji lama', async () => {
        const { l, baris } = buat();
        await l.simpan(P, masukan(), '::1');
        await l.uji(P, 'sandbox');
        expect(baris.get('sandbox').hasil_uji).not.toBeNull();
        await l.simpan(P, masukan({ client_secret: 'lain' }), '::1');
        expect(baris.get('sandbox')).toMatchObject({ hasil_uji: null, diuji_pada: null, client_secret_terenkripsi: 'enc(lain)' });
    });

    it('alamat tidak sah ditolak sebelum menyentuh data', async () => {
        const { l, baris } = buat();
        const h = await l.simpan(P, masukan({ base_url: 'ftp://x' }), '::1');
        expect(h).toMatchObject({ ok: false, kode: 'tidak_valid', bidang: 'base_url' });
        expect(baris.size).toBe(0);
    });
});

describe('aktifkan', () => {
    it('hanya satu lingkungan aktif', async () => {
        const { l } = buat();
        await l.simpan(P, masukan(), '::1');
        await l.simpan(P, masukan({ environment: 'produksi' }), '::1');
        await l.aktifkan(P, 'sandbox', '::1');
        await l.aktifkan(P, 'produksi', '::1');
        const h = await l.ambil(P);
        expect(h.aktif).toBe('produksi');
        expect(h.lingkungan.filter((x) => x.aktif)).toHaveLength(1);
    });

    it('menolak bila kredensial belum ada atau Organization ID kosong', async () => {
        const a = buat();
        expect(await a.l.aktifkan(P, 'sandbox', '::1')).toMatchObject({ ok: false, kode: 'belum_lengkap' });
        const b = buat({ organizationId: null });
        await b.l.simpan(P, masukan(), '::1');
        expect(await b.l.aktifkan(P, 'sandbox', '::1')).toMatchObject({ ok: false, kode: 'belum_lengkap', pesan: expect.stringMatching(/Organization ID/) });
    });
});

describe('uji', () => {
    it('berhasil: klien dibuat dengan rahasia terdekripsi dan alamat resmi, hasil tersimpan', async () => {
        const { l, klienDibuat, baris } = buat();
        await l.simpan(P, masukan(), '::1');
        const h = await l.uji(P, 'sandbox');
        expect(klienDibuat[0]).toEqual({ baseUrl: URL_RESMI.sandbox, clientId: 'cid', clientSecret: 'rahasia', organizationId: 'org-1' });
        expect(h).toMatchObject({ ok: true, data: { berhasil: true, pesan: 'Terhubung ke Klinik Contoh.' } });
        expect(baris.get('sandbox').hasil_uji).toBe('Terhubung ke Klinik Contoh.');
        expect(baris.get('sandbox').diuji_pada).toEqual(new Date('2026-11-14T08:00:00Z'));
    });

    it('memakai alamat kustom bila diisi', async () => {
        const { l, klienDibuat } = buat();
        await l.simpan(P, masukan({ base_url: 'http://localhost:8076' }), '::1');
        await l.uji(P, 'sandbox');
        expect(klienDibuat[0].baseUrl).toBe('http://localhost:8076');
    });

    it('gagal: pesan layanan disimpan, tetapi galat tak terduga tidak membocorkan rincian', async () => {
        const gagal = buat({ uji: async () => { throw new GalatIntegrasi('Invalid client id or secret', { layanan: 'satusehat', status: 401 }); } });
        await gagal.l.simpan(P, masukan(), '::1');
        const h = await gagal.l.uji(P, 'sandbox');
        expect(h).toMatchObject({ ok: true, data: { berhasil: false, pesan: 'Uji koneksi gagal: Invalid client id or secret' } });

        const aneh = buat({ uji: async () => { throw new Error('ECONNREFUSED 10.0.0.5:443 secret=abc'); } });
        await aneh.l.simpan(P, masukan(), '::1');
        const h2 = await aneh.l.uji(P, 'sandbox');
        expect(h2.data.pesan).toBe('Uji koneksi gagal: kesalahan tak terduga');
        expect(JSON.stringify(h2)).not.toContain('10.0.0.5');
    });

    it('menolak bila kredensial belum ada atau Organization ID kosong', async () => {
        expect(await buat().l.uji(P, 'sandbox')).toMatchObject({ ok: false, kode: 'belum_lengkap' });
        const b = buat({ organizationId: null });
        await b.l.simpan(P, masukan(), '::1');
        expect(await b.l.uji(P, 'sandbox')).toMatchObject({ ok: false, kode: 'belum_lengkap' });
    });
});

describe('klienAktif (untuk modul lain)', () => {
    it('null sebelum ada lingkungan aktif, lalu klien lingkungan aktif', async () => {
        const { l } = buat();
        await l.simpan(P, masukan(), '::1');
        expect(await l.klienAktif(1)).toBeNull();
        await l.aktifkan(P, 'sandbox', '::1');
        const aktif = await l.klienAktif(1);
        expect(aktif).toMatchObject({ environment: 'sandbox', organizationId: 'org-1' });
        expect(typeof aktif.klien.uji).toBe('function');
    });
    it('null bila Organization ID kosong', async () => {
        const { l, baris } = buat({ organizationId: null });
        await l.simpan(P, masukan(), '::1');
        baris.get('sandbox').aktif = true;
        expect(await l.klienAktif(1)).toBeNull();
    });
});
