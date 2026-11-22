import { jest } from '@jest/globals';

const { DEFINISI_MASTER, FITUR_IZIN, IZIN_AWAL, JENIS_AKUN_AWAL, MASTER, SKEMA_MASTER, SKEMA_MASTER_UBAH, filterMaster, kodeTindakanBerikut, profilKlinikMasukan, shiftUbah, teksSelMaster } = await import("../index.js");

describe('skema master', () => {
    it('poli: nama layanan wajib (maks 60), status bawaan operasional', () => {
        expect(SKEMA_MASTER.poli.safeParse({ nama: '' }).success).toBe(false);
        expect(SKEMA_MASTER.poli.safeParse({ nama: 'U'.repeat(61) }).success).toBe(false);
        expect(SKEMA_MASTER.poli.parse({ nama: 'Umum' }).status_operasional).toBe('O');
    });
    it('ruang periksa wajib poli; ruang rawat inap tanpa induk; bed wajib ruang', () => {
        expect(SKEMA_MASTER.ruang_periksa.safeParse({ nama: 'Ruang 1' }).success).toBe(false);
        expect(SKEMA_MASTER.ruang_periksa.safeParse({ nama: 'Ruang 1', induk_id: 3 }).success).toBe(true);
        expect(SKEMA_MASTER.ruang.parse({ nama: 'Dahlia', induk_id: 3 })).not.toHaveProperty('induk_id');
        expect(SKEMA_MASTER.bed.safeParse({ nama: 'B' }).success).toBe(false);
    });
    it('praktisi: pengguna wajib saat tambah, tidak saat ubah', () => {
        const profil = { profesi: 'Dokter', nomor_sip: 'S1', masa_berlaku_sip: '2027-01-01' };
        expect(SKEMA_MASTER.praktisi.safeParse(profil).success).toBe(false);
        expect(SKEMA_MASTER_UBAH.praktisi.safeParse(profil).success).toBe(true);
    });
    it('jadwal: hari 1-7, shift wajib, kuota minimal 1', () => {
        const j = { pengguna_id: 1, lokasi_id: 2, hari: 1, shift_id: 3, kuota: 10 };
        expect(SKEMA_MASTER.jadwal.safeParse(j).success).toBe(true);
        expect(SKEMA_MASTER.jadwal.safeParse({ ...j, hari: 8 }).success).toBe(false);
        expect(SKEMA_MASTER.jadwal.safeParse({ ...j, shift_id: undefined }).success).toBe(false);
        expect(SKEMA_MASTER.jadwal.safeParse({ ...j, kuota: 0 }).success).toBe(false);
        expect(SKEMA_MASTER.jadwal.safeParse({ ...j, kuota: null }).success).toBe(true);
        expect(SKEMA_MASTER.jadwal.safeParse({ pengguna_id: 1, lokasi_id: 2, hari: 1, shift_id: 3 }).success).toBe(true);
    });
    it('tarif: jenis dan harga', () => {
        const t = { kode: 'K', nama: 'N', jenis: 'kamar', harga_umum: 100 };
        expect(SKEMA_MASTER.tarif.parse(t)).toMatchObject({ harga_jkn: null, kode_icd9cm: null });
        expect(SKEMA_MASTER.tarif.safeParse({ ...t, jenis: 'obat' }).success).toBe(true);
        expect(SKEMA_MASTER.tarif.safeParse({ ...t, jenis: 'lainnya' }).success).toBe(false);
        expect(SKEMA_MASTER.tarif.safeParse({ ...t, harga_umum: 1.5 }).success).toBe(false);
        // Jenis selain tindakan: kode dan harga umum wajib, kode ICD-9-CM diabaikan.
        expect(SKEMA_MASTER.tarif.safeParse({ ...t, harga_umum: undefined }).error?.issues[0]).toMatchObject({ path: ['harga_umum'], message: MASTER.galat.hargaWajib });
        expect(SKEMA_MASTER.tarif.safeParse({ ...t, kode: '' }).error?.issues[0]).toMatchObject({ path: ['kode'] });
        expect(SKEMA_MASTER.tarif.parse({ ...t, kode_icd9cm: '86.59' }).kode_icd9cm).toBeNull();
    });
    it('tarif tindakan: ICD-9-CM wajib dan berpola, harga dan kode boleh kosong', () => {
        const t = { nama: 'Jahit luka', jenis: 'tindakan' };
        expect(SKEMA_MASTER.tarif.safeParse(t).error?.issues[0]).toMatchObject({ path: ['kode_icd9cm'], message: MASTER.galat.icd9Wajib });
        expect(SKEMA_MASTER.tarif.safeParse({ ...t, kode_icd9cm: 'abc' }).success).toBe(false);
        expect(SKEMA_MASTER.tarif.parse({ ...t, kode_icd9cm: ' 86.59 ', kode: '' })).toEqual({ kode: null, nama: 'Jahit luka', jenis: 'tindakan', harga_umum: null, harga_jkn: null, kode_icd9cm: '86.59' });
        expect(SKEMA_MASTER.tarif.parse({ ...t, kode_icd9cm: '86.59', harga_umum: 75000 }).harga_umum).toBe(75000);
    });
    it('kode tindakan otomatis TND-nnn per fasyankes', () => {
        expect(kodeTindakanBerikut([])).toBe('TND-001');
        expect(kodeTindakanBerikut(['TND-001', 'TND-009', 'TND-X', 'KONS-01'])).toBe('TND-010');
        expect(kodeTindakanBerikut(['TND-999'])).toBe('TND-1000');
    });
    it('filter master: bawaan dan nilai kosong', () => {
        expect(filterMaster.parse({ cari: '', status: '' })).toMatchObject({ status: 'semua', halaman: 1, ukuran: 20 });
        expect(filterMaster.safeParse({ tingkat: 'rt' }).success).toBe(false);
    });
    it('profil klinik: nama dan jenis wajib', () => {
        expect(profilKlinikMasukan.safeParse({ nama: 'K', jenis: 'klinik_pratama_rawat_inap', tanggal_akreditasi: '2025-01-01' }).success).toBe(true);
        expect(profilKlinikMasukan.safeParse({ nama: 'K', jenis: 'puskesmas' }).success).toBe(false);
    });
});

describe('jam shift', () => {
    it('jam sah; selesai boleh melewati tengah malam tetapi tidak sama dengan mulai', () => {
        expect(shiftUbah.safeParse({ jam_mulai: '08:00', jam_selesai: '14:00' }).success).toBe(true);
        expect(shiftUbah.safeParse({ jam_mulai: '21:00', jam_selesai: '07:00' }).success).toBe(true);
        expect(shiftUbah.safeParse({ jam_mulai: '8:00', jam_selesai: '14:00' }).success).toBe(false);
        expect(shiftUbah.safeParse({ jam_mulai: '14:00', jam_selesai: '14:00' }).success).toBe(false);
    });
});

describe('teks sel master', () => {
    it('memformat hari, jam, periode, harga, dan asal wilayah', () => {
        const j = { id: 1, aktif: true, hari: 3, shift_nama: 'Pagi', jam_mulai: '08:00', jam_selesai: '10:00' };
        expect(teksSelMaster('hari', j)).toBe(MASTER.hari[3]);
        expect(teksSelMaster('jam', j)).toBe('08:00-10:00');
        expect(teksSelMaster('shift', j)).toBe('Pagi (08:00-10:00)');
        expect(teksSelMaster('kuota', { kuota: null })).toBe(MASTER.tanpaBatas);
        expect(teksSelMaster('kuota', { kuota: 20 })).toBe('20');
        expect(teksSelMaster('harga_jkn', { id: 1, aktif: true, harga_jkn: null })).toBe('-');
        expect(teksSelMaster('harga_umum', { id: 1, aktif: true, harga_umum: 50000 })).toContain('50');
        expect(teksSelMaster('contoh', { id: 1, aktif: true, contoh: true })).toBe(MASTER.contoh);
        expect(teksSelMaster('nama', { id: 1, aktif: true, nama: null })).toBe('-');
    });
    it('definisi: kolom wilayah tanpa status', () => {
        expect(DEFINISI_MASTER.wilayah.punyaStatus).toBe(false);
    });
});

describe('katalog izin master dan profil klinik', () => {
    it('fitur ada di katalog dan paket Pimpinan', () => {
        expect(FITUR_IZIN).toEqual(expect.arrayContaining(['master', 'profil-klinik']));
        expect(IZIN_AWAL.filter((i) => i.fitur === 'master')).toHaveLength(6);
        const pimpinan = JENIS_AKUN_AWAL.find((j) => j.nama === 'Pimpinan fasyankes');
        expect(pimpinan?.fitur).toEqual(expect.arrayContaining(['master', 'profil-klinik']));
    });
});