import { jest } from '@jest/globals';

const { registrasiPasienMasukan, perbaikanPasienMasukan } = await import("@klira/shared");
const { buatLayananPasien } = await import("./layanan.js");

const teks = { id: 7, jenis: 'general', versi: 2, judul: 'GC', tujuan: 'T', isi: 'I' };
const daftarMasukan = registrasiPasienMasukan.parse({
    nama: 'Siti Rahma', tanggal_lahir: '1990-05-01', jenis_kelamin: 'perempuan', nik: '3201010101900001', ibu_kandung: 'Rina',
    persetujuan: { teks_persetujuan_id: 7, bentuk: 'tertulis', penandatangan: 'pasien', setuju: true },
});
const saya = { id: 3 };
const audit = { catat: async () => {} };

function buat({ sinkronIhs, nik = ['3201010101900001', '3201010101900001'] }) {
    const detail = jest.fn().mockResolvedValueOnce({ id: 9, nik: nik[0] }).mockResolvedValue({ id: 9, nik: nik[1] });
    return buatLayananPasien({
        repo: {
            teksUntukPakai: async () => teks,
            duplikat: async () => [],
            daftarkan: async () => ({ id: 9, nomor_rm: '00-00-001', nama: 'Siti Rahma', status_identitas: 'lengkap', persetujuan_id: 4 }),
            perbaiki: async () => true,
            detail,
        },
        audit,
        sinkronIhs,
    });
}

describe('registrasi pasien dan IHS Number', () => {
    it('mencari IHS Number setelah tersimpan dan melampirkan hasil', async () => {
        const sinkronIhs = jest.fn(async () => ({ status: 'terhubung', ihs_number: 'P1' }));
        const h = await buat({ sinkronIhs }).daftarkan(saya, daftarMasukan, '::1');
        expect(h).toMatchObject({ ok: true, data: { id: 9, satusehat: { status: 'terhubung' } } });
        expect(sinkronIhs).toHaveBeenCalledWith(saya, 9, { alamat: '::1' });
    });

    it('tanpa sinkronIhs (tidak dikonfigurasi di aplikasi) tidak ada bidang satusehat', async () => {
        const h = await buat({}).daftarkan(saya, daftarMasukan);
        expect(h.data).not.toHaveProperty('satusehat');
    });

    it('registrasi yang ditolak tidak mencari IHS Number', async () => {
        const sinkronIhs = jest.fn();
        const l = buatLayananPasien({ repo: { teksUntukPakai: async () => null }, audit, sinkronIhs });
        expect((await l.daftarkan(saya, daftarMasukan)).ok).toBe(false);
        expect(sinkronIhs).not.toHaveBeenCalled();
    });
});

describe('perbaikan pasien dan IHS Number', () => {
    const perbaikan = perbaikanPasienMasukan.parse({
        nama: 'Siti Rahma', tanggal_lahir: '1990-05-01', jenis_kelamin: 'perempuan', jalur_identitas: 'nik', nik: '3201010101900001', wali: [], tidak_cakap: false,
    });

    it('NIK tidak berubah: pencarian biasa', async () => {
        const sinkronIhs = jest.fn(async () => ({ status: 'sudah' }));
        const h = await buat({ sinkronIhs }).perbaiki(saya, 9, perbaikan, '::1');
        expect(h.data.satusehat).toEqual({ status: 'sudah' });
        expect(sinkronIhs).toHaveBeenCalledWith(saya, 9, { nikBerubah: false, paksa: false, alamat: '::1' });
    });

    it('NIK berubah: IHS Number lama dihapus dan dicari ulang', async () => {
        const sinkronIhs = jest.fn(async () => ({ status: 'terhubung' }));
        await buat({ sinkronIhs, nik: ['3201010101900001', '3201010101900002'] }).perbaiki(saya, 9, perbaikan, '::1');
        expect(sinkronIhs).toHaveBeenCalledWith(saya, 9, { nikBerubah: true, paksa: true, alamat: '::1' });
    });
});
