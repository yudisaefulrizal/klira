import type { RequestHandler, Router } from 'express';
import { prisma, type Prisma } from '@klira/db';
import type { PenggunaSaya } from '@klira/shared';
import { alamatDari, PenampungAuditPrisma } from '../../middleware/audit';
import { RepositoriAuditPrisma } from '../audit/repositori';
import { kabarkanWhatsapp } from '../whatsapp/kanal';
import { kabarkanInstagram } from '../instagram/kanal';

type Kanal = 'whatsapp' | 'instagram';
export class PengirimanBerjalan extends Error {}

/** Penghapusan lokal dan audit mengikuti transaksi pemanggil. */
async function bersihkanDalam(tx: Prisma.TransactionClient, kanal: Kanal, user: Pick<PenggunaSaya, 'id' | 'fasyankes_id'>, alamat: string, saatKeluar = false) {
  const fas = user.fasyankes_id;
    const where = { fasyankes_id: fas };
    const pesanWhere = { percakapan: where };
    const antreWhere = { ...pesanWhere, status: { in: ['antre', 'mengirim'] } };
    let percakapan: number;
    let pesan: number;
    if (kanal === 'whatsapp') {
      await tx.$queryRaw`SELECT id FROM wa_percakapan WHERE fasyankes_id = ${fas} ORDER BY id FOR UPDATE`;
      if (!saatKeluar && await tx.waPesan.count({ where: antreWhere })) throw new PengirimanBerjalan();
      await tx.waBaca.deleteMany({ where: pesanWhere });
      pesan = (await tx.waPesan.deleteMany({ where: pesanWhere })).count;
      percakapan = (await tx.waPercakapan.deleteMany({ where })).count;
      await tx.waMedia.deleteMany({ where });
    } else {
      await tx.$queryRaw`SELECT id FROM ig_percakapan WHERE fasyankes_id = ${fas} ORDER BY id FOR UPDATE`;
      if (!saatKeluar && await tx.igPesan.count({ where: antreWhere })) throw new PengirimanBerjalan();
      await tx.igBaca.deleteMany({ where: pesanWhere });
      pesan = (await tx.igPesan.deleteMany({ where: pesanWhere })).count;
      percakapan = (await tx.igPercakapan.deleteMany({ where })).count;
      // Token publik kanal lain dan fasyankes lain tetap berlaku.
      const media = await tx.igMedia.findMany({ where, select: { id: true } });
      if (media.length) await tx.igMediaPublik.deleteMany({ where: { media_id: { in: media.map((m) => m.id) } } });
      await tx.igMedia.deleteMany({ where });
    }
    await new PenampungAuditPrisma(new RepositoriAuditPrisma(tx)).catat({
      fasyankes_id: fas, pengguna_id: user.id, aksi: 'perbaikan', entitas: `${kanal}_percakapan`,
      keterangan: `Membersihkan ${percakapan} percakapan dan ${pesan} pesan lokal ${kanal}`, alamat,
    });
    return { percakapan, pesan };
}

/** Clean manual mempertahankan koneksi dan menunggu pengiriman selesai. */
export async function bersihkanPercakapan(kanal: Kanal, user: Pick<PenggunaSaya, 'id' | 'fasyankes_id'>, alamat: string) {
  return prisma.$transaction((tx) => bersihkanDalam(tx, kanal, user, alamat), { timeout: 20000 });
}

/** Putuskan sesi sebelum menghapus pesan agar pesan sesi lama tidak disimpan kembali. */
export async function putuskanDanBersihkan(kanal: Kanal, user: Pick<PenggunaSaya, 'id' | 'fasyankes_id'>, alamat: string) {
  return prisma.$transaction(async (tx) => {
    if (kanal === 'whatsapp') {
      await tx.$queryRaw`SELECT id FROM wa_koneksi WHERE id = 1 FOR UPDATE`;
      const row = await tx.waKoneksi.findUnique({ where: { id: 1 } });
      if (row && row.fasyankes_id !== user.fasyankes_id) throw new Error('WhatsApp dikelola fasyankes lain.');
      if (row) {
        await tx.waKoneksi.update({ where: { id: 1, fasyankes_id: user.fasyankes_id }, data: { aktif: false, status: 'terputus', nomor: null, qr: null, generasi: { increment: 1 } } });
        await tx.waAuth.deleteMany({});
      }
    } else {
      await tx.$queryRaw`SELECT id FROM ig_koneksi WHERE id = 1 FOR UPDATE`;
      const row = await tx.igKoneksi.findUnique({ where: { id: 1 } });
      if (row && row.fasyankes_id !== user.fasyankes_id) throw new Error('Instagram dikelola fasyankes lain.');
      if (row) await tx.igKoneksi.update({ where: { id: 1, fasyankes_id: user.fasyankes_id }, data: { aktif: false, status: 'terputus', akun_id: '', username: '', oauth_user_id: null, access_token: null, token_berakhir: null, token_diperbarui: null, webhook_aktif: false, api_key: null, webhook_id: null, webhook_secret: null, generasi: { increment: 1 } } });
      await tx.igOauthState.deleteMany({ where: { fasyankes_id: user.fasyankes_id } });
    }
    return bersihkanDalam(tx, kanal, user, alamat, true);
  }, { timeout: 20000 });
}

export function pasangRuteBersihkan(rute: Router, kanal: Kanal, izin: RequestHandler) {
  rute.delete(`/${kanal}/percakapan`, izin, async (req, res, next) => {
    if (req.body?.konfirmasi !== kanal) return void res.status(400).json({ galat: { kode: 'konfirmasi', pesan: 'Konfirmasi pembersihan pesan diperlukan.' } });
    const user = res.locals.pengguna as PenggunaSaya;
    try {
      const hasil = await bersihkanPercakapan(kanal, user, alamatDari(req));
      const kabarkan = kanal === 'whatsapp' ? kabarkanWhatsapp : kabarkanInstagram;
      kabarkan({ tipe: 'dibersihkan', fasyankes_id: user.fasyankes_id });
      res.json({ data: hasil });
    } catch (e) {
      if (e instanceof PengirimanBerjalan) return void res.status(409).json({ galat: { kode: 'pesan_mengirim', pesan: 'Masih ada pesan dalam antrean pengiriman. Tunggu hingga pengiriman selesai, lalu coba lagi.' } });
      next(e);
    }
  });
}
