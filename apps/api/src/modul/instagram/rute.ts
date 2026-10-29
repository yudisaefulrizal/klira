import { perbaruiNamaKontakInstagram } from './profil';
import { pasangRuteKoneksi } from './koneksi';
import { kirimMeta, idPesan, hash, konfigurasiMeta, GalatMeta } from './meta';
import { kabarkanInstagram } from './kanal';
import { randomUUID, randomBytes } from 'node:crypto';
import { Router, type Response } from 'express';
import {
  prisma,
  enkripsiRahasia,
  dekripsiRahasia,
  kunciPercakapanInstagram,
  pangkasPesanInstagram,
} from '@klira/db';
import {
  punyaIzin,
  kirimPesanWa,
  ubahPercakapanWa,
  type PenggunaSaya,
} from '@klira/shared';
import { buatFasilitasAudit } from '../../middleware/audit';
import { wajibMasuk } from '../../middleware/auth';
import { buatWajibIzin } from '../../middleware/izin';
import type { LayananAkses } from '../akses/layanan';
import type { LayananIzin } from '../akses/layanan-izin';


const pengguna = (res: Response) => res.locals.pengguna as PenggunaSaya;
const tolak = (res: Response, pesan: string, status = 400) => {
  res.status(status).json({ galat: { kode: 'instagram', pesan } });
};

const idValid = (v: unknown) => (typeof v === 'string' && /^[1-9]\d{0,9}$/.test(v) ? Number(v) : 0);
export function buatRuteInstagram(akses: LayananAkses, izin: LayananIzin) {
  const rute = Router();
  const masuk = wajibMasuk(akses);
  const audit = buatFasilitasAudit();
  const { wajibIzin } = buatWajibIzin(izin);
  rute.use('/instagram', masuk);
  pasangRuteKoneksi(rute, wajibIzin('instagram', 'lihat'));
  rute.get('/instagram/percakapan', wajibIzin('instagram', 'lihat'), async (req, res) => {
    const user = pengguna(res);
    const halaman = Math.min(1000, Math.max(1, Number(req.query.halaman) || 1));
    const rows = await prisma.igPercakapan.findMany({
      skip: (Math.floor(halaman) - 1) * 200,
      where: { fasyankes_id: user.fasyankes_id },
      orderBy: { diperbarui_pada: 'desc' },
      take: 200,
      include: { pesan: { orderBy: { id: 'desc' }, take: 1 }, baca: { where: { pengguna_id: user.id } } },
    });
    for (const row of rows) void perbaruiNamaKontakInstagram(row.id);
    res.json({
      data: await Promise.all(
        rows.map(async ({ pesan, baca, ...row }) => ({
          ...row,
          terakhir: pesan[0] ? dekripsiRahasia(pesan[0].isi).slice(0, 160) || `[${pesan[0].jenis}]` : '',
          belum_dibaca: await prisma.igPesan.count({
            where: { percakapan_id: row.id, arah: 'masuk', id: { gt: baca[0]?.pesan_id ?? 0 } },
          }),
        })),
      ),
    });
  });
  rute.get('/instagram/ringkasan', wajibIzin('instagram', 'lihat'), async (_req, res) => {
    const user = pengguna(res);
    const rows = await prisma.$queryRaw<{ belum: bigint; terbaru: number | null }[]>`
      SELECT COUNT(DISTINCT CASE WHEN p.id > COALESCE(b.pesan_id, 0) THEN c.id END) AS belum,
             MAX(p.id) AS terbaru
      FROM ig_percakapan c
      LEFT JOIN ig_pesan p ON p.percakapan_id = c.id AND p.arah = 'masuk'
      LEFT JOIN ig_baca b ON b.percakapan_id = c.id AND b.pengguna_id = ${user.id}
      WHERE c.fasyankes_id = ${user.fasyankes_id}`;
    res.json({ data: { belum_dibaca: Number(rows[0]?.belum ?? 0), terbaru: rows[0]?.terbaru ?? 0 } });
  });
  // Seluruh rute percakapan di bawah dibatasi ke fasyankes pengguna, termasuk media.
  rute.use('/instagram/percakapan/:id', wajibIzin('instagram', 'lihat'), async (req, res, next) => {
    const row = await prisma.igPercakapan.findFirst({
      where: { id: idValid(req.params.id), fasyankes_id: pengguna(res).fasyankes_id },
    });
    if (!row) return tolak(res, 'Percakapan pribadi tidak ditemukan', 404);
    res.locals.percakapan = row;
    next();
  });
  rute.get(
    '/instagram/percakapan/:id/pesan',
    audit.lihat({ entitas: 'ig_percakapan', id: (req) => Number(req.params.id) }),
    async (req, res) => {
      const rows = await prisma.igPesan.findMany({
        where: { percakapan_id: res.locals.percakapan.id },
        orderBy: { id: 'desc' },
        take: 10,
      });
      res.setHeader('Cache-Control', 'no-store');
      res.json({ data: rows.reverse().map(({ isi, ...row }) => ({ ...row, teks: dekripsiRahasia(isi) })) });
    },
  );
  rute.post('/instagram/percakapan/:id/baca', async (req, res) => {
    const id = res.locals.percakapan.id as number;
    const terakhir = Number(req.body?.pesan_id);
    if (
      !Number.isSafeInteger(terakhir) ||
      terakhir <= 0 ||
      !(await prisma.igPesan.findFirst({ where: { id: terakhir, percakapan_id: id } }))
    )
      return tolak(res, 'Pesan tidak valid');
    const kunci = { percakapan_id: id, pengguna_id: pengguna(res).id };
    await prisma.igBaca.upsert({
      where: { percakapan_id_pengguna_id: kunci },
      create: { ...kunci, pesan_id: terakhir },
      update: {},
    });
    await prisma.igBaca.updateMany({ where: { ...kunci, pesan_id: { lt: terakhir } }, data: { pesan_id: terakhir } });
    kabarkanInstagram({ tipe: 'baca', fasyankes_id: pengguna(res).fasyankes_id });
    res.json({ data: { ok: true } });
  });
  rute.get(
    '/instagram/percakapan/:id/info',
    audit.lihat({ entitas: 'ig_percakapan', id: (req) => Number(req.params.id) }),
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
    '/instagram/percakapan/:id',
    wajibIzin('instagram', 'lihat'),
    audit.perbaikan({ entitas: 'ig_percakapan', id: (req) => Number(req.params.id) }),
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
        const diperbarui = await prisma.igPercakapan.updateMany({
          where: { id: res.locals.percakapan.id, OR: [{ pasien_id: null }, { pasien_id: pasien.id }] },
          data: hasil.data,
        });
        if (!diperbarui.count) return tolak(res, 'Kontak sudah ditautkan ke pasien lain', 409);
      } else await prisma.igPercakapan.update({ where: { id: res.locals.percakapan.id }, data: hasil.data });
      kabarkanInstagram({ tipe: 'percakapan', fasyankes_id: pengguna(res).fasyankes_id });
      res.json({ data: { ok: true } });
    },
  );
  rute.post(
    '/instagram/percakapan/:id/pesan',
    wajibIzin('instagram', 'lihat'),
    audit.lihat({ entitas: 'ig_pesan', ringkasan: 'Permintaan kirim pesan Instagram' }),
    async (req, res) => {
      const hasil = kirimPesanWa.safeParse(req.body);
      if (!hasil.success) return tolak(res, hasil.error.issues[0].message);
      const user = pengguna(res);
      const koneksi = await prisma.igKoneksi.findUnique({ where: { id: 1 } });
      if (!koneksi || koneksi.fasyankes_id !== user.fasyankes_id || !koneksi.aktif || koneksi.penyedia !== 'meta' || koneksi.status !== 'terhubung' || !koneksi.access_token || !koneksi.token_berakhir || koneksi.token_berakhir.getTime() <= Date.now() || !koneksi.webhook_aktif)
        return tolak(res, 'Instagram belum terhubung. Buka Pengaturan → Instagram.', 409);
      const { teks, media } = hasil.data;
      if (media && teks) return tolak(res, 'Kirim gambar dan teks secara terpisah.');
      if (
        media &&
        (!/^[A-Za-z0-9+/]*={0,2}$/.test(media.base64) ||
          Buffer.from(media.base64, 'base64').length > 8 * 1024 * 1024 ||
          !media.base64.length)
      )
        return tolak(res, 'Lampiran tidak valid atau melebihi 8 MB');
      if (media && !['image/jpeg', 'image/png'].includes(media.mime)) return tolak(res, 'Pilih gambar JPG atau PNG');
      const row = await prisma.$transaction(async (tx) => {
        await kunciPercakapanInstagram(tx, res.locals.percakapan.id);
        let mediaId: string | null = null;
        if (media) {
          mediaId = randomUUID();
          await tx.igMedia.create({
            data: {
              id: mediaId,
              fasyankes_id: user.fasyankes_id,
              isi: enkripsiRahasia(media.base64),
              mime: media.mime,
              nama: media.nama,
            },
          });
        }
        const pesan = await tx.igPesan.create({
          data: {
            percakapan_id: res.locals.percakapan.id,
            arah: 'keluar',
            isi: enkripsiRahasia(teks),
            status: 'mengirim',
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
        await tx.igPercakapan.update({
          where: { id: res.locals.percakapan.id },
          data: { diperbarui_pada: new Date() },
        });
        await pangkasPesanInstagram(tx, res.locals.percakapan.id);
        return pesan;
      });
      kabarkanInstagram({ tipe: 'pesan', fasyankes_id: user.fasyankes_id });
      try {
        let gambarUrl: string | undefined;
        if (media && row.media_id) {
          const token = randomBytes(32).toString('hex');
          await prisma.igMediaPublik.create({ data: { token_hash: hash(token), media_id: row.media_id, generasi: koneksi.generasi, berakhir: new Date(Date.now() + 15 * 60000) } });
          gambarUrl = `${konfigurasiMeta().origin}/instagram/media/${token}`;
        }
        const current = await prisma.igKoneksi.findUnique({ where: { id: 1 } });
        if (!current?.aktif || current.generasi !== koneksi.generasi) throw new GalatMeta('Koneksi berubah. Hubungkan ulang Instagram.', 409, true);
        const mid = await kirimMeta(dekripsiRahasia(koneksi.access_token), koneksi.akun_id, res.locals.percakapan.jid, teks, gambarUrl);
        await prisma.$transaction(async (tx) => {
          await kunciPercakapanInstagram(tx, res.locals.percakapan.id);
          const local = await tx.igPesan.findUnique({ where: { id: row.id } });
          if (!local) return; // Data may have been deleted by a signed deletion request.
          const echo = await tx.igPesan.findUnique({ where: { ig_id: idPesan(koneksi.akun_id, mid) } });
          if (echo && echo.id !== row.id) {
            await tx.igPesan.delete({ where: { id: echo.id } });
            if (echo.media_id) await tx.igMedia.deleteMany({ where: { id: echo.media_id } });
          }
          await tx.igPesan.update({ where: { id: row.id }, data: { status: 'terkirim', ig_id: idPesan(koneksi.akun_id, mid) } });
        });
      } catch (e) {
        const ditolak = e instanceof GalatMeta && e.pastiDitolak;
        await prisma.igPesan.updateMany({ where: { id: row.id }, data: { status: ditolak ? 'gagal' : 'belum pasti' } });
        if (e instanceof GalatMeta && e.dicabut) await prisma.igKoneksi.updateMany({ where: { id: 1, generasi: koneksi.generasi }, data: { aktif: false, access_token: null, status: 'dicabut', webhook_aktif: false, generasi: { increment: 1 } } });
        kabarkanInstagram({ tipe: 'pesan', fasyankes_id: user.fasyankes_id });
        return tolak(res, ditolak ? (e as GalatMeta).message : 'Pengiriman belum terkonfirmasi. Periksa Instagram sebelum mengirim ulang.', 502);
      }
      await prisma.$transaction(async (tx) => {
        await kunciPercakapanInstagram(tx, res.locals.percakapan.id);
        await pangkasPesanInstagram(tx, res.locals.percakapan.id);
      });
      kabarkanInstagram({ tipe: 'pesan', fasyankes_id: user.fasyankes_id });
      res.status(201).json({ data: { id: row.id } });
    },
  );
  rute.get(
    '/instagram/media/:id',
    wajibIzin('instagram', 'lihat'),
    audit.lihat({ entitas: 'ig_media' }),
    async (req, res) => {
      const row = await prisma.igMedia.findFirst({
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
