const { KATALOG_ENDPOINT, METODE_UJI, bangunPermintaan, butuhBadan, cariEndpoint, contohBadan, isiKonteks, katalogUntuk } = await import("./katalog-endpoint.js");

describe('isi katalog', () => {
    it('id unik, layanan dan metode sah, kelompok dan label terisi', () => {
        const ids = KATALOG_ENDPOINT.map((x) => x.id);
        expect(new Set(ids).size).toBe(ids.length);
        for (const x of KATALOG_ENDPOINT) {
            expect(['satusehat', 'pcare']).toContain(x.layanan);
            expect(METODE_UJI).toContain(x.metode);
            expect(x.kelompok && x.label).toBeTruthy();
            expect(x.id.startsWith(x.layanan === 'satusehat' ? 'ss-' : 'pc-')).toBe(true);
        }
        expect(katalogUntuk('satusehat').length).toBeGreaterThan(10);
        expect(katalogUntuk('pcare').length).toBeGreaterThan(30);
    });

    it('setiap {penanda} di jalur dan query punya parameter, dan sebaliknya tiap parameter terpakai', () => {
        for (const x of KATALOG_ENDPOINT) {
            const dipakai = new Set([...(x.jalur + JSON.stringify(x.query ?? {})).matchAll(/\{(\w+)\}/g)].map((m) => m[1]));
            const ada = new Set(x.parameter.map((q) => q.nama));
            expect([x.id, [...dipakai].sort()]).toEqual([x.id, [...ada].sort()]);
        }
    });

    it('badan hanya untuk POST/PUT dan wajib ada di sana', () => {
        for (const x of KATALOG_ENDPOINT) {
            if (butuhBadan(x)) expect([x.id, typeof x.badan]).toEqual([x.id, 'object']);
            else expect([x.id, x.badan]).toEqual([x.id, undefined]);
        }
    });

    it('jalur tanpa spasi dan tanpa ".." dan pola parameter berupa regex sah', () => {
        for (const x of KATALOG_ENDPOINT) {
            expect(x.jalur).not.toMatch(/\s|\.\./);
            expect(x.jalur === '' || x.jalur.startsWith('/')).toBe(true);
            for (const q of x.parameter) if (q.pola) expect(() => new RegExp(q.pola)).not.toThrow();
        }
    });

    it('contoh isian parameter lolos validasinya sendiri bila tidak kosong', () => {
        for (const x of KATALOG_ENDPOINT) {
            const nilai = Object.fromEntries(x.parameter.map((q) => [q.nama, q.contoh.replace('{{organization_id}}', 'org-1') || 'x']));
            expect([x.id, bangunPermintaan(x, nilai).ok]).toEqual([x.id, true]);
        }
    });
});

describe('bangunPermintaan', () => {
    const ambil = (id) => KATALOG_ENDPOINT.find((x) => x.id === id);

    it('jalur, encode, dan query', () => {
        expect(bangunPermintaan(ambil('pc-peserta-noka'), { noKartu: '0000039043765' })).toEqual({ ok: true, jalur: '/peserta/0000039043765' });
        expect(bangunPermintaan(ambil('ss-pasien-nik'), { nik: '9999000000000001' }).jalur).toBe('/Patient?identifier=https%3A%2F%2Ffhir.kemkes.go.id%2Fid%2Fnik%7C9999000000000001');
        expect(bangunPermintaan(ambil('ss-kfa-cari'), { halaman: '1', ukuran: '5', kata: 'asam folat & b12' }).jalur).toBe('/products/all?page=1&size=5&keyword=asam%20folat%20%26%20b12');
        expect(bangunPermintaan(ambil('ss-bundle-kirim'), {})).toEqual({ ok: true, jalur: '' });
    });

    it('tidak bisa menyisipkan jalur atau query lewat isian', () => {
        const a = bangunPermintaan(ambil('pc-ref-diagnosa'), { kdDiagnosa: '../../kunjungan/x?a=b#c' });
        expect(a.jalur).toBe('/diagnosa/..%2F..%2Fkunjungan%2Fx%3Fa%3Db%23c');
        expect(a.jalur.split('/')).toHaveLength(3);
        const b = bangunPermintaan(ambil('ss-encounter-cari'), { pasien: 'P1&_count=1000' });
        expect(b.jalur).toBe('/Encounter?subject=P1%26_count%3D1000');
    });

    it('wajib diisi, dipangkas, panjang dibatasi, karakter kendali ditolak', () => {
        expect(bangunPermintaan(ambil('pc-peserta-noka'), {}).galat.noKartu).toMatch(/wajib/);
        expect(bangunPermintaan(ambil('pc-peserta-noka'), { noKartu: '  123  ' }).jalur).toBe('/peserta/123');
        expect(bangunPermintaan(ambil('pc-peserta-noka'), { noKartu: 'x'.repeat(201) }).galat.noKartu).toMatch(/panjang/);
        expect(bangunPermintaan(ambil('pc-peserta-noka'), { noKartu: 'a\nb' }).galat.noKartu).toMatch(/karakter/);
        expect(bangunPermintaan(ambil('pc-peserta-noka'), { noKartu: 123 }).galat.noKartu).toMatch(/wajib/);
    });

    it('pola parameter ditegakkan dengan pesan khusus', () => {
        expect(bangunPermintaan(ambil('ss-pasien-nik'), { nik: '123' }).galat.nik).toBe('NIK harus 16 digit.');
        expect(bangunPermintaan(ambil('pc-daftar-nourut'), { noUrut: '1', tgl: '2026-11-14' }).galat.tgl).toMatch(/dd-MM-yyyy/);
        expect(bangunPermintaan(ambil('pc-peserta-jenis'), { jenisKartu: 'ktp', nomor: '1' }).galat.jenisKartu).toMatch(/nik atau noka/);
    });

    it('paginasi opsional tetapi berpasangan dan berupa angka', () => {
        const x = ambil('pc-ref-dokter');
        expect(bangunPermintaan(x, {})).toEqual({ ok: true, jalur: '/dokter' });
        expect(bangunPermintaan(x, { start: '0', limit: '10' })).toEqual({ ok: true, jalur: '/dokter/0/10' });
        expect(bangunPermintaan(x, { start: '0' }).galat.limit).toMatch(/berpasangan/);
        expect(bangunPermintaan(x, { start: 'a', limit: '1' }).galat.start).toMatch(/angka/);
        expect(bangunPermintaan(ambil('pc-ref-diagnosa'), { kdDiagnosa: 'A01', start: '0', limit: '5' }).jalur).toBe('/diagnosa/A01/0/5');
    });
});

describe('katalog dan contoh badan', () => {
    it('cariEndpoint menurut layanan dan id; id layanan lain tidak ditemukan', () => {
        expect(cariEndpoint('pcare', 'pc-ref-kesadaran').metode).toBe('GET');
        expect(cariEndpoint('satusehat', 'pc-ref-kesadaran')).toBeNull();
        expect(cariEndpoint('pcare', 'tidak-ada')).toBeNull();
    });
    it('isiKonteks mengganti {{kunci}}, kunci tak dikenal menjadi kosong', () => {
        expect(isiKonteks('a {{x}} b {{y}}', { x: '1' })).toBe('a 1 b ');
    });
    it('contohBadan mengisi organization_id dan {id} dari parameter; tanpa badan menjadi kosong', () => {
        const ubah = cariEndpoint('satusehat', 'ss-encounter-ubah');
        const t = contohBadan(ubah, { id: 'ENC-1' }, { organization_id: 'org-9' });
        expect(JSON.parse(t)).toMatchObject({ id: 'ENC-1', serviceProvider: { reference: 'Organization/org-9' } });
        expect(JSON.parse(contohBadan(ubah, {}, {})).id).toBe('{id}');
        expect(contohBadan(cariEndpoint('pcare', 'pc-ref-kesadaran'))).toBe('');
        expect(() => JSON.parse(contohBadan(cariEndpoint('satusehat', 'ss-bundle-kirim'), {}, { organization_id: 'o' }))).not.toThrow();
    });
});
