import type { AddressInfo } from 'net';
import { hashKataSandi } from '@klira/db';
import { buatApp } from '../../app';
import type { EntriAudit, PenampungAudit } from '../../middleware/audit';
import { buatLayananAkses, hashIdSesi } from './layanan';
import { PembatasPercobaan } from './pembatas';
import type { RepositoriAkses } from './repositori';
import type { AkunMasuk } from './skema';

class RepoMemori implements RepositoriAkses {
  akun: AkunMasuk[] = [];
  sesi = new Map<string, { akun: AkunMasuk; kedaluwarsa: Date }>();
  fitur: Record<number, string[]> = {};
  async cariAkunByUsername(u: string) {
    return this.akun.find((a) => a.username === u && a.aktif) ?? null;
  }
  async ambilAkses(id: number) {
    return { jenis_akun: ['Uji'], fitur: this.fitur[id] ?? [] };
  }
  async buatSesi(d: { idHash: string; akun: AkunMasuk; kedaluwarsa: Date }) {
    this.sesi.set(d.idHash, { akun: d.akun, kedaluwarsa: d.kedaluwarsa });
  }
  async cariSesi(h: string, sekarang: Date) {
    const s = this.sesi.get(h);
    return s && s.kedaluwarsa > sekarang ? { akun: s.akun } : null;
  }
  async hapusSesi(h: string) {
    this.sesi.delete(h);
  }
  async hapusKedaluwarsa(sekarang: Date) {
    for (const [h, s] of this.sesi) if (s.kedaluwarsa <= sekarang) this.sesi.delete(h);
  }
}

describe('modul akses', () => {
  const repo = new RepoMemori();
  const entri: EntriAudit[] = [];
  const audit: PenampungAudit = { catat: async (e) => void entri.push(e) };
  let waktu = Date.parse('2026-10-25T00:00:00Z');
  const layanan = buatLayananAkses({
    repo, audit, sekarang: () => new Date(waktu), sesiMs: 60_000,
    pembatas: new PembatasPercobaan({ batasAkun: 3, batasAlamat: 100, jendelaMs: 600_000, jedaMs: 120_000 }, () => waktu),
  });
  const server = buatApp('/tidak-ada', { layananAkses: layanan, baseUrl: 'https://klira.contoh' }).listen(0);
  const url = (p: string) => `http://127.0.0.1:${(server.address() as AddressInfo).port}${p}`;
  const post = (p: string, badan: unknown, cookie?: string) =>
    fetch(url(p), { method: 'POST', headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) }, body: JSON.stringify(badan) });

  beforeAll(async () => {
    repo.akun.push(
      { id: 1, fasyankes_id: 1, nama: 'Pimpinan', username: 'pimpinan', kata_sandi_hash: await hashKataSandi('sandi-uji-1'), aktif: true, wajib_ganti_kredensial: true },
      { id: 2, fasyankes_id: 1, nama: 'Admin IT', username: 'adminit', kata_sandi_hash: await hashKataSandi('sandi-uji-2'), aktif: true, wajib_ganti_kredensial: false },
    );
    repo.fitur = { 1: ['akses', 'rekam-medis'], 2: ['satusehat'] };
  });
  afterAll(() => void server.close());

  const ambilCookie = (res: Response) => res.headers.get('set-cookie')?.split(';')[0] ?? '';

  it('masuk berhasil: cookie httpOnly, sesi tersimpan sebagai hash, flag ganti kredensial dan halaman awal', async () => {
    const res = await post('/api/masuk', { username: 'pimpinan', kata_sandi: 'sandi-uji-1' });
    expect(res.status).toBe(200);
    const sc = res.headers.get('set-cookie') ?? '';
    expect(sc).toMatch(/HttpOnly/i);
    expect(sc).toMatch(/Secure/i);
    const idMentah = decodeURIComponent(ambilCookie(res).split('=')[1]);
    expect(repo.sesi.has(idMentah)).toBe(false);
    expect(repo.sesi.has(hashIdSesi(idMentah))).toBe(true);
    const { data } = await res.json();
    expect(data).toMatchObject({ username: 'pimpinan', wajib_ganti_kredensial: true, halaman_awal: '/pasien' });
    expect(data.kata_sandi_hash).toBeUndefined();
    expect(entri.some((e) => e.aksi === 'masuk' && e.pengguna_id === 1)).toBe(true);
  });

  it('akun tanpa akses rekam medis diarahkan ke Beranda tugas', async () => {
    const res = await post('/api/masuk', { username: 'adminit', kata_sandi: 'sandi-uji-2' });
    expect((await res.json()).data.halaman_awal).toBe('/beranda');
  });

  it('GET /api/saya dengan dan tanpa sesi', async () => {
    expect((await fetch(url('/api/saya'))).status).toBe(401);
    const masuk = await post('/api/masuk', { username: 'pimpinan', kata_sandi: 'sandi-uji-1' });
    const res = await fetch(url('/api/saya'), { headers: { cookie: ambilCookie(masuk) } });
    expect(res.status).toBe(200);
    expect((await res.json()).data.username).toBe('pimpinan');
  });

  it('keluar menghapus sesi', async () => {
    const masuk = await post('/api/masuk', { username: 'pimpinan', kata_sandi: 'sandi-uji-1' });
    const cookie = ambilCookie(masuk);
    expect((await post('/api/keluar', {}, cookie)).status).toBe(200);
    expect((await fetch(url('/api/saya'), { headers: { cookie } })).status).toBe(401);
    expect(entri.some((e) => e.aksi === 'keluar')).toBe(true);
  });

  it('sesi kedaluwarsa ditolak', async () => {
    const masuk = await post('/api/masuk', { username: 'adminit', kata_sandi: 'sandi-uji-2' });
    const cookie = ambilCookie(masuk);
    expect((await fetch(url('/api/saya'), { headers: { cookie } })).status).toBe(200);
    waktu += 61_000;
    expect((await fetch(url('/api/saya'), { headers: { cookie } })).status).toBe(401);
  });

  it('kata sandi salah dan username tak dikenal memberi pesan sama', async () => {
    const a = await post('/api/masuk', { username: 'pimpinan', kata_sandi: 'salah' });
    const b = await post('/api/masuk', { username: 'tidakada', kata_sandi: 'salah' });
    expect(a.status).toBe(401);
    expect(b.status).toBe(401);
    expect(await a.json()).toEqual(await b.json());
    expect(a.headers.get('set-cookie')).toBeNull();
    expect(entri.filter((e) => e.aksi === 'masuk_gagal').length).toBeGreaterThanOrEqual(2);
  });

  it('masukan tidak valid ditolak 400', async () => {
    expect((await post('/api/masuk', { username: '' })).status).toBe(400);
  });

  it('membatasi percobaan gagal lalu membuka setelah jeda', async () => {
    waktu += 10_000_000;
    for (let i = 0; i < 3; i++) {
      expect((await post('/api/masuk', { username: 'adminit', kata_sandi: 'salah' })).status).toBe(401);
    }
    // sekarang terkunci, bahkan dengan kata sandi benar
    const terkunci = await post('/api/masuk', { username: 'adminit', kata_sandi: 'sandi-uji-2' });
    expect(terkunci.status).toBe(429);
    waktu += 121_000;
    expect((await post('/api/masuk', { username: 'adminit', kata_sandi: 'sandi-uji-2' })).status).toBe(200);
  });
});
