import type { KlinisKunjunganDto } from '@klira/shared';
import { BAGIAN_KLINIS, DEFAULT_KEPERAWATAN, KLINIS, SKEMA_BAGIAN } from '@klira/shared';
import {
  defaultKeperawatan, keperawatanDiubah, keperawatanKosong, keperawatanNormal, kosongKeperawatan, ringkasanKeperawatan, ubahJenisNyeri,
} from './keadaan-keperawatan';
import {
  adaPerubahanBagian, galatBagian, isiBagian, keadaanAwalForm, keadaanDariServer, mulaiUbahKeperawatan, pulihkanKeadaan, rencanaSimpan, ringkasanIsi,
} from './keadaan-pemeriksaan';

const kosongServer = (): KlinisKunjunganDto['bagian'] =>
  Object.fromEntries(BAGIAN_KLINIS.map((b) => [b, { bagian: b, isi: null, pengesahan: null, verifikasi: 'belum_disahkan' }])) as unknown as KlinisKunjunganDto['bagian'];
const tak = Object.fromEntries(BAGIAN_KLINIS.map((b) => [b, false])) as Record<(typeof BAGIAN_KLINIS)[number], boolean>;
const tersimpan = { ...SKEMA_BAGIAN.keperawatan.parse({ ...DEFAULT_KEPERAWATAN, alergi: 'Penisilin', nyeri_jenis: 'akut', nyeri_skala: 4, nyeri_lokasi: 'Kepala' }) };
const denganKeperawatan = () => {
  const b = kosongServer();
  (b as Record<string, unknown>).keperawatan = { bagian: 'keperawatan', isi: tersimpan, pengesahan: { versi: 1 }, verifikasi: 'sah' };
  return b;
};

describe('form keperawatan: default keadaan baik', () => {
  it('skrining baru terisi default; isi tersimpan tidak ditimpa; mode periksa tidak mengisi default', () => {
    const baru = keadaanAwalForm('skrining', kosongServer());
    expect(baru.keperawatan).toMatchObject({ kajian_keperawatan: 'keadaan umum baik', alergi: 'tidak ada', telah_diobati: 'tidak ada', obat_dikonsumsi: 'tidak ada', nyeri_jenis: 'tidak', diagnosa_keperawatan: '' });
    expect(keperawatanDiubah(baru.keperawatan)).toEqual([]);
    expect(keadaanAwalForm('skrining', denganKeperawatan()).keperawatan).toMatchObject({ alergi: 'Penisilin', nyeri_skala: '4', nyeri_lokasi: 'Kepala' });
    expect(keperawatanKosong(keadaanAwalForm('periksa', kosongServer()).keperawatan)).toBe(true);
  });

  it('draf menimpa default (form dengan draf tidak diisi ulang default)', () => {
    const awal = keadaanAwalForm('skrining', kosongServer());
    const draf = { ...awal, keperawatan: { ...awal.keperawatan, alergi: 'Debu', kajian_keperawatan: '' } };
    expect(pulihkanKeadaan(awal, JSON.parse(JSON.stringify(draf))).keperawatan).toMatchObject({ alergi: 'Debu', kajian_keperawatan: '' });
  });

  it('default skrining ikut disimpan walau tidak diubah; tanpa isian dokter tidak menyimpan keperawatan', () => {
    const server = keadaanDariServer(kosongServer());
    const k = keadaanAwalForm('skrining', kosongServer());
    expect(rencanaSimpan('skrining', k, server, tak)).toEqual([{ bagian: 'keperawatan', galat: null }]);
    expect(rencanaSimpan('periksa', keadaanAwalForm('periksa', kosongServer()), server, tak)).toEqual([]);
    // dokter membuka isian keperawatan yang belum diisi: mulai dari default
    const dibuka = mulaiUbahKeperawatan(keadaanAwalForm('periksa', kosongServer()));
    expect(dibuka.keperawatan).toEqual(defaultKeperawatan());
    const sudah = keadaanAwalForm('periksa', denganKeperawatan());
    expect(mulaiUbahKeperawatan(sudah)).toBe(sudah);
  });

  it('bolak-balik isi tersimpan tidak dianggap berubah', () => {
    const k = keadaanDariServer(denganKeperawatan());
    expect(adaPerubahanBagian('keperawatan', k, keadaanDariServer(denganKeperawatan()))).toBe(false);
    expect(SKEMA_BAGIAN.keperawatan.parse(isiBagian('keperawatan', k))).toEqual(tersimpan);
  });
});

describe('penanda diubah dan Semua normal', () => {
  it('menghitung isian berbeda dari default (huruf besar/kecil diabaikan), per kelompok dan seluruhnya', () => {
    const k = { ...defaultKeperawatan(), alergi: 'Penisilin', telah_diobati: '  Tidak Ada ', jatuh_menopang: true, diagnosa_keperawatan: 'Nyeri akut' };
    expect(keperawatanDiubah(k)).toEqual(['alergi', 'jatuh_menopang']);
    expect(keperawatanDiubah(k, 'kajian')).toEqual(['alergi']);
    expect(keperawatanDiubah(k, 'asuhan')).toEqual([]);
    // dikosongkan juga ditandai
    expect(keperawatanDiubah({ ...defaultKeperawatan(), kajian_keperawatan: '' })).toEqual(['kajian_keperawatan']);
  });

  it('Semua normal satu kelompok; Kembalikan semua tidak menyentuh isian tanpa default', () => {
    const k = { ...ubahJenisNyeri(defaultKeperawatan(), 'kronis'), nyeri_skala: '7', nyeri_lokasi: 'Lutut', alergi: 'Penisilin', gizi_bb_turun: true, rencana_asuhan: 'Edukasi' };
    const nyeri = keperawatanNormal(k, 'nyeri');
    expect(nyeri).toMatchObject({ nyeri_jenis: 'tidak', nyeri_skala: '', nyeri_lokasi: '', alergi: 'Penisilin', gizi_bb_turun: true });
    const semua = keperawatanNormal(k);
    expect(keperawatanDiubah(semua)).toEqual([]);
    expect(semua.rencana_asuhan).toBe('Edukasi');
  });

  it('tidak nyeri mengosongkan isian nyeri lain; skala wajib bila nyeri', () => {
    const k = keadaanAwalForm('skrining', kosongServer());
    k.keperawatan = ubahJenisNyeri(k.keperawatan, 'akut');
    expect(galatBagian('keperawatan', k)).toMatch(/skala/i);
    k.keperawatan = { ...k.keperawatan, nyeri_skala: '5', nyeri_lokasi: 'Perut' };
    expect(galatBagian('keperawatan', k)).toBeNull();
    expect(ubahJenisNyeri(k.keperawatan, 'tidak')).toMatchObject({ nyeri_jenis: 'tidak', nyeri_skala: '', nyeri_lokasi: '' });
  });
});

describe('ringkasan keperawatan', () => {
  it('hasil risiko jatuh dan gizi dihitung; nyeri rinci hanya bila nyeri; masuk ringkasan akhir bila terisi', () => {
    const k = { ...defaultKeperawatan(), jatuh_tidak_seimbang: true, jatuh_menopang: true, gizi_asupan_kurang: true };
    const r = ringkasanKeperawatan(k);
    expect(r.baris).toEqual(expect.arrayContaining([
      { label: 'Risiko jatuh (Get Up and Go)', nilai: 'Risiko tinggi (Ya/Ya)' },
      { label: 'Skrining gizi', nilai: 'Berisiko malnutrisi (Tidak/Ya)' },
      { label: 'Nyeri', nilai: 'Tidak nyeri' },
    ]));
    expect(r.baris.map((b) => b.label)).not.toContain('Lokasi');
    const awal = keadaanDariServer(kosongServer());
    expect(ringkasanIsi(awal)[0].judul).toBe(KLINIS.langkah.anamnesis);
    expect(ringkasanIsi({ ...awal, keperawatan: k })[0].judul).toBe('Skrining keperawatan');
    expect(keperawatanKosong(kosongKeperawatan())).toBe(true);
  });
});
