import {
  alergiTercatat, berartiTidakAda, DEFAULT_KEPERAWATAN, hasilRisikoGizi, hasilRisikoJatuh, isiDefault, isianDiubah, jumlahDiubah, keperawatanIsi, kembalikanNormal, samaDenganDefault,
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
    expect(h).toMatchObject({ kajian_keperawatan: 'keadaan umum baik', alergi: 'tidak ada', nyeri_jenis: 'tidak', nyeri_skala: null, jatuh_menopang: false, diagnosa_keperawatan: null, skrining_visual: null });
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

  it('hasil risiko jatuh dan gizi dihitung', () => {
    expect(hasilRisikoJatuh({ jatuh_tidak_seimbang: false, jatuh_menopang: false })).toBe('tidak_berisiko');
    expect(hasilRisikoJatuh({ jatuh_tidak_seimbang: true, jatuh_menopang: false })).toBe('risiko_rendah');
    expect(hasilRisikoJatuh({ jatuh_tidak_seimbang: false, jatuh_menopang: true })).toBe('risiko_rendah');
    expect(hasilRisikoJatuh({ jatuh_tidak_seimbang: true, jatuh_menopang: true })).toBe('risiko_tinggi');
    expect(hasilRisikoGizi({ gizi_bb_turun: false, gizi_asupan_kurang: false })).toBe('tidak_berisiko');
    expect(hasilRisikoGizi({ gizi_bb_turun: false, gizi_asupan_kurang: true })).toBe('berisiko');
  });
});
