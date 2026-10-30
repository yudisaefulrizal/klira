const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { chromium } = require('/home/nuscode/projek/- nuscode/video-3d/node_modules/playwright-core');
const root = path.resolve(__dirname, '../../apps/web');
const html = path.join(root, '.qa-wilayah.html');
const entry = path.join(root, 'src/.qa-wilayah.tsx');
(async () => {
  let server, browser;
  try {
    await fs.writeFile(html, '<html><body><div id="root"></div><script type="module" src="/src/.qa-wilayah.tsx"></script></body></html>');
    await fs.writeFile(entry, `import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { PencarianWilayah } from './komponen/pencarian-wilayah';
function Uji() { const [kode, setKode] = useState(''); return <form onSubmit={e => {e.preventDefault(); throw Error('Unexpected submit');}}><PencarianWilayah id="wilayah" value={kode} onChange={setKode}/><output data-testid="kode">{kode}</output></form>; }
createRoot(document.getElementById('root')!).render(<Uji/>);`);
    const { createServer } = await import(pathToFileURL(path.resolve(__dirname, '../../node_modules/vite/dist/node/index.js')).href);
    server = await createServer({ root, server: { host: '127.0.0.1', port: 0 } });
    await server.listen();
    const port = server.httpServer.address().port;
    browser = await chromium.launch({ headless: true, executablePath: '/home/nuscode/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome' });
    const page = await browser.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    const choices = [
      {kode: '11.01.01.2001', nama: 'Keude Bakongan', label: 'Keude Bakongan, Bakongan, Kabupaten Aceh Selatan, Aceh'},
      {kode: '32.73.02.1005', nama: 'Dago', label: 'Dago, Coblong, Kota Bandung, Jawa Barat'},
    ];
    await page.route('**/api/wilayah**', async route => {
      const url = new URL(route.request().url());
      if (url.pathname === '/api/wilayah') {
        const cari = url.searchParams.get('cari');
        if (cari === 'gagal') return route.fulfill({status: 500, json: {galat: {pesan: 'Pencarian gagal uji'}}});
        if (cari === 'lambat') await new Promise(r => setTimeout(r, 500));
        const data = cari === 'kosong' ? [] : choices;
        return route.fulfill({json: {data: {data, lebih_banyak: false}}});
      }
      return route.fulfill({json: {data: choices[0]}});
    });
    await page.goto(`http://127.0.0.1:${port}/.qa-wilayah.html`);
    const input = page.getByRole('combobox');
    await input.fill('bakongan');
    await page.getByRole('option').first().waitFor();
    await input.press('ArrowDown'); await input.press('Enter');
    await assert.doesNotReject(() => page.getByTestId('kode').filter({hasText: '11.01.01.2001'}).waitFor());
    await page.getByRole('button', {name: 'Hapus pilihan wilayah'}).click();
    assert.equal(await page.getByTestId('kode').textContent(), '');
    await input.fill('dago'); await page.getByRole('option').first().waitFor();
    await page.getByRole('option').nth(1).click();
    assert.equal(await page.getByTestId('kode').textContent(), '32.73.02.1005');
    await page.getByRole('button', {name: 'Hapus pilihan wilayah'}).click();
    await input.fill('lambat'); await page.waitForTimeout(330); await input.fill(''); await page.waitForTimeout(600);
    assert.equal(await page.getByRole('option').count(), 0);
    assert.equal(await page.locator('small[role="status"]').count(), 0);
    await input.fill('kosong'); await page.locator('small[role="status"]').filter({hasText: 'Wilayah tidak ditemukan.'}).waitFor();
    await input.fill('gagal'); await page.locator('small[role="status"]').filter({hasText: 'Pencarian gagal uji'}).waitFor();
    await input.fill('bakongan'); await page.getByRole('option').first().waitFor();
    await input.press('Escape'); assert.equal(await page.getByRole('option').count(), 0);
    assert.deepEqual(errors, []);
    console.log('PASS: pilihan keyboard/mouse, hapus kode, hasil kosong, galat, Escape, dan respons usang.');
  } finally {
    if (browser) await browser.close(); if (server) await server.close();
    await fs.rm(html, {force: true}); await fs.rm(entry, {force: true});
  }
})().catch(e => {console.error(e); process.exitCode = 1;});
