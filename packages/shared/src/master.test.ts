import { DEFINISI_MASTER, FITUR_IZIN, IZIN_AWAL, JENIS_AKUN_AWAL, MASTER, SKEMA_MASTER, SKEMA_MASTER_UBAH, filterMaster, profilKlinikMasukan, teksSelMaster } from './index';

describe('skema master', () => {
  it('poli: nama wajib, status bawaan operasional', () => {
    expect(SKEMA_MASTER.poli.safeParse({ nama: '' }).success).toBe(false);
    expect(SKEMA_MASTER.poli.parse({ nama: 'Umum' }).status_operasional).toBe('O');
  });
  it('bed wajib induk; ruang induk opsional', () => {
    expect(SKEMA_MASTER.bed.safeParse({ nama: 'B' }).success).toBe(false);
    expect(SKEMA_MASTER.ruang.safeParse({ nama: 'R' }).success).toBe(true);
  });
  it('praktisi: pengguna wajib saat tambah, tidak saat ubah', () => {
    const profil = { profesi: 'Dokter', nomor_sip: 'S1', masa_berlaku_sip: '2027-01-01' };
    expect(SKEMA_MASTER.praktisi.safeParse(profil).success).toBe(false);
    expect(SKEMA_MASTER_UBAH.praktisi.safeParse(profil).success).toBe(true);
  });
  it('jadwal: hari 1-7, jam sah dan berurutan, kuota minimal 1, periode berurutan', () => {
    const j = { pengguna_id: 1, lokasi_id: 2, hari: 1, jam_mulai: '08:00', jam_selesai: '12:00', kuota: 10, berlaku_dari: '2026-01-01' };
    expect(SKEMA_MASTER.jadwal.safeParse(j).success).toBe(true);
    expect(SKEMA_MASTER.jadwal.safeParse({ ...j, hari: 8 }).success).toBe(false);
    expect(SKEMA_MASTER.jadwal.safeParse({ ...j, jam_mulai: '8:00' }).success).toBe(false);
    expect(SKEMA_MASTER.jadwal.safeParse({ ...j, jam_selesai: '08:00' }).success).toBe(false);
    expect(SKEMA_MASTER.jadwal.safeParse({ ...j, kuota: 0 }).success).toBe(false);
    expect(SKEMA_MASTER.jadwal.safeParse({ ...j, berlaku_sampai: '2025-12-31' }).success).toBe(false);
  });
  it('tarif: jenis dan harga', () => {
    const t = { kode: 'K', nama: 'N', jenis: 'kamar', harga_umum: 100 };
    expect(SKEMA_MASTER.tarif.parse(t).harga_jkn).toBeUndefined();
    expect(SKEMA_MASTER.tarif.safeParse({ ...t, jenis: 'obat' }).success).toBe(false);
    expect(SKEMA_MASTER.tarif.safeParse({ ...t, harga_umum: 1.5 }).success).toBe(false);
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

describe('teks sel master', () => {
  it('memformat hari, jam, periode, harga, dan asal wilayah', () => {
    const j = { id: 1, aktif: true, hari: 3, jam_mulai: '08:00', jam_selesai: '10:00', berlaku_dari: '2026-01-01', berlaku_sampai: null };
    expect(teksSelMaster('hari', j)).toBe(MASTER.hari[3]);
    expect(teksSelMaster('jam', j)).toBe('08:00-10:00');
    expect(teksSelMaster('periode', j)).toBe('2026-01-01 s/d -');
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
