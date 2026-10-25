import type { AddressInfo } from 'net';
import { hashKataSandi } from '@klira/db';
import { buatApp } from '../../app';
import type { EntriAudit, PenampungAudit } from '../../middleware/audit';
import { buatLayananAkses, hashIdSesi, penandaUsername } from './layanan';
import { PembatasPercobaan } from './pembatas';
import { KonflikUsername } from './repositori';
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
    const fitur = this.fitur[id] ?? [];
    return { jenis_akun: ['Uji'], fitur, izin: fitur.map((f) => ({ fitur: f, aksi: 'lihat' as const, cakupan: 'unit' as const })) };
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
  async usernameDipakai(username: string, kecuali: number) {
    return this.akun.some((a) => a.id !== kecuali && a.username.toLowerCase() === username.toLowerCase());
  }
  async gantiKredensial(d: { akun: AkunMasuk; username: string; kataSandiHash: string; sesiBaru: { idHash: string; kedaluwarsa: Date } }) {
    if (await this.usernameDipakai(d.username, d.akun.id)) throw new KonflikUsername();
    const a = this.akun.find((x) => x.id === d.akun.id)!;
    a.username = d.username;
    a.kata_sandi_hash = d.kataSandiHash;
    a.wajib_ganti_kredensial = false;
    for (const [h, s] of this.sesi) if (s.akun.id === a.id) this.sesi.delete(h);
    this.sesi.set(d.sesiBaru.idHash, { akun: a, kedaluwarsa: d.sesiBaru.kedaluwarsa });
  }
}

describe('modul akses', () => {
  const repo = new RepoMemori();
  const entri: EntriAudit[] = [];
  const audit: PenampungAudit = { catat: async (e) => void entri.push(e) };
  let waktu = Date.parse('2026-10-25T00:00:00Z');
  const layanan = buatLayananAkses({
    repo, audit, kredensialAwal: { username: 'pimpinan', kataSandi: 'klira-awal-2026' }, sekarang: () => new Date(waktu), sesiMs: 60_000,
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
      { id: 3, fasyankes_id: 1, nama: 'Awal Tiga', username: 'awal3', kata_sandi_hash: await hashKataSandi('sandi-lama-3'), aktif: true, wajib_ganti_kredensial: true },
      { id: 4, fasyankes_id: 1, nama: 'Awal Empat', username: 'awal4', kata_sandi_hash: await hashKataSandi('sandi-lama-4'), aktif: true, wajib_ganti_kredensial: true },
    );
    repo.fitur = { 1: ['akses', 'rekam-medis'], 2: ['satusehat'], 3: ['akses', 'rekam-medis'], 4: ['akses', 'rekam-medis'] };
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

  describe('ganti kredensial', () => {
    const masukKe = async (username: string, kata_sandi: string) => ambilCookie(await post('/api/masuk', { username, kata_sandi }));
    const baik = (s: object = {}) => ({
      username: 'dokter.baru', kata_sandi_lama: 'sandi-lama-3', kata_sandi: 'SandiBaru123', konfirmasi_kata_sandi: 'SandiBaru123', ...s,
    });

    it('audit login gagal tidak menyimpan username mentah', async () => {
      entri.length = 0;
      await post('/api/masuk', { username: 'RahasiaKetik', kata_sandi: 'salah' });
      await post('/api/masuk', { username: 'awal3', kata_sandi: 'salah' });
      const gagal = entri.filter((e) => e.aksi === 'masuk_gagal');
      expect(JSON.stringify(gagal)).not.toMatch(/rahasiaketik/i);
      expect(gagal[0].keterangan).toContain(penandaUsername('RahasiaKetik'));
      expect(gagal[0].pengguna_id).toBeUndefined();
      expect(gagal[1].pengguna_id).toBe(3);
      expect(gagal[1].keterangan).not.toContain('awal3');
    });

    it('selama wajib ganti: rute lain ditolak, saya/keluar/kesehatan terbuka', async () => {
      const cookie = await masukKe('awal3', 'sandi-lama-3');
      const res = await fetch(url('/api/pasien'), { headers: { cookie } });
      expect(res.status).toBe(403);
      expect((await res.json()).galat.kode).toBe('wajib_ganti_kredensial');
      expect((await fetch(url('/api/saya'), { headers: { cookie } })).status).toBe(200);
      expect((await fetch(url('/api/kesehatan'), { headers: { cookie } })).status).toBe(200);
      // akun yang sudah tidak wajib tidak terblokir (404 biasa)
      const bebas = await masukKe('adminit', 'sandi-uji-2');
      expect((await fetch(url('/api/pasien'), { headers: { cookie: bebas } })).status).toBe(404);
    });

    it('tanpa sesi ditolak 401', async () => {
      expect((await post('/api/ganti-kredensial', baik())).status).toBe(401);
    });

    it('kata sandi lama salah ditolak dan tidak mengubah apa pun', async () => {
      const cookie = await masukKe('awal3', 'sandi-lama-3');
      const res = await post('/api/ganti-kredensial', baik({ kata_sandi_lama: 'bukan-ini' }), cookie);
      expect(res.status).toBe(400);
      expect((await res.json()).galat.rincian[0].jalur).toBe('kata_sandi_lama');
      expect(repo.akun.find((a) => a.id === 3)).toMatchObject({ username: 'awal3', wajib_ganti_kredensial: true });
    });

    it('username bentrok (juga beda huruf besar) ditolak 409', async () => {
      const cookie = await masukKe('awal3', 'sandi-lama-3');
      for (const u of ['adminit', 'AdminIT']) {
        const res = await post('/api/ganti-kredensial', baik({ username: u }), cookie);
        expect(res.status).toBe(409);
        expect((await res.json()).galat.kode).toBe('konflik');
      }
    });

    it('username sama dengan username awal ditolak', async () => {
      const cookie = await masukKe('awal3', 'sandi-lama-3');
      const res = await post('/api/ganti-kredensial', baik({ username: 'Pimpinan' }), cookie);
      expect(res.status).toBe(400);
      expect((await res.json()).galat.rincian[0].jalur).toBe('username');
    });

    it('aturan kata sandi: lemah, pendek, konfirmasi beda, sama dengan lama, sama dengan awal', async () => {
      const cookie = await masukKe('awal3', 'sandi-lama-3');
      const tolak = async (s: object) => (await post('/api/ganti-kredensial', baik(s), cookie)).status;
      expect(await tolak({ kata_sandi: 'hurufsaja', konfirmasi_kata_sandi: 'hurufsaja' })).toBe(400);
      expect(await tolak({ kata_sandi: 'a1', konfirmasi_kata_sandi: 'a1' })).toBe(400);
      expect(await tolak({ konfirmasi_kata_sandi: 'BedaSekali1' })).toBe(400);
      // sama dengan yang lama (kata sandi lama memenuhi aturan kekuatan)
      expect(await tolak({ kata_sandi: 'sandi-lama-3', konfirmasi_kata_sandi: 'sandi-lama-3' })).toBe(400);
      expect(await tolak({ kata_sandi: 'klira-awal-2026', konfirmasi_kata_sandi: 'klira-awal-2026' })).toBe(400);
      expect(repo.akun.find((a) => a.id === 3)?.wajib_ganti_kredensial).toBe(true);
    });

    it('berhasil: flag mati, sesi lain dicabut, sesi baru aktif, audit, kredensial lama tak berlaku', async () => {
      entri.length = 0;
      const cookieA = await masukKe('awal4', 'sandi-lama-4');
      const cookieLain = await masukKe('awal4', 'sandi-lama-4');
      const res = await post(
        '/api/ganti-kredensial',
        { username: 'dokter.empat', kata_sandi_lama: 'sandi-lama-4', kata_sandi: 'SandiBaru456', konfirmasi_kata_sandi: 'SandiBaru456' },
        cookieA,
      );
      expect(res.status).toBe(200);
      const { data } = await res.json();
      expect(data).toMatchObject({ username: 'dokter.empat', wajib_ganti_kredensial: false, halaman_awal: '/pasien' });
      const cookieBaru = ambilCookie(res);
      expect(cookieBaru).not.toBe(cookieA);
      expect((res.headers.get('set-cookie') ?? '')).toMatch(/HttpOnly/i);
      // sesi lama (termasuk yang dipakai mengganti) dan sesi lain dicabut
      expect((await fetch(url('/api/saya'), { headers: { cookie: cookieA } })).status).toBe(401);
      expect((await fetch(url('/api/saya'), { headers: { cookie: cookieLain } })).status).toBe(401);
      const saya = await fetch(url('/api/saya'), { headers: { cookie: cookieBaru } });
      expect((await saya.json()).data.wajib_ganti_kredensial).toBe(false);
      // tidak lagi diblokir
      expect((await fetch(url('/api/pasien'), { headers: { cookie: cookieBaru } })).status).toBe(404);
      expect(entri.some((e) => e.aksi === 'ganti_kredensial' && e.pengguna_id === 4)).toBe(true);
      // kredensial lama tidak berlaku, yang baru berlaku
      expect((await post('/api/masuk', { username: 'awal4', kata_sandi: 'sandi-lama-4' })).status).toBe(401);
      expect((await post('/api/masuk', { username: 'dokter.empat', kata_sandi: 'SandiBaru456' })).status).toBe(200);
    });
  });
});
