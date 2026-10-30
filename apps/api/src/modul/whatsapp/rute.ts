import { pasangRuteBersihkan, putuskanDanBersihkan } from '../pesan/bersihkan';
import { kabarkanWhatsapp } from './kanal';
import { randomUUID } from 'node:crypto';
import { Router, type Response } from 'express';
import {
  prisma,
  enkripsiRahasia,
  dekripsiRahasia,
  kunciPercakapanWhatsapp,
  pangkasPesanWhatsapp,
} from '@klira/db';
import {
  jidWhatsappPribadi,
  punyaIzin,
  bukaPercakapanWa,
  kirimPesanWa,
  ubahPercakapanWa,
  type PenggunaSaya,
} from '@klira/shared';
import { alamatDari, buatFasilitasAudit } from '../../middleware/audit';
import { wajibMasuk } from '../../middleware/auth';
import { buatWajibIzin } from '../../middleware/izin';
import type { LayananAkses } from '../akses/layanan';
import type { LayananIzin } from '../akses/layanan-izin';

const filterPribadi = { OR: [{ jid: { endsWith: '@s.whatsapp.net' } }, { jid: { endsWith: '@lid' } }] };
const pengguna = (res: Response) => res.locals.pengguna as PenggunaSaya;
const tolak = (res: Response, pesan: string, status = 400) => {
  res.status(status).json({ galat: { kode: 'whatsapp', pesan } });
};
const tersedia = (detak: Date | null) => !!detak && Date.now() - detak.getTime() < 20000;
const idValid = (v: unknown) => (typeof v === 'string' && /^[1-9]\d{0,9}$/.test(v) ? Number(v) : 0);
export function buatRuteWhatsapp(akses: LayananAkses, izin: LayananIzin) {
  const rute = Router();
  const masuk = wajibMasuk(akses);
  const audit = buatFasilitasAudit();
  const { wajibIzin } = buatWajibIzin(izin);
  rute.use('/whatsapp', masuk);
  pasangRuteBersihkan(rute, 'whatsapp', wajibIzin('whatsapp', 'lihat'));
  rute.get('/whatsapp/koneksi', wajibIzin('whatsapp', 'lihat'), async (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const row = await prisma.waKoneksi.findUnique({ where: { id: 1 } });
    const milik = row?.fasyankes_id === pengguna(res).fasyankes_id;
    const hidup = milik && row.aktif && tersedia(row.detak);
    res.json({
      data: {
        status: hidup ? row.status : 'terputus',
        nomor: hidup && row.status === 'terhubung' ? row.nomor : null,
        qr: hidup && row.qr && punyaIzin(pengguna(res), 'whatsapp', 'lihat') ? dekripsiRahasia(row.qr) : null,
        tersedia: hidup,
      },
    });
  });
  rute.post(
    '/whatsapp/koneksi',
    wajibIzin('whatsapp', 'lihat'),
    audit.lihat({ entitas: 'wa_koneksi', ringkasan: 'Permintaan perubahan koneksi WhatsApp' }),
    async (req, res) => {
      if (!['hubungkan', 'putuskan'].includes(req.body?.aksi)) return tolak(res, 'Aksi koneksi tidak valid');
      const user = pengguna(res);
      const row = await prisma.waKoneksi.findUnique({ where: { id: 1 } });
      if (row && row.fasyankes_id !== user.fasyankes_id)
        return tolak(res, 'Nomor WhatsApp sudah dikelola fasyankes lain', 409);
      const aktif = req.body.aksi === 'hubungkan';
      if (!aktif) {
        await putuskanDanBersihkan('whatsapp', user, alamatDari(req));
        kabarkanWhatsapp({ tipe: 'dibersihkan', fasyankes_id: user.fasyankes_id });
        kabarkanWhatsapp({ tipe: 'koneksi', fasyankes_id: user.fasyankes_id });
        return void res.json({ data: { ok: true } });
      }
      await prisma.waKoneksi.upsert({
        where: { id: 1, fasyankes_id: user.fasyankes_id },
        create: { id: 1, fasyankes_id: user.fasyankes_id, aktif, status: aktif ? 'menghubungkan' : 'terputus' },
        update: { aktif, nomor: null, generasi: { increment: 1 }, qr: null, status: aktif ? 'menghubungkan' : 'terputus' },
      });
      kabarkanWhatsapp({ tipe: 'koneksi', fasyankes_id: user.fasyankes_id });
      res.json({ data: { ok: true } });
    },
  );
  rute.get('/whatsapp/percakapan', wajibIzin('whatsapp', 'lihat'), async (req, res) => {
    const user = pengguna(res);
    const halaman = Math.min(1000, Math.max(1, Number(req.query.halaman) || 1));
    const rows = await prisma.waPercakapan.findMany({
      skip: (Math.floor(halaman) - 1) * 200,
      where: { fasyankes_id: user.fasyankes_id, ...filterPribadi },
      orderBy: { diperbarui_pada: 'desc' },
      take: 200,
      include: { pesan: { orderBy: { id: 'desc' }, take: 1 }, baca: { where: { pengguna_id: user.id } } },
    });
    res.json({
      data: await Promise.all(
        rows.map(async ({ pesan, baca, ...row }) => ({
          ...row,
          terakhir: pesan[0] ? dekripsiRahasia(pesan[0].isi).slice(0, 160) || `[${pesan[0].jenis}]` : '',
          belum_dibaca: await prisma.waPesan.count({
            where: { percakapan_id: row.id, arah: 'masuk', id: { gt: baca[0]?.pesan_id ?? 0 } },
          }),
        })),
      ),
    });
  });
  rute.get('/whatsapp/ringkasan', wajibIzin('whatsapp', 'lihat'), async (_req, res) => {
    const user = pengguna(res);
    const rows = await prisma.$queryRaw<{ belum: bigint; terbaru: number | null }[]>`
      SELECT COUNT(DISTINCT CASE WHEN p.id > COALESCE(b.pesan_id, 0) THEN c.id END) AS belum,
             MAX(p.id) AS terbaru
      FROM wa_percakapan c
      LEFT JOIN wa_pesan p ON p.percakapan_id = c.id AND p.arah = 'masuk'
      LEFT JOIN wa_baca b ON b.percakapan_id = c.id AND b.pengguna_id = ${user.id}
      WHERE c.fasyankes_id = ${user.fasyankes_id}
        AND (c.jid LIKE '%@s.whatsapp.net' OR c.jid LIKE '%@lid')`;
    res.json({ data: { belum_dibaca: Number(rows[0]?.belum ?? 0), terbaru: rows[0]?.terbaru ?? 0 } });
  });
  rute.get('/whatsapp/pasien/:id', wajibIzin('whatsapp', 'lihat'), wajibIzin('pasien', 'lihat'), async (req, res) => {
    const pasien = await prisma.pasien.findFirst({
      where: { id: idValid(req.params.id), fasyankes_id: pengguna(res).fasyankes_id },
      select: { id: true, nama: true, nomor_hp: true, wali_keluarga: { select: { nama: true, hubungan: true, kontak: true } } },
    });
    if (!pasien) return tolak(res, 'Pasien tidak ditemukan', 404);
    res.json({ data: pasien });
  });
  rute.post('/whatsapp/percakapan', wajibIzin('whatsapp', 'lihat'), async (req, res) => {
    const hasil = bukaPercakapanWa.safeParse(req.body);
    if (!hasil.success) return tolak(res, hasil.error.issues[0].message);
    const user = pengguna(res);
    const { nomor, pasien_id } = hasil.data;
    if (pasien_id && !punyaIzin(user, 'pasien', 'lihat'))
      return tolak(res, 'Tidak memiliki izin mengakses pasien', 403);
    const pasien = pasien_id
      ? await prisma.pasien.findFirst({
          where: { id: pasien_id, fasyankes_id: user.fasyankes_id },
          select: { id: true, nama: true },
        })
      : null;
    if (pasien_id && !pasien) return tolak(res, 'Pasien tidak ditemukan', 404);
    const jid = `${nomor}@s.whatsapp.net`;
    const lama = await prisma.waPercakapan.findUnique({
      where: { fasyankes_id_jid: { fasyankes_id: user.fasyankes_id, jid } },
    });
    if (pasien && lama?.pasien_id && lama.pasien_id !== pasien.id)
      return tolak(res, 'Nomor ini sudah ditautkan ke pasien lain. Buka percakapan tanpa menautkan pasien.', 409);
    const row = await prisma.waPercakapan.upsert({
      where: { fasyankes_id_jid: { fasyankes_id: user.fasyankes_id, jid } },
      create: { fasyankes_id: user.fasyankes_id, jid, nama: pasien?.nama ?? nomor!, pasien_id },
      update: pasien ? { pasien_id, nama: pasien.nama } : {},
    });
    kabarkanWhatsapp({ tipe: 'percakapan', fasyankes_id: user.fasyankes_id });
    res.json({ data: { id: row.id } });
  });
  // Seluruh rute percakapan di bawah dibatasi ke fasyankes pengguna, termasuk media.
  rute.use('/whatsapp/percakapan/:id', wajibIzin('whatsapp', 'lihat'), async (req, res, next) => {
    const row = await prisma.waPercakapan.findFirst({
      where: { id: idValid(req.params.id), fasyankes_id: pengguna(res).fasyankes_id },
    });
    if (!row || !jidWhatsappPribadi(row.jid)) return tolak(res, 'Percakapan pribadi tidak ditemukan', 404);
    res.locals.percakapan = row;
    next();
  });
  rute.get(
    '/whatsapp/percakapan/:id/pesan',
    audit.lihat({ entitas: 'wa_percakapan', id: (req) => Number(req.params.id) }),
    async (req, res) => {
      const rows = await prisma.waPesan.findMany({
        where: { percakapan_id: res.locals.percakapan.id },
        orderBy: { id: 'desc' },
        take: 10,
      });
      res.setHeader('Cache-Control', 'no-store');
      res.json({ data: rows.reverse().map(({ isi, ...row }) => ({ ...row, teks: dekripsiRahasia(isi) })) });
    },
  );
  rute.post('/whatsapp/percakapan/:id/baca', async (req, res) => {
    const id = res.locals.percakapan.id as number;
    const terakhir = Number(req.body?.pesan_id);
    if (
      !Number.isSafeInteger(terakhir) ||
      terakhir <= 0 ||
      !(await prisma.waPesan.findFirst({ where: { id: terakhir, percakapan_id: id } }))
    )
      return tolak(res, 'Pesan tidak valid');
    const kunci = { percakapan_id: id, pengguna_id: pengguna(res).id };
    await prisma.waBaca.upsert({
      where: { percakapan_id_pengguna_id: kunci },
      create: { ...kunci, pesan_id: terakhir },
      update: {},
    });
    await prisma.waBaca.updateMany({ where: { ...kunci, pesan_id: { lt: terakhir } }, data: { pesan_id: terakhir } });
    kabarkanWhatsapp({ tipe: 'baca', fasyankes_id: pengguna(res).fasyankes_id });
    res.json({ data: { ok: true } });
  });
  rute.get(
    '/whatsapp/percakapan/:id/info',
    audit.lihat({ entitas: 'wa_percakapan', id: (req) => Number(req.params.id) }),
    async (_req, res) => {
      const row = res.locals.percakapan;
      const user = pengguna(res);
      const [pasien, penanggung] = await Promise.all([
        row.pasien_id && punyaIzin(user, 'pasien', 'lihat')
          ? prisma.pasien.findFirst({
              where: { id: row.pasien_id, fasyankes_id: user.fasyankes_id },
              select: { id: true, nama: true, nomor_rm: true },
            })
          : null,
        row.penanggung_jawab
          ? prisma.pengguna.findFirst({
              where: { id: row.penanggung_jawab, fasyankes_id: user.fasyankes_id },
              select: { id: true, nama: true },
            })
          : null,
      ]);
      res.setHeader('Cache-Control', 'no-store');
      res.json({ data: { pasien_tertaut: !!row.pasien_id, pasien, penanggung } });
    },
  );
  rute.patch(
    '/whatsapp/percakapan/:id',
    wajibIzin('whatsapp', 'lihat'),
    audit.perbaikan({ entitas: 'wa_percakapan', id: (req) => Number(req.params.id) }),
    async (req, res) => {
      const hasil = ubahPercakapanWa.safeParse(req.body);
      if (!hasil.success) return tolak(res, 'Tautan pasien atau penanggung jawab tidak valid');
      if (
        hasil.data.penanggung_jawab &&
        !(await prisma.pengguna.findFirst({
          where: { id: hasil.data.penanggung_jawab, fasyankes_id: pengguna(res).fasyankes_id, aktif: true },
        }))
      )
        return tolak(res, 'Akun penanggung jawab tidak ditemukan');
      if (hasil.data.pasien_id) {
        const user = pengguna(res);
        if (!punyaIzin(user, 'pasien', 'lihat')) return tolak(res, 'Tidak memiliki izin mengakses pasien', 403);
        const pasien = await prisma.pasien.findFirst({
          where: { id: hasil.data.pasien_id, fasyankes_id: user.fasyankes_id },
          select: { id: true },
        });
        if (!pasien) return tolak(res, 'Pasien tidak ditemukan', 404);
        const diperbarui = await prisma.waPercakapan.updateMany({
          where: { id: res.locals.percakapan.id, OR: [{ pasien_id: null }, { pasien_id: pasien.id }] },
          data: hasil.data,
        });
        if (!diperbarui.count) return tolak(res, 'Kontak sudah ditautkan ke pasien lain', 409);
      } else await prisma.waPercakapan.update({ where: { id: res.locals.percakapan.id }, data: hasil.data });
      kabarkanWhatsapp({ tipe: 'percakapan', fasyankes_id: pengguna(res).fasyankes_id });
      res.json({ data: { ok: true } });
    },
  );
  rute.post(
    '/whatsapp/percakapan/:id/pesan',
    wajibIzin('whatsapp', 'lihat'),
    audit.lihat({ entitas: 'wa_pesan', ringkasan: 'Permintaan kirim pesan WhatsApp' }),
    async (req, res) => {
      const hasil = kirimPesanWa.safeParse(req.body);
      if (!hasil.success) return tolak(res, hasil.error.issues[0].message);
      const user = pengguna(res);
      const koneksi = await prisma.waKoneksi.findUnique({ where: { id: 1 } });
      if (
        !koneksi ||
        koneksi.fasyankes_id !== user.fasyankes_id ||
        !koneksi.aktif ||
        koneksi.status !== 'terhubung' ||
        !tersedia(koneksi.detak)
      )
        return tolak(res, 'WhatsApp belum terhubung. Hubungkan melalui Pengaturan → WhatsApp.', 409);
      const { teks, media } = hasil.data;
      if (
        media &&
        (!/^[A-Za-z0-9+/]*={0,2}$/.test(media.base64) ||
          Buffer.from(media.base64, 'base64').length > 8 * 1024 * 1024 ||
          !media.base64.length)
      )
        return tolak(res, 'Lampiran tidak valid atau melebihi 8 MB');
      const row = await prisma.$transaction(async (tx) => {
        await kunciPercakapanWhatsapp(tx, res.locals.percakapan.id);
        let mediaId: string | null = null;
        if (media) {
          mediaId = randomUUID();
          await tx.waMedia.create({
            data: {
              id: mediaId,
              fasyankes_id: user.fasyankes_id,
              isi: enkripsiRahasia(media.base64),
              mime: media.mime,
              nama: media.nama,
            },
          });
        }
        const pesan = await tx.waPesan.create({
          data: {
            percakapan_id: res.locals.percakapan.id,
            arah: 'keluar',
            isi: enkripsiRahasia(teks),
            status: 'antre',
            dibuat_oleh: user.id,
            media_id: mediaId,
            jenis: media
              ? media.mime.startsWith('image/')
                ? 'image'
                : media.mime.startsWith('audio/')
                  ? 'audio'
                  : media.mime.startsWith('video/')
                    ? 'video'
                    : 'document'
              : 'text',
          },
        });
        await tx.waPercakapan.update({
          where: { id: res.locals.percakapan.id },
          data: { diperbarui_pada: new Date() },
        });
        await pangkasPesanWhatsapp(tx, res.locals.percakapan.id);
        return pesan;
      });
      kabarkanWhatsapp({ tipe: 'pesan', fasyankes_id: user.fasyankes_id });
      res.status(201).json({ data: { id: row.id } });
    },
  );
  rute.get(
    '/whatsapp/media/:id',
    wajibIzin('whatsapp', 'lihat'),
    audit.lihat({ entitas: 'wa_media' }),
    async (req, res) => {
      const row = await prisma.waMedia.findFirst({
        where: { id: String(req.params.id), fasyankes_id: pengguna(res).fasyankes_id },
      });
      if (!row) return tolak(res, 'Lampiran tidak ditemukan', 404);
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
      const buffer = Buffer.from(dekripsiRahasia(row.isi), 'base64');
      const mimePratinjau = new Set([
        'image/jpeg',
        'image/png',
        'image/webp',
        'video/mp4',
        'audio/ogg',
        'audio/mpeg',
        'audio/mp4',
      ]);
      const inline = req.query.pratinjau === '1' && mimePratinjau.has(row.mime);
      if (!inline) {
        res.type('application/octet-stream');
        res.attachment(row.nama);
        return void res.send(buffer);
      }
      res.type(row.mime);
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Accept-Ranges', 'bytes');
      const range = req.headers.range;
      if (range) {
        const bagian = /^bytes=(\d*)-(\d*)$/.exec(range);
        let awal = bagian?.[1] ? Number(bagian[1]) : 0;
        let akhir = bagian?.[2] ? Number(bagian[2]) : buffer.length - 1;
        if (bagian && !bagian[1] && bagian[2]) {
          awal = Math.max(0, buffer.length - Number(bagian[2]));
          akhir = buffer.length - 1;
        }
        if (
          !bagian ||
          (!bagian[1] && !bagian[2]) ||
          !Number.isSafeInteger(awal) ||
          !Number.isSafeInteger(akhir) ||
          awal > akhir ||
          awal >= buffer.length
        ) {
          res.setHeader('Content-Range', `bytes */${buffer.length}`);
          return void res.status(416).end();
        }
        akhir = Math.min(akhir, buffer.length - 1);
        res.setHeader('Content-Range', `bytes ${awal}-${akhir}/${buffer.length}`);
        return void res.status(206).send(buffer.subarray(awal, akhir + 1));
      }
      res.send(buffer);
    },
  );
  return rute;
}
