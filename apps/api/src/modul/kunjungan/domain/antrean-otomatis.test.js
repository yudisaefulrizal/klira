import { jest } from '@jest/globals';

jest.unstable_mockModule('@klira/db', () => ({ ubahKunjunganUntukMulaiAntreanDalam: jest.fn(),
    ubahAntreanUntukMulaiAntreanDalam: jest.fn(),
    ubahAntreanUntukMulaiAntreanDalam2: jest.fn(),
    ubahAntreanUntukSelesaiAntreanDalam: jest.fn() }));
const db = await import("@klira/db");
const { mulaiAntreanDalam, selesaiAntreanDalam } = await import("./antrean-otomatis.js");

const pertama = new Date('2026-10-30T02:00:00Z');

const berikutnya = new Date('2026-10-30T03:00:00Z');

function siapkan(status = 'dipanggil', tahap = 'pemeriksaan') {
    const antrean = { fasyankes_id: 7, kunjungan_id: 11, status, waktu_mulai: null, waktu_selesai: null };
    const kunjungan = { status: 'arrived' };
    const tx = {};
    jest.mocked(db.ubahKunjunganUntukMulaiAntreanDalam).mockImplementation(async (status, fas, id, tahapBoleh) => {
        if (fas !== 7 || id !== 11 || !tahapBoleh?.includes(tahap) || antrean.status === 'batal')
            return { count: 0 };
        kunjungan.status = status;
        return { count: 1 };
    });
    const cocok = (fas, id, status) => fas === 7 && id === 11 && !!status?.includes(antrean.status);
    jest.mocked(db.ubahAntreanUntukMulaiAntreanDalam).mockImplementation(async (waktu, fas, id, status) => {
        if (!cocok(fas, id, status) || antrean.waktu_mulai !== null)
            return { count: 0 };
        antrean.waktu_mulai = waktu;
        return { count: 1 };
    });
    jest.mocked(db.ubahAntreanUntukMulaiAntreanDalam2).mockImplementation(async (ke, fas, id, status) => {
        if (!cocok(fas, id, status))
            return { count: 0 };
        antrean.status = ke;
        return { count: 1 };
    });
    jest.mocked(db.ubahAntreanUntukSelesaiAntreanDalam).mockImplementation(async (waktu, fas, id, status) => {
        if (!cocok(fas, id, status) || antrean.waktu_selesai !== null)
            return { count: 0 };
        antrean.waktu_selesai = waktu;
        return { count: 1 };
    });
    jest.mocked(db.ubahAntreanUntukMulaiAntreanDalam2).mockImplementation(async (ke, fas, id, status) => {
        if (!cocok(fas, id, status))
            return { count: 0 };
        antrean.status = ke;
        return { count: 1 };
    });
    return { tx, antrean, kunjungan };
}

test.each(['menunggu', 'dipanggil'])('catatan pertama mulai melayani dari %s tanpa perlu tombol manual', async (status) => {
    const w = siapkan(status, 'menunggu_skrining');
    await mulaiAntreanDalam(w.tx, 7, 11, pertama);
    expect(w.antrean).toMatchObject({ status: 'dilayani', waktu_mulai: pertama });
    expect(w.kunjungan.status).toBe('in-progress');
    await mulaiAntreanDalam(w.tx, 7, 11, berikutnya);
    expect(w.antrean.waktu_mulai).toEqual(pertama);
    await selesaiAntreanDalam(w.tx, 7, 11, berikutnya);
    expect(w.antrean).toMatchObject({ status: 'selesai', waktu_mulai: pertama, waktu_selesai: berikutnya });
    await selesaiAntreanDalam(w.tx, 7, 11, new Date());
    await mulaiAntreanDalam(w.tx, 7, 11, new Date());
    expect(w.antrean).toMatchObject({ status: 'selesai', waktu_mulai: pertama, waktu_selesai: berikutnya });
});

test.each(['batal', 'selesai'])('status terminal %s tidak dibuka ulang atau ditimpa waktunya', async (status) => {
    const w = siapkan(status);
    await mulaiAntreanDalam(w.tx, 7, 11, pertama);
    await selesaiAntreanDalam(w.tx, 7, 11, berikutnya);
    expect(w.antrean).toMatchObject({ status, waktu_mulai: null, waktu_selesai: null });
});

test.each(['resep', 'kasir', 'ditutup'])('perbaikan catatan di tahap %s tidak memulai antrean', async (tahap) => {
    const w = siapkan('dipanggil', tahap);
    await mulaiAntreanDalam(w.tx, 7, 11, pertama);
    expect(w.antrean.status).toBe('dipanggil');
    expect(w.antrean.waktu_mulai).toBeNull();
});

test('fasilitas lain tidak dapat mengubah status atau waktu', async () => {
    const w = siapkan();
    await mulaiAntreanDalam(w.tx, 8, 11, pertama);
    await selesaiAntreanDalam(w.tx, 8, 11, berikutnya);
    expect(w.antrean).toMatchObject({ status: 'dipanggil', waktu_mulai: null, waktu_selesai: null });
});

test.each(['menunggu', 'dipanggil', 'dilayani'])('penutupan menyelesaikan antrean lama yang masih %s', async (status) => {
    const w = siapkan(status);
    await selesaiAntreanDalam(w.tx, 7, 11, berikutnya);
    expect(w.antrean).toMatchObject({ status: 'selesai', waktu_selesai: berikutnya });
});