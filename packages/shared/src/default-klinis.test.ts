import {
  bidangKelompok, DEFAULT_ANAMNESIS, DEFAULT_PEMERIKSAAN, DEFINISI_PEMERIKSAAN, KELOMPOK_PEMERIKSAAN, PEMERIKSAAN_BIDANG, pemeriksaanIsi, anamnesisIsi, ringkasanPemeriksaan,
  alergiTercatat, berartiTidakAda, DEFAULT_KEPERAWATAN, hasilRisikoGizi, isiDefault, isianDiubah, jumlahDiubah, keperawatanIsi, kembalikanNormal, samaDenganDefault,
} from './index';

describe('default keadaan baik (util bersama)', () => {
  const kosong = { a: '', b: '', c: false, d: '', bebas: '' };
  const bawaan = { a: 'tidak ada', b: 'vesikuler', c: false, d: null } as const;

  it('form baru diisi default; teks null menjadi kosong; isian tanpa default tidak disentuh', () => {
    expect(isiDefault(kosong, bawaan)).toEqual({ a: 'tidak ada', b: 'vesikuler', c: false, d: '', bebas: '' });
  });

  it('penanda diubah mengabaikan huruf besar/kecil dan spasi; null sama dengan kosong', () => {
    expect(samaDenganDefault(' Tidak  Ada ', 'tidak ada')).toBe(true);
    expect(samaDenganDefault('', null)).toBe(true);
    expect(samaDenganDefault('x', undefined)).toBe(true);
    const nilai = { ...isiDefault(kosong, bawaan), a: 'Penisilin', c: true, bebas: 'apa saja' };
    expect(isianDiubah(nilai, bawaan)).toEqual(['a', 'c']);
    expect(jumlahDiubah(nilai, bawaan)).toBe(2);
    expect(jumlahDiubah(nilai, bawaan, ['b', 'c'])).toBe(1);
    // dikosongkan juga dihitung diubah
    expect(isianDiubah({ ...nilai, b: '' }, bawaan, ['b'])).toEqual(['b']);
  });

  it('Semua normal per kelompok dan kembalikan semua', () => {
    const nilai = { a: 'Penisilin', b: 'ronki', c: true, d: 'x', bebas: 'tetap' };
    expect(kembalikanNormal(nilai, bawaan, ['a', 'c'])).toEqual({ a: 'tidak ada', b: 'ronki', c: false, d: 'x', bebas: 'tetap' });
    expect(kembalikanNormal(nilai, bawaan)).toEqual({ a: 'tidak ada', b: 'vesikuler', c: false, d: '', bebas: 'tetap' });
  });

  it('berarti "tidak ada"', () => {
    expect(berartiTidakAda('  TIDAK ada ')).toBe(true);
    expect(berartiTidakAda('Penisilin')).toBe(false);
    expect(berartiTidakAda(null)).toBe(false);
  });

  it('konteks alergi: default "tidak ada" dan kosong berarti tanpa alergi', () => {
    expect(alergiTercatat('Tidak ada')).toBeNull();
    expect(alergiTercatat(' tidak  ADA ')).toBeNull();
    expect(alergiTercatat('  ')).toBeNull();
    expect(alergiTercatat(null)).toBeNull();
    expect(alergiTercatat(' Penisilin, debu ')).toBe('Penisilin, debu');
  });
});

describe('skrining keperawatan (P6)', () => {
  it('default lolos skema; isian kosong menjadi null dan boolean false', () => {
    const h = keperawatanIsi.parse(DEFAULT_KEPERAWATAN);
    expect(h).toMatchObject({ kajian_keperawatan: 'keadaan umum baik', alergi: 'tidak ada', nyeri_jenis: 'tidak', nyeri_skala: null, gizi_bb_turun: false, diagnosa_keperawatan: null, skrining_visual: null });
    expect(keperawatanIsi.parse({})).toMatchObject({ nyeri_jenis: 'tidak', gizi_bb_turun: false, alergi: null });
  });

  it('nyeri bersyarat: skala wajib bila nyeri; tidak nyeri menyimpan isian nyeri lain null', () => {
    expect(keperawatanIsi.safeParse({ nyeri_jenis: 'akut' }).success).toBe(false);
    expect(keperawatanIsi.safeParse({ nyeri_jenis: 'akut', nyeri_skala: '11' }).success).toBe(false);
    expect(keperawatanIsi.parse({ nyeri_jenis: 'kronis', nyeri_skala: '6', nyeri_lokasi: 'Lutut' })).toMatchObject({ nyeri_skala: 6, nyeri_lokasi: 'Lutut' });
    expect(keperawatanIsi.parse({ nyeri_jenis: 'tidak', nyeri_skala: 6, nyeri_lokasi: 'Lutut' })).toMatchObject({ nyeri_skala: null, nyeri_lokasi: null });
    expect(keperawatanIsi.safeParse({ skrining_visual: 'ungu' }).success).toBe(false);
    expect(keperawatanIsi.safeParse({ alergi: 'x'.repeat(501) }).success).toBe(false);
  });

  it('hasil risiko gizi dihitung', () => {
    expect(hasilRisikoGizi({ gizi_bb_turun: false, gizi_asupan_kurang: false })).toBe('tidak_berisiko');
    expect(hasilRisikoGizi({ gizi_bb_turun: false, gizi_asupan_kurang: true })).toBe('berisiko');
  });
});

describe('isian dokter mengikuti formulir (P7)', () => {
  it('definisi pemeriksaan: kunci unik, muat di kolom bidang (VarChar 50), setiap kelompok punya bidang', () => {
    expect(new Set(PEMERIKSAAN_BIDANG).size).toBe(PEMERIKSAAN_BIDANG.length);
    expect(PEMERIKSAAN_BIDANG.every((k) => k.length <= 50)).toBe(true);
    for (const k of KELOMPOK_PEMERIKSAAN) expect(bidangKelompok(k.kunci).length).toBeGreaterThan(0);
    
  });

  it('default pemeriksaan sesuai formulir dan lolos skema; odontogram tanpa default', () => {
    expect(DEFAULT_PEMERIKSAAN).toMatchObject({ mata_konjungtiva: 'tidak anemis', paru_bunyi: 'vesikuler', ekstremitas_akral: 'hangat', tht_tonsil_kanan: 'T1', lokalis_ukuran: 'tidak ada' });
    expect(DEFAULT_PEMERIKSAAN).not.toHaveProperty('odontogram_tanggal');
    expect(Object.keys(DEFAULT_PEMERIKSAAN)).toHaveLength(DEFINISI_PEMERIKSAAN.length - 1);
    expect(pemeriksaanIsi.parse({ ...DEFAULT_PEMERIKSAAN })).toMatchObject({ ...DEFAULT_PEMERIKSAAN, odontogram_tanggal: null });
  });

  it('penanda diubah dan Semua normal per kelompok pemeriksaan', () => {
    const isi = { ...DEFAULT_PEMERIKSAAN, mata_konjungtiva: 'anemis', paru_rhonki: 'basah halus di basal', paru_bunyi: ' Vesikuler ', odontogram_tanggal: '' };
    expect(isianDiubah(isi, DEFAULT_PEMERIKSAAN)).toEqual(['mata_konjungtiva', 'paru_rhonki']);
    expect(jumlahDiubah(isi, DEFAULT_PEMERIKSAAN, bidangKelompok('paru') as (keyof typeof DEFAULT_PEMERIKSAAN)[])).toBe(1);
    const mata = kembalikanNormal(isi, DEFAULT_PEMERIKSAAN, bidangKelompok('mata') as (keyof typeof DEFAULT_PEMERIKSAAN)[]);
    expect(mata.mata_konjungtiva).toBe('tidak anemis');
    expect(mata.paru_rhonki).toBe('basah halus di basal');
    // Isian dikosongkan dihitung diubah (tersimpan null).
    expect(isianDiubah({ ...DEFAULT_PEMERIKSAAN, tht_serumen: '' }, DEFAULT_PEMERIKSAAN)).toEqual(['tht_serumen']);
  });

  it('default anamnesa: riwayat dahulu dan keluarga "tidak ada" saja', () => {
    expect(DEFAULT_ANAMNESIS).toEqual({ riwayat_pribadi: 'tidak ada', riwayat_keluarga: 'tidak ada' });
    expect(isiDefault({ keluhan_utama: '', penyerta: '', riwayat_sekarang: '', riwayat_pribadi: '', riwayat_keluarga: '', kajian_sosial: '' }, DEFAULT_ANAMNESIS))
      .toEqual({ keluhan_utama: '', penyerta: '', riwayat_sekarang: '', riwayat_pribadi: 'tidak ada', riwayat_keluarga: 'tidak ada', kajian_sosial: '' });
    expect(anamnesisIsi.safeParse({ ...DEFAULT_ANAMNESIS }).success).toBe(false); // keluhan utama tetap wajib
  });

  it('ringkasan pemeriksaan per kelompok: kelompok normal menjadi satu kalimat, yang diubah ditandai', () => {
    const r = ringkasanPemeriksaan({ ...DEFAULT_PEMERIKSAAN, paru_rhonki: 'basah halus', odontogram_tanggal: '2026-11-01' });
    expect(r.map((k) => k.kelompok)).toEqual(KELOMPOK_PEMERIKSAAN.map((k) => k.kunci));
    const mata = r.find((k) => k.kelompok === 'mata')!;
    expect(mata).toMatchObject({ normal: true, kalimat: 'Konjungtiva tidak anemis, sklera tidak ikterik, lain-lain tidak ada' });
    const paru = r.find((k) => k.kelompok === 'paru')!;
    expect(paru.normal).toBe(false);
    expect(paru.kalimat).toBeNull();
    expect(paru.baris.find((b) => b.kunci === 'paru_rhonki')).toMatchObject({ nilai: 'basah halus', diubah: true });
    const odo = r.find((k) => k.kelompok === 'odontogram')!;
    expect(odo).toMatchObject({ normal: false, kalimat: null });
    expect(odo.baris[0]).toMatchObject({ nilai: '2026-11-01', diubah: false });
    expect(ringkasanPemeriksaan(null).find((k) => k.kelompok === 'odontogram')).toMatchObject({ normal: true, kalimat: null });
  });
});
