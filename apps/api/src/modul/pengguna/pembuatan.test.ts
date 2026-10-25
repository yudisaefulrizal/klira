import { AKUN_BARU, penggunaBaru } from '@klira/shared';
import type { EntriAudit } from '../../middleware/audit';
import { buatKataSandiAwal } from './kata-sandi-awal';
import { buatLayananPembuatanAkun } from './pembuatan';
import { KonflikAkun, bidangKonflik } from './repositori-baru';
import type { DataAkunBaru, RepositoriAkunBaru } from './repositori-baru';

const SANDI = 'Rahasia-Uji-77';
const izinCat = [
  { id: 1, fitur: 'resep', aksi: 'input' as const, cakupan: 'unit' as const },
  { id: 2, fitur: 'pendaftaran', aksi: 'lihat' as const, cakupan: 'unit' as const },
];
const jenis = [
  { id: 10, fasyankes_id: 7, nama: 'Dokter/DPJP', syarat_profesi: 'dokter ber-SIP', aktif: true, diubah_oleh: null, alasan_perubahan: null, dibuat_pada: new Date(), izin: [izinCat[0]] },
  { id: 11, fasyankes_id: 7, nama: 'Petugas pendaftaran', syarat_profesi: null, aktif: true, diubah_oleh: null, alasan_perubahan: null, dibuat_pada: new Date(), izin: [izinCat[1]] },
  { id: 12, fasyankes_id: 7, nama: 'Nonaktif', syarat_profesi: null, aktif: false, diubah_oleh: null, alasan_perubahan: null, dibuat_pada: new Date(), izin: [] },
];

function siapkan(opsi: { dupUsername?: boolean; dupNik?: boolean; konflikSimpan?: 'username' | 'nik' | boolean } = {}) {
  const audit: EntriAudit[] = [];
  const disimpan: DataAkunBaru[] = [];
  let hashDari = '';
  const repo: RepositoriAkunBaru = {
    cekDuplikat: async () => ({ username: !!opsi.dupUsername, nik: !!opsi.dupNik }),
    buatAkun: async (d) => {
      if (opsi.konflikSimpan) throw new KonflikAkun(opsi.konflikSimpan === 'nik' ? 'nik' : 'username');
      disimpan.push(d);
      return {
        id: 50, profil_id: d.profil ? 60 : null,
        penugasan_ids: d.penugasan.map((_, i) => 70 + i), izin_akun_ids: d.izin_akun.map((_, i) => 80 + i),
        peringatan: d.peringatan.map((w, i) => ({ id: 90 + i, jenis_peringatan: w.jenis_peringatan, alasan_pimpinan: w.alasan_pimpinan })),
      };
    },
  };
  const layanan = buatLayananPembuatanAkun({
    repo,
    repoIzin: {
      daftarJenisAkun: async () => jenis,
      izinByIds: async (ids) => izinCat.filter((i) => ids.includes(i.id)),
      cariIzin: async (fitur, aksi, cakupan) => izinCat.find((i) => i.fitur === fitur && i.aksi === aksi && i.cakupan === cakupan) ?? null,
    },
    audit: { catat: async (e) => void audit.push(e) },
    sekarang: () => new Date('2026-10-25T00:00:00Z'),
    buatKataSandi: () => SANDI,
    hash: async (k) => { hashDari = k; return `hash:${k.length}`; },
  });
  return { layanan, audit, disimpan, hashDari: () => hashDari };
}
const pelaku = { id: 1, fasyankes_id: 7 };
const dasar = {
  nama: 'Dewi Lestari', nik: '3201010101010001', username: 'dewi.l',
  penugasan: [{ jenis_akun_id: 11, mulai: '2026-10-01' }],
};
const parse = (o: object) => penggunaBaru.parse({ ...dasar, ...o });

describe('skema penggunaBaru', () => {
  it('menolak NIK bukan 16 digit, username salah format, tanpa penugasan', () => {
    expect(penggunaBaru.safeParse({ ...dasar, nik: '123' }).success).toBe(false);
    expect(penggunaBaru.safeParse({ ...dasar, username: 'a b' }).success).toBe(false);
    expect(penggunaBaru.safeParse({ ...dasar, penugasan: [] }).success).toBe(false);
    expect(penggunaBaru.safeParse({ ...dasar, penugasan: [{ jenis_akun_id: 11, mulai: '2026-10-05', selesai: '2026-10-01' }] }).success).toBe(false);
  });
  it('izin per akun wajib beralasan', () => {
    const r = penggunaBaru.safeParse({ ...dasar, izin_akun: [{ izin_id: 2, tipe: 'tambah', alasan: ' ', mulai: '2026-10-01' }] });
    expect(r.success).toBe(false);
  });
});

describe('kata sandi awal', () => {
  it('12 karakter, memuat huruf dan angka, acak', () => {
    const a = buatKataSandiAwal();
    expect(a).toMatch(/^(?=.*[A-Za-z])(?=.*\d).{12}$/);
    expect(new Set(Array.from({ length: 20 }, buatKataSandiAwal)).size).toBeGreaterThan(18);
  });
});

describe('pembuatan akun', () => {
  it('berhasil tanpa peringatan: menyimpan hash, mengembalikan kata sandi sekali, wajib ganti', async () => {
    const { layanan, disimpan, hashDari } = siapkan();
    const h = await layanan.buat(pelaku, parse({}));
    expect(h).toMatchObject({ ok: true, data: { id: 50, username: 'dewi.l', kata_sandi_awal: SANDI, peringatan: [] } });
    expect(hashDari()).toBe(SANDI);
    expect(disimpan[0].kata_sandi_hash).toBe(`hash:${SANDI.length}`);
    expect(JSON.stringify(disimpan[0])).not.toContain(SANDI);
    expect(disimpan[0]).toMatchObject({ fasyankes_id: 7, oleh: 1, profil: null });
  });

  it('peringatan tanpa alasan menjawab perlu_konfirmasi dan tidak menyimpan', async () => {
    const { layanan, disimpan, audit } = siapkan();
    const h = await layanan.buat(pelaku, parse({ penugasan: [{ jenis_akun_id: 10, mulai: '2026-10-01' }] }));
    expect(h).toMatchObject({ ok: false, kode: 'perlu_konfirmasi_peringatan' });
    if (!h.ok && h.kode === 'perlu_konfirmasi_peringatan') expect(h.peringatan.map((w) => w.jenis)).toContain('izin_klinis_non_dokter');
    expect(disimpan).toHaveLength(0);
    expect(audit).toHaveLength(0);
  });

  it('dengan alasan: peringatan tersimpan bersama akun dan tercatat di audit', async () => {
    const { layanan, disimpan, audit } = siapkan();
    const h = await layanan.buat(pelaku, parse({
      penugasan: [{ jenis_akun_id: 10, mulai: '2026-10-01' }],
      izin_akun: [{ izin_id: 2, tipe: 'tambah', alasan: 'Membantu pendaftaran', mulai: '2026-10-01' }],
      konfirmasi_peringatan: { alasan: 'Dokter tamu, SIP menyusul', terima_untuk_akun: true },
    }));
    expect(h.ok).toBe(true);
    expect(disimpan[0].peringatan[0]).toMatchObject({ alasan_pimpinan: 'Dokter tamu, SIP menyusul', diterima_untuk_akun: true });
    const aksi = audit.map((e) => `${e.aksi}:${e.entitas}`);
    expect(aksi).toEqual(expect.arrayContaining(['input:pengguna', 'input:penugasan_jenis', 'input:izin_per_akun', 'peringatan_izin:peringatan_izin']));
    expect(audit.every((e) => e.pengguna_id === 1 && e.fasyankes_id === 7)).toBe(true);
  });

  it('audit tidak memuat kata sandi maupun NIK', async () => {
    const { layanan, audit } = siapkan();
    await layanan.buat(pelaku, parse({ profil: { profesi: 'Perawat', nomor_sip: 'SIP-1' } }));
    const teks = JSON.stringify(audit);
    expect(teks).not.toContain(SANDI);
    expect(teks).not.toContain('3201010101010001');
    expect(teks).toContain('Akun dibuat: dewi.l');
  });

  it('SIP lewat masa berlaku pada jenis bersyarat memunculkan peringatan penugasan', async () => {
    const { layanan } = siapkan();
    const h = await layanan.buat(pelaku, parse({
      profil: { profesi: 'Dokter', nomor_sip: 'SIP-9', masa_berlaku_sip: '2026-12-31' },
      penugasan: [{ jenis_akun_id: 10, mulai: '2026-10-01', selesai: '2027-06-01' }],
    }));
    expect(h).toMatchObject({ ok: false, kode: 'perlu_konfirmasi_peringatan' });
    if (!h.ok && h.kode === 'perlu_konfirmasi_peringatan') expect(h.peringatan.map((w) => w.jenis)).toEqual(['penugasan_lewat_sip']);
  });

  it('username atau NIK ganda, jenis tidak aktif, izin tidak dikenal ditolak', async () => {
    expect(await siapkan({ dupUsername: true }).layanan.buat(pelaku, parse({}))).toMatchObject({ ok: false, kode: 'konflik' });
    expect(await siapkan({ dupNik: true }).layanan.buat(pelaku, parse({}))).toMatchObject({ ok: false, kode: 'konflik' });
    expect(await siapkan({ konflikSimpan: true }).layanan.buat(pelaku, parse({}))).toMatchObject({ ok: false, kode: 'konflik' });
    expect(await siapkan({ konflikSimpan: 'nik' }).layanan.buat(pelaku, parse({}))).toMatchObject({ ok: false, kode: 'konflik', pesan: AKUN_BARU.duplikatNik });
    expect(await siapkan({ konflikSimpan: 'username' }).layanan.buat(pelaku, parse({}))).toMatchObject({ ok: false, kode: 'konflik', pesan: AKUN_BARU.duplikatUsername });
    const s = siapkan();
    expect(await s.layanan.buat(pelaku, parse({ penugasan: [{ jenis_akun_id: 12, mulai: '2026-10-01' }] }))).toMatchObject({ ok: false, kode: 'tidak_valid' });
    expect(await s.layanan.buat(pelaku, parse({ penugasan: [{ jenis_akun_id: 99, mulai: '2026-10-01' }] }))).toMatchObject({ ok: false, kode: 'tidak_valid' });
    expect(await s.layanan.buat(pelaku, parse({ izin_akun: [{ izin_id: 999, tipe: 'tambah', alasan: 'x', mulai: '2026-10-01' }] }))).toMatchObject({ ok: false, kode: 'tidak_valid' });
    expect(s.disimpan).toHaveLength(0);
  });
});

describe('bidangKonflik (target galat P2002 Prisma)', () => {
  it('mengenali NIK dari nama indeks maupun daftar kolom, selain itu username', () => {
    expect(bidangKonflik({ target: 'pengguna_fasyankes_id_nik_key' })).toBe('nik');
    expect(bidangKonflik({ target: ['fasyankes_id', 'nik'] })).toBe('nik');
    expect(bidangKonflik({ target: 'pengguna_fasyankes_id_username_key' })).toBe('username');
    expect(bidangKonflik({ target: ['fasyankes_id', 'username'] })).toBe('username');
    expect(bidangKonflik(undefined)).toBe('username');
  });
});
