import { awalRegistrasi, BIDANG_SENSITIF_REGISTRASI, bentukRegistrasi, bisaCariDuplikat, galatRegistrasi, hapusWali, isianCariDuplikat, ubahJalur, ubahTidakCakap, } from './keadaan-registrasi.js';
import { saringSensitif } from '../../util/draf/draf.js';
import { awalKunjungan, bentukKunjungan, dokterPoli, galatKunjungan, keteranganAsuransi, ubahKunjungan } from './keadaan-kunjungan.js';
const sah = (p = {}) => ({
    ...awalRegistrasi(), nama: 'Siti', nik: '3201010101900001', tanggal_lahir: '1990-05-01', ibu_kandung: 'Rina', jenis_kelamin: 'perempuan', setuju: true, ...p,
});
const kandidat = (alasan) => ({ id: 1, nomor_rm: '00-00-001', nama: 'Siti', tanggal_lahir: '1990-05-01', alasan });
describe('galat registrasi (satu formulir)', () => {
    it('isian awal: identitas dan general consent bermasalah', () => {
        const g = galatRegistrasi(awalRegistrasi(), 1, null);
        expect(g.pesan.length).toBeGreaterThan(0);
        expect(g.bidang.nama).toBeTruthy();
        expect(g.bidang['persetujuan.setuju']).toBeTruthy();
    });
    it('isian lengkap sah', () => {
        expect(galatRegistrasi(sah(), 1, null).pesan).toEqual([]);
    });
    it('teks persetujuan belum termuat menahan pendaftaran dan dilaporkan paling akhir', () => {
        const g = galatRegistrasi(sah(), null, null);
        expect(g.bidang['persetujuan.teks_persetujuan_id']).toBeTruthy();
        expect(g.pesan.at(-1)).toBe(g.bidang['persetujuan.teks_persetujuan_id']);
    });
    it('jalur identitas khusus: paspor butuh nomor; tanpa identitas tidak butuh NIK', () => {
        const paspor = galatRegistrasi(sah({ jalur_identitas: 'paspor', nik: '' }), 1, null);
        expect(awalRegistrasi().jalur_identitas).toBe('nik');
        expect(paspor.bidang.nomor_paspor).toBeTruthy();
        expect(galatRegistrasi(sah({ jalur_identitas: 'paspor', nik: '', nomor_paspor: 'A1' }), 1, null).pesan).toEqual([]);
        expect(galatRegistrasi(sah({ jalur_identitas: 'tanpa_identitas', nik: '' }), 1, null).pesan).toEqual([]);
    });
    it('tidak cakap butuh wali dan penandatangan wali', () => {
        const k = ubahTidakCakap(sah(), true);
        expect(k.penandatangan).toBe('wali');
        expect(galatRegistrasi(k, 1, null).bidang.wali).toBeTruthy();
        const lengkap = { ...k, wali: [{ hubungan: 'Ibu', nama: 'Rina', kontak: '' }], wali_ke: '0' };
        expect(galatRegistrasi(lengkap, 1, null).pesan).toEqual([]);
        expect(galatRegistrasi({ ...lengkap, wali_ke: '' }, 1, null).pesan.length).toBeGreaterThan(0);
    });
    it('duplikat: NIK sama memblokir; nama-lahir-ibu butuh pernyataan berbeda; pesannya paling atas', () => {
        expect(galatRegistrasi(sah(), 1, [kandidat('nik')]).pesan).toHaveLength(1);
        expect(galatRegistrasi(sah({ konfirmasi_duplikat: true }), 1, [kandidat('nik')]).pesan).toHaveLength(1);
        expect(galatRegistrasi(sah(), 1, [kandidat('nama_lahir_ibu')]).pesan).toHaveLength(1);
        expect(galatRegistrasi(sah({ konfirmasi_duplikat: true }), 1, [kandidat('nama_lahir_ibu')]).pesan).toEqual([]);
        expect(galatRegistrasi(sah(), 1, []).pesan).toEqual([]);
        const g = galatRegistrasi({ ...sah({ nama: '' }) }, 1, [kandidat('nama_lahir_ibu')]);
        expect(g.pesan[0]).toBe('Tinjau kemungkinan data ganda: pakai pasien yang ada atau nyatakan pasien ini berbeda.');
    });
});
describe('bentuk registrasi dan bantuan isian', () => {
    it('permintaan dari isian: wali penandatangan menjadi indeks, NIK dibuang untuk tanpa identitas', () => {
        const k = { ...sah({ jalur_identitas: 'tanpa_identitas', nik: '3201010101900001' }), penandatangan: 'wali', wali_ke: '1', wali: [{ hubungan: 'A', nama: 'A', kontak: '' }, { hubungan: 'B', nama: 'B', kontak: '' }] };
        const b = bentukRegistrasi(k, 4);
        expect(b.nik).toBeUndefined();
        expect(b.persetujuan).toMatchObject({ teks_persetujuan_id: 4, penandatangan: 'wali', wali_ke: 1, setuju: true });
        expect(bentukRegistrasi(sah(), 4).persetujuan.wali_ke).toBeNull();
    });
    it('ubahJalur mengosongkan isian khusus jalur dan konfirmasi duplikat', () => {
        const k = ubahJalur(sah({ nomor_paspor: 'P', nomor_kitas: 'K', konfirmasi_duplikat: true }), 'tanpa_identitas');
        expect(k).toMatchObject({ nik: '', nomor_paspor: '', nomor_kitas: '', konfirmasi_duplikat: false });
        expect(ubahJalur(sah({ nomor_paspor: 'P' }), 'paspor').nomor_paspor).toBe('P');
    });
    it('hapus wali menjaga penunjuk penandatangan', () => {
        const wali = [{ hubungan: 'A', nama: 'A', kontak: '' }, { hubungan: 'B', nama: 'B', kontak: '' }, { hubungan: 'C', nama: 'C', kontak: '' }];
        const dasar = { ...sah(), wali, penandatangan: 'wali', tidak_cakap: true };
        expect(hapusWali({ ...dasar, wali_ke: '2' }, 0)).toMatchObject({ wali_ke: '1' });
        expect(hapusWali({ ...dasar, wali_ke: '1' }, 1)).toMatchObject({ wali_ke: '' });
        expect(hapusWali({ ...dasar, wali_ke: '0' }, 2)).toMatchObject({ wali_ke: '0' });
        const satu = { ...sah(), wali: wali.slice(0, 1), penandatangan: 'wali', wali_ke: '0' };
        expect(hapusWali(satu, 0)).toMatchObject({ penandatangan: 'pasien', wali_ke: '' });
    });
    it('pencarian duplikat butuh NIK 16 digit atau nama+tanggal lahir+ibu', () => {
        expect(bisaCariDuplikat(awalRegistrasi())).toBe(false);
        expect(bisaCariDuplikat(sah({ nik: '123' }))).toBe(true);
        expect(bisaCariDuplikat(sah({ nik: '123', ibu_kandung: '' }))).toBe(false);
        expect(bisaCariDuplikat(sah({ nik: '3201010101900001', nama: '' }))).toBe(true);
        expect(isianCariDuplikat(sah({ nik: '12', nama: ' Siti ' }))).toEqual({ nama: 'Siti', tanggal_lahir: '1990-05-01', ibu_kandung: 'Rina' });
    });
    it('penjamin: nomor kartu JKN, keterangan asuransi, dan nomor polis dikirim; polis terlalu panjang ditandai', () => {
        const k = sah({ jkn_nomor_kartu: '0001', asuransi_nama: 'Asuransi X', asuransi_nomor_polis: 'POL-1' });
        expect(bentukRegistrasi(k, 1)).toMatchObject({ jkn_nomor_kartu: '0001', asuransi_nama: 'Asuransi X', asuransi_nomor_polis: 'POL-1' });
        expect(Object.keys(bentukRegistrasi(k, 1)).filter((b) => b.startsWith('jkn_'))).toEqual(['jkn_nomor_kartu']);
        expect(galatRegistrasi(sah({ asuransi_nomor_polis: 'x'.repeat(51) }), 1, []).bidang.asuransi_nomor_polis).toBeTruthy();
    });
});
describe('pendaftaran kunjungan', () => {
    it('rawat jalan wajib jenis poli; IMP tidak membawa jenis poli; SEP hanya JKN', () => {
        const k = awalKunjungan(7);
        expect(bentukKunjungan(k)).not.toHaveProperty('dpjp_id');
        expect(galatKunjungan(k)).toEqual({ jenis_poli: expect.any(String) });
        expect(galatKunjungan({ ...k, jenis_poli: 'Umum' })).toEqual({});
        expect(galatKunjungan(awalKunjungan())).toHaveProperty('pasien_id');
        expect(bentukKunjungan({ ...k, jenis: 'IMP', jenis_poli: 'Umum', nomor_sep: 'X' })).toMatchObject({ jenis_poli: undefined, nomor_sep: undefined });
        expect(bentukKunjungan({ ...k, jenis_poli: 'Umum', cara_pembayaran: 'jkn', nomor_sep: ' S1 ' })).toMatchObject({ pasien_id: 7, jenis_poli: 'Umum', nomor_sep: ' S1 ' });
        expect(galatKunjungan({ ...k, jenis: 'IMP' })).toEqual({});
    });
    it('ubah membersihkan isian yang tidak berlaku', () => {
        const k = { ...awalKunjungan(1), jenis_poli: 'Umum', cara_pembayaran: 'jkn', nomor_sep: 'S' };
        expect(ubahKunjungan(k, { cara_pembayaran: 'umum' }).nomor_sep).toBe('');
        expect(ubahKunjungan(k, { jenis: 'IMP' }).jenis_poli).toBe('');
    });
    it('dokter terfilter jenis poli: dikosongkan bila bukan dokter jenis baru; dokter opsional dan tidak terpilih otomatis', () => {
        const dpjp = [
            { id: 1, nama: 'dr. A', profesi: 'Dokter umum', jenis_poli: ['Umum', 'KIA'] },
            { id: 2, nama: 'dr. B', profesi: 'Dokter umum', jenis_poli: ['Umum'] },
            { id: 5, nama: 'drg. C', profesi: 'Dokter gigi', jenis_poli: ['Gigi'] },
        ];
        expect(dokterPoli(dpjp, 'Umum').map((d) => d.id)).toEqual([1, 2]);
        expect(dokterPoli(dpjp, 'umum').map((d) => d.id)).toEqual([1, 2]);
        expect(dokterPoli(dpjp, '')).toEqual([]);
        const k = awalKunjungan(1);
        const diUmum = ubahKunjungan(k, { jenis_poli: 'Umum' }, dpjp);
        expect(diUmum.dpjp_id).toBe('');
        const pilihB = ubahKunjungan(diUmum, { dpjp_id: '2' }, dpjp);
        expect(ubahKunjungan(pilihB, { jenis_poli: 'KIA' }, dpjp).dpjp_id).toBe('');
        expect(ubahKunjungan({ ...pilihB, dpjp_id: '1' }, { jenis_poli: 'KIA' }, dpjp).dpjp_id).toBe('1');
        expect(ubahKunjungan(pilihB, { jenis_poli: 'Gigi' }, dpjp).dpjp_id).toBe('');
        expect(ubahKunjungan(pilihB, { jenis: 'IMP' }, dpjp).dpjp_id).toBe('');
        expect(bentukKunjungan({ ...pilihB, cara_pembayaran: 'asuransi' })).toMatchObject({ jenis_poli: 'Umum', dpjp_id: 2, cara_pembayaran: 'asuransi' });
        expect(galatKunjungan({ ...pilihB, cara_pembayaran: 'asuransi' })).toEqual({});
    });
    it('asuransi lain: keterangan dari data pasien, null bila belum diisi; SEP hanya JKN', () => {
        expect(keteranganAsuransi({ asuransi_nama: ' Asuransi X ', asuransi_nomor_polis: 'P-1' })).toEqual({ nama: 'Asuransi X', polis: 'P-1' });
        expect(keteranganAsuransi({ asuransi_nama: 'Asuransi X', asuransi_nomor_polis: null })).toEqual({ nama: 'Asuransi X', polis: null });
        expect(keteranganAsuransi({ asuransi_nama: ' ', asuransi_nomor_polis: null })).toBeNull();
        expect(keteranganAsuransi(null)).toBeNull();
        const k = { ...awalKunjungan(1), lokasi_id: '3', cara_pembayaran: 'jkn', nomor_sep: 'S' };
        expect(ubahKunjungan(k, { cara_pembayaran: 'asuransi' }).nomor_sep).toBe('');
    });
});
describe('draf registrasi tanpa data sensitif', () => {
    it('NIK, ibu kandung, kontak wali, JKN, dan asuransi tidak ikut tersimpan', () => {
        const k = { ...awalRegistrasi(), nik: '3201', ibu_kandung: 'Rina', jkn_nomor_kartu: '000', asuransi_nama: 'AsuransiZ', asuransi_nomor_polis: 'POL-77', wali: [{ hubungan: 'ibu', nama: 'R', kontak: '0812' }], agama: 'Islam' };
        const aman = JSON.stringify(saringSensitif(k, BIDANG_SENSITIF_REGISTRASI));
        for (const rahasia of ['3201', 'Rina', '000', '0812', 'AsuransiZ', 'POL-77'])
            expect(aman).not.toContain(rahasia);
        expect(aman).toContain('Islam');
    });
});
