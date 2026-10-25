import fs from 'fs';
import os from 'os';
import path from 'path';
import type { AddressInfo } from 'net';
import { buatApp } from './app';

describe('app', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'klira-web-'));
  fs.writeFileSync(path.join(dir, 'index.html'), '<html>Klira SPA</html>');
  const server = buatApp(dir).listen(0);
  const { port } = server.address() as AddressInfo;
  const url = (p: string) => `http://127.0.0.1:${port}${p}`;
  afterAll(() => {
    server.close();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('GET /api/kesehatan mengembalikan ok', async () => {
    const res = await fetch(url('/api/kesehatan'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });
  it('melayani index.html dan fallback SPA', async () => {
    expect(await (await fetch(url('/'))).text()).toContain('Klira SPA');
    expect(await (await fetch(url('/pasien/12'))).text()).toContain('Klira SPA');
  });
  it('rute /api tak dikenal tidak jatuh ke SPA', async () => {
    const res = await fetch(url('/api/tidak-ada'));
    expect(res.status).toBe(404);
    expect(await res.json()).toHaveProperty('galat');
  });
});
