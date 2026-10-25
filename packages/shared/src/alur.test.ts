import {
  aksiAntreanTersedia, bolehAksiAntrean, bolehPindahTahap, cekDuplikatMasukan, filterPasien, formatNomorRm, kodeAntrean, kunjunganMasukan, registrasiPasienMasukan,
  statusIdentitasDari, tanggalWib, umurTahun,
} from './index';

describe('antrean', () => {
  it('kode nomor A-001 dan seterusnya', () => {
    expect(kodeAntrean(1)).toBe('A-001');
    expect(kodeAntrean(42)).toBe('A-042');
    expect(kodeAntrean(1234)).toBe('A-1234');
  });
  it('perpindahan status yang sah', () => {
    expect(aksiAntreanTersedia('menunggu')).toEqual(['panggil', 'batal']);
    expect(aksiAntreanTersedia('dipanggil')).toEqual(['panggil', 'mulai', 'batal']);
    expect(aksiAntreanTersedia('dilayani')).toEqual(['selesai']);
    expect(aksiAntreanTersedia('selesai')).toEqual([]);
    expect(aksiAntreanTersedia('batal')).toEqual([]);
    expect(bolehAksiAntrean('menunggu', 'mulai')).toBe(false);
  });
  it('tahap layanan hanya maju dan tidak langsung ditutup', () => {
    expect(bolehPindahTahap('menunggu_skrining', 'pemeriksaan')).toBe(true);
    expect(bolehPindahTahap('pemeriksaan', 'kasir')).toBe(true);
    expect(bolehPindahTahap('pemeriksaan', 'menunggu_skrining')).toBe(false);
    expect(bolehPindahTahap('kasir', 'ditutup')).toBe(false);
  });
});

describe('nomor RM dan tanggal', () => {
  it('format 2-2-3 dari urutan', () => {
    expect(formatNomorRm(1)).toBe('00-00-001');
    expect(formatNomorRm(12345)).toBe('00-12-345');
    expect(formatNomorRm(1234567)).toBe('12-34-567');
  });
  it('hari antrean menurut Asia/Jakarta', () => {
    expect(tanggalWib(new Date('2026-10-25T16:59:00Z'))).toBe('2026-10-25');
    expect(tanggalWib(new Date('2026-10-25T17:00:00Z'))).toBe('2026-10-26');
  });
  it('umur penuh', () => {
    expect(umurTahun('1990-10-26', new Date('2026-10-25T05:00:00Z'))).toBe(35);
    expect(umurTahun('1990-10-25', new Date('2026-10-25T05:00:00Z'))).toBe(36);
    expect(umurTahun('2030-01-01', new Date('2026-10-25T05:00:00Z'))).toBe(0);
  });
});

const consent = { teks_persetujuan_id: 1, bentuk: 'tertulis', penandatangan: 'pasien', setuju: true };
const dasar = { nama: 'Siti', tanggal_lahir: '1990-05-01', jenis_kelamin: 'perempuan', nik: '3201010101900001', persetujuan: consent };

describe('skema registrasi pasien', () => {
  const uji = (o: object) => registrasiPasienMasukan.safeParse({ ...dasar, ...o });
  const jalur = (r: ReturnType<typeof uji>) => (r.success ? [] : r.error.issues.map((i) => i.path.join('.')));

  it('jalur NIK sah dan kosong menjadi tanpa NIK memerlukan jalur lain', () => {
    expect(uji({}).success).toBe(true);
    expect(jalur(uji({ nik: '' }))).toEqual(['nik']);
    expect(jalur(uji({ nik: '123' }))).toContain('nik');
  });
  it('paspor dan KITAS wajib nomor; tanpa identitas tidak boleh ber-NIK', () => {
    expect(jalur(uji({ jalur_identitas: 'paspor', nik: undefined }))).toEqual(['nomor_paspor']);
    expect(uji({ jalur_identitas: 'paspor', nik: undefined, nomor_paspor: 'A123' }).success).toBe(true);
    expect(jalur(uji({ jalur_identitas: 'kitas', nik: undefined }))).toEqual(['nomor_kitas']);
    expect(uji({ jalur_identitas: 'tanpa_identitas', nik: undefined }).success).toBe(true);
    expect(jalur(uji({ jalur_identitas: 'tanpa_identitas' }))).toEqual(['nik']);
    expect(statusIdentitasDari('tanpa_identitas')).toBe('sementara');
    expect(statusIdentitasDari('nik')).toBe('lengkap');
  });
  it('pasien tidak cakap wajib wali dan penandatangan wali', () => {
    expect(jalur(uji({ tidak_cakap: true }))).toEqual(expect.arrayContaining(['wali', 'persetujuan.penandatangan']));
    const wali = [{ hubungan: 'Ibu', nama: 'Rina' }];
    expect(uji({ tidak_cakap: true, wali, persetujuan: { ...consent, penandatangan: 'wali', wali_ke: 0 } }).success).toBe(true);
    expect(jalur(uji({ wali, persetujuan: { ...consent, penandatangan: 'wali', wali_ke: 3 } }))).toEqual(['persetujuan.wali_ke']);
  });
  it('general consent wajib disetujui dan tanggal lahir tidak di masa depan', () => {
    expect(jalur(uji({ persetujuan: { ...consent, setuju: false } }))).toContain('persetujuan.setuju');
    expect(uji({ tanggal_lahir: '2999-01-01' }).success).toBe(false);
    expect(uji({ tanggal_lahir: '2026-02-31' }).success).toBe(false);
    expect(uji({ tanggal_lahir: '1950-01-01' }).success).toBe(true);
  });
});

describe('skema kunjungan dan penyaring', () => {
  it('rawat jalan wajib poli; SEP hanya untuk JKN', () => {
    expect(kunjunganMasukan.safeParse({ pasien_id: 1, jenis: 'AMB' }).success).toBe(false);
    expect(kunjunganMasukan.safeParse({ pasien_id: 1, jenis: 'AMB', lokasi_id: 2 }).success).toBe(true);
    expect(kunjunganMasukan.safeParse({ pasien_id: 1, jenis: 'IMP' }).success).toBe(true);
    expect(kunjunganMasukan.safeParse({ pasien_id: 1, jenis: 'IMP', nomor_sep: 'X' }).success).toBe(false);
    const jkn = kunjunganMasukan.safeParse({ pasien_id: 1, jenis: 'IMP', cara_pembayaran: 'jkn', nomor_sep: '' });
    expect(jkn.success).toBe(true);
  });
  it('filter pasien bawaan dan cek duplikat menerima isian kosong', () => {
    expect(filterPasien.parse({})).toEqual({ tahap: 'semua', halaman: 1, ukuran: 20 });
    expect(filterPasien.parse({ cari: '', tahap: '' }).tahap).toBe('semua');
    expect(filterPasien.safeParse({ tahap: 'lain' }).success).toBe(false);
    expect(cekDuplikatMasukan.parse({ nik: '', nama: ' ' })).toEqual({});
  });
});
