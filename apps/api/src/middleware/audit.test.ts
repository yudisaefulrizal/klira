import type { AddressInfo } from 'net';
import fs from 'fs';
import path from 'path';
import express from 'express';
import { buatFasilitasAudit, idDariParam, PenampungAuditPrisma } from './audit';
import type { EntriAudit, PenampungAudit } from './audit';
import type { RepositoriAudit } from '../modul/audit/repositori';
import { selCsv } from '../modul/audit/csv';

function pasang(penampung: PenampungAudit) {
  const f = buatFasilitasAudit(penampung);
  const app = express();
  app.set('trust proxy', true);
  app.use(express.json());
  app.use((_req, res, next) => {
    res.locals.pengguna = { id: 7, fasyankes_id: 3 };
    next();
  });
  app.get('/pasien/:id', f.lihat({ entitas: 'pasien', id: idDariParam() }), (_req, res) => void res.json({ data: { nama: 'RAHASIA' } }));
  app.post('/pasien', f.input({ entitas: 'pasien' }), (req, res) => void res.status(req.body.gagal ? 400 : 201).json({ data: { id: 42 } }));
  app.patch('/pasien/:id', f.perbaikan({ entitas: 'pasien', id: idDariParam() }), (_req, res) => void res.json({ data: {} }));
  const server = app.listen(0);
  const url = (p: string) => `http://127.0.0.1:${(server.address() as AddressInfo).port}${p}`;
  return { server, url };
}

describe('fasilitas audit', () => {
  const entri: EntriAudit[] = [];
  const baik: PenampungAudit = { catat: async (e) => void entri.push(e) };
  beforeEach(() => void (entri.length = 0));

  it('lihat dicatat otomatis dengan id dari parameter, alamat dari X-Forwarded-For, tanpa isi data', async () => {
    const { server, url } = pasang(baik);
    const r = await fetch(url('/pasien/12?nik=3201000000000001'), { headers: { 'x-forwarded-for': '203.0.113.9' } });
    server.close();
    expect(r.status).toBe(200);
    expect(entri).toHaveLength(1);
    expect(entri[0]).toMatchObject({ aksi: 'lihat', entitas: 'pasien', entitas_id: 12, pengguna_id: 7, fasyankes_id: 3, alamat: '203.0.113.9', keterangan: 'GET /pasien/:id' });
    expect(JSON.stringify(entri)).not.toMatch(/RAHASIA|3201000000000001/);
  });

  it('input dicatat dengan id dari respons dan tanpa badan permintaan; perbaikan dengan id parameter', async () => {
    const { server, url } = pasang(baik);
    const kirim = (m: string, p: string, badan: object) => fetch(url(p), { method: m, headers: { 'content-type': 'application/json' }, body: JSON.stringify(badan) });
    expect((await kirim('POST', '/pasien', { nama: 'BUDI SANTOSO', nik: '3201000000000001' })).status).toBe(201);
    expect((await kirim('PATCH', '/pasien/5', { nama: 'X' })).status).toBe(200);
    expect((await kirim('POST', '/pasien', { gagal: true })).status).toBe(400);
    server.close();
    expect(entri.map((e) => [e.aksi, e.entitas_id])).toEqual([['input', 42], ['perbaikan', 5]]);
    expect(JSON.stringify(entri)).not.toMatch(/BUDI|3201000000000001/);
  });

  it('gagal-aman: lihat gagal tulis menolak 500 tanpa membocorkan data; input gagal tulis menjadi 500', async () => {
    const rusak: PenampungAudit = { catat: async () => { throw new Error('db mati'); } };
    const { server, url } = pasang(rusak);
    const a = await fetch(url('/pasien/1'));
    const b = await fetch(url('/pasien'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    server.close();
    expect(a.status).toBe(500);
    expect(await a.text()).not.toContain('RAHASIA');
    expect(b.status).toBe(500);
  });
});

describe('penampung audit', () => {
  it('kegagalan tulis dicatat ke log aplikasi dan dilempar (tidak diam-diam)', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const repo = { tambah: async () => { throw new Error('putus'); } } as unknown as RepositoriAudit;
    await expect(new PenampungAuditPrisma(repo).catat({ aksi: 'masuk', entitas: 'sesi' })).rejects.toThrow('Gagal menulis log audit');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('memotong keterangan dan alamat serta mengisi waktu', async () => {
    const simpan: unknown[] = [];
    const repo = { tambah: async (c: unknown) => void simpan.push(c) } as unknown as RepositoriAudit;
    await new PenampungAuditPrisma(repo).catat({ aksi: 'lihat', entitas: 'pasien', keterangan: 'x'.repeat(500), alamat: 'a'.repeat(100) });
    const c = simpan[0] as { keterangan: string; alamat: string; waktu: Date };
    expect(c.keterangan).toHaveLength(255);
    expect(c.alamat).toHaveLength(64);
    expect(c.waktu).toBeInstanceOf(Date);
  });
});

describe('log hanya-tambah', () => {
  it('tidak ada update/delete/upsert pada logAudit di kode non-uji', () => {
    const akar = path.resolve(__dirname, '..');
    const berkas: string[] = [];
    const jelajah = (d: string) => {
      for (const n of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, n.name);
        if (n.isDirectory()) jelajah(p);
        else if (p.endsWith('.ts') && !p.endsWith('.test.ts')) berkas.push(p);
      }
    };
    jelajah(akar);
    for (const b of berkas) expect(fs.readFileSync(b, 'utf8')).not.toMatch(/logAudit\.(update|updateMany|delete|deleteMany|upsert)/);
    // satu-satunya penulis log_audit adalah repositori audit
    const penulis = berkas.filter((b) => /logAudit\.create/.test(fs.readFileSync(b, 'utf8')));
    expect(penulis.map((p) => path.basename(p))).toEqual(['repositori.ts']);
  });
});

describe('csv', () => {
  it('menetralkan rumus dan mengutip', () => {
    expect(selCsv('=1+1')).toBe("'=1+1");
    expect(selCsv('a,"b"')).toBe('"a,""b"""');
    expect(selCsv(null)).toBe('');
  });
});
