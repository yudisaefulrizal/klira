import { jest } from '@jest/globals';

const kliraActual0 = await import("@klira/db");
jest.unstable_mockModule('@klira/db', () => {
    const hitungKodeTerminologiUntukKamusTerminologi = jest.fn();
    const daftarKodeTerminologiUntukKamusTerminologi = jest.fn();
    return { ...kliraActual0,
        pool: {},
        hitungKodeTerminologiUntukKamusTerminologi: hitungKodeTerminologiUntukKamusTerminologi,
        daftarKodeTerminologiUntukKamusTerminologi: daftarKodeTerminologiUntukKamusTerminologi,
        daftarKodeTerminologiUntukCariTerminologi: daftarKodeTerminologiUntukKamusTerminologi,
        daftarKodeTerminologiUntukCariTerminologi2: daftarKodeTerminologiUntukKamusTerminologi,
        daftarKodeTerminologiUntukCariTerminologi3: daftarKodeTerminologiUntukKamusTerminologi,
        transaksi: jest.fn(async (fn) => fn({})) };
});
const db = await import("@klira/db");
const { kamusTerminologiMasukan } = await import("@klira/shared");
const { RepositoriKlinisMysql } = await import("../data-access/repositori.js");

beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(db.hitungKodeTerminologiUntukKamusTerminologi).mockResolvedValue(31);
    jest.mocked(db.daftarKodeTerminologiUntukKamusTerminologi).mockResolvedValue([]);
});

test('ICD menampilkan referensi primer lengkap tanpa membaca DB', async () => {
    const repo = new RepositoriKlinisMysql();
    const pertama = await repo.kamusTerminologi(kamusTerminologiMasukan.parse({ sistem: 'icd9cm' }));
    const kedua = await repo.kamusTerminologi(kamusTerminologiMasukan.parse({ sistem: 'icd9cm', halaman: 2 }));
    const diagnosis = await repo.kamusTerminologi(kamusTerminologiMasukan.parse({ sistem: 'icd10' }));
    expect(pertama.total).toBe(4626);
    expect(diagnosis.total).toBe(18542);
    expect(pertama.data[0]).toMatchObject({ kode: '00', contoh: false });
    expect(pertama.data).toHaveLength(30);
    expect(kedua.data).toHaveLength(30);
    expect(kedua.data.some((b) => pertama.data.some((a) => a.kode === b.kode))).toBe(false);
    expect(db.hitungKodeTerminologiUntukKamusTerminologi).not.toHaveBeenCalled();
    expect(db.daftarKodeTerminologiUntukKamusTerminologi).not.toHaveBeenCalled();
});

test('kamus dan pencarian ICD memakai sumber statis yang sama, termasuk nol dan titik', async () => {
    const repo = new RepositoriKlinisMysql();
    const h = await repo.kamusTerminologi(kamusTerminologiMasukan.parse({ sistem: 'icd10', awalan: 'i', ukuran: 50 }));
    const saran = await repo.cariTerminologi('icd10', 'i10', 10);
    expect(h.data.every((k) => k.kode.startsWith('I'))).toBe(true);
    expect(h.data.find((k) => k.kode === 'I10')).toEqual(saran[0]);
    const tindakan = await repo.cariTerminologi('icd9cm', '00.01', 10);
    expect(tindakan[0]).toMatchObject({ kode: '00.01', contoh: false });
    expect((await repo.cariTerminologi('icd9cm', '  THERAPEUTIC ULTRASOUND  ', 5)).length).toBeGreaterThan(0);
    expect(db.daftarKodeTerminologiUntukKamusTerminologi).not.toHaveBeenCalled();
});

test('sistem selain ICD tetap memakai master DB', async () => {
    await new RepositoriKlinisMysql().kamusTerminologi(kamusTerminologiMasukan.parse({ sistem: 'loinc' }));
    expect(jest.mocked(db.hitungKodeTerminologiUntukKamusTerminologi).mock.calls.map(args => ({ ...args }))).toEqual(expect.arrayContaining([expect.objectContaining({ 0: 'loinc', 1: true })]));
});

test('menolak sistem, halaman, ukuran dan indeks yang tidak sah', () => {
    for (const q of [{ sistem: 'lain' }, { sistem: 'icd10', halaman: 0 }, { sistem: 'icd10', ukuran: 1000 }, { sistem: 'icd10', awalan: '%' }]) {
        expect(kamusTerminologiMasukan.safeParse(q).success).toBe(false);
    }
});

test('padanan komunitas memperluas pencarian Indonesia tanpa mengganti nama resmi', async () => {
    const repo = new RepositoriKlinisMysql();
    const hasil = await repo.cariTerminologi('icd10', 'hipertensi', 50);
    const i10 = hasil.find((k) => k.kode === 'I10');
    expect(i10).toMatchObject({ nama: 'Essential (primary) hypertension', status_padanan: 'komunitas' });
    expect(i10?.nama_indonesia?.toLowerCase()).toContain('hipertensi');
    expect((await repo.cariTerminologi('icd10', 'hypertension', 50)).find((k) => k.kode === 'I10')).toEqual(i10);
    expect((await repo.cariTerminologi('icd10', 'A05.2', 1))[0].nama_indonesia).toBeUndefined();
    expect((await repo.cariTerminologi('icd9cm', '89.52', 1))[0].nama_indonesia).toBeUndefined();
    expect(db.daftarKodeTerminologiUntukKamusTerminologi).not.toHaveBeenCalled();
});

test('nama KPTL membantu pencarian Indonesia tanpa mengganti nama atau kode ICD9CM', async () => {
    const repo = new RepositoriKlinisMysql();
    const hasil = await repo.cariTerminologi('icd9cm', 'elektrokardiografi', 50);
    const ekg = hasil.find((k) => k.kode === '89.52');
    expect(ekg).toMatchObject({ nama: 'Electrocardiogram', nama_tindakan_kptl: [{ kode: '10925.x', nama: 'Elektrokardiografi (EKG)' }] });
    const kamus = await repo.kamusTerminologi(kamusTerminologiMasukan.parse({ sistem: 'icd9cm', awalan: '0' }));
    expect(kamus.data.find((k) => k.kode === '00.01')?.nama_tindakan_kptl?.[0].nama).toContain('USG Terapi');
    // Nama sumber berbeda: mapping ini harus tetap disisihkan.
    expect((await repo.cariTerminologi('icd9cm', '17.7', 1))[0].nama_tindakan_kptl).toBeUndefined();
    expect(db.daftarKodeTerminologiUntukKamusTerminologi).not.toHaveBeenCalled();
});