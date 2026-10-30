import type { KandidatDuplikatDto } from '@klira/shared';
import {
  awalRegistrasi, BIDANG_SENSITIF_REGISTRASI, bentukRegistrasi, bisaCariDuplikat, galatRegistrasi, hapusWali, isianCariDuplikat, ringkasanRegistrasi, ubahJalur, ubahTidakCakap,
} from './keadaan-registrasi';
import { saringSensitif } from '../../util/draf';
import type { KeadaanRegistrasi } from './keadaan-registrasi';
import { awalKunjungan, bentukKunjungan, galatKunjungan, ubahKunjungan } from './keadaan-kunjungan';

const sah = (p: Partial<KeadaanRegistrasi> = {}): KeadaanRegistrasi => ({
  ...awalRegistrasi(), nama: 'Siti', nik: '3201010101900001', tanggal_lahir: '1990-05-01', ibu_kandung: 'Rina', jenis_kelamin: 'perempuan', setuju: true, ...p,
});
const kandidat = (alasan: 'nik' | 'nama_lahir_ibu'): KandidatDuplikatDto => ({ id: 1, nomor_rm: '00-00-001', nama: 'Siti', tanggal_lahir: '1990-05-01', alasan });

describe('galat registrasi per langkah', () => {
  it('isian awal: identitas dan general consent bermasalah, langkah lain sah', () => {
    const g = galatRegistrasi(awalRegistrasi(), 1, null);
    expect(g.perLangkah[0]).toBeTruthy();
    expect(g.perLangkah[4]).toBeTruthy();
    expect([1, 2, 3].map((i) => g.perLangkah[i])).toEqual([null, null, null]);
    expect(g.bidang.nama).toBeTruthy();
    expect(g.bidang['persetujuan.setuju']).toBeTruthy();
  });
  it('isian lengkap sah', () => {
    expect(galatRegistrasi(sah(), 1, null).perLangkah).toEqual(Array(6).fill(null));
  });
  it('teks persetujuan belum termuat menahan langkah consent', () => {
    expect(galatRegistrasi(sah(), null, null).perLangkah[4]).toBeTruthy();
  });
  it('jalur identitas khusus: paspor butuh nomor di langkah identitas; tanpa identitas tidak butuh NIK', () => {
    const paspor = galatRegistrasi(sah({ jalur_identitas: 'paspor', nik: '' }), 1, null);
    expect(awalRegistrasi().jalur_identitas).toBe('nik');
    expect(paspor.perLangkah[0]).toBeTruthy();
    expect(paspor.perLangkah[2]).toBeNull();
    expect(paspor.bidang.nomor_paspor).toBeTruthy();
    expect(galatRegistrasi(sah({ jalur_identitas: 'paspor', nik: '', nomor_paspor: 'A1' }), 1, null).perLangkah).toEqual(Array(6).fill(null));
    expect(galatRegistrasi(sah({ jalur_identitas: 'tanpa_identitas', nik: '' }), 1, null).perLangkah).toEqual(Array(6).fill(null));
  });
  it('tidak cakap butuh wali di langkah wali dan penandatangan wali', () => {
    const k = ubahTidakCakap(sah(), true);
    expect(k.penandatangan).toBe('wali');
    expect(galatRegistrasi(k, 1, null).perLangkah[2]).toBeTruthy();
    const lengkap = { ...k, wali: [{ hubungan: 'Ibu', nama: 'Rina', kontak: '' }], wali_ke: '0' };
    expect(galatRegistrasi(lengkap, 1, null).perLangkah).toEqual(Array(6).fill(null));
    expect(galatRegistrasi({ ...lengkap, wali_ke: '' }, 1, null).perLangkah[4]).toBeTruthy();
  });
  it('duplikat: NIK sama memblokir; nama-lahir-ibu butuh pernyataan berbeda', () => {
    expect(galatRegistrasi(sah(), 1, [kandidat('nik')]).perLangkah[0]).toBeTruthy();
    expect(galatRegistrasi(sah({ konfirmasi_duplikat: true }), 1, [kandidat('nik')]).perLangkah[0]).toBeTruthy();
    expect(galatRegistrasi(sah(), 1, [kandidat('nama_lahir_ibu')]).perLangkah[0]).toBeTruthy();
    expect(galatRegistrasi(sah({ konfirmasi_duplikat: true }), 1, [kandidat('nama_lahir_ibu')]).perLangkah[0]).toBeNull();
    expect(galatRegistrasi(sah(), 1, []).perLangkah[0]).toBeNull();
  });
});

describe('bentuk registrasi dan bantuan isian', () => {
  it('permintaan dari isian: wali penandatangan menjadi indeks, NIK dibuang untuk tanpa identitas', () => {
    const k = { ...sah({ jalur_identitas: 'tanpa_identitas', nik: '3201010101900001' }), penandatangan: 'wali' as const, wali_ke: '1', wali: [{ hubungan: 'A', nama: 'A', kontak: '' }, { hubungan: 'B', nama: 'B', kontak: '' }] };
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
    const dasar = { ...sah(), wali, penandatangan: 'wali' as const, tidak_cakap: true };
    expect(hapusWali({ ...dasar, wali_ke: '2' }, 0)).toMatchObject({ wali_ke: '1' });
    expect(hapusWali({ ...dasar, wali_ke: '1' }, 1)).toMatchObject({ wali_ke: '' });
    expect(hapusWali({ ...dasar, wali_ke: '0' }, 2)).toMatchObject({ wali_ke: '0' });
    const satu = { ...sah(), wali: wali.slice(0, 1), penandatangan: 'wali' as const, wali_ke: '0' };
    expect(hapusWali(satu, 0)).toMatchObject({ penandatangan: 'pasien', wali_ke: '' });
  });
  it('pencarian duplikat butuh NIK 16 digit atau nama+tanggal lahir+ibu', () => {
    expect(bisaCariDuplikat(awalRegistrasi())).toBe(false);
    expect(bisaCariDuplikat(sah({ nik: '123' }))).toBe(true);
    expect(bisaCariDuplikat(sah({ nik: '123', ibu_kandung: '' }))).toBe(false);
    expect(bisaCariDuplikat(sah({ nik: '3201010101900001', nama: '' }))).toBe(true);
    expect(isianCariDuplikat(sah({ nik: '12', nama: ' Siti ' }))).toEqual({ nama: 'Siti', tanggal_lahir: '1990-05-01', ibu_kandung: 'Rina' });
  });
  it('ringkasan memuat identitas, wali, dan general consent', () => {
    const k = { ...sah({ jalur_identitas: 'tanpa_identitas', nik: '' }), wali: [{ hubungan: 'Ibu', nama: 'Rina', kontak: '0812' }], penandatangan: 'wali' as const, wali_ke: '0' };
    const r = ringkasanRegistrasi(k, { id: 1, jenis: 'general', versi: 3, judul: 'GC', tujuan: 't', isi: 'i' });
    expect(r.map((b) => b.judul)).toHaveLength(6);
    expect(r[0].baris.find((b) => b.label === 'Status identitas')?.nilai).toBe('Identitas sementara');
    expect(r[3].baris[0]).toEqual({ label: 'Ibu', nilai: 'Rina (0812)' });
    expect(r[5].baris).toEqual(expect.arrayContaining([{ label: 'Versi teks 3', nilai: 'GC' }, { label: 'Penandatangan', nilai: 'Rina' }]));
  });
});

describe('pendaftaran kunjungan', () => {
  it('rawat jalan wajib poli; IMP tidak membawa poli; SEP hanya JKN', () => {
    const k = awalKunjungan(7);
    expect(bentukKunjungan(k)).not.toHaveProperty('dpjp_id');
    expect(galatKunjungan(k)).toEqual({ lokasi_id: expect.any(String) });
    expect(galatKunjungan({ ...k, lokasi_id: '3' })).toEqual({});
    expect(galatKunjungan(awalKunjungan())).toHaveProperty('pasien_id');
    expect(bentukKunjungan({ ...k, jenis: 'IMP', lokasi_id: '3', nomor_sep: 'X' })).toMatchObject({ lokasi_id: undefined, nomor_sep: undefined });
    expect(bentukKunjungan({ ...k, lokasi_id: '3', cara_pembayaran: 'jkn', nomor_sep: ' S1 ' })).toMatchObject({ pasien_id: 7, lokasi_id: 3, nomor_sep: ' S1 ' });
    expect(galatKunjungan({ ...k, jenis: 'IMP' })).toEqual({});
  });
  it('ubah membersihkan isian yang tidak berlaku', () => {
    const k = { ...awalKunjungan(1), lokasi_id: '3', cara_pembayaran: 'jkn' as const, nomor_sep: 'S' };
    expect(ubahKunjungan(k, { cara_pembayaran: 'umum' }).nomor_sep).toBe('');
    expect(ubahKunjungan(k, { jenis: 'IMP' }).lokasi_id).toBe('');
  });

});

describe('draf registrasi tanpa data sensitif', () => {
  it('NIK, ibu kandung, kontak wali, dan JKN tidak ikut tersimpan', () => {
    const k = { ...awalRegistrasi(), nik: '3201', ibu_kandung: 'Rina', jkn_nomor_kartu: '000', wali: [{ hubungan: 'ibu', nama: 'R', kontak: '0812' }], agama: 'Islam' };
    const aman = JSON.stringify(saringSensitif(k, BIDANG_SENSITIF_REGISTRASI));
    for (const rahasia of ['3201', 'Rina', '000', '0812']) expect(aman).not.toContain(rahasia);
    expect(aman).toContain('Islam');
  });
});
