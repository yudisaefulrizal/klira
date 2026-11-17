import { BAGIAN_KLINIS, BAGIAN_NARASI, BAGIAN_SOAPIE } from '@klira/shared';
import { awalKeadaan } from '../../modal/pemeriksaan/keadaan-pemeriksaan.js';
import { alamatProfil, bentukDraf, terapkanDraf, keadaanAlamat, kepesertaan, modeCatatan, opsiCetakPanel, parseTensi, pelaksana, saringRiwayat, tandaKepalaPanel, teksTensi, umurTahun } from './keadaan-profil-pasien.js';

const izin = (...daftar) => (fitur, aksi) => daftar.includes(`${fitur}:${aksi}`);

describe('halaman Pasien', () => {
    it('SOAPIE: enam teks panjang, semuanya bagian narasi klinis', () => {
        expect(BAGIAN_SOAPIE).toEqual(['subjek', 'objek', 'asesmen', 'plan', 'instruksi', 'evaluasi']);
        expect(BAGIAN_SOAPIE.every((b) => BAGIAN_NARASI.includes(b) && BAGIAN_KLINIS.includes(b))).toBe(true);
    });
    it('tensi satu isian: dipecah ke sistole dan diastole, bolak-balik', () => {
        expect(parseTensi('120/80')).toEqual({ sistolik: '120', diastolik: '80', sah: true });
        expect(parseTensi(' 90 / 60 ')).toEqual({ sistolik: '90', diastolik: '60', sah: true });
        expect(parseTensi('120/')).toEqual({ sistolik: '120', diastolik: '', sah: true });
        expect(parseTensi('120')).toEqual({ sistolik: '120', diastolik: '', sah: true });
        expect(parseTensi('')).toEqual({ sistolik: '', diastolik: '', sah: true });
        expect(parseTensi('abc').sah).toBe(false);
        expect(parseTensi('12/8/4').sah).toBe(false);
        expect(teksTensi({ sistolik: '120', diastolik: '80' })).toBe('120/80');
        expect(teksTensi({ sistolik: '120', diastolik: '' })).toBe('120');
        expect(teksTensi({ sistolik: '', diastolik: '' })).toBe('');
    });
    it('pelaksana: pengesah terbaru dari bagian yang disebut', () => {
        const sah = (nama, waktu) => ({ pengesahan: { pengguna_nama: nama, jenis_akun: 'Dokter/DPJP', waktu } });
        const b = { subjek: sah('dr. A', '2026-11-15T01:00:00.000Z'), objek: sah('dr. B', '2026-11-15T02:00:00.000Z'), plan: { pengesahan: null } };
        expect(pelaksana(b, ['subjek', 'objek', 'plan'])).toMatchObject({ nama: 'dr. B', jenis_akun: 'Dokter/DPJP' });
        expect(pelaksana(b, ['plan', 'asesmen'])).toBeNull();
    });
    it('alamat: pasien, kunjungan, dan tab pendamping bolak-balik; nilai tidak sah diabaikan', () => {
        const k = { pasien: 7, kunjungan: 31, sub: 'resep' };
        expect(alamatProfil(k)).toBe('/pasien?tab=pasien&pasien=7&kunjungan=31&bagian=resep');
        expect(keadaanAlamat('?tab=pasien&pasien=7&kunjungan=31&bagian=resep')).toEqual(k);
        // Resep dan Tindakan adalah tab terpisah.
        expect(keadaanAlamat('?pasien=7&kunjungan=31&bagian=tindakan').sub).toBe('tindakan');
        expect(alamatProfil({ pasien: 7, sub: 'pemeriksaan' })).toBe('/pasien?tab=pasien&pasien=7');
        expect(keadaanAlamat('?pasien=abc&kunjungan=-1&bagian=lain')).toEqual({ pasien: null, kunjungan: null, sub: 'pemeriksaan' });
    });
    it('mode catatan: bebas diubah sampai kunjungan ditutup, sesudahnya diubah dengan alasan', () => {
        const dokter = izin('klinis:input');
        expect(modeCatatan({ jenis: 'AMB', tahap_layanan: 'pemeriksaan' }, dokter)).toEqual({ ubah: true, ubahVital: true, tutup: false, alasan: null });
        for (const tahap of ['resep', 'kasir'])
            expect(modeCatatan({ jenis: 'AMB', tahap_layanan: tahap }, dokter)).toEqual({ ubah: true, ubahVital: true, tutup: false, alasan: null });
        expect(modeCatatan({ jenis: 'AMB', tahap_layanan: 'ditutup' }, dokter)).toEqual({ ubah: true, ubahVital: true, tutup: true, alasan: null });
        expect(modeCatatan({ jenis: 'AMB', tahap_layanan: 'menunggu_skrining' }, dokter)).toEqual({ ubah: true, ubahVital: true, tutup: false, alasan: null });
        expect(modeCatatan({ jenis: 'AMB', tahap_layanan: 'pemeriksaan' }, izin('klinis:lihat'))).toEqual({ ubah: false, ubahVital: false, tutup: false, alasan: 'tanpaIzin' });
        expect(modeCatatan({ jenis: 'LAB', tahap_layanan: 'pemeriksaan' }, dokter)).toEqual({ ubah: false, ubahVital: false, tutup: false, alasan: 'lab' });
    });
    it('penelusuran riwayat: semua kata harus cocok pada poli, dokter, keluhan, atau diagnosis', () => {
        const riwayat = [
            { id: 2, mulai: '2026-11-10T02:00:00.000Z', poli_nama: 'Poli Gigi', dpjp_nama: 'drg. Mahmud', keluhan_utama: 'Gigi berlubang', diagnosis: [{ kode: 'K02.1', nama: 'Karies dentin', peran: 'utama' }] },
            { id: 1, mulai: '2026-10-01T02:00:00.000Z', poli_nama: 'Poli Umum 1', dpjp_nama: 'dr. Ahmad', keluhan_utama: 'Batuk', diagnosis: [] },
        ];
        expect(saringRiwayat(riwayat, '')).toHaveLength(2);
        expect(saringRiwayat(riwayat, 'gigi mahmud').map((r) => r.id)).toEqual([2]);
        expect(saringRiwayat(riwayat, 'K02').map((r) => r.id)).toEqual([2]);
        expect(saringRiwayat(riwayat, '2026-10').map((r) => r.id)).toEqual([1]);
        expect(saringRiwayat(riwayat, 'ahmad gigi')).toHaveLength(0);
    });
    it('kepesertaan dan umur', () => {
        expect(kepesertaan({ jkn_nomor_kartu: '0001234567890', asuransi_nama: 'X' })).toMatchObject({ label: 'BPJS', rincian: '0001234567890' });
        expect(kepesertaan({ jkn_nomor_kartu: null, asuransi_nama: 'Asuransi Sehat' })).toMatchObject({ label: 'Asuransi', rincian: 'Asuransi Sehat' });
        expect(kepesertaan({ jkn_nomor_kartu: null, asuransi_nama: null })).toMatchObject({ label: 'Umum', rincian: null });
        const kini = new Date(2026, 10, 15);
        expect(umurTahun('1990-11-15', kini)).toBe(36);
        expect(umurTahun('1990-11-16', kini)).toBe(35);
        expect(umurTahun('', kini)).toBeNull();
    });
    it('draf catatan: bentuk dan terapkan bolak-balik, yang sama dengan keadaan sekarang tidak berlaku', () => {
        const dasar = { ...awalKeadaan(), subjek: '', keperawatan: { alergi: '' }, tanda_vital: { ...awalKeadaan().tanda_vital } };
        const ubah = { ...dasar, subjek: 'Batuk', asesmen: 'ISPA', keperawatan: { alergi: 'Penisilin' }, tanda_vital: { ...dasar.tanda_vital, suhu: '37.5', kesadaran: 'compos_mentis' } };
        const draf = bentukDraf(ubah, '120/80');
        const hasil = terapkanDraf(dasar, '', JSON.parse(JSON.stringify(draf)));
        expect(hasil.k).toMatchObject({ subjek: 'Batuk', asesmen: 'ISPA', keperawatan: { alergi: 'Penisilin' }, tanda_vital: { suhu: '37.5', kesadaran: 'compos_mentis' } });
        expect(hasil.tensi).toBe('120/80');
        expect(terapkanDraf(ubah, '120/80', draf)).toBeNull();
        expect(terapkanDraf(dasar, '', { ...draf, versi_draf: 99 })).toBeNull();
        // diagnosis ikut draf; entri rusak dibuang
        const dx = [{ kode: 'I10', nama: 'Essential (primary) hypertension', peran: 'utama', snomed: '' }];
        const dengan = terapkanDraf(dasar, '', JSON.parse(JSON.stringify(bentukDraf({ ...dasar, diagnosis: dx }, ''))));
        expect(dengan.k.diagnosis).toEqual(dx);
        expect(terapkanDraf(dasar, '', { ...bentukDraf(ubah, ''), diagnosis: [{ kode: 1 }, { kode: 'I10', nama: 'x', peran: 'salah' }] }).k.diagnosis).toEqual([]);
        expect(terapkanDraf(dasar, '', null)).toBeNull();
        expect(terapkanDraf(dasar, '', { versi_draf: 1, subjek: 123, tanda_vital: 'x', alergi: null, tensi: {} })).toBeNull();
    });
    it('tanda kepala panel: memuat status sesuai tab yang sedang dibuka', () => {
        const klinis = {
            kunjungan: { tahap_layanan: 'ditutup', cara_pembayaran: 'umum' },
            bagian: { tindakan: { verifikasi: 'sah', pengesahan: { pengguna_nama: 'dr. A', jenis_akun: 'Dokter', versi: 2 } } },
        };
        expect(tandaKepalaPanel({ sub: 'pemeriksaan', klinis }).map((x) => x.label)).toEqual(['Ditutup']);
        expect(tandaKepalaPanel({ sub: 'resep', klinis, data: { resep: { nilai: [{ nomor_resep: 'R-001', status: 'diajukan' }] } } }).map((x) => x.label))
            .toEqual(['Ditutup', 'R-001', 'Menunggu farmasi']);
        expect(tandaKepalaPanel({ sub: 'tindakan', klinis }).map((x) => x.label))
            .toEqual(['Ditutup', 'Disahkan', 'Versi 2']);
        expect(tandaKepalaPanel({ sub: 'penunjang', klinis, data: { penunjang: { nilai: [{ status: 'divalidasi' }, { status: 'menunggu_hasil' }] } } }).map((x) => x.label))
            .toEqual(['Ditutup', '1/2 divalidasi']);
        expect(tandaKepalaPanel({
            sub: 'penutup', klinis,
            kasir: { kunjungan: klinis.kunjungan, tagihan: { status_tagihan: 'lengkap', total: 100000, sisa: 0 }, hasil_lab: { status: 'diserahkan', divalidasi: 2, total: 2 } },
            resepSerah: [{ status: 'diserahkan' }],
        }).map((x) => x.label)).toEqual(['Ditutup', 'Diserahkan di kasir', 'Sudah diserahkan (2/2)']);
    });
    it('opsi cetak panel: mengumpulkan dokumen yang tersedia dan diizinkan untuk menu printer', () => {
        expect(opsiCetakPanel({
            terbatas: false, bolehKlinis: true, bolehRekamMedis: false, bolehPenunjang: true, bolehKasir: true,
            orders: [{ status: 'divalidasi', hasil: { nilai: '12' } }],
            kasir: { tagihan: { pembayaran: [{ metode: 'tunai', jumlah: 50000 }] } },
        }).map((x) => x.id)).toEqual(['rekam-medis', 'hasil-lab', 'bayar']);
        expect(opsiCetakPanel({
            terbatas: true, bolehKlinis: false, bolehRekamMedis: false, bolehPenunjang: false, bolehKasir: true,
            kasir: { hasil_lab: { divalidasi: 1 }, tagihan: { pembayaran: [] } },
        }).map((x) => x.id)).toEqual(['hasil-lab']);
    });
});
