import { perbaruiNamaKontakInstagram } from './profil';
import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import { prisma, enkripsiRahasia, kunciPercakapanInstagram, pangkasPesanInstagram } from '@klira/db';
import { idPesan, tandaTanganSah } from './meta';
import { kabarkanInstagram } from './kanal';
export type EventInstagram = {
  sender?: { id?: string }; recipient?: { id?: string }; timestamp?: number;
  message?: { mid?: string; text?: string; is_echo?: boolean; attachments?: { type?: string; payload?: { url?: string } }[] };
};
export type PayloadInstagram = { object?: string; entry?: { id?: string; messaging?: EventInstagram[]; changes?: { field?: string; value?: EventInstagram }[] }[] };
export function bacaPesanInstagram(event: EventInstagram, akun: string) {
  const m = event.message; const echo = m?.is_echo === true;
  const jid = (echo ? event.recipient?.id : event.sender?.id) ?? '';
  if (!m || typeof m.mid !== 'string' || !m.mid || !/^\d{3,32}$/.test(jid) || jid === akun || (echo ? event.sender?.id : event.recipient?.id) !== akun) return null;
  const tanggal = new Date(typeof event.timestamp === 'number' ? event.timestamp : Date.now());
  const lampiran = Array.isArray(m.attachments) ? m.attachments[0] : undefined;
  const teks = typeof m.text === 'string' ? m.text.slice(0, 10000) : '';
  if (!teks && !lampiran) return null;
  return { jid, mid: m.mid, nama: jid, teks, arah: echo ? 'keluar' : 'masuk', tanggal: Number.isNaN(tanggal.getTime()) ? new Date() : tanggal, lampiran };
}
// Only fetch public Meta CDN hosts, without redirects. Streaming enforces the cap even without Content-Length.
export async function unduhGambarInstagram(alamat: string) {
  const url = new URL(alamat);
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443') || !/(^|\.)(cdninstagram\.com|fbcdn\.net)$/.test(url.hostname)) throw new Error('Alamat media tidak didukung');
  const res = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(15000) });
  const mime = res.headers.get('content-type')?.split(';')[0];
  if (!res.ok || !res.body || !mime || !['image/jpeg', 'image/png'].includes(mime)) throw new Error('Gambar tidak tersedia');
  const reader = res.body.getReader(); const bagian: Uint8Array[] = []; let ukuran = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      ukuran += value.length; if (ukuran > 8 * 1024 * 1024) throw new Error('Gambar melebihi 8 MB');
      bagian.push(value);
    }
  } finally { await reader.cancel(); }
  return { base64: Buffer.concat(bagian).toString('base64'), mime };
}
export const webhookInstagram: RequestHandler = async (req, res) => {
  if (!Buffer.isBuffer(req.body) || !tandaTanganSah(req.body, req.headers['x-hub-signature-256'])) { res.status(403).end(); return; }
  let payload: PayloadInstagram;
  try { payload = JSON.parse(req.body.toString('utf8')); if (!payload || typeof payload !== 'object') throw new Error(); }
  catch { res.status(400).end(); return; }
  if (payload.object !== 'instagram') { res.json({ ok: true }); return; }
  const row = await prisma.igKoneksi.findUnique({ where: { id: 1 } });
  if (!row?.aktif || row.penyedia !== 'meta') { res.json({ ok: true }); return; }
  for (const entry of Array.isArray(payload.entry) ? payload.entry : []) {
    if (entry?.id !== row.akun_id) continue;
    const events = [...(Array.isArray(entry.messaging) ? entry.messaging : []), ...(Array.isArray(entry.changes) ? entry.changes : []).filter((v) => v?.field === 'messages' && v.value).map((v) => v.value!)];
    for (const event of events) {
      if (!event || typeof event !== 'object') continue;
      const pesan = bacaPesanInstagram(event, row.akun_id); if (!pesan) continue;
      const mid = idPesan(row.akun_id, pesan.mid);
      if (await prisma.igEvent.findUnique({ where: { id: mid } })) continue;
      let gambar: { base64: string; mime: string } | null = null;
      if (pesan.lampiran?.type === 'image' && typeof pesan.lampiran.payload?.url === 'string') {
        try { gambar = await unduhGambarInstagram(pesan.lampiran.payload.url); } catch { /* A failed download does not discard the DM. */ }
      }
      const baru = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM ig_koneksi WHERE id = 1 FOR UPDATE`;
        const current = await tx.igKoneksi.findUnique({ where: { id: 1 } });
        if (!current?.aktif || current.generasi !== row.generasi || current.akun_id !== row.akun_id || current.penyedia !== 'meta') return false;
        if (await tx.igEvent.findUnique({ where: { id: mid } })) return false;
        const kontak = await tx.igPercakapan.upsert({
          where: { fasyankes_id_jid: { fasyankes_id: row.fasyankes_id, jid: pesan.jid } },
          create: { fasyankes_id: row.fasyankes_id, jid: pesan.jid, nama: pesan.nama }, update: {},
        });
        await kunciPercakapanInstagram(tx, kontak.id);
        await tx.igEvent.create({ data: { id: mid } });
        // Echoes may arrive before or after the send response. Never insert an already acknowledged send.
        if (await tx.igPesan.findUnique({ where: { ig_id: mid } })) return false;
        const mediaId = gambar ? randomUUID() : null;
        if (gambar && mediaId) await tx.igMedia.create({ data: { id: mediaId, fasyankes_id: row.fasyankes_id, isi: enkripsiRahasia(gambar.base64), mime: gambar.mime, nama: gambar.mime === 'image/png' ? 'instagram.png' : 'instagram.jpg' } });
        const label = pesan.lampiran && !gambar ? '\n[Lampiran Instagram tidak tersedia di Klira; buka aplikasi Instagram]' : '';
        await tx.igPesan.create({ data: { percakapan_id: kontak.id, ig_id: mid, arah: pesan.arah, isi: enkripsiRahasia(pesan.teks + label), jenis: gambar ? 'image' : 'text', media_id: mediaId, status: 'terkirim', dibuat_pada: pesan.tanggal } });
        await tx.igPercakapan.update({ where: { id: kontak.id }, data: { diperbarui_pada: new Date() } });
        await pangkasPesanInstagram(tx, kontak.id); return kontak.id;
      });
      if (baru) {
        kabarkanInstagram({ tipe: 'pesan', fasyankes_id: row.fasyankes_id, baru: pesan.arah === 'masuk' });
        void perbaruiNamaKontakInstagram(baru);
      }
    }
  }
  // Processing failures propagate as 5xx so Meta can retry, rather than acknowledging a lost event.
  res.json({ ok: true });
};
